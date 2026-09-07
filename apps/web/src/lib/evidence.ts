import {
  MatchingResult,
  EvidenceItem,
  PersonEvidenceGraph,
  PersonEvidenceProject,
  PersonEvidenceSolution,
  PersonEvidenceResearch,
  PersonEvidenceFacility,
} from "@/types/matching";

export interface EvidenceCategoryItem {
  key: "skills" | "projects" | "solutions" | "research" | "facilities";
  label: string;
  singularLabel: string;
  count: number;
}

export interface CandidateEvidenceDetails {
  totalCount: number;
  label: string;
  shortBadgeLabel: string;
  categories: EvidenceCategoryItem[];
}

/**
 * Calculates the canonical, truthful evidence count and category breakdown
 * for a matching candidate from either person_evidence_graph or supporting_evidence.
 *
 * Rules:
 * 1. An evidence item is counted once; duplicate IDs are deduplicated.
 * 2. Technologies embedded within a project or solution describe that evidence
 *    and are NOT counted as separate evidence items.
 * 3. A single candidate profile reference is not double-counted on top of the graph.
 * 4. Missing/undefined fields return 0 without throwing.
 */
export function getEvidenceDetails(
  candidate?: Partial<MatchingResult> | null
): CandidateEvidenceDetails {
  if (!candidate) {
    return createEmptyEvidenceDetails();
  }

  const graph = candidate.person_evidence_graph;
  const supportingEv = candidate.supporting_evidence || [];

  // Branch A: Candidate has a structured person_evidence_graph
  if (graph && typeof graph === "object") {
    // 1. Skills: Deduplicate unique skill strings case-insensitively
    const rawSkills = Array.isArray(graph.skills) ? graph.skills : [];
    const seenSkills = new Set<string>();
    for (const s of rawSkills) {
      if (typeof s === "string" && s.trim()) {
        seenSkills.add(s.trim().toLowerCase());
      }
    }
    const skillsCount = seenSkills.size;

    // 2. Projects: Deduplicate by project_id (fallback to title)
    // Note: technologies inside project.technologies are attributes, NOT separate evidence items.
    const rawProjects = Array.isArray(graph.projects) ? graph.projects : [];
    const seenProjects = new Set<string>();
    for (const p of rawProjects) {
      if (p && typeof p === "object") {
        const id = (p.project_id || p.title || "").trim().toLowerCase();
        if (id) {
          seenProjects.add(id);
        }
      }
    }
    const projectsCount = seenProjects.size;

    // 3. Solutions: Deduplicate by solution_id (fallback to title)
    // Note: technologies inside solution.technologies are attributes, NOT separate evidence items.
    const rawSolutions = Array.isArray(graph.solutions) ? graph.solutions : [];
    const seenSolutions = new Set<string>();
    for (const s of rawSolutions) {
      if (s && typeof s === "object") {
        const id = (s.solution_id || s.title || "").trim().toLowerCase();
        if (id) {
          seenSolutions.add(id);
        }
      }
    }
    const solutionsCount = seenSolutions.size;

    // 4. Research: Deduplicate by research_id (fallback to title)
    const rawResearch = Array.isArray(graph.research) ? graph.research : [];
    const seenResearch = new Set<string>();
    for (const r of rawResearch) {
      if (r && typeof r === "object") {
        const id = (r.research_id || r.title || "").trim().toLowerCase();
        if (id) {
          seenResearch.add(id);
        }
      }
    }
    const researchCount = seenResearch.size;

    // 5. Facilities: Deduplicate by facility_id (fallback to name)
    const rawFacilities = Array.isArray(graph.facilities) ? graph.facilities : [];
    const seenFacilities = new Set<string>();
    for (const f of rawFacilities) {
      if (f && typeof f === "object") {
        const id = (f.facility_id || f.name || "").trim().toLowerCase();
        if (id) {
          seenFacilities.add(id);
        }
      }
    }
    const facilitiesCount = seenFacilities.size;

    const graphTotal =
      skillsCount + projectsCount + solutionsCount + researchCount + facilitiesCount;

    if (graphTotal > 0) {
      const categories: EvidenceCategoryItem[] = [];

      if (skillsCount > 0) {
        categories.push({
          key: "skills",
          label: `${skillsCount} ${skillsCount === 1 ? "Skill" : "Skills"}`,
          singularLabel: "Skill",
          count: skillsCount,
        });
      }
      if (projectsCount > 0) {
        categories.push({
          key: "projects",
          label: `${projectsCount} ${projectsCount === 1 ? "Project" : "Projects"}`,
          singularLabel: "Project",
          count: projectsCount,
        });
      }
      if (solutionsCount > 0) {
        categories.push({
          key: "solutions",
          label: `${solutionsCount} ${
            solutionsCount === 1 ? "Problem Solution" : "Problem Solutions"
          }`,
          singularLabel: "Problem Solution",
          count: solutionsCount,
        });
      }
      if (researchCount > 0) {
        categories.push({
          key: "research",
          label: `${researchCount} ${
            researchCount === 1 ? "Research Item" : "Research Items"
          }`,
          singularLabel: "Research Item",
          count: researchCount,
        });
      }
      if (facilitiesCount > 0) {
        categories.push({
          key: "facilities",
          label: `${facilitiesCount} ${
            facilitiesCount === 1 ? "Facility" : "Facilities"
          }`,
          singularLabel: "Facility",
          count: facilitiesCount,
        });
      }

      return buildEvidenceDetails(graphTotal, categories);
    }
  }

  // Branch B: Fallback to supporting_evidence items (e.g. for Projects, Solutions, Research, Facilities)
  if (Array.isArray(supportingEv) && supportingEv.length > 0) {
    const seenEvidenceIds = new Set<string>();
    const categoryCounts: Record<string, number> = {
      skills: 0,
      projects: 0,
      solutions: 0,
      research: 0,
      facilities: 0,
    };

    for (const ev of supportingEv) {
      if (!ev) continue;
      const key = `${ev.source_type || ""}:${ev.source_id || ev.source_title || ""}`
        .trim()
        .toLowerCase();
      if (key && !seenEvidenceIds.has(key)) {
        seenEvidenceIds.add(key);

        const type = (ev.source_type || "").toUpperCase();
        if (type.includes("PROJECT")) {
          categoryCounts.projects += 1;
        } else if (type.includes("SOLUTION")) {
          categoryCounts.solutions += 1;
        } else if (type.includes("RESEARCH")) {
          categoryCounts.research += 1;
        } else if (type.includes("FACILITY") || type.includes("EQUIPMENT")) {
          categoryCounts.facilities += 1;
        } else if (type.includes("SKILL") || type.includes("PROFILE") || type.includes("PERSON")) {
          categoryCounts.skills += 1;
        } else {
          categoryCounts.projects += 1;
        }
      }
    }

    const totalCount = seenEvidenceIds.size;
    if (totalCount > 0) {
      const categories: EvidenceCategoryItem[] = [];
      if (categoryCounts.skills > 0) {
        categories.push({
          key: "skills",
          label: `${categoryCounts.skills} ${
            categoryCounts.skills === 1 ? "Skill" : "Skills"
          }`,
          singularLabel: "Skill",
          count: categoryCounts.skills,
        });
      }
      if (categoryCounts.projects > 0) {
        categories.push({
          key: "projects",
          label: `${categoryCounts.projects} ${
            categoryCounts.projects === 1 ? "Project" : "Projects"
          }`,
          singularLabel: "Project",
          count: categoryCounts.projects,
        });
      }
      if (categoryCounts.solutions > 0) {
        categories.push({
          key: "solutions",
          label: `${categoryCounts.solutions} ${
            categoryCounts.solutions === 1 ? "Problem Solution" : "Problem Solutions"
          }`,
          singularLabel: "Problem Solution",
          count: categoryCounts.solutions,
        });
      }
      if (categoryCounts.research > 0) {
        categories.push({
          key: "research",
          label: `${categoryCounts.research} ${
            categoryCounts.research === 1 ? "Research Item" : "Research Items"
          }`,
          singularLabel: "Research Item",
          count: categoryCounts.research,
        });
      }
      if (categoryCounts.facilities > 0) {
        categories.push({
          key: "facilities",
          label: `${categoryCounts.facilities} ${
            categoryCounts.facilities === 1 ? "Facility" : "Facilities"
          }`,
          singularLabel: "Facility",
          count: categoryCounts.facilities,
        });
      }

      return buildEvidenceDetails(totalCount, categories);
    }
  }

  // Branch C: Scalar evidence_count fallback if provided
  if (typeof candidate.evidence_count === "number" && candidate.evidence_count > 0) {
    return buildEvidenceDetails(candidate.evidence_count, []);
  }

  return createEmptyEvidenceDetails();
}

function buildEvidenceDetails(
  totalCount: number,
  categories: EvidenceCategoryItem[]
): CandidateEvidenceDetails {
  if (totalCount <= 0) {
    return createEmptyEvidenceDetails();
  }

  const label =
    totalCount === 1
      ? "Grounded in 1 evidence source"
      : `Grounded in ${totalCount} evidence sources`;

  const shortBadgeLabel =
    totalCount === 1 ? "1 Evidence Source" : `${totalCount} Evidence Sources`;

  return {
    totalCount,
    label,
    shortBadgeLabel,
    categories,
  };
}

function createEmptyEvidenceDetails(): CandidateEvidenceDetails {
  return {
    totalCount: 0,
    label: "0 evidence sources",
    shortBadgeLabel: "0 Evidence Sources",
    categories: [],
  };
}
