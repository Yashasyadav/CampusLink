# CampusLink AI — Architecture & Boundaries

## Monorepo Layout

CampusLink AI uses a monorepo structure separating application entry points (`apps/`), shared dependencies (`packages/Shared`), data seeds/fixtures (`data/`), infrastructural definitions (`infra/`), and system documentation (`docs/`).

```
CampusLink_AI/
├── apps/
│   ├── web/        # Next.js App Router Frontend
│   └── api/        # FastAPI Python Backend
├── packages/
│   └── shared/     # Cross-cutting TypeScript interfaces & API models
├── data/
│   ├── seed/       # Initial dataset scripts
│   └── fixtures/   # Test fixtures & document samples
└── infra/
    ├── docker/     # Dockerfiles & container configs
    └── migrations/ # Alembic migrations container
```

## System Layering Principles

The backend maintains strict structural decoupling across layers:

```
[ HTTP Route Handlers / API ]
            ↓
    [ Service Layer ]
            ↓
  [ Repository Layer ]
            ↓
   [ PostgreSQL DB ]
```

And for multi-agent execution:

```
[ HTTP Route / Trigger ]
            ↓
    [ LangGraph Graph ]
            ↓
     [ AI Agents ]
            ↓
 [ Permission-Aware Tools ]
            ↓
    [ Service Layer ]
            ↓
  [ Repository Layer ]
            ↓
   [ PostgreSQL DB ]
```

### Critical Layering Rules:
1. **Agents must NEVER execute raw SQL queries directly.**
2. **Agents must NEVER bypass security, visibility, or authorization policies.**
3. **Agents must consume data strictly via deterministic, permission-aware tools.**
