"""Database Reset & E2E Seed Command for CampusLink AI.

Clears existing records, populates the complete synthetic CampusLink campus dataset,
generates PDF/DOCX resume fixtures, attaches private document extractions, and rebuilds vector embeddings.

Usage:
  python -m scripts.reset_test_data
  or
  python scripts/reset_test_data.py
"""
import sys
import os
import logging
from pathlib import Path

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SyncSessionLocal
from app.db.seed import run_seed
from tests.fixtures.generate_fixtures import generate_all_fixtures
from app.services.embedding_index_service import EmbeddingIndexService
from app.models.users import User
from app.models.documents import Document, DocumentExtraction, DocumentType, ProcessingStatus, ExtractionStatus

logger = logging.getLogger("campuslink.reset")


def reset_test_environment():
    logging.basicConfig(level=logging.INFO)
    logger.info("=" * 70)
    logger.info("CAMPUSLINK AI — E2E TEST DATASET RESET")
    logger.info("=" * 70)

    # 1. Run seed script with force=True to wipe and recreate dataset
    logger.info("\n[1/4] Seeding synthetic CampusLink E2E dataset...")
    run_seed(force=True)

    # 2. Generate resume fixtures
    logger.info("\n[2/4] Generating synthetic PDF & DOCX resume fixtures...")
    generate_all_fixtures()

    # 3. Attach private document fixture for Student 2 (Meera Nair)
    logger.info("\n[3/4] Attaching private document & extraction fixtures for Meera Nair...")
    db = SyncSessionLocal()
    try:
        meera = db.query(User).filter(User.email == "student2@campuslink.test").first()
        if meera:
            # Check if document already exists
            existing_doc = db.query(Document).filter(Document.owner_id == meera.id).first()
            if not existing_doc:
                doc = Document(
                    owner_id=meera.id,
                    document_type=DocumentType.RESUME,
                    original_filename="meera_nair_dsp.pdf",
                    storage_key="resumes/student2/meera_nair_dsp.pdf",
                    mime_type="application/pdf",
                    file_size=2048,
                    checksum="synthetic-e2e-checksum-meera",
                    processing_status=ProcessingStatus.CONFIRMED,
                )
                db.add(doc)
                db.flush()

                extraction = DocumentExtraction(
                    document_id=doc.id,
                    extracted_data={
                        "skills": ["DSP", "Audio Processing", "Noise Reduction", "Spectral Analysis", "Python", "MATLAB"],
                        "projects": ["Microphone Noise Reduction using Spectral Filtering"],
                        "experience": ["Digital Signal Processing Lab Researcher"],
                    },
                    model_name="gemini-2.5-flash",
                    confidence=0.95,
                    extraction_status=ExtractionStatus.COMPLETED,
                )
                db.add(extraction)
                db.commit()
                logger.info("Attached private resume document fixture for Meera Nair (Student 2).")

        # 4. Rebuild embeddings
        logger.info("\n[4/4] Indexing vector embeddings for all campus entities...")
        indexer = EmbeddingIndexService()
        report = indexer.reindex_all(db)
        logger.info(
            f"Embeddings index report: Total={report.total_records} | "
            f"Indexed={report.indexed_records} | Skipped={report.skipped_records} | "
            f"Failed={report.failed_records} | Duration={report.duration_seconds}s"
        )
    finally:
        db.close()

    logger.info("\n" + "=" * 70)
    logger.info("E2E TEST DATASET RESET SUCCESSFULLY COMPLETED!")
    logger.info("=" * 70)


if __name__ == "__main__":
    reset_test_environment()
