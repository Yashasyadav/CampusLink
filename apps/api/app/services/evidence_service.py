import logging
from typing import List, Dict, Any, Optional
from app.schemas.matching import EvidenceItem
from app.schemas.agents import Evidence

logger = logging.getLogger(__name__)


class EvidenceService:
    """
    Service responsible for aggregating, formatting, and ranking candidate evidence items
    while enforcing privacy and permission boundary controls.
    """

    @staticmethod
    def format_evidence_items(
        candidate_id: str,
        candidate_type: str,
        raw_evidences: List[Evidence],
        candidate_meta: Dict[str, Any] = None
    ) -> List[EvidenceItem]:
        """
        Transforms raw agent discovery evidence items into structured EvidenceItem objects.
        Filters out any private/unauthorized content pointers.
        """
        formatted: List[EvidenceItem] = []
        candidate_meta = candidate_meta or {}

        for ev in raw_evidences:
            # Enforce privacy check: Skip raw resume or private contact snippets
            snippet = ev.snippet.strip() if ev.snippet else ""
            if "PRIVATE_RESUME" in snippet or "hidden_contact" in snippet:
                continue

            item = EvidenceItem(
                source_type=ev.entity_type.upper(),
                source_id=str(ev.entity_id),
                source_title=ev.title,
                snippet=snippet[:300] if snippet else f"Evidence record from {ev.source}",
                relevance=round(max(0.0, min(1.0, float(ev.score))), 4),
            )
            formatted.append(item)

        # Fallback if no raw evidence items were attached
        if not formatted and candidate_meta:
            source_type = candidate_type.upper()
            if source_type == "PERSON":
                title = "Public Profile & Skills"
            else:
                title = candidate_meta.get("title") or candidate_meta.get("name") or "Campus Record"
            snippet_text = candidate_meta.get("bio") or candidate_meta.get("description") or f"Explicit {source_type.lower()} match."
            formatted.append(
                EvidenceItem(
                    source_type=source_type,
                    source_id=str(candidate_id),
                    source_title=title,
                    snippet=str(snippet_text)[:300],
                    relevance=0.75,
                )
            )

        # Rank evidence items by relevance descending
        formatted.sort(key=lambda x: x.relevance, reverse=True)
        return formatted
