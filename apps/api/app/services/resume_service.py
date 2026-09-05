import hashlib
import uuid
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.storage import default_storage_provider, StorageProvider
from app.models.documents import Document, DocumentExtraction, ProcessingStatus, ExtractionStatus
from app.models.profiles import Profile
from app.models.users import User
from app.models.skills import UserSkill, Skill
from app.models.projects import Project, ProjectContributor
from app.repositories.document_repository import DocumentRepository
from app.repositories.profile_repository import ProfileRepository
from app.schemas.resume_extraction import ResumeExtraction
from app.services.ai_provider import GeminiDocumentAIProvider, DocumentAIProvider
from app.services.normalization_service import NormalizationService


class ResumeProcessingService:
    """Enterprise service managing the complete resume document lifecycle."""

    def __init__(
        self,
        storage_provider: Optional[StorageProvider] = None,
        ai_provider: Optional[DocumentAIProvider] = None,
    ):
        self.storage_provider = storage_provider or default_storage_provider
        self.ai_provider = ai_provider or GeminiDocumentAIProvider()

    def validate_file(self, file_name: str, file_bytes: bytes, mime_type: str) -> str:
        """Validate file size, extension, and binary header magic bytes."""
        if not file_bytes:
            raise ValueError("Uploaded file is empty.")

        if len(file_bytes) > settings.MAX_RESUME_SIZE_BYTES:
            raise ValueError(
                f"File size exceeds maximum allowed limit of {settings.MAX_RESUME_SIZE_MB}MB."
            )

        lower_name = file_name.lower()
        clean_ext = ""

        if lower_name.endswith(".pdf"):
            clean_ext = "pdf"
        elif lower_name.endswith(".docx"):
            clean_ext = "docx"
        else:
            raise ValueError("Unsupported file format. Only PDF and DOCX files are allowed.")

        # Header content validation (magic bytes)
        if clean_ext == "pdf":
            if not file_bytes.startswith(b"%PDF-"):
                raise ValueError("Invalid PDF file: Missing standard %PDF header bytes.")
        elif clean_ext == "docx":
            # DOCX files are zip archives starting with PK\x03\x04
            if not file_bytes.startswith(b"PK\x03\x04"):
                raise ValueError("Invalid DOCX file: Missing standard ZIP/DOCX header bytes.")

        return clean_ext

    async def upload_resume(
        self,
        db: AsyncSession,
        owner_id: uuid.UUID,
        file_name: str,
        file_bytes: bytes,
        mime_type: str,
    ) -> Document:
        """Validate, store binary file, and persist Document metadata record."""
        clean_ext = self.validate_file(file_name, file_bytes, mime_type)
        doc_id = uuid.uuid4()
        checksum = hashlib.sha256(file_bytes).hexdigest()

        # Save to isolated private storage
        storage_key = await self.storage_provider.save_file(
            file_content=file_bytes,
            owner_id=str(owner_id),
            document_id=str(doc_id),
            extension=clean_ext,
        )

        canonical_mime = "application/pdf" if clean_ext == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        # Create Document database record
        doc = Document(
            id=doc_id,
            owner_id=owner_id,
            original_filename=file_name,
            storage_key=storage_key,
            mime_type=canonical_mime,
            file_size=len(file_bytes),
            checksum=checksum,
            processing_status=ProcessingStatus.UPLOADED,
        )
        db.add(doc)
        await db.flush()
        return doc

    async def process_resume(
        self,
        db: AsyncSession,
        owner_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> DocumentExtraction:
        """Run Document AI provider on stored document and save candidate extraction."""
        doc = await DocumentRepository.get_document_by_id(db, document_id)
        if not doc:
            raise ValueError("Document not found.")

        if doc.owner_id != owner_id:
            raise PermissionError("Access denied: You do not own this document.")

        # Update status to PROCESSING
        await DocumentRepository.update_processing_status(db, document_id, ProcessingStatus.PROCESSING)

        try:
            # Read file bytes from storage
            file_bytes = await self.storage_provider.get_file(doc.storage_key)

            # Invoke Document AI Provider (Gemini)
            extraction_schema: ResumeExtraction = await self.ai_provider.extract_resume_data(
                file_bytes=file_bytes,
                mime_type=doc.mime_type,
                file_name=doc.original_filename,
            )

            # Normalize skills and technologies in place
            for skill in extraction_schema.skills:
                skill.name = NormalizationService.normalize_name(skill.name)

            for tech in extraction_schema.technologies:
                tech.name = NormalizationService.normalize_name(tech.name)

            # Calculate confidence average across extracted items
            conf_scores = [s.confidence for s in extraction_schema.skills] + [
                t.confidence for t in extraction_schema.technologies
            ]
            avg_confidence = (sum(conf_scores) / len(conf_scores)) if conf_scores else 0.95

            # Save document extraction record
            extracted_dict = extraction_schema.model_dump()
            model_name = getattr(self.ai_provider, "model_name", settings.GEMINI_MODEL)

            extraction = await DocumentRepository.create_or_update_extraction(
                db=db,
                document_id=document_id,
                extracted_data=extracted_dict,
                model_name=model_name,
                confidence=avg_confidence,
                status=ExtractionStatus.COMPLETED,
            )

            # Update document status to REVIEW_REQUIRED
            await DocumentRepository.update_processing_status(
                db, document_id, ProcessingStatus.REVIEW_REQUIRED
            )

            return extraction

        except Exception as e:
            # Safely mark status as FAILED and retain file for retry
            await DocumentRepository.update_processing_status(db, document_id, ProcessingStatus.FAILED)
            await DocumentRepository.create_or_update_extraction(
                db=db,
                document_id=document_id,
                extracted_data={"error": "Processing failed", "detail": str(e)},
                status=ExtractionStatus.FAILED,
            )
            raise e

    async def update_extraction(
        self,
        db: AsyncSession,
        owner_id: uuid.UUID,
        document_id: uuid.UUID,
        extraction_data: Dict[str, Any],
    ) -> DocumentExtraction:
        """Update extraction payload with user edits during review phase."""
        doc = await DocumentRepository.get_document_by_id(db, document_id)
        if not doc or doc.owner_id != owner_id:
            raise PermissionError("Access denied or document not found.")

        extraction = await DocumentRepository.get_extraction_by_document_id(db, document_id)
        if not extraction:
            raise ValueError("No extraction found for this document.")

        extraction.extracted_data = extraction_data
        await db.flush()
        return extraction

    async def confirm_extraction(
        self,
        db: AsyncSession,
        owner_id: uuid.UUID,
        document_id: uuid.UUID,
        confirmed_data: Dict[str, Any],
    ) -> Tuple[Document, Profile]:
        """Apply user-reviewed & confirmed extraction data to approved profile & domain tables."""
        doc = await DocumentRepository.get_document_by_id(db, document_id)
        if not doc or doc.owner_id != owner_id:
            raise PermissionError("Access denied or document not found.")

        profile = await ProfileRepository(db).get_by_user_id(owner_id)
        if not profile:
            raise ValueError("User profile not found.")

        personal = confirmed_data.get("personal_information", {})

        # Apply personal info updates without overwriting pre-existing user bio unless explicitly provided
        if personal.get("full_name") and (not profile.full_name or profile.full_name == "New User"):
            profile.full_name = personal["full_name"]

        if personal.get("phone") and not profile.phone:
            profile.phone = personal["phone"]

        if personal.get("location") and not profile.location:
            profile.location = personal["location"]

        if personal.get("github_url") and not profile.github_url:
            profile.github_url = personal["github_url"]

        if personal.get("linkedin_url") and not profile.linkedin_url:
            profile.linkedin_url = personal["linkedin_url"]

        if personal.get("portfolio_url") and not profile.portfolio_url:
            profile.portfolio_url = personal["portfolio_url"]

        # If user bio is empty, set bio from summary or generated summary candidate if explicitly confirmed
        confirmed_bio = personal.get("bio")
        if confirmed_bio and confirmed_bio.strip():
            profile.bio = confirmed_bio.strip()
        elif not profile.bio and confirmed_data.get("summary", {}).get("generated_summary"):
            profile.bio = confirmed_data["summary"]["generated_summary"]

        # Mark user profile as completed
        profile.profile_completed = True

        # Process confirmed skills
        confirmed_skills = confirmed_data.get("skills", [])
        for s_data in confirmed_skills:
            skill_name = s_data.get("name")
            if not skill_name:
                continue

            skill = await NormalizationService.get_or_create_skill(
                db=db, raw_name=skill_name, category=s_data.get("category")
            )

            # Check if user skill link exists
            stmt = select(UserSkill).where(
                UserSkill.user_id == owner_id, UserSkill.skill_id == skill.id
            )
            res = await db.execute(stmt)
            user_skill = res.scalar_one_or_none()

            prof_raw = s_data.get("proficiency", "INTERMEDIATE")
            prof_str = prof_raw.value if hasattr(prof_raw, "value") else str(prof_raw)

            if not user_skill:
                user_skill = UserSkill(
                    id=uuid.uuid4(),
                    user_id=owner_id,
                    skill_id=skill.id,
                    proficiency=prof_str,
                    source="RESUME",
                    confidence=float(s_data.get("confidence", 0.9)),
                )
                db.add(user_skill)

        # Process confirmed projects
        confirmed_projects = confirmed_data.get("projects", [])
        for p_data in confirmed_projects:
            title = p_data.get("title")
            if not title:
                continue

            # Generate project slug
            slug_base = title.lower().replace(" ", "-").replace("/", "-")
            slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"

            proj = Project(
                id=uuid.uuid4(),
                title=title,
                slug=slug,
                description=p_data.get("description") or title,
                problem_statement=p_data.get("problem_statement"),
                outcome=p_data.get("outcomes"),
                github_url=p_data.get("repository_url"),
                demo_url=p_data.get("project_url"),
                created_by=owner_id,
                status="COMPLETED",
                visibility="CAMPUS_ONLY",
            )
            db.add(proj)
            await db.flush()

            # Add user as contributor
            contributor = ProjectContributor(
                id=uuid.uuid4(),
                project_id=proj.id,
                user_id=owner_id,
                role="OWNER",
                contribution_description="Extracted and confirmed from resume",
            )
            db.add(contributor)

        # Mark document status as CONFIRMED
        doc.processing_status = ProcessingStatus.CONFIRMED
        await DocumentRepository.mark_extraction_reviewed(db, document_id, owner_id)

        await db.flush()
        return doc, profile
