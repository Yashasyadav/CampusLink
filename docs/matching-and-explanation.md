# Phase 8 — Matching & Explanation Intelligence

## 1. Overview

Phase 8 introduces **Matching & Explanation Intelligence** to CampusLink AI. While Phase 7 discovered evidence-backed candidate pointers across people, projects, research, solutions, and facilities, Phase 8 evaluates candidate relevance, grounds explanations in empirical evidence, classifies actionable help types, and constructs potential expertise Help Chains.

The core product transformation:
- **Phase 7**: *"Here are some things we found."*
- **Phase 8**: *"Here are the most relevant options, why they are relevant, and what evidence supports them."*

---

## 2. Architecture

```
User Natural Language Problem
             │
             ▼
POST /api/v1/matching/analyze
             │
             ▼
    MatchingAgent / Service
             │
   ┌─────────┴────────────────────────┐
   ▼                                  ▼
Phase 7 Discovery           Scoring Engine (Deterministic)
(People, Projects,          • Semantic relevance (35%)
 Solutions, Facilities)      • Skill overlap (20%)
                             • Tech overlap (15%)
                             • Project evidence (15%)
                             • Solution evidence (10%)
                             • Evidence quality (5%)
                                      │
             ┌────────────────────────┴────────────────────────┐
             ▼                                                 ▼
Evidence Aggregation & Privacy                      Explanation Agent / Service
• Filters private profiles/resumes                  • Grounded in evidence only
• Formats EvidenceItem list                         • Classifies HelpTypeEnum
• Computes evidence strength                        • Hallucination defenses
             │                                                 │
             └────────────────────────┬────────────────────────┘
                                      │
                                      ▼
                        Potential Expertise Help Chain
                        • Greedy set-cover heuristic
                        • 1 to 3 candidate nodes
                                      │
                                      ▼
                           Structured Response JSON
```

---

## 3. Scoring Formula & Configuration

Numerical relevance scores are computed **100% deterministically** by `ScoringService`. The LLM is never allowed to directly invent or mutate scores.

$$\text{Final Score} = \sum_{i} w_i \cdot s_i$$

### Centralized Config Weights (`app/core/config.py`):

| Weight Component | Percentage | Description |
| :--- | :---: | :--- |
| `semantic_relevance` | 35% | Vector & text retrieval similarity |
| `skill_overlap` | 20% | Normalized Jaccard ratio of query skills to candidate skills |
| `technology_overlap` | 15% | Normalized overlap ratio of required technologies |
| `project_evidence` | 15% | Binary weight for direct candidate project evidence |
| `solution_evidence` | 10% | Binary weight for direct historical solution evidence |
| `evidence_quality` | 5% | Hierarchical evidence type strength score |

### Relevance Level Mapping
- **$\ge 85\%$**: `High relevance`
- **$\ge 70\%$**: `Strong match`
- **$\ge 50\%$**: `Relevant`
- **$< 50\%$**: `Potential match`

No fake precision (e.g. `92.438%`) is displayed to the user.

---

## 4. Evidence Model & Quality Hierarchy

Evidence items are aggregated by `EvidenceService` and ranked according to the evidence quality hierarchy:

1. **PROBLEM_SOLUTION** (1.00) — Direct past problem/solution experience.
2. **PROJECT** (0.85) — Similar project experience.
3. **RESEARCH** (0.75) — Relevant research publication.
4. **PROFILE_SKILL** (0.65) — Explicit confirmed skill.
5. **EQUIPMENT / FACILITY** (0.50) — Laboratory capability or hardware asset.
6. **PROFILE** (0.35) — General profile description.

### Privacy Guardrails
- `PRIVATE_RESUME` raw document text is strictly excluded.
- Hidden email/phone and private contact attributes are omitted.
- Private projects and private profiles are filtered out prior to matching.

---

## 5. Explanation Architecture & Grounding

`ExplanationService` and `ExplanationAgent` convert structured candidate data and evidence into human-readable explanations.

- **Prompt Version**: `MATCH_EXPLANATION_PROMPT_V1`
- **Rules**:
  1. Use ONLY supplied query understanding, candidate metadata, deterministic scores, and retrieved evidence.
  2. NEVER invent skills, experience, projects, job titles, achievements, availability, relationships, or contact details.
  3. Fallback when evidence is sparse: *"Relevant based on shared skills and technology."*

### Actionable Help Types (`HelpTypeEnum`):
- `TECHNICAL_GUIDANCE`
- `PROJECT_COLLABORATION`
- `RESEARCH_GUIDANCE`
- `HARDWARE_SUPPORT`
- `SOFTWARE_SUPPORT`
- `DEBUGGING_HELP`
- `DOMAIN_EXPERTISE`
- `FACILITY_ACCESS`
- `PREVIOUS_SOLUTION_REFERENCE`

---

## 6. Help Chain Algorithm

For multi-domain queries (e.g. *"ESP32 microphone + TinyML accuracy"*), no single person may possess all required capabilities.

- **Algorithm**: Greedy set-cover heuristic selecting 1 to 3 candidate nodes.
- **Single Match Optimization**: If one top candidate covers all required query skills, return `is_single_candidate_sufficient = True`.
- **Disclaimer**: Expressly labeled as `POTENTIAL EXPERTISE CHAIN`. No messaging, contacting, or connection requests are generated (Phase 9 boundary).

---

## 7. API Specification

### `POST /api/v1/matching/analyze`

#### Request Body
```json
{
  "query": "My ESP32 microphone works, but my TinyML keyword detection model has poor accuracy."
}
```

#### Response Schema
- `query`: `string`
- `understanding`: `QueryUnderstandingResult`
- `top_people`: `List[MatchingResult]`
- `top_projects`: `List[MatchingResult]`
- `top_solutions`: `List[MatchingResult]`
- `research`: `List[MatchingResult]`
- `facilities`: `List[MatchingResult]`
- `help_chain`: `Optional[HelpChain]`
- `traces`: `List[AgentTrace]`
- `metadata`: `object`

---

## 8. Verification & Test Suite

16 unit, integration, and API tests implemented in `tests/test_matching.py`:
- Deterministic formula calculation test
- Skill & technology overlap tests
- Clamping & normalization tests
- Evidence quality & privacy filtering tests
- Explanation grounding & hallucination defense tests
- Help Chain multi-candidate & single-candidate tests
- API authentication & validation error tests (`200 OK`, `401 Unauthorized`, `422 Unprocessable`)

**Pytest Status**: 16/16 Passed cleanly.
**TypeScript Status**: 0 Errors (`npx tsc --noEmit`).
**Production Build Status**: 20/20 Routes Compiled (`npm run build`).

---

## 9. Future Calibration Strategy

The centralized `MATCHING_WEIGHTS` dictionary in `app/core/config.py` allows future calibration using real user feedback (e.g., click-through rates, helpfulness votes, and project contact outcomes) without refactoring the core matching pipeline.
