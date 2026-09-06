"""Chunking Strategy for Campus Knowledge Entities."""

from typing import List, Optional, Any
from app.models.knowledge import ProblemSolution


MAX_CHUNK_WORDS = 400


def chunk_entity_text(entity_type: str, text: str, entity_obj: Optional[Any] = None) -> List[str]:
    """
    Split entity text representation into chunks.
    For short entities or single text representations, returns a single chunk.
    For Problem/Solution entities, creates semantic section chunks.
    For long generic text, splits by paragraph/word windows.
    """
    if not text or not text.strip():
        return []

    # 1. Specialized semantic chunking for Problem/Solution entities
    if entity_type == "PROBLEM_SOLUTION" and isinstance(entity_obj, ProblemSolution):
        chunks = []
        
        # Chunk 0: Problem + Context
        c0_parts = [f"Problem Title: {entity_obj.title}"]
        if entity_obj.domain:
            c0_parts.append(f"Domain: {entity_obj.domain}")
        if entity_obj.problem:
            c0_parts.append(f"Problem: {entity_obj.problem}")
        if entity_obj.symptoms:
            c0_parts.append(f"Symptoms: {entity_obj.symptoms}")
        if entity_obj.root_cause:
            c0_parts.append(f"Root Cause: {entity_obj.root_cause}")
        chunks.append("\n".join(c0_parts))

        # Chunk 1: Solution & Implementation
        c1_parts = [f"Problem Title: {entity_obj.title}"]
        if entity_obj.solution:
            c1_parts.append(f"Solution: {entity_obj.solution}")
        if hasattr(entity_obj, "technologies") and entity_obj.technologies:
            if isinstance(entity_obj.technologies, list):
                c1_parts.append(f"Technologies: {', '.join(entity_obj.technologies)}")
        chunks.append("\n".join(c1_parts))

        # Chunk 2: Outcome & Lessons Learned
        c2_parts = [f"Problem Title: {entity_obj.title}"]
        if entity_obj.outcome:
            c2_parts.append(f"Outcome: {entity_obj.outcome}")
        if entity_obj.lessons_learned:
            c2_parts.append(f"Lessons Learned: {entity_obj.lessons_learned}")
        if len(c2_parts) > 1:
            chunks.append("\n".join(c2_parts))

        # Filter out trivial chunks
        valid_chunks = [c for c in chunks if len(c.strip()) > 10]
        if valid_chunks:
            return valid_chunks

    # 2. General word count / paragraph windowing chunking fallback
    words = text.strip().split()
    if len(words) <= MAX_CHUNK_WORDS:
        return [text.strip()]

    # Paragraph-based chunking
    paragraphs = text.strip().split("\n\n")
    chunks = []
    current_chunk = []
    current_words = 0

    for para in paragraphs:
        para_words = len(para.split())
        if current_words + para_words > MAX_CHUNK_WORDS and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [para]
            current_words = para_words
        else:
            current_chunk.append(para)
            current_words += para_words

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks if chunks else [text.strip()]
