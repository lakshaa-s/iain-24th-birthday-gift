"""
Add ISBN-13s to the book index.

This is the join key between this recommender and paperbackd. Iain's Firestore
book records carry an array of ISBN-13s (see collectIsbn13s in his
js/book-utils.js); Open Library knows the ISBNs for each edition of a work.
Matching on ISBN is exact, which title matching never is.

We keep up to `MAX_ISBNS` per work — same reasoning as his: enough that one bad
or unknown printing doesn't lose the match, without storing every edition ever.

    python src/add_isbns.py

Resumable: rerun and it only fetches works that don't have an answer yet.
Slower than add_covers.py because it reads an editions list per work — expect
roughly an hour per 10k books. Run it after data_collection.py.
"""

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
METADATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_metadata.json"
ISBN_CACHE = PROJECT_ROOT / "data" / "raw" / "isbns.json"

BASE = "https://openlibrary.org"
HEADERS = {"User-Agent": "iain-birthday-gift/1.0 (personal project)"}
PAUSE = 0.2
MAX_ISBNS = 6
EDITION_LIMIT = 20  # editions to scan per work


def normalise_isbn13(raw):
    """Mirror of his normaliseIsbn13: digits only, must be 13 long."""
    if not raw:
        return None
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    return digits if len(digits) == 13 else None


def isbns_for_work(work_id):
    url = f"{BASE}/works/{work_id}/editions.json?limit={EDITION_LIMIT}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        return [] if e.code == 404 else None
    except (OSError, TimeoutError, json.JSONDecodeError):
        return None  # None = "ask again later", [] = "genuinely none"

    found = []
    seen = set()
    for ed in data.get("entries", []) or []:
        for raw in (ed.get("isbn_13") or []):
            isbn = normalise_isbn13(raw)
            if isbn and isbn not in seen:
                seen.add(isbn)
                found.append(isbn)
                if len(found) >= MAX_ISBNS:
                    return found
        # ISBN-10s exist on older editions; OL usually lists both, but if a
        # record only has a 10 we skip it — his site keys on 13s.
    return found


def load_cache():
    if ISBN_CACHE.exists():
        try:
            return json.loads(ISBN_CACHE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def main():
    books = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    cache = load_cache()

    # build_index.py rewrites books_metadata.json from scratch, so ISBNs sitting
    # only in the metadata would be lost on every rebuild. Fold anything already
    # there into the cache first — that's an hour of lookups per 4k books.
    seeded = 0
    for b in books:
        wid = b.get("work_id")
        if wid and "isbns" in b and wid not in cache:
            cache[wid] = b["isbns"]
            seeded += 1
    if seeded:
        ISBN_CACHE.parent.mkdir(parents=True, exist_ok=True)
        ISBN_CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")
        print(f"Seeded cache with {seeded} ISBN sets already in the metadata.")

    # Anything we know goes straight back on.
    reused = 0
    for b in books:
        wid = b.get("work_id")
        if wid and wid in cache and "isbns" not in b:
            b["isbns"] = cache[wid]
            reused += 1
    if reused:
        print(f"Reused {reused} cached lookups — no network needed for those.")

    todo = [b for b in books if b.get("work_id") and "isbns" not in b]
    print(f"{len(books)} books, {len(todo)} need an ISBN lookup.")

    if not todo:
        METADATA_FILE.write_text(json.dumps(books, ensure_ascii=False), encoding="utf-8")
        total = sum(1 for b in books if b.get("isbns"))
        print(f"\nDone. {total}/{len(books)} books can be matched by ISBN.")
        return

    def flush():
        METADATA_FILE.write_text(json.dumps(books, ensure_ascii=False), encoding="utf-8")
        ISBN_CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")

    matched = 0
    try:
        for i, book in enumerate(todo, 1):
            result = isbns_for_work(book["work_id"])
            if result is not None:
                book["isbns"] = result
                cache[book["work_id"]] = result
                if result:
                    matched += 1

            if i % 25 == 0 or i == len(todo):
                flush()
                print(f"  {i}/{len(todo)} checked · {matched} with ISBNs")

            time.sleep(PAUSE)
    except KeyboardInterrupt:
        print("\n  interrupted — saving what we have")

    flush()

    total = sum(1 for b in books if b.get("isbns"))
    print(f"\nDone. {total}/{len(books)} books can be matched by ISBN.")
    print("Commit data/processed/books_metadata.json and redeploy the API.")


if __name__ == "__main__":
    main()