# Campus Knowledge Intelligence — Phase 5 Documentation

## Architecture Overview
Phase 5 introduces structured, permission-aware campus knowledge intelligence entities to CampusLink AI:
- **Projects**: Academic, Capstone, Research, and Open-Source project records with contributors, roles, skills, and technology tags.
- **Research & Publications**: Journal papers, conference proceedings, preprints, DOI identifiers, and multi-author linkings.
- **Facilities & Equipment**: Campus research laboratories, operating hours, department leads, and specialized hardware assets with real-time availability tracking (`AVAILABLE`, `IN_USE`, `RESERVED`).
- **Problem / Solution Institutional Memory**: Structured bug/failure records containing symptoms, root cause diagnoses, verified code fixes, outcomes, and lessons learned.

---

## Database Schemas & Alembic Migration
- **Migration**: `apps/api/migrations/versions/002_campus_knowledge.py`
- **Domain Tables Added/Extended**:
  - `projects`, `project_contributors`, `project_skills`, `project_technologies`
  - `research_items`, `research_authors`
  - `facilities`, `equipment`
  - `problem_solutions`, `problem_solution_skills`, `problem_solution_technologies`

---

## REST API Specifications

### 1. Projects API
- `POST /api/v1/projects`: Create project & assign creator as `OWNER`.
- `GET /api/v1/projects`: Paginated list of projects with status, type, and domain filters.
- `GET /api/v1/projects/mine`: List projects created by current user.
- `GET /api/v1/projects/{project_id}`: Fetch project detail with contributors and skills.
- `PATCH /api/v1/projects/{project_id}`: Update project metadata (Owner/Admin only).
- `DELETE /api/v1/projects/{project_id}`: Delete project (Owner/Admin only).
- `POST /api/v1/projects/{project_id}/contributors`: Add contributor with role.
- `DELETE /api/v1/projects/{project_id}/contributors/{user_id}`: Remove contributor.

### 2. Research API
- `POST /api/v1/research`: Submit research paper item.
- `GET /api/v1/research`: List publications filtered by type, venue, or research area.
- `GET /api/v1/research/mine`: List research papers owned by current user.
- `GET /api/v1/research/{research_id}`: Get detailed paper info and authors.
- `PATCH /api/v1/research/{research_id}`: Update research item (Author/Admin only).
- `DELETE /api/v1/research/{research_id}`: Delete research item (Author/Admin only).

### 3. Facilities & Equipment API
- `POST /api/v1/facilities`: Register lab facility (Faculty/Admin only).
- `GET /api/v1/facilities`: List facilities with equipment counts and contact details.
- `GET /api/v1/facilities/{facility_id}`: Fetch lab details and equipment inventory.
- `PATCH /api/v1/facilities/{facility_id}`: Update facility metadata (Lab Lead/Admin only).
- `DELETE /api/v1/facilities/{facility_id}`: Delete lab facility (Lab Lead/Admin only).
- `POST /api/v1/facilities/{facility_id}/equipment`: Add equipment asset to lab.
- `GET /api/v1/equipment`: List equipment across campus.
- `GET /api/v1/equipment/{equipment_id}`: Get equipment asset details.
- `PATCH /api/v1/equipment/{equipment_id}`: Update availability status (Facility Lead/Admin only).
- `DELETE /api/v1/equipment/{equipment_id}`: Delete equipment asset.

### 4. Problem & Solution Memory API
- `POST /api/v1/solutions`: Publish institutional problem-solution record.
- `GET /api/v1/solutions`: List problem-solution records by domain.
- `GET /api/v1/solutions/mine`: List problem-solution records authored by current user.
- `GET /api/v1/solutions/{solution_id}`: Fetch full problem-solution record with root cause.
- `PATCH /api/v1/solutions/{solution_id}`: Update record (Author/Admin only).
- `DELETE /api/v1/solutions/{solution_id}`: Delete record (Author/Admin only).

---

## Authorization Controls
- **Projects**: Modifiable only by the `created_by` user or an `ADMIN`.
- **Research**: Modifiable only by the paper `owner_id` or an `ADMIN`.
- **Facilities & Equipment**: Facility creation restricted to `FACULTY` and `ADMIN`. Updates restricted to responsible faculty or `ADMIN`.
- **Problem Solutions**: Modifiable only by the `author_id` or an `ADMIN`.

---

## Verification
- Unit & Integration Test Suite: `pytest tests/test_campus_knowledge.py` (4/4 passed).
- Total System Test Suite: 29 passed, 1 skipped.
- Frontend Next.js Build: `npm run build` (18 pages compiled cleanly).
