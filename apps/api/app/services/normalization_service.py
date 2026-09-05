import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.skills import Skill

# Deterministic Tech & Skill Alias Mappings
TECH_ALIASES = {
    "react.js": "React",
    "reactjs": "React",
    "react": "React",
    "python3": "Python",
    "python 3": "Python",
    "python": "Python",
    "esp-32": "ESP32",
    "esp 32": "ESP32",
    "esp32": "ESP32",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "vue": "Vue.js",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "next": "Next.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "aws": "AWS",
    "amazon web services": "AWS",
}


class NormalizationService:
    """Service for deterministic skill and technology normalization."""

    @staticmethod
    def normalize_name(raw_name: str) -> str:
        """Normalize raw tech or skill string into canonical representation."""
        if not raw_name:
            return ""

        clean = raw_name.strip()
        lower_key = clean.lower()

        if lower_key in TECH_ALIASES:
            return TECH_ALIASES[lower_key]

        # Default title casing formatting while preserving capitalized acronyms
        if clean.isupper() and len(clean) <= 5:
            return clean

        return clean.title()

    @staticmethod
    def get_normalized_key(raw_name: str) -> str:
        """Get lowercase lookup key for database uniqueness constraint."""
        canonical = NormalizationService.normalize_name(raw_name)
        return canonical.lower()

    @staticmethod
    async def get_or_create_skill(
        db: AsyncSession, raw_name: str, category: Optional[str] = None
    ) -> Skill:
        """Find existing skill by normalized key or create new entry in skills table."""
        canonical_name = NormalizationService.normalize_name(raw_name)
        norm_key = NormalizationService.get_normalized_key(raw_name)

        # Check existing database skill by normalized_name
        stmt = select(Skill).where(Skill.normalized_name == norm_key)
        result = await db.execute(stmt)
        skill = result.scalar_one_or_none()

        if skill:
            return skill

        # Create new skill entry
        new_skill = Skill(
            id=uuid.uuid4(),
            name=canonical_name,
            normalized_name=norm_key,
            category=category or "General",
        )
        db.add(new_skill)
        await db.flush()
        return new_skill
