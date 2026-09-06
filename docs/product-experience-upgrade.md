# Phase 7.6 — Product Experience Upgrade

## Design System

### Color Tokens

| Token | Value | Usage |
|:---|:---|:---|
| `--color-primary` | `#2563EB` | Primary blue (buttons, links, active states) |
| `--color-primary-dark` | `#1D4ED8` | Hover states, dark blue |
| `--color-orange` | `#F97316` | Accent orange (CTA, highlights) |
| `--color-bg` | `#F8FAFC` | Application background |
| `--color-surface` | `#FFFFFF` | Card surface |
| `--color-text` | `#0F172A` | Primary text |
| `--color-text-secondary` | `#475569` | Secondary text |
| `--color-border` | `#E2E8F0` | Default border |

### Typography Scale

| Size | px | Usage |
|:---|:---|:---|
| `text-xs` | 12px | Labels, badges, metadata |
| `text-sm` | 13px | Body text, inputs |
| `text-base` | 15px | Main body content |
| `text-xl` | 18px | Section headings |
| `text-2xl` | 22px | Card headings |
| `text-4xl` | 32px | Page headings |
| `text-6xl` | 44px | Hero headings |

### Shadows

| Name | Usage |
|:---|:---|
| `shadow-card` | Default card shadow |
| `shadow-card-hover` | Card hover elevation |
| `shadow-blue` | Blue button/focus ring |
| `shadow-xl` | Modal/overlay shadow |

---

## API Integration

All service calls now correctly use the `/api/v1/` prefix.

| Service | Old | Fixed |
|:---|:---|:---|
| Projects | `/projects` | `/api/v1/projects` |
| Research | `/research` | `/api/v1/research` |
| Facilities | `/facilities` | `/api/v1/facilities` |
| Equipment | `/equipment` | `/api/v1/equipment` |
| Solutions | `/solutions` | `/api/v1/solutions` |
| Search | `/search` | `/api/v1/search` |
| Agents | `/agents/discover` | `/api/v1/agents/discover` |
| Resume | `/documents/resume` | `/api/v1/documents/resume` |

---

## Resume Workflow

1. User visits `/profile` → sees Resume section
2. If no resume: drag-and-drop / click upload
3. File validation: PDF/DOCX, max 10 MB
4. Upload → AI extraction triggered automatically
5. Redirected to `/onboarding/resume/review?doc=<id>&from=profile`
6. User reviews → confirms → profile marked completed
7. "Replace" button available at all times — does NOT overwrite without confirmation

---

## Page Architecture

| Page | Route | Key Changes |
|:---|:---|:---|
| Discover | `/discover` | Hero section, example queries, evidence cards |
| Search | `/search` | URL ?q= param, result tabs, score bars |
| Projects | `/projects` | Skeleton loading, ApiError, better cards |
| Research | `/research` | Pub type colors, author/venue display |
| Facilities | `/facilities` | Status badges, expandable equipment list |
| Solutions | `/solutions` | Problem/Solution sectioned cards |
| Profile | `/profile` | Hero header, resume section, toggle privacy |

---

## Error Handling Standards

- **404**: "We couldn't find the requested campus resource."
- **401**: "Your session has expired. Please sign in again."
- **403**: "You don't have permission to access this resource."
- **500/503**: "CampusLink encountered a server error."
- **Network**: "Unable to reach CampusLink servers."

No page uses `alert()` or silently swallows errors.
