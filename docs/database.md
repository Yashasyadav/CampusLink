# CampusLink AI — Database Architecture & Vector Specifications

## Overview
CampusLink AI utilizes **PostgreSQL 16** with the **`pgvector`** extension running inside a dedicated Docker container.

> [!IMPORTANT]
> **Host Port Configuration**:
> - Developer Windows PostgreSQL: `localhost:5432` (Untouched for other local projects)
> - **CampusLink Docker PostgreSQL**: `localhost:5433` (Container port 5432)
> - Database Name: `campuslink_db`
> - User: `campuslink`

---

## Connection Stack & ORM Layering
- **FastAPI Backend**: Accesses database strictly through SQLAlchemy 2.x ORM using `psycopg` driver.
- **Connection URL**: `postgresql+psycopg://campuslink:campuslink_dev_pass@localhost:5433/campuslink_db` (or `db:5432` inside container networks).
- **Session Lifecycle**: Per-request dependency injection (`get_db`) with connection pooling (`pool_pre_ping=True`).

```
[ Frontend Client ]
        ↓
 [ FastAPI Routes ]
        ↓
  [ Service Layer ]
        ↓
[ Repository Layer ]
        ↓
  [ SQLAlchemy 2.x ]
        ↓
 [ PostgreSQL 16 + pgvector ]
```

---

## Domain Model Schema (17 Entities)

1. **`users`**: Account identity, email, password hash, role (`STUDENT`, `FACULTY`, `ADMIN`, `ALUMNI`), status (`ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING`).
2. **`profiles`**: 1-to-1 profile attributes, department, year, designation, bio, social links, and privacy/visibility controls (`searchable`, `contact_visibility`, `show_email`, `show_phone`, `show_social_links`).
3. **`skills`**: Normalized skill taxonomy (e.g., `python`, `react`, `esp32`).
4. **`user_skills`**: User-Skill many-to-many relationship with proficiency level, source, and confidence score.
5. **`projects`**: Campus project records, titles, slugs, descriptions, problem statements, methodology, visibility, and status.
6. **`project_contributors`**: Project-User relationship with roles (`OWNER`, `CONTRIBUTOR`, `MENTOR`, `FACULTY_GUIDE`).
7. **`project_skills`**: Project-Skill many-to-many.
8. **`project_technologies`**: Normalized project technology tags.
9. **`documents`**: Metadata for uploaded resume/report files stored in object storage.
10. **`document_extractions`**: Structured JSONB extraction results from AI parsing.
11. **`research_items`**: Academic publications and research papers.
12. **`facilities`**: Campus labs, workshops, computing clusters.
13. **`equipment`**: Specialized hardware, GPUs, oscilloscopes linked to facilities.
14. **`problem_solutions`**: Institutional memory records capturing problem symptoms, root cause, solution, and outcome.
15. **`embeddings`**: Polymorphic vector embeddings utilizing `pgvector` (`Vector(768)` matching Gemini `text-embedding-004`).
16. **`connections`**: User-to-user connection requests (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`) with self-connection check constraint.
17. **`audit_logs`**: System audit trail tracking privacy updates, document parsing, and security events.

---

## Alembic Migration Strategy

All schema changes are migration-driven. Tables are created and updated strictly via Alembic revisions.

- Initial Revision: `001_initial_schema`
- Enables extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Applies foreign key constraints, indexes, unique constraints, and check constraints.

---

## Database Startup & Seeding Instructions

### 1. Launch Docker Container
```bash
docker compose up -d db
```

### 2. Apply Migrations
```bash
cd apps/api
.venv\Scripts\python -m alembic upgrade head
```

### 3. Load Synthetic Seed Data
```bash
.venv\Scripts\python -m app.db.seed
```
