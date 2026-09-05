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

- **Phase 1 (Current)**: Enterprise Architecture & Foundation
- **Phase 2**: Database Schema, Models & Alembic Migrations
- **Phase 3**: Core Domain Services & Deterministic API Endpoints
- **Phase 4**: Agentic Framework & LangGraph Workflow Integration
- **Phase 5**: Frontend UI/UX Experience & Integration
- **Phase 6**: Hardening, Security, Testing & Production Deployment

---

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

### 2. Run Backend API

```bash
cd apps/api
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend health check:
`GET http://localhost:8000/health` -> `{"status": "ok"}`

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
