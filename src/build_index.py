import json
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CLEAN_DATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_clean.jsonl"
EMBEDDINGS_FILE = PROJECT_ROOT / "data" / "processed" / "embeddings.npy"
METADATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_metadata.json"


def build_embeddings():
    records = []
    with open(CLEAN_DATA_FILE, "r", encoding="utf-8") as f:
        for line in f:
            records.append(json.loads(line))

    corpus = [b["combined_text"] for b in records]

    print(f"Encoding {len(corpus)} books with all-MiniLM-L6-v2...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(corpus, batch_size=64, show_progress_bar=True, normalize_embeddings=True)

    # Save vector embeddings and lightweight metadata
    np.save(EMBEDDINGS_FILE, embeddings)

    metadata = [
        {
            "work_id": b.get("work_id"),
            "title": b.get("title"),
            "author": (b.get("author_names") or [None])[0],
            "cover_id": b.get("cover_id"),
            "subjects": b.get("subjects", []),
        }
        for b in records
    ]
    with open(METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False)

    print(f"Embeddings saved to {EMBEDDINGS_FILE}")
    print(f"Metadata saved to {METADATA_FILE}")


if __name__ == "__main__":
    build_embeddings()