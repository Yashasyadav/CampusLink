import os
import shutil
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional
from app.core.config import settings


class StorageProvider(ABC):
    """Abstract storage provider for private document management."""

    @abstractmethod
    async def save_file(
        self, file_content: bytes, owner_id: str, document_id: str, extension: str
    ) -> str:
        """Save file bytes into storage and return relative storage_key."""
        pass

    @abstractmethod
    async def get_file(self, storage_key: str) -> bytes:
        """Retrieve file bytes from storage using storage_key."""
        pass

    @abstractmethod
    async def delete_file(self, storage_key: str) -> bool:
        """Delete file from storage using storage_key."""
        pass


class LocalStorageProvider(StorageProvider):
    """Local filesystem storage implementation with strict path traversal protections."""

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.STORAGE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _sanitize_path(self, storage_key: str) -> Path:
        """Sanitize storage key and ensure it stays within base_dir."""
        clean_key = storage_key.lstrip("/\\")
        target_path = (self.base_dir / clean_key).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError(f"Path traversal detected for storage key: {storage_key}")
        return target_path

    async def save_file(
        self, file_content: bytes, owner_id: str, document_id: str, extension: str
    ) -> str:
        clean_ext = extension.lstrip(".").lower()
        if clean_ext not in ["pdf", "docx"]:
            raise ValueError(f"Unsupported file extension: .{clean_ext}")

        # Directory hierarchy: owner_id/document_id.ext
        rel_key = f"{owner_id}/{document_id}.{clean_ext}"
        target_path = self._sanitize_path(rel_key)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        with open(target_path, "wb") as f:
            f.write(file_content)

        return rel_key

    async def get_file(self, storage_key: str) -> bytes:
        target_path = self._sanitize_path(storage_key)
        if not target_path.is_file():
            raise FileNotFoundError(f"File not found for storage key: {storage_key}")

        with open(target_path, "rb") as f:
            return f.read()

    async def delete_file(self, storage_key: str) -> bool:
        try:
            target_path = self._sanitize_path(storage_key)
            if target_path.is_file():
                target_path.unlink()
                return True
            return False
        except Exception:
            return False


# Default storage provider instance
default_storage_provider = LocalStorageProvider()
