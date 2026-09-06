# CampusLink AI

> **Agentic Campus Expertise and Knowledge Discovery Platform**

CampusLink AI is a production-oriented AI application designed to connect campus problems with relevant people, projects, historical problem/solution records, equipment, and faculty expertise using evidence-backed intelligent matching.

---

## 🎯 Core Product Principle

CampusLink AI transforms natural problem descriptions into actionable campus connections through a multi-agent orchestration pipeline:

$$\text{Problem Understanding} \longrightarrow \text{Evidence Discovery} \longrightarrow \text{Intelligent Matching} \longrightarrow \text{Connection}$$

- **Not a chatbot**: Focuses on structured data retrieval, multi-agent reasoning, and explainable recommendations.
- **Not a simple CRUD app**: Combines relational databases, vector search (`pgvector`), and orchestrated agents (`LangGraph`).
- **Not generic social network**: Rooted in verifiable campus assets, past project artifacts, equipment availability, and skill evidence.

---

## 🏗️ Architecture Overview

The platform is built as a production-grade monorepo isolating frontend UI, backend API services, multi-agent workflows, data schemas, and shared utilities.

```
CampusLink_AI/
├── apps/
│   ├── web/                # Next.js (App Router), React, TypeScript, Tailwind CSS
│   └── api/                # Python, FastAPI, Pydantic, SQLAlchemy 2.x, LangGraph
├── packages/
│   └── shared/             # Shared TypeScript types, API contracts, constants
├── data/
│   ├── seed/               # Database seed scripts & initial dataset
│   └── fixtures/           # Testing fixtures & mock documents
├── infra/
│   ├── docker/             # Container definitions (API, Web)
│   └── migrations/         # Database migration scripts (Alembic)
├── docs/                   # Architectural & development documentation
├── .env.example            # Environment configuration template
├── docker-compose.yml      # Local development stack (FastAPI, Next.js, Postgres+pgvector)
├── README.md               # Repository documentation
└── LICENSE                 # MIT License
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js (App Router), React 18/19, TypeScript, Tailwind CSS |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Data Persistence** | PostgreSQL 16 + `pgvector` extension |
| **ORM & Migrations** | SQLAlchemy 2.x (Async API) & Alembic |
| **AI Orchestration** | LangGraph, Gemini API (abstracted LLM provider) |
| **Infrastructure** | Docker & Docker Compose |
| **Repository Setup** | Enterprise Monorepo Structure |

---

## 🚀 Development Strategy

CampusLink AI is constructed using a disciplined phase-by-phase roadmap:

- **Phase 1**: Enterprise Repository Architecture — COMPLETE
- **Phase 2**: PostgreSQL 16 + `pgvector` Database & Alembic Migrations — COMPLETE
- **Phase 3**: Authentication, Cookie Sessions & Profile Onboarding — COMPLETE
- **Phase 4**: Resume Intelligence & Document Processing — COMPLETE
- **Phase 5**: Projects, Research, Facilities & Campus Knowledge Intelligence — COMPLETE
- **Phase 6**: Embeddings, Semantic Vector Search & Hybrid Search — COMPLETE
- **Phase 7**: Agentic Campus Discovery — COMPLETE
- **Phase 7.5**: UI/UX Overhaul, SaaS Identity & Navigation Stabilization — COMPLETE ([Documentation](docs/ui-ux-overhaul.md))
- **Phase 7.6**: Premium Enterprise UI/UX + Resume Workflow + API 404 Fixes — COMPLETE ([Documentation](docs/product-experience-upgrade.md))
- **Phase 8**: Matching & Explanation Intelligence — COMPLETE ([Documentation](docs/matching-and-explanation.md))
- **Phase 9**: LangGraph Agentic Workflow Orchestration — COMPLETE ([Documentation](docs/langgraph-orchestration.md))
- **Phase 10**: Trust, Feedback & Recommendation Quality Intelligence — COMPLETE ([Documentation](docs/recommendation-quality.md))


---

## 🔑 AI & Gemini Configuration Setup

To enable Google Gemini document intelligence for resume upload and structured parsing:

1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Add your key to `.env`:
   ```ini
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-pro
   STORAGE_DIR=storage/private/resumes
   MAX_RESUME_SIZE_MB=10
   ```
> [!NOTE]
> If `GEMINI_API_KEY` is not provided, backend services launch gracefully, reporting `gemini: "unconfigured"` on `GET /health`. Resume processing endpoints return safe non-crashing error responses.


## 📋 Local Prerequisites

- **Node.js**: `v18.x` or `v20.x`+
- **Python**: `v3.11`+
- **Docker & Docker Compose**: Installed and running
- **Git**

---

## ⚙️ Getting Started

### 1. Clone & Set Up Environment

```bash
cp .env.example .env
```

### 2. Start PostgreSQL Container (Port 5433)

CampusLink PostgreSQL runs in Docker on **host port 5433** (keeping any local Windows PostgreSQL on 5432 untouched):

```bash
docker compose up -d db
```

Verify container status:
```bash
docker compose ps
```

### 3. Run Backend API & Apply Migrations

```bash
cd apps/api
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Run database migrations & seed synthetic data
alembic upgrade head
python -m app.db.seed

# Run API server
uvicorn app.main:app --reload --port 8000
```

Verify backend health check (with DB & pgvector status):
`GET http://localhost:8000/health` -> `{"status": "ok", "database": "healthy", "pgvector": "available"}`

### 3. Run Frontend Web App

```bash
cd apps/web
npm install
npm run dev
```

Frontend local server: `http://localhost:3000`

---

## 📄 License

Distributed under the [MIT License](LICENSE).
