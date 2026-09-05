import uuid
from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.documents import Document, DocumentExtraction, DocumentType, ProcessingStatus, ExtractionStatus


class DocumentRepository:
    """Async repository for document metadata and extraction CRUD operations."""

    @staticmethod
    async def create_document(
        db: AsyncSession,
        owner_id: uuid.UUID,
        original_filename: str,
        storage_key: str,
        mime_type: str,
        file_size: int,
        checksum: Optional[str] = None,
        document_type: DocumentType = DocumentType.RESUME,
    ) -> Document:
        doc = Document(
            id=uuid.uuid4(),
            owner_id=owner_id,
            document_type=document_type,
            original_filename=original_filename,
            storage_key=storage_key,
            mime_type=mime_type,
            file_size=file_size,
            checksum=checksum,
            processing_status=ProcessingStatus.UPLOADED,
        )
        db.add(doc)
        await db.flush()
        return doc

    @staticmethod
    async def get_document_by_id(db: AsyncSession, document_id: uuid.UUID) -> Optional[Document]:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_latest_user_resume(db: AsyncSession, owner_id: uuid.UUID) -> Optional[Document]:
        stmt = (
            select(Document)
            .where(Document.owner_id == owner_id, Document.document_type == DocumentType.RESUME)
            .order_by(desc(Document.created_at))
            .limit(1)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def update_processing_status(
        db: AsyncSession, document_id: uuid.UUID, status: ProcessingStatus
    ) -> Optional[Document]:
        doc = await DocumentRepository.get_document_by_id(db, document_id)
        if doc:
            doc.processing_status = status
            await db.flush()
        return doc

    @staticmethod
    async def create_or_update_extraction(
        db: AsyncSession,
        document_id: uuid.UUID,
        extracted_data: Dict[str, Any],
        model_name: Optional[str] = None,
        confidence: float = 0.9,
        status: ExtractionStatus = ExtractionStatus.COMPLETED,
    ) -> DocumentExtraction:
        stmt = select(DocumentExtraction).where(DocumentExtraction.document_id == document_id)
        result = await db.execute(stmt)
        ext = result.scalar_one_or_none()

        if ext:
            ext.extracted_data = extracted_data
            ext.model_name = model_name
            ext.confidence = confidence
            ext.extraction_status = status
        else:
            ext = DocumentExtraction(
                id=uuid.uuid4(),
                document_id=document_id,
                extracted_data=extracted_data,
                model_name=model_name,
                confidence=confidence,
                extraction_status=status,
            )
            db.add(ext)

        await db.flush()
        return ext

    @staticmethod
    async def get_extraction_by_document_id(
        db: AsyncSession, document_id: uuid.UUID
    ) -> Optional[DocumentExtraction]:
        stmt = select(DocumentExtraction).where(DocumentExtraction.document_id == document_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def mark_extraction_reviewed(
        db: AsyncSession, document_id: uuid.UUID, reviewer_id: uuid.UUID
    ) -> Optional[DocumentExtraction]:
        ext = await DocumentRepository.get_extraction_by_document_id(db, document_id)
        if ext:
            ext.reviewed_at = datetime.now(timezone.utc)
            ext.reviewed_by = reviewer_id
            await db.flush()
        return ext
