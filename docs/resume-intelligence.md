# CampusLink AI — Resume Intelligence & Document Processing Architecture

## 1. Overview
CampusLink AI Phase 4 establishes a production-oriented document intelligence pipeline for resume upload, validation, structured parsing, taxonomy normalization, confidence tracking, and candidate profile confirmation.

```
Resume Upload (PDF/DOCX)
       ↓
Isolated Private Storage (storage/private/resumes/)
       ↓
Document Validation (MIME & Magic Bytes)
       ↓
Document AI Abstraction (GeminiDocumentAIProvider)
       ↓
Structured Extraction (Pydantic ResumeExtraction Schema)
       ↓
Deterministic Normalization (Skill Taxonomy)
       ↓
Extraction Review UI (/onboarding/resume/review)
       ↓
User Review & Confirmation
       ↓
Approved Profile & Knowledge Base Updates
```

---

## 2. Security & Storage Architecture
- **Private Storage**: Uploaded files are stored in `storage/private/resumes/{owner_id}/{document_id}.ext`. Uploaded documents are **NEVER** placed in public web directories (`apps/web/public/`) or made directly accessible over HTTP.
- **Path Traversal Protection**: `LocalStorageProvider` resolves and sanitizes all storage keys, verifying strict containment within `STORAGE_DIR`.
- **MIME & Content Magic Bytes Validation**: Inspects binary headers (`%PDF-` for PDF, `PK\x03\x04` for DOCX) and enforces a 10MB configurable limit (`MAX_RESUME_SIZE_MB`).

---

## 3. Gemini Document AI Provider & Abstraction
- **SDK**: Official Google GenAI SDK (`google-genai`).
- **Abstraction**: `DocumentAIProvider` interface with `GeminiDocumentAIProvider` implementation.
- **Model**: Default `gemini-1.5-pro` (configurable via `GEMINI_MODEL`).
- **Multimodal & DOCX Support**:
  - PDFs are passed directly for visual multimodal layout understanding (`types.Part.from_bytes(data, mime_type="application/pdf")`).
  - DOCX files are parsed locally using `python-docx`, preserving paragraph and table structure before structured prompt generation.
- **Structured Schema**: Output forced to conform strictly to Pydantic `ResumeExtraction` JSON schema (`response_mime_type="application/json"`).
- **Prompt Injection Defense**: Versioned prompt `RESUME_EXTRACTION_PROMPT_V1` isolates instructions from untrusted resume text.

---

## 4. Provenance, Confidence & Hallucination Prevention
- **Provenance Types**: `EXPLICIT` (direct quotation), `INFERRED` (contextual implication), `AI_GENERATED` (profile summary).
- **Confidence Rating**: Numerical scores (0.0 to 1.0) rendered on the frontend as clear badges ("High confidence", "Medium confidence", "Needs review").
- **Existing Profile Protection**: AI extraction candidates **NEVER** overwrite existing manually entered profile bio or details without explicit user review and confirmation.

---

## 5. Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/resume` | Upload PDF or DOCX resume document (max 10MB) |
| `GET` | `/api/v1/documents/resume/current` | Get active resume metadata and status |
| `POST` | `/api/v1/documents/resume/{id}/process` | Trigger or retry Gemini document AI extraction |
| `GET` | `/api/v1/documents/resume/{id}/extraction` | Get structured extraction output for review |
| `PATCH` | `/api/v1/documents/resume/{id}/extraction` | Edit candidate fields prior to confirmation |
| `POST` | `/api/v1/documents/resume/{id}/confirm` | Confirm extraction & apply approved fields to profile |

---

## 6. Environment Configuration
Add to `.env`:
```ini
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
STORAGE_DIR=storage/private/resumes
MAX_RESUME_SIZE_MB=10
```
