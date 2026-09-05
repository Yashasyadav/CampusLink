# CampusLink AI — Development Guidelines & Workflow

## Coding Standards

### Frontend (TypeScript / Next.js):
- **Strict TypeScript Mode**: `noImplicitAny`, `strictNullChecks` enforced.
- **Component Isolation**: Reusable generic UI components reside in `components/ui/`. Domain components reside in `features/<domain>/`.
- **Styling**: Vanilla CSS tokens combined with utility Tailwind CSS. Avoid arbitrary inline pixel values.
- **API Access**: All server calls flow through `src/services/` or `src/lib/api-client.ts`.

### Backend (Python / FastAPI):
- **Type Annotations**: Python type hints required across all parameters and return types.
- **Data Validation**: Strict Pydantic schemas for request validation and response serialization.
- **No Logic in Routes**: Route handlers delegate immediately to service functions.
- **Dependency Injection**: Use FastAPI `Depends()` for database sessions, security context, and service providers.

## Git & Workflow Conventions
- Monorepo commits use conventional commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Secrets must NEVER be committed to version control.
