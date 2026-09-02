"""
Collect books from Open Library.

Three changes from the original, which capped out at 826 books:

  1. Paginates. The old version asked each subject for its first 100 works and
     stopped, so 10 subjects x 100 = 1000 works maximum. The endpoint accepts
     an offset, so now we keep asking until we have what we want.
  2. Resolves author names. The old version stored author keys ("OL27695A")
     and never looked them up, so no book in the index knew who wrote it.
     Names are cached on disk, so each author is fetched once ever.
  3. Resumable. Progress is flushed as it goes and already-collected works are
     skipped on a rerun, so a dropped connection costs you nothing.

This uses Open Library's public JSON API — the same one the old script used.
No scraping, nothing that needs a key, nothing against anyone's terms.

    python src/data_collection.py --smoke              # ~2 min, sanity check
    python src/data_collection.py --per-subject 800    # the real run

Be aware the real run takes a few hours: Open Library asks for one request at
a time and we sleep between them. Leave it going overnight.
"""

import argparse
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_FILE = PROJECT_ROOT / "data" / "raw" / "books.jsonl"
AUTHOR_CACHE = PROJECT_ROOT / "data" / "raw" / "authors.json"

BASE = "https://openlibrary.org"
HEADERS = {"User-Agent": "iain-birthday-gift/1.0 (personal project)"}
PAUSE = 0.12
PAGE = 200  # works per request

SUBJECTS = [
    # the original ten
    "fiction", "fantasy", "romance", "mystery_and_detective_stories",
    "science_fiction", "horror", "thriller", "historical_fiction",
    "young_adult_fiction", "literary_fiction",
    # breadth: genre
    "adventure", "crime", "detective_and_mystery_stories", "dystopia",
    "ghost_stories", "gothic_fiction", "humor", "magic_realism",
    "short_stories", "spy_stories", "war_stories", "western_stories",
    "graphic_novels", "poetry", "drama", "classic_literature",
    # breadth: non-fiction, so it isn't all novels
    "biography", "history", "science", "philosophy", "psychology",
    "travel", "nature", "art", "music", "cooking", "essays", "memoir",
    # breadth: place and period, which pull different shelves
    "english_literature", "american_literature", "irish_literature",
    "japanese_literature", "russian_literature", "african_american_fiction",
]


def get_json(url, params=None, retries=4):
    """Fetch JSON, retrying transient failures with backoff.

    Open Library will reset connections and rate-limit over a run this long.
    ConnectionResetError is an OSError, not a URLError, so an earlier version
    of this caught neither and died three hours in. Catch OSError and retry.
    """
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"

    for attempt in range(retries):
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None                      # genuinely absent
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 ** attempt)         # 1s, 2s, 4s
                continue
            return None
        except (OSError, TimeoutError, json.JSONDecodeError):
            # OSError covers ConnectionResetError, URLError and socket timeouts.
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            return None
    return None


def collect_work_ids(subject, target):
    """Page through a subject until we have `target` work ids."""
    ids, offset = [], 0
    while len(ids) < target:
        data = get_json(f"{BASE}/subjects/{subject}.json",
                        {"limit": PAGE, "offset": offset})
        time.sleep(PAUSE)
        if not data:
            break

        works = data.get("works") or []
        if not works:
            break  # ran off the end of this subject

        for w in works:
            key = (w.get("key") or "").replace("/works/", "")
            if key:
                ids.append(key)

        offset += PAGE
    return ids[:target]


def load_author_cache():
    if AUTHOR_CACHE.exists():
        try:
            return json.loads(AUTHOR_CACHE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {}


def author_names(keys, cache):
    """Resolve author keys to names, fetching only what we've never seen."""
    names = []
    for key in keys:
        if key not in cache:
            data = get_json(f"{BASE}/authors/{key}.json")
            time.sleep(PAUSE)
            cache[key] = (data or {}).get("name") or None
        if cache[key]:
            names.append(cache[key])
    return names


def extract(work, cache):
    work_id = (work.get("key") or "").replace("/works/", "")

    author_keys = []
    for a in work.get("authors", []):
        k = (a.get("author") or {}).get("key")
        if k:
            author_keys.append(k.replace("/authors/", ""))

    description = work.get("description")
    if isinstance(description, dict):
        description = description.get("value", "")

    covers = [c for c in (work.get("covers") or []) if isinstance(c, int) and c > 0]

    return {
        "work_id": work_id,
        "title": work.get("title"),
        "description": description,
        "subjects": work.get("subjects", []),
        "subject_places": work.get("subject_places", []),
        "subject_times": work.get("subject_times", []),
        "subject_people": work.get("subject_people", []),
        "authors": author_keys,
        "author_names": author_names(author_keys, cache),
        "covers": covers,
        "cover_id": covers[0] if covers else None,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-subject", type=int, default=800,
                    help="works to pull per subject (default 800)")
    ap.add_argument("--smoke", action="store_true",
                    help="tiny run: 20 per subject, 3 subjects")
    args = ap.parse_args()

    subjects = SUBJECTS[:3] if args.smoke else SUBJECTS
    per_subject = 20 if args.smoke else args.per_subject

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Resume: keep whatever we already have.
    have = {}
    if OUTPUT_FILE.exists():
        for line in OUTPUT_FILE.read_text(encoding="utf-8").splitlines():
            if line.strip():
                try:
                    b = json.loads(line)
                    if b.get("work_id"):
                        have[b["work_id"]] = b
                except json.JSONDecodeError:
                    continue
        print(f"Resuming: {len(have)} books already collected.")

    print(f"Collecting work ids across {len(subjects)} subjects...")
    wanted = []
    seen = set()
    for s in subjects:
        ids = collect_work_ids(s, per_subject)
        new = [i for i in ids if i not in seen]
        seen.update(new)
        wanted.extend(new)
        print(f"  {s:38} {len(ids):5} found, {len(new):5} new")

    todo = [w for w in wanted if w not in have]
    print(f"\n{len(seen)} unique works, {len(todo)} still need fetching.\n")

    cache = load_author_cache()

    def flush():
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            for b in have.values():
                f.write(json.dumps(b, ensure_ascii=False) + "\n")
        AUTHOR_CACHE.write_text(json.dumps(cache, ensure_ascii=False),
                                encoding="utf-8")

    try:
      for i, work_id in enumerate(todo, 1):
        work = get_json(f"{BASE}/works/{work_id}.json")
        time.sleep(PAUSE)
        if not work:
            continue

        book = extract(work, cache)
        if book["title"]:
            have[work_id] = book

        if i % 100 == 0 or i == len(todo):
            flush()
            print(f"  {i}/{len(todo)} fetched · {len(have)} books · "
                  f"{len(cache)} authors known")
    except KeyboardInterrupt:
        print("\n  interrupted — saving what we have")

    flush()

    withauth = sum(1 for b in have.values() if b.get("author_names"))
    withcov = sum(1 for b in have.values() if b.get("cover_id"))
    print(f"\nSaved {len(have)} books to {OUTPUT_FILE}")
    print(f"  {withauth} have an author name")
    print(f"  {withcov} have a cover")
    print("\nNext: python src/data_cleaning.py && python src/build_index.py")


if __name__ == "__main__":
    main()