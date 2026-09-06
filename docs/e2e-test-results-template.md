# CampusLink AI — End-to-End Manual Testing Results Log

Use this template to record manual test execution results for the CampusLink AI application.

**Environment**: Local Development / Synthetic E2E Test Campus (`campuslink_e2e_v1`)  
**Tester**:  
**Date**:  
**Backend Commit / Build**:  
**Frontend Commit / Build**:  

---

## 1. Automated Regression & System Health Results

| Check | Expected | Actual | Status (PASS/FAIL) | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Pytest Suite** | All tests pass (`pytest`) | | | |
| **E2E Dataset Verification** | 22/22 tests pass (`pytest tests/test_e2e_test_environment.py`) | | | |
| **TypeScript Type-Check** | Zero errors (`npx tsc --noEmit`) | | | |
| **Next.js Production Build** | Build succeeds (`npm run build`) | | | |
| **Database Reset Command** | Script completes (`python -m scripts.reset_test_data`) | | | |
| **Embedding Index Command** | Indexing completes (`python -m scripts.rebuild_embeddings`) | | | |

---

## 2. Feature & Flow Manual Test Execution Matrix

| Test Case | Step / Feature | Expected Outcome | Actual Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Student Registration | Account created successfully and redirected | | | |
| **AUTH-02** | Login Valid | `student1@campuslink.test` logs in | | | |
| **AUTH-03** | Login Invalid | Invalid password rejected with error alert | | | |
| **AUTH-04** | Auth Middleware | Unauthenticated access to `/discover` redirected | | | |
| **PROF-01** | Profile View | Profile loads bio, department, and skills | | | |
| **PROF-02** | Profile Edit | Editing bio/links updates profile | | | |
| **PROF-03** | Privacy Toggle | Toggling `searchable` setting persists | | | |
| **RES-01** | Resume Upload | Uploading `meera_nair_dsp.pdf` parses text | | | |
| **RES-02** | Resume Extraction | Skills extracted (DSP, Noise Reduction) | | | |
| **RES-03** | Skill Confirmation | User confirms extracted skills | | | |
| **RES-04** | Resume Privacy | Resume document is hidden from other users | | | |
| **KNOW-01** | Projects Feed | Displays 10 realistic project cards | | | |
| **KNOW-02** | Research Feed | Displays 3 published research paper items | | | |
| **KNOW-03** | Facilities Feed | Displays 3 lab facility entries | | | |
| **KNOW-04** | Solutions Feed | Displays 6 problem/solution records | | | |
| **SRCH-01** | Hybrid Search | "ESP32 TinyML" query retrieves relevant projects | | | |
| **SRCH-02** | Entity Filters | Filtering by "People" returns profile cards | | | |
| **SRCH-03** | Privacy Exclusion | User B (`Rohan Kapoor`) excluded from search | | | |
| **DISC-01** | Golden Query Discovery | "ESP32 microphone works..." query parsed | | | |
| **DISC-02** | People Recommendation | Aarav Menon & Meera Nair returned | | | |
| **DISC-03** | Help Chain Generation | Aarav → Meera → Dr. Kavitha chain generated | | | |
| **DISC-04** | Evidence Aggregation | Projects and solutions attached as evidence | | | |
| **GRAPH-01** | LangGraph Workflow | Graph executes parallel nodes cleanly | | | |
| **GRAPH-02** | Trace Visibility | Real node execution trace displayed | | | |
| **SEC-01** | Contact Privacy | User C (`Diya Sharma`) hides contact info | | | |
| **SEC-02** | Prompt Injection Fixture | Untrusted text rendered as data; no secret leak | | | |
| **ERR-01** | Empty Query | Empty search handled gracefully | | | |
| **ERR-02** | Irrelevant Query | Blockchain query returns graceful low-confidence | | | |

---

## 3. Reviewer Summary & Next Steps

- **Total Test Cases**: 28
- **Passed**: 
- **Failed**: 
- **Blockers / Issues Identified**:
- **Readiness Recommendation**:
