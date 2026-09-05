import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.users import User
from app.repositories.document_repository import DocumentRepository
from app.schemas.profile import ProfileResponse
from app.services.resume_service import ResumeProcessingService

router = APIRouter(prefix="/documents", tags=["Documents & Resume Intelligence"])
resume_service = ResumeProcessingService()


@router.post(
    "/resume",
    status_code=status.HTTP_201_CREATED,
    summary="Upload PDF or DOCX resume document",
)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload resume document (PDF or DOCX max 10MB) for current authenticated user."""
    try:
        content = await file.read()
        doc = await resume_service.upload_resume(
            db=db,
            owner_id=current_user.id,
            file_name=file.filename or "resume.pdf",
            file_bytes=content,
            mime_type=file.content_type or "application/octet-stream",
        )
        await db.commit()
        return {
            "message": "Resume uploaded successfully.",
            "document": {
                "id": str(doc.id),
                "original_filename": doc.original_filename,
                "file_size": doc.file_size,
                "mime_type": doc.mime_type,
                "processing_status": doc.processing_status.value,
                "created_at": doc.created_at.isoformat(),
            },
        }
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document. Please try again.",
        )


@router.get(
    "/resume/current",
    summary="Get current user's latest uploaded resume and status",
)
async def get_current_resume(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the active user's latest uploaded resume document and processing status."""
    doc = await DocumentRepository.get_latest_user_resume(db, current_user.id)
    if not doc:
        return {"document": None}

    extraction = await DocumentRepository.get_extraction_by_document_id(db, doc.id)

    return {
        "document": {
            "id": str(doc.id),
            "original_filename": doc.original_filename,
            "file_size": doc.file_size,
            "mime_type": doc.mime_type,
            "processing_status": doc.processing_status.value,
            "created_at": doc.created_at.isoformat(),
        },
        "extraction_status": extraction.extraction_status.value if extraction else "NONE",
    }


@router.post(
    "/resume/{document_id}/process",
    summary="Trigger or retry Gemini structured resume extraction",
)
async def process_resume(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger Document AI provider processing for uploaded resume."""
    try:
        extraction = await resume_service.process_resume(
            db=db, owner_id=current_user.id, document_id=document_id
        )
        await db.commit()
        return {
            "message": "Resume processing completed successfully.",
            "document_id": str(document_id),
            "extraction_id": str(extraction.id),
            "confidence": extraction.confidence,
            "extracted_data": extraction.extracted_data,
        }
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except RuntimeError as re:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process document. Please try again.",
        )


@router.get(
    "/resume/{document_id}/extraction",
    summary="Get extracted resume data for user review",
)
async def get_resume_extraction(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get document extraction payload for review."""
    doc = await DocumentRepository.get_document_by_id(db, document_id)
    if not doc or doc.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found or access denied."
        )

    extraction = await DocumentRepository.get_extraction_by_document_id(db, document_id)
    if not extraction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Extraction output not found."
        )

    return {
        "document_id": str(document_id),
        "processing_status": doc.processing_status.value,
        "confidence": extraction.confidence,
        "model_name": extraction.model_name,
        "extracted_data": extraction.extracted_data or {},
    }


@router.patch(
    "/resume/{document_id}/extraction",
    summary="Update extracted data payload during user review",
)
async def update_resume_extraction(
    document_id: uuid.UUID,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update extraction candidate fields prior to final confirmation."""
    try:
        updated = await resume_service.update_extraction(
            db=db, owner_id=current_user.id, document_id=document_id, extraction_data=payload
        )
        await db.commit()
        return {
            "message": "Extraction candidates updated.",
            "extracted_data": updated.extracted_data,
        }
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to update extraction."
        )


@router.post(
    "/resume/{document_id}/confirm",
    summary="Confirm extraction results and apply to candidate profile",
)
async def confirm_resume_extraction(
    document_id: uuid.UUID,
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply confirmed extraction data to approved profile, skills, and project entities."""
    try:
        doc, profile = await resume_service.confirm_extraction(
            db=db, owner_id=current_user.id, document_id=document_id, confirmed_data=payload
        )
        await db.commit()
        return {
            "message": "Resume profile data confirmed and saved.",
            "document_status": doc.processing_status.value,
            "profile_completed": profile.profile_completed,
            "profile": ProfileResponse.model_validate(profile).model_dump(),
        }
    except PermissionError as pe:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to confirm extraction.",
        )
