# Books next to yours

A birthday present for [Iain](https://paperbackd.ink), who built a place to log
what he's read. This is the other half: name a book you loved and it finds the
ones that sit closest to it.

Recommendations are semantic, not keyword-based. Every book is embedded from its
title, author, description and subjects, and "closest" means nearest in that
space — so *Casino Royale* returns the rest of the Bond run, and *Dracula*
returns vampire novels rather than other books with "Dracula" in the title.

**Live:** [frontend](https://iain-gift-frontend.onrender.com) ·
[API](https://iain-book-recommender.onrender.com)

---

## What's in the index

| | |
|---|---|
| Books | 25,820 |
| With an author | 24,913 |
| With cover art | 21,557 |
| Embedding | `all-MiniLM-L6-v2`, 384 dimensions, normalised |
| Source | [Open Library](https://openlibrary.org) public JSON API |

---

## Layout

```
app/main.py          FastAPI service — the only thing that runs in production
src/                 the offline pipeline (run on a laptop, not on the server)
data/processed/      embeddings.npy + books_metadata.json, both committed
data/raw/            intermediates, gitignored (books_clean.jsonl is ~95 MB)
frontend/            React + Vite + Tailwind, deployed as a static site
```

The API loads two files at startup and holds them in memory: a 38 MB float32
array and its metadata. Similarity is a dot product against the whole corpus —
no vector database, no index structure. At 25k books that's about 10 ms, and it
stays viable to roughly 150k before memory becomes the constraint.

---

## Rebuilding the index

Four scripts, in order. **Run them one at a time** — each depends on the last
finishing cleanly.

```bash
python src/data_collection.py --smoke          # 2 min, checks the API is behaving
python src/data_collection.py --per-subject 800  # ~3 h  -> data/raw/books.jsonl
python src/data_cleaning.py                    # instant
python src/build_index.py                      # ~2 min on CPU
python src/add_isbns.py                        # ~6 h, optional (see below)
```

All the long ones are **resumable** — they save as they go and skip work already
done on a rerun. Run them detached so a closed terminal doesn't kill them:

```bash
caffeinate -i nohup python -u src/data_collection.py --per-subject 800 > scrape.log 2>&1 &
tail -f scrape.log
```

`build_index.py` needs `sentence-transformers`, which is deliberately **not** in
`requirements.txt` — the API never embeds anything at runtime, and keeping torch
out of the deployment takes the image from gigabytes to tens of megabytes.

```bash
pip install sentence-transformers
```

After `build_index.py`, always check the index is aligned before committing:

```bash
python -c "
import numpy as np, json
E = np.load('data/processed/embeddings.npy')
m = json.load(open('data/processed/books_metadata.json'))
print(E.shape[0], len(m), 'aligned:', E.shape[0] == len(m))"
```

If those numbers differ, every recommendation is for the wrong book.

---

## API

### `GET /`

Health and corpus size. The frontend calls this on load, both to wake the
service and to display the real book count.

```json
{ "status": "ok", "books": 25820, "matchable_by_isbn": 24680 }
```

### `POST /recommend`

```json
{ "title": "Dracula", "top_n": 6 }
```

Returns `query` (the matched book) and `recommendations`. 404s if the title
isn't in the index. Near-duplicates are collapsed, so three printings of the
same book don't fill the results.

### `POST /similar`

The same engine, but taking a book described the way **paperbackd** stores one.
Tries ISBN-13 first, then title + author, then title alone.

```json
{ "title": "The Hobbit (Middle-Earth #1)", "author": "Tolkien, J.R.R.", "isbns": ["9780261102217"] }
```

Series markers and `"Surname, First"` are handled, mirroring paperbackd's
`cleanTitle` / `cleanAuthor`. **This endpoint never 404s** — an unmatched book
returns `matched: false` with an empty list, because any real library will
contain books this index doesn't, and that shouldn't break a page render.

### `GET /search?q=&limit=`

Ranked title autocomplete: exact, then prefix, then word-start, then substring,
shortest first within each tier. Returns title, author, work id and cover id.

---

## Running locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --port 7860
```

```bash
cd frontend
npm install
VITE_API_BASE=http://localhost:7860 npm run dev
```

`VITE_API_BASE` defaults to the deployed API, so plain `npm run dev` runs the
local frontend against production data.

---

## Deployment

Two Render services from this one repo.

**API** — Docker, from the `Dockerfile` at the root. It binds `${PORT:-7860}`;
the fallback keeps it working on Hugging Face Spaces, which is where this
started.

**Frontend** — static site. Root Directory `frontend`, build
`npm install && npm run build`, publish `dist`. If Root Directory is blank the
build runs at the repo root, finds no `package.json`, and fails.

Both run on Render's free tier, which **sleeps after 15 minutes idle** and takes
about 50 seconds to wake. Fine for a gift; not fine as a live dependency of
another site. The frontend pings `/` on load to absorb the cold start before
anyone types anything.

---

## Things that will bite you

**Don't put `embeddings.npy` in Git LFS.** Render doesn't fetch LFS objects, so
the container gets a 132-byte pointer file, `np.load` throws at import, and the
service fails to start. The file is small enough to commit directly.

**`books_clean.jsonl` approaches GitHub's 100 MB hard limit** at this corpus
size. It and `books.jsonl` are gitignored — both are regenerable, and neither is
needed at runtime.

**`build_index.py` rewrites `books_metadata.json` from scratch**, which would
discard ISBNs written by `add_isbns.py`. That script keeps its own cache at
`data/raw/isbns.json` and re-applies from it, so lookups survive a rebuild.
Don't delete that file.

**Never commit while `add_isbns.py` is running** — it writes the metadata
continuously, and a half-written 12 MB JSON file will crash the API on boot.

---

## Attribution

Book data from [Open Library](https://openlibrary.org), used through its public
JSON API. Cover images from the Open Library Covers API. Nothing here is
scraped; the endpoints are the sanctioned ones, and requests are rate-limited
and identified.
