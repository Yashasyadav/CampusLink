import hashlib
import time
import uuid
import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field
from sqlalchemy import select, delete
from sqlalchemy.orm import Session

from app.models.embeddings import Embedding
from app.models.profiles import Profile
from app.models.projects import Project
from app.models.research import ResearchItem
from app.models.facilities import Facility, Equipment
from app.models.knowledge import ProblemSolution
from app.models.users import User

from app.services.embedding_provider import get_embedding_provider, EmbeddingProvider
from app.services.text_builder import (
    build_profile_text,
    build_project_text,
    build_research_text,
    build_facility_text,
    build_equipment_text,
    build_problem_solution_text,
)
from app.services.chunking import chunk_entity_text

logger = logging.getLogger(__name__)


@dataclass
class IndexingReport:
    total_records: int = 0
    indexed_records: int = 0
    skipped_records: int = 0
    failed_records: int = 0
    duration_seconds: float = 0.0
    embedding_model: str = ""
    errors: List[str] = field(default_factory=list)


class EmbeddingIndexService:
    """Service responsible for building, chunking, embedding, and indexing campus knowledge entities."""

    def __init__(self, provider: Optional[EmbeddingProvider] = None):
        self.provider = provider or get_embedding_provider()

    def calculate_hash(self, text: str) -> str:
        """Compute SHA256 hex digest of text."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def index_entity(
        self, db: Session, entity_type: str, entity_id: uuid.UUID, entity_obj: Optional[Any] = None
    ) -> bool:
        """
        Index or re-index a single entity.
        Idempotent: skips re-embedding if content hash has not changed.
        """
        # 1. Resolve entity object if not passed
        if entity_obj is None:
            entity_obj = self._load_entity(db, entity_type, entity_id)

        if entity_obj is None:
            # Source entity no longer exists - clean up any stale embeddings
            self.delete_entity_embeddings(db, entity_type, entity_id)
            return False

        # 2. Build deterministic text representation
        text = self._build_entity_text(entity_type, entity_obj)
        if not text:
            # Ineligible for search (e.g., non-searchable profile) -> remove existing embeddings
            self.delete_entity_embeddings(db, entity_type, entity_id)
            return False

        content_hash = self.calculate_hash(text)

        # 3. Check existing embeddings for hash match
        existing = db.scalars(
            select(Embedding).where(
                Embedding.entity_type == entity_type,
                Embedding.entity_id == entity_id,
            )
        ).all()

        if existing and all(e.content_hash == content_hash for e in existing):
            logger.debug(f"Skipping re-embedding for {entity_type}:{entity_id} (hash unchanged)")
            return True

        # 4. Chunk content
        chunks = chunk_entity_text(entity_type, text, entity_obj)
        if not chunks:
            self.delete_entity_embeddings(db, entity_type, entity_id)
            return False

        # 5. Generate embeddings
        try:
            embeddings_vectors = self.provider.embed_texts(chunks)
        except Exception as exc:
            logger.error(f"Failed to generate embeddings for {entity_type}:{entity_id}: {exc}")
            return False

        # 6. Delete old embeddings inside transaction
        db.execute(
            delete(Embedding).where(
                Embedding.entity_type == entity_type,
                Embedding.entity_id == entity_id,
            )
        )

        # 7. Insert new chunk embeddings
        for idx, (chunk_text, vector) in enumerate(zip(chunks, embeddings_vectors)):
            embedding_record = Embedding(
                entity_type=entity_type,
                entity_id=entity_id,
                chunk_index=idx,
                chunk_text=chunk_text,
                embedding=vector,
                embedding_model=self.provider.model_name,
                content_hash=content_hash,
                metadata_={
                    "char_count": len(chunk_text),
                    "chunk_count": len(chunks),
                },
            )
            db.add(embedding_record)

        db.commit()
        return True

    def delete_entity_embeddings(self, db: Session, entity_type: str, entity_id: uuid.UUID) -> None:
        """Remove all vector embeddings for a specified entity."""
        db.execute(
            delete(Embedding).where(
                Embedding.entity_type == entity_type,
                Embedding.entity_id == entity_id,
            )
        )
        db.commit()

    def reindex_all(self, db: Session, entity_types: Optional[List[str]] = None) -> IndexingReport:
        """
        Campus-wide administrative re-indexing operation.
        Scans database tables, builds text, generates embeddings, and reports results.
        """
        start_time = time.time()
        report = IndexingReport(embedding_model=self.provider.model_name)

        allowed_types = entity_types or [
            "PROFILE",
            "PROJECT",
            "RESEARCH",
            "FACILITY",
            "EQUIPMENT",
            "PROBLEM_SOLUTION",
        ]

        for etype in allowed_types:
            records = self._get_all_entities_of_type(db, etype)
            logger.info(f"DEBUG REINDEX {etype}: found {len(records)} records")
            report.total_records += len(records)

            for item in records:
                e_id = getattr(item, "id", None)
                if etype == "PROFILE":
                    e_id = getattr(item, "id", None)  # profile.id

                if not e_id:
                    report.failed_records += 1
                    continue

                try:
                    success = self.index_entity(db, etype, e_id, item)
                    if success:
                        report.indexed_records += 1
                    else:
                        report.skipped_records += 1
                except Exception as exc:
                    db.rollback()
                    logger.error(f"Error indexing {etype}:{e_id}: {exc}")
                    report.failed_records += 1
                    report.errors.append(f"{etype}:{e_id} -> {str(exc)}")

        report.duration_seconds = round(time.time() - start_time, 3)
        return report

    def _load_entity(self, db: Session, entity_type: str, entity_id: uuid.UUID) -> Optional[Any]:
        if entity_type == "PROFILE":
            return db.get(Profile, entity_id)
        elif entity_type == "PROJECT":
            return db.get(Project, entity_id)
        elif entity_type == "RESEARCH":
            return db.get(ResearchItem, entity_id)
        elif entity_type == "FACILITY":
            return db.get(Facility, entity_id)
        elif entity_type == "EQUIPMENT":
            return db.get(Equipment, entity_id)
        elif entity_type == "PROBLEM_SOLUTION":
            return db.get(ProblemSolution, entity_id)
        return None

    def _build_entity_text(self, entity_type: str, entity_obj: Any) -> Optional[str]:
        if entity_type == "PROFILE":
            user = getattr(entity_obj, "user", None)
            return build_profile_text(entity_obj, user)
        elif entity_type == "PROJECT":
            return build_project_text(entity_obj)
        elif entity_type == "RESEARCH":
            return build_research_text(entity_obj)
        elif entity_type == "FACILITY":
            return build_facility_text(entity_obj)
        elif entity_type == "EQUIPMENT":
            return build_equipment_text(entity_obj)
        elif entity_type == "PROBLEM_SOLUTION":
            return build_problem_solution_text(entity_obj)
        return None

    def _get_all_entities_of_type(self, db: Session, entity_type: str) -> List[Any]:
        if entity_type == "PROFILE":
            return list(db.scalars(select(Profile).where(Profile.searchable == True)).all())
        elif entity_type == "PROJECT":
            return list(db.scalars(select(Project)).all())
        elif entity_type == "RESEARCH":
            return list(db.scalars(select(ResearchItem)).all())
        elif entity_type == "FACILITY":
            return list(db.scalars(select(Facility)).all())
        elif entity_type == "EQUIPMENT":
            return list(db.scalars(select(Equipment)).all())
        elif entity_type == "PROBLEM_SOLUTION":
            return list(db.scalars(select(ProblemSolution)).all())
        return []
