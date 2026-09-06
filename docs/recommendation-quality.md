# Phase 10 — Trust, Feedback & Recommendation Quality Intelligence

## Overview

CampusLink AI Phase 10 introduces persistent recommendation auditing, user feedback collection, deterministic quality scoring, and administrative audit interfaces. This phase turns CampusLink AI from a recommendation engine into a trustworthy, self-monitoring platform that transparently tracks why recommendations were surfaced and how helpful users found them.

---

## Key Capabilities

1. **Persistent Audit Trail (`RecommendationEvent`)**
   - Automatically logs every recommendation surfaced by the agentic discovery graph (`/api/v1/discover/search`).
   - Captures snapshot metrics at the moment of recommendation: match score, semantic score, ground evidence count, and explanation coverage.
   - Prevents stale feedback by binding feedback directly to a immutable recommendation event record.

2. **Updatable User Feedback (`RecommendationFeedback`)**
   - Enables users to submit explicitly categorized feedback (`HELPFUL`, `NOT_HELPFUL`, `INACCURATE`, `IRRELEVANT`, `OUTDATED`) along with structured reasons (`WEAK_SKILL_MATCH`, `LOW_SEMANTIC_RELEVANCE`, `EXPLANATION_UNCLEAR`, `EVIDENCE_MISSING`, `OTHER`) and optional comments.
   - Idempotent upsert allows users to revise feedback without generating duplicate entries.
   - Enforces strict server-side IDOR authorization: users can only view and submit feedback for recommendation events addressed to them.

3. **Deterministic Quality Flags**
   - Evaluates system trust signals dynamically on recommendation events:
     - `LOW_EVIDENCE`: Less than 2 verified evidence points attached.
     - `WEAK_SKILL_MATCH`: Match score under 0.60.
     - `LOW_SEMANTIC_RELEVANCE`: Semantic similarity score under 0.50.
     - `NEGATIVE_USER_FEEDBACK`: Candidate received `NOT_HELPFUL`, `INACCURATE`, or `IRRELEVANT` feedback.
     - `EXPLANATION_MISSING`: Grounded explanation not provided.

4. **Administrative Quality & Audit Dashboards**
   - Protected by `UserRole.ADMIN` role checks on all administrative API endpoints.
   - Surfacing overall metrics: overall helpful rate, negative feedback rate, average evidence count, explanation coverage, and feedback coverage.
   - Includes breakdown analytics grouped by entity type (`STUDENT`, `PROJECT`, `FACILITY`, `RESEARCH_GROUP`).
   - Filters audit records by date range, query text, quality flags, entity type, and feedback rating.
   - Detail view redacts sensitive PII (like raw user session tokens or IP addresses) while presenting a complete diagnostic trace of candidate context, scoring components, evidence graph references, and user feedback history.

---

## Database Architecture

### `recommendation_events` Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, FK to `users.id`)
- `entity_id` (UUID)
- `entity_type` (Enum: `STUDENT`, `PROJECT`, `FACILITY`, `RESEARCH_GROUP`)
- `match_score` (Float)
- `semantic_score` (Float)
- `evidence_count` (Integer)
- `has_explanation` (Boolean)
- `query_text` (String, indexed)
- `surfaced_at` (DateTime with time zone)

### `recommendation_feedback` Table
- `id` (UUID, Primary Key)
- `recommendation_id` (UUID, FK to `recommendation_events.id`, Unique index)
- `user_id` (UUID, FK to `users.id`)
- `feedback_type` (Enum: `HELPFUL`, `NOT_HELPFUL`, `INACCURATE`, `IRRELEVANT`, `OUTDATED`)
- `reason` (Enum: `EXACT_MATCH`, `HIGH_RELEVANCE`, `WEAK_SKILL_MATCH`, `LOW_SEMANTIC_RELEVANCE`, `EXPLANATION_UNCLEAR`, `EVIDENCE_MISSING`, `OTHER`)
- `optional_comment` (Text)
- `created_at` (DateTime with time zone)
- `updated_at` (DateTime with time zone)

---

## API Reference

### User Feedback Endpoints
- `POST /api/v1/feedback/recommendations/{recommendation_id}`: Submit or update feedback for a recommendation event.
- `GET /api/v1/feedback/recommendations/{recommendation_id}`: Retrieve existing user feedback for a recommendation event.

### Admin Audit Endpoints
- `GET /api/v1/admin/recommendations/metrics`: Aggregated recommendation quality metrics & entity breakdown.
- `GET /api/v1/admin/recommendations`: Searchable, filterable recommendation audit log with quality flags.
- `GET /api/v1/admin/recommendations/{id}`: Privacy-sanitized audit detail view for a specific recommendation event.

---

## Frontend Integration

- **Discover Page (`/discover`)**: Candidate cards feature trust badges (e.g. relevance percentage and verified evidence pill) along with interactive `[ Helpful ]` and `[ Not helpful ]` action buttons with popover feedback modal.
- **Admin Dashboard (`/admin/recommendations`)**: Complete overview of metrics cards, filter bar (Quality Flag, Entity Type, Rating, Query Search), and entity breakdown table.
- **Admin Audit Detail (`/admin/recommendations/[id]`)**: Full inspection view highlighting quality flags, score breakdowns, grounded evidence items, and user feedback audit trail.
