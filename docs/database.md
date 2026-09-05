# CampusLink AI — Database & Vector Architecture

## PostgreSQL + pgvector

CampusLink AI uses PostgreSQL 16 with the `pgvector` extension as its single source of truth for both relational entity data and high-dimensional semantic vector embeddings.

### Relational Entities (Phase 2 Roadmap):
- **Users & Auth**: Credentials, roles, permissions.
- **Profiles**: Student, faculty, and researcher profiles, skills, interests.
- **Projects**: Past and current campus projects, research records, problem statements.
- **Facilities & Equipment**: Labs, specialized machinery, computing clusters, access policies.
- **Connections & Requests**: Expertise discovery records, introduced links, match interactions.
- **Audit Logs**: Governance, privacy visibility checks, system access logs.

### Vector Embeddings (Phase 2 Roadmap):
- Profile skill embeddings
- Project description vector index
- Facility capabilities vector index
- Problem statement semantic matching
