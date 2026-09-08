import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.users import User
from app.schemas.agents import (
    DiscoveryResponse,
    QueryUnderstandingResult,
    IntentEnum,
    ResultTypeEnum,
    ResultComposition,
)
from app.schemas.matching import (
    MatchingResult,
    EvidenceItem,
    HelpChain,
    HelpChainNode,
    MatchingAnalyzeResponse,
)
from app.services.scoring_service import ScoringService
from app.services.evidence_service import EvidenceService
from app.services.explanation_service import ExplanationService

logger = logging.getLogger(__name__)


MIN_RELEVANCE_THRESHOLD = 0.25


def determine_result_composition(intent: IntentEnum) -> ResultComposition:
    """
    Deterministically computes primary, secondary, and evidence-only knowledge types
    based on the structured query intent.
    """
    if intent in (IntentEnum.FIND_FACILITY, IntentEnum.FIND_EQUIPMENT):
        return ResultComposition(
            primary_result_type=ResultTypeEnum.FACILITIES,
            secondary_result_types=[ResultTypeEnum.PEOPLE],
            evidence_only_types=[ResultTypeEnum.PROJECTS, ResultTypeEnum.SOLUTIONS, ResultTypeEnum.RESEARCH],
        )
    elif intent == IntentEnum.FIND_PROJECT:
        return ResultComposition(
            primary_result_type=ResultTypeEnum.PROJECTS,
            secondary_result_types=[ResultTypeEnum.PEOPLE],
            evidence_only_types=[ResultTypeEnum.RESEARCH, ResultTypeEnum.SOLUTIONS],
        )
    elif intent == IntentEnum.FIND_RESEARCH:
        return ResultComposition(
            primary_result_type=ResultTypeEnum.RESEARCH,
            secondary_result_types=[ResultTypeEnum.PEOPLE],
            evidence_only_types=[ResultTypeEnum.PROJECTS, ResultTypeEnum.SOLUTIONS],
        )
    elif intent == IntentEnum.FIND_SIMILAR_SOLUTION:
        return ResultComposition(
            primary_result_type=ResultTypeEnum.SOLUTIONS,
            secondary_result_types=[ResultTypeEnum.PEOPLE, ResultTypeEnum.PROJECTS],
            evidence_only_types=[ResultTypeEnum.RESEARCH],
        )
    elif intent == IntentEnum.FIND_EXPERTISE_AND_SIMILAR_SOLUTIONS:
        # Problem solving query: People is primary, Help Chain alongside, solutions/projects/research are person evidence
        return ResultComposition(
            primary_result_type=ResultTypeEnum.PEOPLE,
            secondary_result_types=[],
            evidence_only_types=[ResultTypeEnum.SOLUTIONS, ResultTypeEnum.PROJECTS, ResultTypeEnum.RESEARCH],
        )
    elif intent == IntentEnum.FIND_PERSON:
        return ResultComposition(
            primary_result_type=ResultTypeEnum.PEOPLE,
            secondary_result_types=[ResultTypeEnum.PROJECTS, ResultTypeEnum.RESEARCH, ResultTypeEnum.SOLUTIONS],
            evidence_only_types=[],
        )
    else:
        # GENERAL_CAMPUS_DISCOVERY / fallback
        return ResultComposition(
            primary_result_type=ResultTypeEnum.PEOPLE,
            secondary_result_types=[
                ResultTypeEnum.PROJECTS,
                ResultTypeEnum.SOLUTIONS,
                ResultTypeEnum.RESEARCH,
                ResultTypeEnum.FACILITIES,
            ],
            evidence_only_types=[],
        )


class MatchingService:
    """
    Main orchestration service for Phase 8 Matching & Explanation Intelligence.
    Consumes Phase 7 agentic discovery output, calculates deterministic scores,
    aggregates evidence, generates grounded explanations, and constructs Help Chains.
    """

    def __init__(self):
        from app.services.agent_execution_service import AgentExecutionService
        self.agent_execution_service = AgentExecutionService()
        self.scoring_service = ScoringService()
        self.evidence_service = EvidenceService()
        self.explanation_service = ExplanationService()

    def analyze(
        self,
        db: Session,
        current_user: User,
        query: str,
        precomputed_discovery: Optional[DiscoveryResponse] = None,
    ) -> MatchingAnalyzeResponse:
        """
        Main entrypoint for matching and explanation intelligence.
        """
        # Step 1: Obtain Phase 7 Discovery Response
        if precomputed_discovery and precomputed_discovery.query_understanding:
            discovery = precomputed_discovery
        else:
            discovery = self.agent_execution_service.discover(db, current_user, query)

        qu = discovery.query_understanding
        q_skills = qu.skills
        q_tech = qu.technologies
        q_domains = qu.domain

        # Step 2: Process People Candidates
        top_people: List[MatchingResult] = []
        if discovery.people and discovery.people.candidates:
            for cand in discovery.people.candidates:
                # Ensure current authenticated user is strictly excluded
                if str(cand.user_id) == str(current_user.id):
                    continue

                c_skills = cand.matched_skills
                c_tech = cand.matched_technologies
                ev_graph = cand.person_evidence_graph or {}

                # Collect candidate technologies from profile + project + solution evidence
                all_cand_tech = self.scoring_service.collect_candidate_technologies(
                    candidate_technologies=c_tech,
                    person_evidence_graph=ev_graph,
                )

                q_tech_lower = {t.lower().strip() for t in q_tech if t.strip()}
                matched_tech_list = [t for t in all_cand_tech if t.lower().strip() in q_tech_lower]

                # True intersection of candidate skills with query skills / keywords
                q_skills_lower = {s.lower().strip() for s in q_skills if s.strip()}
                q_terms = [term.lower().strip() for term in (qu.problem_keywords + qu.diagnostic_areas) if len(term.strip()) > 2]
                all_cand_skills = list(c_skills) + ev_graph.get("skills", [])

                matched_skills_list = []
                seen_sk = set()
                for s in all_cand_skills:
                    s_clean = s.strip()
                    s_low = s_clean.lower()
                    if s_low in q_skills_lower or any(s_low == term or term in s_low for term in q_terms):
                        if s_low not in seen_sk:
                            seen_sk.add(s_low)
                            matched_skills_list.append(s_clean)

                has_proj = bool(ev_graph.get("projects")) or any(e.entity_type.upper() == "PROJECT" for e in cand.evidence)
                has_sol = bool(ev_graph.get("solutions")) or any(e.entity_type.upper() == "PROBLEM_SOLUTION" for e in cand.evidence)
                has_res = bool(ev_graph.get("research"))
                
                # Base semantic score from top evidence item
                raw_score = cand.evidence[0].score if cand.evidence else 0.50

                score, relevance_level, ev_strength, _ = self.scoring_service.calculate_score(
                    semantic_relevance=raw_score,
                    query_skills=q_skills,
                    candidate_skills=all_cand_skills,
                    query_technologies=q_tech,
                    candidate_technologies=all_cand_tech,
                    has_project_evidence=has_proj,
                    has_solution_evidence=has_sol,
                    has_research_evidence=has_res,
                    best_evidence_type="PROBLEM_SOLUTION" if has_sol else ("PROJECT" if has_proj else ("RESEARCH" if has_res else "PROFILE")),
                    person_evidence_graph=ev_graph,
                )

                if score < MIN_RELEVANCE_THRESHOLD:
                    continue

                formatted_ev = self.evidence_service.format_evidence_items(
                    candidate_id=str(cand.user_id),
                    candidate_type="PERSON",
                    raw_evidences=cand.evidence,
                    candidate_meta={"display_name": cand.display_name, "department": cand.department},
                )

                explanation, help_type, strengths, limitations = self.explanation_service.generate_explanation(
                    query=query,
                    candidate_title=cand.display_name,
                    candidate_type="PERSON",
                    relevance_score=score,
                    relevance_level=relevance_level,
                    matched_skills=matched_skills_list,
                    matched_technologies=matched_tech_list,
                    evidence_items=formatted_ev,
                )

                top_people.append(
                    MatchingResult(
                        candidate_id=str(cand.user_id),
                        candidate_type="PERSON",
                        title=cand.display_name,
                        subtitle=cand.department or "Campus Member",
                        relevance_score=score,
                        relevance_level=relevance_level,
                        matched_skills=matched_skills_list,
                        matched_technologies=matched_tech_list,
                        matched_domains=q_domains,
                        supporting_evidence=formatted_ev,
                        evidence_strength=ev_strength,
                        evidence_count=cand.evidence_count or ev_graph.get("evidence_count", len(formatted_ev)),
                        person_evidence_graph=ev_graph,
                        explanation=explanation,
                        help_type=help_type,
                        strengths=strengths,
                        limitations=limitations,
                    )
                )

        top_people.sort(key=lambda x: x.relevance_score, reverse=True)

        # Step 3: Process Projects
        top_projects: List[MatchingResult] = []
        if discovery.projects and discovery.projects.projects:
            for proj in discovery.projects.projects:
                proj_id = str(proj.get("id") or proj.get("project_id", ""))
                title = proj.get("title", "Campus Project")
                proj_meta = proj.get("metadata") or {}
                technologies = proj.get("technologies") or proj_meta.get("technologies", [])
                skills = proj.get("skills") or proj_meta.get("skills", [])
                contributors = proj.get("contributors") or proj_meta.get("contributors", [])
                score_raw = float(proj.get("score") or proj.get("relevance") or 0.50)

                score, relevance_level, ev_strength, _ = self.scoring_service.calculate_score(
                    semantic_relevance=score_raw,
                    query_skills=q_skills,
                    candidate_skills=skills,
                    query_technologies=q_tech,
                    candidate_technologies=technologies,
                    has_project_evidence=True,
                    has_solution_evidence=False,
                    best_evidence_type="PROJECT",
                )

                if score < MIN_RELEVANCE_THRESHOLD:
                    continue

                matching_ev = [e for e in discovery.evidence if str(e.entity_id) == proj_id]
                formatted_ev = self.evidence_service.format_evidence_items(
                    candidate_id=proj_id,
                    candidate_type="PROJECT",
                    raw_evidences=matching_ev,
                    candidate_meta={"title": title, "description": proj.get("description", "")},
                )

                explanation, help_type, strengths, limitations = self.explanation_service.generate_explanation(
                    query=query,
                    candidate_title=title,
                    candidate_type="PROJECT",
                    relevance_score=score,
                    relevance_level=relevance_level,
                    matched_skills=skills,
                    matched_technologies=technologies,
                    evidence_items=formatted_ev,
                )

                proj_strengths = list(strengths)
                if contributors:
                    proj_strengths.append(f"Contributors: {', '.join(contributors)}")
                proj_subtitle = f"Contributors: {', '.join(contributors[:3])}" if contributors else (proj.get("domain") or "Campus Project")

                top_projects.append(
                    MatchingResult(
                        candidate_id=proj_id,
                        candidate_type="PROJECT",
                        title=title,
                        subtitle=proj_subtitle,
                        relevance_score=score,
                        relevance_level=relevance_level,
                        matched_skills=skills,
                        matched_technologies=technologies,
                        matched_domains=q_domains,
                        supporting_evidence=formatted_ev,
                        evidence_strength=ev_strength,
                        explanation=explanation,
                        help_type=help_type,
                        strengths=proj_strengths,
                        limitations=limitations,
                    )
                )

        top_projects.sort(key=lambda x: x.relevance_score, reverse=True)

        # Step 4: Process Previous Solutions
        top_solutions: List[MatchingResult] = []
        if discovery.projects and discovery.projects.solutions:
            for sol in discovery.projects.solutions:
                sol_id = str(sol.get("id") or sol.get("solution_id", ""))
                title = sol.get("title") or sol.get("problem_title") or "Campus Solution Record"
                score_raw = float(sol.get("score") or sol.get("relevance") or 0.50)

                score, relevance_level, ev_strength, _ = self.scoring_service.calculate_score(
                    semantic_relevance=score_raw,
                    query_skills=q_skills,
                    candidate_skills=[],
                    query_technologies=q_tech,
                    candidate_technologies=[],
                    has_project_evidence=False,
                    has_solution_evidence=True,
                    best_evidence_type="PROBLEM_SOLUTION",
                )

                if score < MIN_RELEVANCE_THRESHOLD:
                    continue

                matching_ev = [e for e in discovery.evidence if str(e.entity_id) == sol_id]
                formatted_ev = self.evidence_service.format_evidence_items(
                    candidate_id=sol_id,
                    candidate_type="PROBLEM_SOLUTION",
                    raw_evidences=matching_ev,
                    candidate_meta={"title": title, "description": sol.get("solution_description") or sol.get("outcome")},
                )

                explanation, help_type, strengths, limitations = self.explanation_service.generate_explanation(
                    query=query,
                    candidate_title=title,
                    candidate_type="PROBLEM_SOLUTION",
                    relevance_score=score,
                    relevance_level=relevance_level,
                    matched_skills=[],
                    matched_technologies=[],
                    evidence_items=formatted_ev,
                )

                top_solutions.append(
                    MatchingResult(
                        candidate_id=sol_id,
                        candidate_type="PROBLEM_SOLUTION",
                        title=title,
                        subtitle="Previous Solution Memory",
                        relevance_score=score,
                        relevance_level=relevance_level,
                        matched_skills=[],
                        matched_technologies=[],
                        matched_domains=q_domains,
                        supporting_evidence=formatted_ev,
                        evidence_strength=ev_strength,
                        explanation=explanation,
                        help_type=help_type,
                        strengths=strengths,
                        limitations=limitations,
                    )
                )

        top_solutions.sort(key=lambda x: x.relevance_score, reverse=True)

        # Step 5: Process Research
        top_research: List[MatchingResult] = []
        if discovery.projects and discovery.projects.research:
            for item in discovery.projects.research:
                item_id = str(item.get("id") or item.get("research_id", ""))
                title = item.get("title", "Campus Research Paper")
                res_meta = item.get("metadata") or {}
                authors = res_meta.get("authors", [])
                score_raw = float(item.get("score") or item.get("relevance") or 0.50)

                score, relevance_level, ev_strength, _ = self.scoring_service.calculate_score(
                    semantic_relevance=score_raw,
                    query_skills=q_skills,
                    candidate_skills=[],
                    query_technologies=q_tech,
                    candidate_technologies=[],
                    has_project_evidence=False,
                    has_solution_evidence=False,
                    best_evidence_type="RESEARCH",
                )

                if score < MIN_RELEVANCE_THRESHOLD:
                    continue

                formatted_ev = self.evidence_service.format_evidence_items(
                    candidate_id=item_id,
                    candidate_type="RESEARCH",
                    raw_evidences=[],
                    candidate_meta={"title": title, "description": item.get("abstract", "")},
                )

                explanation, help_type, strengths, limitations = self.explanation_service.generate_explanation(
                    query=query,
                    candidate_title=title,
                    candidate_type="RESEARCH",
                    relevance_score=score,
                    relevance_level=relevance_level,
                    matched_skills=[],
                    matched_technologies=[],
                    evidence_items=formatted_ev,
                )

                res_strengths = list(strengths)
                if authors:
                    res_strengths.append(f"Authors: {', '.join(authors)}")
                res_subtitle = f"Authors: {', '.join(authors[:2])}" if authors else (item.get("publication_type") or "Campus Research Publication")

                top_research.append(
                    MatchingResult(
                        candidate_id=item_id,
                        candidate_type="RESEARCH",
                        title=title,
                        subtitle=res_subtitle,
                        relevance_score=score,
                        relevance_level=relevance_level,
                        matched_skills=[],
                        matched_technologies=[],
                        matched_domains=q_domains,
                        supporting_evidence=formatted_ev,
                        evidence_strength=ev_strength,
                        explanation=explanation,
                        help_type=help_type,
                        strengths=res_strengths,
                        limitations=limitations,
                    )
                )

        top_research.sort(key=lambda x: x.relevance_score, reverse=True)

        # Step 6: Process Facilities
        top_facilities: List[MatchingResult] = []
        if discovery.facilities and (discovery.facilities.facilities or discovery.facilities.equipment):
            all_fac_items = discovery.facilities.facilities + discovery.facilities.equipment
            for fac in all_fac_items:
                fac_id = str(fac.get("id") or fac.get("facility_id", ""))
                title = fac.get("name") or fac.get("title") or "Campus Laboratory"
                dept = fac.get("department") or fac.get("location") or "Hardware Asset"
                fac_meta = fac.get("metadata") or {}
                eq_items = fac_meta.get("equipment", [])
                resp_contact = fac_meta.get("responsible_user")
                score_raw = float(fac.get("score") or fac.get("relevance") or 0.50)

                score, relevance_level, ev_strength, _ = self.scoring_service.calculate_score(
                    semantic_relevance=score_raw,
                    query_skills=q_skills,
                    candidate_skills=[],
                    query_technologies=q_tech,
                    candidate_technologies=[],
                    has_project_evidence=False,
                    has_solution_evidence=False,
                    best_evidence_type="FACILITY",
                )

                if score < MIN_RELEVANCE_THRESHOLD:
                    continue

                formatted_ev = self.evidence_service.format_evidence_items(
                    candidate_id=fac_id,
                    candidate_type="FACILITY",
                    raw_evidences=[],
                    candidate_meta={"title": title, "description": fac.get("description")},
                )

                explanation, help_type, strengths, limitations = self.explanation_service.generate_explanation(
                    query=query,
                    candidate_title=title,
                    candidate_type="FACILITY",
                    relevance_score=score,
                    relevance_level=relevance_level,
                    matched_skills=[],
                    matched_technologies=q_tech,
                    evidence_items=formatted_ev,
                )

                fac_strengths = list(strengths)
                if eq_items:
                    fac_strengths.append(f"Equipment: {', '.join(eq_items[:4])}")
                if resp_contact:
                    fac_strengths.append(f"Contact: {resp_contact}")
                fac_subtitle = f"Equipment: {', '.join(eq_items[:3])}" if eq_items else (dept or "Campus Laboratory")

                top_facilities.append(
                    MatchingResult(
                        candidate_id=fac_id,
                        candidate_type="FACILITY",
                        title=title,
                        subtitle=fac_subtitle,
                        relevance_score=score,
                        relevance_level=relevance_level,
                        matched_skills=[],
                        matched_technologies=q_tech,
                        matched_domains=q_domains,
                        supporting_evidence=formatted_ev,
                        evidence_strength=ev_strength,
                        explanation=explanation,
                        help_type=help_type,
                        strengths=fac_strengths,
                        limitations=limitations,
                    )
                )

        top_facilities.sort(key=lambda x: x.relevance_score, reverse=True)

        # Step 7: Build Potential Expertise Help Chain
        help_chain = self.construct_help_chain(q_skills, q_tech, q_domains, top_people, top_projects)

        total_candidates = len(top_people) + len(top_projects) + len(top_solutions) + len(top_research) + len(top_facilities)
        result_composition = determine_result_composition(qu.intent)

        return MatchingAnalyzeResponse(
            query=query,
            understanding=qu,
            top_people=top_people,
            top_projects=top_projects,
            top_solutions=top_solutions,
            research=top_research,
            facilities=top_facilities,
            help_chain=help_chain,
            traces=discovery.traces,
            result_composition=result_composition,
            metadata={
                "candidate_count": total_candidates,
                "processing_status": discovery.status,
            },
        )

    def construct_help_chain(
        self,
        query_skills: List[str],
        query_tech: List[str],
        query_domains: List[str],
        people_candidates: List[MatchingResult],
        project_candidates: List[MatchingResult],
    ) -> Optional[HelpChain]:
        """
        Constructs a deterministic initial Help Chain covering required capabilities.
        Uses a set-cover heuristic to identify 1-3 candidates spanning distinct problem dimensions.
        """
        required_capabilities = list(dict.fromkeys(query_skills + query_tech + query_domains))
        if not required_capabilities or not people_candidates:
            return None

        # Check if top 1 person genuinely covers all required query capabilities
        top_cand = people_candidates[0]
        top_cand_caps = {s.lower() for s in top_cand.matched_skills + top_cand.matched_technologies}
        q_skills_lower = {s.lower() for s in query_skills}
        q_tech_lower = {t.lower() for t in query_tech}
        all_req_lower = q_skills_lower.union(q_tech_lower)

        # Single candidate is sufficient ONLY if top_cand has high relevance AND covers all requested skills/tech
        is_single_sufficient = (
            bool(all_req_lower)
            and all_req_lower.issubset(top_cand_caps)
            and top_cand.relevance_score >= 0.60
        )
        
        if is_single_sufficient or len(required_capabilities) <= 1:
            node = HelpChainNode(
                step_number=1,
                focus_area="Best Single-Person Match",
                candidate_id=top_cand.candidate_id,
                candidate_name=top_cand.title,
                candidate_type=top_cand.candidate_type,
                reason=f"Primary expert demonstrates comprehensive coverage for your technical problem ({', '.join(top_cand.matched_skills[:2] + top_cand.matched_technologies[:2]) or 'Domain Expertise'}).",
                matched_skills=top_cand.matched_skills,
            )
            return HelpChain(
                needed_capabilities=required_capabilities,
                covered_capabilities=top_cand.matched_skills or required_capabilities,
                nodes=[node],
                explanation=f"Best Single-Person Match: {top_cand.title} has direct experience covering key technical requirements for this issue.",
                is_single_candidate_sufficient=True,
            )

        # Multi-candidate Help Chain via greedy capability cover
        nodes: List[HelpChainNode] = []
        covered_set = set()
        uncovered = set([c.lower() for c in required_capabilities])

        # Attempt to pick up to 3 candidates with complementary skills
        step = 1
        for cand in people_candidates:
            cand_skills_lower = set([s.lower() for s in cand.matched_skills + cand.matched_technologies])
            newly_covered = uncovered.intersection(cand_skills_lower)

            if newly_covered or step == 1:
                focus = ", ".join([s.title() for s in list(newly_covered or cand_skills_lower)[:2]]) or "Technical Guidance"
                nodes.append(
                    HelpChainNode(
                        step_number=step,
                        focus_area=focus,
                        candidate_id=cand.candidate_id,
                        candidate_name=cand.title,
                        candidate_type=cand.candidate_type,
                        reason=f"Covers {focus} domain requirements.",
                        matched_skills=cand.matched_skills,
                    )
                )
                covered_set.update(cand_skills_lower)
                uncovered.difference_update(cand_skills_lower)
                step += 1

            if step > 3 or not uncovered:
                break

        covered_list = [c.title() for c in list(covered_set)]

        return HelpChain(
            needed_capabilities=required_capabilities,
            covered_capabilities=covered_list if covered_list else required_capabilities,
            nodes=nodes,
            explanation=f"Potential Expertise Chain: Your problem spans {len(nodes)} distinct technical areas. CampusLink identified a potential expertise chain across complementary campus members.",
            is_single_candidate_sufficient=False,
        )
