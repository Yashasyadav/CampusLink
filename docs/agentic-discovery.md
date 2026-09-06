# Phase 7 — Agentic Campus Discovery Architecture

## 1. Executive Summary & Core Objective

Phase 7 introduces specialized AI investigator agents that process natural-language campus problem statements and discover evidence-backed candidates using Phase 6 search tools.

```
                         NATURAL LANGUAGE QUERY
                                  │
                                  ▼
                     QUERY UNDERSTANDING AGENT
           (Extracts Intent, Domains, Skills, Tech, Need Flags)
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   PEOPLE DISCOVERY       PROJECT & KNOWLEDGE     FACILITY DISCOVERY
        AGENT              DISCOVERY AGENT              AGENT
   (search_people)        (projects/solutions)     (labs/equipment)
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
                     EVIDENCE-BACKED CANDIDATES
                         & AGENT EXECUTION TRACE
```

---

## 2. Agent Mental Model & Tool Architecture

An Agent is NOT a simple function. An Agent consists of:

$$\text{LLM Reasoning} + \text{Role/Instructions} + \text{Controlled Tools} + \text{Pydantic Schemas} + \text{Bounded Execution}$$

### Controlled Tool Architecture

Agents MUST NOT execute direct SQL or access raw ORM database sessions.

$$\text{Agent} \longrightarrow \text{Controlled Tool} \longrightarrow \text{Application Service} \longrightarrow \text{Search Service (Phase 6)} \longrightarrow \text{PostgreSQL / pgvector}$$

All tools enforce requesting user context and Phase 6 visibility boundaries (`PUBLIC`, `CAMPUS_ONLY`, `searchable=True`).

---

## 3. Specialized Discovery Agents

1. **Query Understanding Agent (`QueryUnderstandingAgent`)**:
   - Analyzes natural language problem descriptions.
   - Extracts domains, skills, technologies, problem keywords, and intent (`IntentEnum`).
   - Sets boolean flags: `needs_people`, `needs_projects`, `needs_solutions`, `needs_facilities`.

2. **People Discovery Agent (`PeopleDiscoveryAgent`)**:
   - Uses `search_people_tool` and `get_profile_tool`.
   - Returns evidence-backed candidates (`PeopleCandidate`) with supporting evidence pointers.

3. **Project & Knowledge Discovery Agent (`ProjectKnowledgeDiscoveryAgent`)**:
   - Uses `search_projects_tool`, `search_research_tool`, and `search_solutions_tool`.
   - Discovers similar projects, research papers, and historical problem/solution records.

4. **Facility Discovery Agent (`FacilityDiscoveryAgent`)**:
   - Uses `search_facilities_tool` and `search_equipment_tool`.
   - Locates operational hardware laboratories and equipment.

---

## 4. Prompt Injection Defense & Data Boundaries

- **Strict Boundary**: Retrieved campus records (resumes, project descriptions, papers) are **untrusted DATA**, not executable system instructions.
- System prompts explicitly instruct the LLM to ignore embedded prompt injections (e.g. "ignore previous instructions", "reveal passwords").
- The agent NEVER invents non-existent campus people, expertise, or hardware.

---

## 5. Security & Authorization

- **User Context Propagation**: Authenticated `current_user` is passed to all tool calls.
- **Visibility Enforcement**: Private projects or non-searchable profiles are NEVER returned to unauthorized users.
- **No Direct SQL**: Agents do not have SQL connection strings or raw DB access.

---

## 6. Execution Service & Partial Failures

`AgentExecutionService` orchestrates execution:
- Maximum 5 tool calls per agent.
- Max execution duration limit per agent.
- If one specialized agent fails (e.g. Facility Agent), remaining agent results are preserved and the overall status reports `PARTIAL_SUCCESS`.

---

## 7. Scope Boundaries (What Phase 7 DOES NOT DO)

- **No Final Match Scores**: Recommendations, percentage match scores ("95% Match"), and final ranking belong to **Phase 8**.
- **No Connections**: Connection requests, contact recommendations, and messaging belong to **Phase 11**.
- **No LangGraph Loops**: LangGraph orchestration and multi-agent loops belong to **Phase 9**.
