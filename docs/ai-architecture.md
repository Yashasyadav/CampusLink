# CampusLink AI — Multi-Agent System Architecture

## Core Conceptual Orchestration Flow

```
[ User Query: "I have a problem..." ]
                ↓
    [ Query Understanding Agent ]
                ↓
    ┌───────────┼───────────┐
    ↓           ↓           ↓
 [People]  [Projects]  [Facilities]  (Parallel Retrieval Agents)
    └───────────┬───────────┘
                ↓
  [ Matching & Explanation Agent ]
                ↓
 [ Evidence-Backed Recommendation ]
```

## Abstracted LLM Provider Strategy

To prevent vendor lock-in, all LLM invocations flow through unified interface boundaries. Although Phase 1 initializes configuration placeholders for the **Gemini API**, the architecture enforces abstract model wrappers allowing seamless substitution (e.g., Anthropic, OpenAI, or local models).

## Agent Responsibility Matrix

1. **Query Understanding Agent**: Deconstructs raw problem descriptions into key intent, domain taxonomy, required skills, and entity filters.
2. **People Discovery Agent**: Searches student & faculty profiles based on skill overlap, verified past contributions, and collaboration history.
3. **Project & Knowledge Agent**: Matches against past project records, published papers, solution documents, and GitHub repositories.
4. **Facility Discovery Agent**: Finds specialized hardware, lab tools, computing resources, and facility managers matching technical needs.
5. **Matching & Explanation Agent**: Synthesizes multi-source evidence, scores relevancy, ranks findings, and provides transparent explanations for each match.
