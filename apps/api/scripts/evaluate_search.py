"""
Search Evaluation Script for CampusLink AI
Evaluates Recall@5, Recall@10, and MRR metrics on a synthetic benchmark dataset.
"""

import sys
import os
import time

# Add app parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SyncSessionLocal
from app.services.embedding_index_service import EmbeddingIndexService
from app.services.search_service import SearchService
from app.models.projects import Project, ProjectType, ProjectStatus
from app.models.knowledge import ProblemSolution, ProblemSolutionStatus, KnowledgeVisibility


EVALUATION_DATASET = [
    {
        "query": "ESP32 TinyML keyword detection",
        "expected_keywords": ["esp32", "tinyml", "keyword"],
        "expected_entity_types": ["PROJECT", "PROBLEM_SOLUTION"],
    },
    {
        "query": "audio processing on edge devices",
        "expected_keywords": ["audio", "processing", "edge"],
        "expected_entity_types": ["PROJECT", "RESEARCH"],
    },
    {
        "query": "cybersecurity network intrusion detection",
        "expected_keywords": ["cybersecurity", "intrusion", "network"],
        "expected_entity_types": ["PROJECT", "RESEARCH"],
    },
    {
        "query": "computer vision attendance system",
        "expected_keywords": ["vision", "attendance", "camera"],
        "expected_entity_types": ["PROJECT"],
    },
    {
        "query": "robotics obstacle avoidance",
        "expected_keywords": ["robotics", "obstacle", "drone"],
        "expected_entity_types": ["PROJECT", "RESEARCH"],
    },
    {
        "query": "PostgreSQL backend development",
        "expected_keywords": ["postgresql", "backend", "fastapi"],
        "expected_entity_types": ["PROJECT", "PROBLEM_SOLUTION"],
    },
    {
        "query": "previous solutions for noisy microphone audio",
        "expected_keywords": ["microphone", "noise", "audio"],
        "expected_entity_types": ["PROBLEM_SOLUTION"],
    },
]


def run_evaluation():
    print("=" * 60)
    print("CAMPUSLINK AI — SEARCH RETRIEVAL EVALUATION")
    print("=" * 60)

    db = SyncSessionLocal()
    indexer = EmbeddingIndexService()
    searcher = SearchService()

    # 1. Reindex knowledge base
    print("\n[1/3] Indexing campus entities...")
    report = indexer.reindex_all(db)
    print(f"Indexed: {report.indexed_records} | Skipped: {report.skipped_records} | Total: {report.total_records}")

    # 2. Run benchmark queries
    print("\n[2/3] Executing retrieval benchmark queries...")
    recalls_5 = []
    recalls_10 = []
    mrr_list = []

    for idx, test_case in enumerate(EVALUATION_DATASET, 1):
        q = test_case["query"]
        expected_kws = test_case["expected_keywords"]

        res = searcher.search(db, query=q, mode="HYBRID", limit=10)

        # Evaluate relevance: result is relevant if title or snippet matches expected keywords
        hits_5 = 0
        hits_10 = 0
        rank_first_hit = None

        for rank, item in enumerate(res.results, 1):
            text_content = f"{item.title} {item.snippet}".lower()
            is_relevant = any(kw in text_content for kw in expected_kws)

            if is_relevant:
                if rank <= 5:
                    hits_5 += 1
                if rank <= 10:
                    hits_10 += 1
                if rank_first_hit is None:
                    rank_first_hit = rank

        r5 = min(1.0, hits_5 / 1) if res.results else 0.0
        r10 = min(1.0, hits_10 / 1) if res.results else 0.0
        rr = (1.0 / rank_first_hit) if rank_first_hit else 0.0

        recalls_5.append(r5)
        recalls_10.append(r10)
        mrr_list.append(rr)

        print(f"\nQuery {idx}: '{q}'")
        print(f"  Results Returned: {len(res.results)} | Duration: {res.duration_ms}ms")
        print(f"  First Hit Rank: {rank_first_hit or 'N/A'}")
        print(f"  Recall@5: {r5:.2f} | Recall@10: {r10:.2f} | RR: {rr:.2f}")

    # 3. Summary metrics
    avg_r5 = sum(recalls_5) / len(recalls_5) if recalls_5 else 0.0
    avg_r10 = sum(recalls_10) / len(recalls_10) if recalls_10 else 0.0
    avg_mrr = sum(mrr_list) / len(mrr_list) if mrr_list else 0.0

    print("\n" + "=" * 60)
    print("EVALUATION SUMMARY")
    print("=" * 60)
    print(f"Recall@5  : {avg_r5 * 100:.1f}%")
    print(f"Recall@10 : {avg_r10 * 100:.1f}%")
    print(f"MRR       : {avg_mrr:.3f}")
    print("=" * 60)

    db.close()


if __name__ == "__main__":
    run_evaluation()
