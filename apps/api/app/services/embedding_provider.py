import abc
import hashlib
import math
import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingProvider(abc.ABC):
    """Abstract Base Class for text embedding providers."""

    @property
    @abc.abstractmethod
    def model_name(self) -> str:
        """Name of the embedding model."""
        pass

    @property
    @abc.abstractmethod
    def dimension(self) -> int:
        """Dimension of output embedding vectors."""
        pass

    @abc.abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Embed a single text string into a float vector."""
        pass

    @abc.abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of text strings into float vectors."""
        pass


class GeminiEmbeddingProvider(EmbeddingProvider):
    """Concrete embedding provider using official Google GenAI SDK."""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self._api_key = api_key or settings.GEMINI_API_KEY
        self._model = model or settings.GEMINI_EMBEDDING_MODEL or settings.EMBEDDING_MODEL or "text-embedding-004"
        self._dimension = settings.EMBEDDING_DIMENSION or 768
        self._client = None

        if self._api_key and self._api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self._client = genai.Client(api_key=self._api_key)
            except Exception as exc:
                logger.warning(f"Failed to initialize GenAI client: {exc}")

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self._dimension

        if self._client is None:
            logger.warning("Gemini client uninitialized or key missing. Falling back to FakeEmbeddingProvider.")
            return FakeEmbeddingProvider(model=self._model, dimension=self._dimension).embed_text(text)

        try:
            response = self._client.models.embed_content(
                model=self._model,
                contents=text.strip(),
            )
            # Response handling for google-genai SDK
            if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                return list(response.embedding.values)
            elif hasattr(response, "embeddings") and response.embeddings:
                return list(response.embeddings[0].values)
            else:
                raise ValueError(f"Unexpected response structure from embed_content: {response}")
        except Exception as exc:
            logger.error(f"Error calling Gemini embed_content API: {exc}")
            # Safe fallback for reliability
            return FakeEmbeddingProvider(model=self._model, dimension=self._dimension).embed_text(text)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self._client is None:
            return FakeEmbeddingProvider(model=self._model, dimension=self._dimension).embed_texts(texts)

        results = []
        for text in texts:
            results.append(self.embed_text(text))
        return results


class FakeEmbeddingProvider(EmbeddingProvider):
    """Deterministic mock embedding provider for fast offline testing."""

    def __init__(self, model: str = "text-embedding-004", dimension: int = 768):
        self._model = model
        self._dimension = dimension

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimension(self) -> int:
        return self._dimension

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self._dimension

        # Generate deterministic vector from SHA256 of text
        clean_text = text.strip().lower()
        vector = []
        
        # Hash expanding to fill vector dimension
        for i in range(self._dimension):
            h = hashlib.sha256(f"{clean_text}:{i}".encode("utf-8")).hexdigest()
            # Convert first 8 hex chars to float in [-1.0, 1.0]
            val = (int(h[:8], 16) / 0xFFFFFFFF) * 2.0 - 1.0
            vector.append(val)

        # L2 normalize vector for proper cosine distance behavior
        norm = math.sqrt(sum(v * v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
            
        return vector

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(text) for text in texts]


def get_embedding_provider() -> EmbeddingProvider:
    """Factory method to resolve configured embedding provider."""
    if settings.USE_FAKE_EMBEDDINGS or settings.EMBEDDING_PROVIDER == "fake":
        return FakeEmbeddingProvider(
            model=settings.EMBEDDING_MODEL,
            dimension=settings.EMBEDDING_DIMENSION
        )

    # Check if real API key is present
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        logger.info("No active GEMINI_API_KEY found, using FakeEmbeddingProvider.")
        return FakeEmbeddingProvider(
            model=settings.EMBEDDING_MODEL,
            dimension=settings.EMBEDDING_DIMENSION
        )

    return GeminiEmbeddingProvider(
        api_key=settings.GEMINI_API_KEY,
        model=settings.GEMINI_EMBEDDING_MODEL or settings.EMBEDDING_MODEL
    )
