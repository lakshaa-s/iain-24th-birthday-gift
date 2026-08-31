"""
Enrich books_metadata.json with real Open Library cover IDs.

The frontend can technically ask covers.openlibrary.org for a cover by *work*
OLID, but that endpoint is unreliable for works (it's built for editions), so a
lot of books come back blank. This resolves each work to its real cover id once,
offline, and writes it into the metadata the API already serves.

Run it from the repo root:

    python src/add_covers.py

It's resumable: rerun it and it only fetches the books still missing a cover.
"""

import json
import time
import urllib.error
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
METADATA_FILE = PROJECT_ROOT / "data" / "processed" / "books_metadata.json"

API = "https://openlibrary.org/works/{}.json"
HEADERS = {"User-Agent": "iain-birthday-gift/1.0 (personal project)"}
PAUSE = 0.25  # be polite to a free API


def fetch_cover_id(work_id):
    """Return the first cover id for a work, or None."""
    req = urllib.request.Request(API.format(work_id), headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.load(r)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError):
        return None

    covers = data.get("covers") or []
    # Open Library uses negative ids as "no cover" tombstones.
    for c in covers:
        if isinstance(c, int) and c > 0:
            return c
    return None


def main():
    books = json.loads(METADATA_FILE.read_text(encoding="utf-8"))

    todo = [b for b in books if b.get("work_id") and "cover_id" not in b]
    print(f"{len(books)} books, {len(todo)} still need a cover lookup.")

    found = 0
    for i, book in enumerate(todo, 1):
        cover = fetch_cover_id(book["work_id"])
        book["cover_id"] = cover  # None is a real answer: don't ask again
        if cover:
            found += 1

        if i % 25 == 0 or i == len(todo):
            print(f"  {i}/{len(todo)} checked, {found} covers found")
            METADATA_FILE.write_text(
                json.dumps(books, ensure_ascii=False), encoding="utf-8"
            )

        time.sleep(PAUSE)

    METADATA_FILE.write_text(json.dumps(books, ensure_ascii=False), encoding="utf-8")

    with_cover = sum(1 for b in books if b.get("cover_id"))
    print(f"\nDone. {with_cover}/{len(books)} books have a real cover.")
    print("Commit data/processed/books_metadata.json and redeploy the API.")


if __name__ == "__main__":
    main()