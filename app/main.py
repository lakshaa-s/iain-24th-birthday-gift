import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EMBEDDINGS_FILE = PROJECT_ROOT / "data" / "processed" / "embeddings.npy"
METADATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_metadata.json"

app = FastAPI(title="Book Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = np.load(EMBEDDINGS_FILE)
with open(METADATA_FILE, "r", encoding="utf-8") as f:
    metadata = json.load(f)


# ---------------------------------------------------------------- normalising
# These mirror paperbackd's js/utils.js so both sides agree on what counts as
# the same book. cleanTitle strips series markers like "(Discworld #4)";
# cleanAuthor turns "Austen, Jane" into "Jane Austen".

SERIES_RE = re.compile(r"\s*\([^)]*#\s*\d+[^)]*\)")
SURNAME_FIRST_RE = re.compile(r"^([^,]+),\s*(.+)$")
LEADING_ARTICLE_RE = re.compile(r"^(the|a|an)\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9 ]+")


def _fold(text):
    """Lowercase, strip accents and punctuation, collapse whitespace."""
    text = unicodedata.normalize("NFKD", str(text or ""))
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = NON_ALNUM_RE.sub(" ", text.lower())
    return " ".join(text.split())


def clean_title(t):
    return SERIES_RE.sub("", str(t or "")).strip()


def clean_author(a):
    return SURNAME_FIRST_RE.sub(r"\2 \1", str(a or "")).strip()


def norm_title(t):
    return LEADING_ARTICLE_RE.sub("", _fold(clean_title(t)))


def norm_author(a):
    return _fold(clean_author(a))


def norm_isbn(raw):
    digits = "".join(ch for ch in str(raw or "") if ch.isdigit())
    return digits if len(digits) == 13 else None


# -------------------------------------------------------------------- indexes

title_to_idx = {}          # exact lowercase title -> idx (first wins)
norm_title_to_idxs = defaultdict(list)
isbn_to_idx = {}
author_of = {}
# Normalised title per book, computed once at startup. /search used to derive
# these on every keystroke, which is ~26k unicode normalisations per request
# once the corpus got big.
norm_titles = [""] * len(metadata)

for i, book in enumerate(metadata):
    title = book.get("title")
    if not title:
        continue
    nt = norm_title(title)
    norm_titles[i] = nt
    title_to_idx.setdefault(title.lower(), i)
    norm_title_to_idxs[nt].append(i)
    author_of[i] = norm_author(book.get("author"))
    for raw in (book.get("isbns") or []):
        isbn = norm_isbn(raw)
        if isbn:
            isbn_to_idx.setdefault(isbn, i)


def _resolve(title=None, author=None, isbn=None, isbns=None):
    """Find the best index for a book. Returns (idx, how) or (None, None)."""

    # 1. ISBN is exact — always try it first.
    candidates = []
    if isbn:
        candidates.append(isbn)
    candidates.extend(isbns or [])
    for raw in candidates:
        key = norm_isbn(raw)
        if key and key in isbn_to_idx:
            return isbn_to_idx[key], "isbn"

    if not title:
        return None, None

    # 2. Exact title, disambiguated by author when we have one.
    nt = norm_title(title)
    hits = norm_title_to_idxs.get(nt, [])
    if hits:
        if author and len(hits) > 1:
            na = norm_author(author)
            for i in hits:
                if author_of.get(i) and (na in author_of[i] or author_of[i] in na):
                    return i, "title+author"
        return hits[0], "title"

    # 3. Substring, preferring the shortest match so "Emma" doesn't land on
    #    a seven-novel omnibus that happens to contain the word.
    subs = [(len(k), v[0]) for k, v in norm_title_to_idxs.items() if nt and nt in k]
    if subs:
        subs.sort()
        return subs[0][1], "partial"

    return None, None


def _payload(idx, score=None):
    book = dict(metadata[idx])
    if "subjects" in book and isinstance(book["subjects"], list):
        book["subjects"] = book["subjects"][:5]
    if score is not None:
        book["similarity_score"] = round(float(score), 4)
    return book


def _neighbours(idx, top_n, drop_same_title=True):
    sims = embeddings @ embeddings[idx]
    order = np.argsort(sims)[::-1]

    anchor = norm_titles[idx]
    seen_titles = {anchor}
    out = []
    for j in order:
        if j == idx:
            continue
        nt = norm_titles[j]
        if drop_same_title:
            # Same normalised title: a straight reprint.
            if nt in seen_titles:
                continue
            # Or the anchor's title sits inside the candidate's, which catches
            # "Dracula" -> "Bram Stoker's Dracula omnibus". Guarded on length so
            # short titles ("Emma", "It") don't swallow unrelated books.
            if len(anchor) >= 6 and anchor in nt:
                continue
            seen_titles.add(nt)
        out.append(_payload(int(j), sims[j]))
        if len(out) == top_n:
            break
    return out


# ------------------------------------------------------------------ endpoints

@app.get("/")
def health():
    return {
        "status": "ok",
        "books": len(metadata),
        "matchable_by_isbn": len(isbn_to_idx),
    }


class RecommendRequest(BaseModel):
    title: str
    top_n: int = 5


@app.post("/recommend")
def recommend_books(req: RecommendRequest):
    idx, _ = _resolve(title=req.title)
    if idx is None:
        raise HTTPException(status_code=404, detail="Book not found in database.")
    return {"recommendations": _neighbours(idx, req.top_n)}


class SimilarRequest(BaseModel):
    """The shape a paperbackd book record already has."""
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    isbns: Optional[List[str]] = None
    top_n: int = 6


@app.post("/similar")
def similar(req: SimilarRequest):
    """
    Recommend against a book described the way paperbackd stores it.

    Unlike /recommend this never 404s: an unmatched book is a normal outcome
    when someone's library is bigger than this index, so callers get
    matched: false and can carry on rendering the rest of the page.
    """
    idx, how = _resolve(
        title=req.title, author=req.author, isbn=req.isbn, isbns=req.isbns
    )

    if idx is None:
        return {
            "matched": False,
            "matched_by": None,
            "query": {"title": req.title, "author": req.author},
            "recommendations": [],
        }

    return {
        "matched": True,
        "matched_by": how,
        "query": _payload(idx),
        "recommendations": _neighbours(idx, req.top_n),
    }


@app.get("/search")
def search_books(q: str = "", limit: int = 5):
    """Ranked title search: exact, then prefix, then word start, then anywhere."""
    query = q.lower().strip()
    if not query:
        return {"results": []}

    nq = norm_title(query)
    scored = []
    for i, nt in enumerate(norm_titles):
        if not nt:
            continue

        if nt == nq:
            rank = 0
        elif nt.startswith(nq):
            rank = 1
        elif re.search(rf"\b{re.escape(nq)}", nt):
            rank = 2
        elif nq in nt:
            rank = 3
        else:
            continue

        # Shorter titles first within a rank: "Emma" beats the omnibus.
        scored.append((rank, len(nt), i))
        if len(scored) > 400:
            break

    scored.sort()
    seen = set()
    results = []
    for _, _, i in scored:
        book = metadata[i]
        nt = norm_titles[i]
        if nt in seen:
            continue
        seen.add(nt)
        results.append({
            "title": book.get("title"),
            "author": book.get("author"),
            "work_id": book.get("work_id"),
            "cover_id": book.get("cover_id"),
        })
        if len(results) == limit:
            break

    return {"results": results}