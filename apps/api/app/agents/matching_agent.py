import logging
from typing import Optional
from sqlalchemy.orm import Session
from app.models.users import User
from app.schemas.agents import DiscoveryResponse
from app.schemas.matching import MatchingAnalyzeResponse
from app.services.matching_service import MatchingService

logger = logging.getLogger(__name__)


class MatchingAgent:
    """
    Phase 8 Matching Agent.
    Receives Phase 7 discovery output or raw query, evaluates candidate relevance across matching dimensions,
    and returns structured Pydantic analysis data.
    """

    def __init__(self):
        self.matching_service = MatchingService()

    def evaluate(
        self,
        db: Session,
        current_user: User,
        query: str,
        precomputed_discovery: Optional[DiscoveryResponse] = None,
    ) -> MatchingAnalyzeResponse:
        """
        Executes candidate matching evaluation and explanation workflow.
        """
        return self.matching_service.analyze(
            db=db,
            current_user=current_user,
            query=query,
            precomputed_discovery=precomputed_discovery,
        )
