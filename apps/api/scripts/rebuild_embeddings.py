"""Embedding Rebuilding Script for CampusLink AI.

Scans all campus entities (Profiles, Projects, Research, Facilities, Equipment, ProblemSolutions),
builds chunk text, generates embeddings via EmbeddingIndexService, and inserts vector embeddings into database.
"""
import sys
import os
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SyncSessionLocal
from app.services.embedding_index_service import EmbeddingIndexService

logger = logging.getLogger("campuslink.embeddings")


def rebuild_embeddings():
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting campus-wide embedding indexing...")

    db = SyncSessionLocal()
    try:
        indexer = EmbeddingIndexService()
        report = indexer.reindex_all(db)
        logger.info(
            f"Embedding Index Complete! Total: {report.total_records} | "
            f"Indexed: {report.indexed_records} | Skipped: {report.skipped_records} | "
            f"Failed: {report.failed_records} | Duration: {report.duration_seconds}s"
        )
        if report.errors:
            logger.warning(f"Indexing errors encountered: {report.errors}")
    finally:
        db.close()


if __name__ == "__main__":
    rebuild_embeddings()
