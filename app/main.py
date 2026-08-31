from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import json
from pathlib import Path

# Define file paths
PROJECT_ROOT = Path(__file__).resolve().parents[1]
EMBEDDINGS_FILE = PROJECT_ROOT / "data" / "processed" / "embeddings.npy"
METADATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_metadata.json"

app = FastAPI(title="Book Recommender API")

# Allow the frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load embeddings and metadata once during startup
embeddings = np.load(EMBEDDINGS_FILE)
with open(METADATA_FILE, "r", encoding="utf-8") as f:
    metadata = json.load(f)

# Health check route for smoke tests and monitoring
@app.get("/")
def health():
    return {"status": "ok", "books": len(metadata)}

# Create a lookup dictionary for fast index retrieval by title
title_to_idx = {book["title"].lower(): i for i, book in enumerate(metadata) if book.get("title")}

class RecommendRequest(BaseModel):
    title: str
    top_n: int = 5

@app.post("/recommend")
def recommend_books(req: RecommendRequest):
    query = req.title.lower().strip()
    
    # 1. Exact match
    book_idx = title_to_idx.get(query)
    
    # 2. Substring fallback if not exact match
    if book_idx is None:
        matches = [idx for title, idx in title_to_idx.items() if query in title]
        if matches:
            book_idx = matches[0]
            
    if book_idx is None:
        raise HTTPException(status_code=404, detail="Book not found in database.")
        
    # Dot product calculation on normalized vectors
    similarities = embeddings @ embeddings[book_idx]
    
    # Sort indices by similarity score (descending) and get the top N matches
    top_indices = np.argsort(similarities)[::-1]
    
    # Filter out the exact same book and grab the requested amount
    recommendations = []
    for idx in top_indices:
        if idx != book_idx:
            match = metadata[idx].copy()
            if "subjects" in match and isinstance(match["subjects"], list):
                match["subjects"] = match["subjects"][:5]
            match["similarity_score"] = round(float(similarities[idx]), 4)
            recommendations.append(match)
        if len(recommendations) == req.top_n:
            break
            
    return {"recommendations": recommendations}

@app.get("/search")
def search_books(q: str = "", limit: int = 5):
    query = q.lower().strip()
    if not query:
        return {"results": []}
    
    matches = [
        {"title": book["title"], "work_id": book.get("work_id")}
        for book in metadata
        if query in book.get("title", "").lower()
    ]
    return {"results": matches[:limit]}