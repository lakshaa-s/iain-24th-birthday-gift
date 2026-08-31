import { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_BASE || 'https://iain-book-recommender.onrender.com'

// Verified to exist in the 826-book index — these never 404.
const STARTERS = ['Dracula', 'The Secret History', 'The Hobbit', 'Jane Eyre', 'The Road']

// Subject tags that carry no information for a reader.
const DULL = new Set([
  'fiction', 'fiction, general', 'general', 'large type books', 'accessible book',
  'protected daisy', 'in library', 'internet archive wishlist', 'open library staff picks',
  'long now manual for civilization', 'literature', 'english literature', 'reading',
])

const usefulSubjects = (subjects) => {
  if (!Array.isArray(subjects)) return []
  const seen = new Set()
  const out = []
  for (const s of subjects) {
    const key = String(s).trim().toLowerCase()
    if (!key || DULL.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push(String(s).trim())
    if (out.length === 3) break
  }
  return out
}

function Cover({ workId, title }) {
  const [failed, setFailed] = useState(false)

  if (failed || !workId) {
    // Fallback: a blind-stamped spine, so a missing cover still looks deliberate.
    return (
      <div className="w-[74px] h-[112px] shrink-0 rounded-[2px] bg-cloth-light border border-cloth-deep flex items-center justify-center px-2 shadow-[inset_0_0_0_1px_rgba(201,162,39,.28)]">
        <span className="font-display text-gilt/70 text-[11px] leading-tight text-center line-clamp-4">
          {title}
        </span>
      </div>
    )
  }
  return (
    <img
      src={`https://covers.openlibrary.org/b/olid/${workId}-M.jpg?default=false`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-[74px] h-[112px] shrink-0 rounded-[2px] object-cover bg-cloth-light shadow-md"
    />
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [anchor, setAnchor] = useState('')       // the book the results are relative to
  const [trail, setTrail] = useState([])         // books explored, in order
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [waking, setWaking] = useState(false)    // Render free tier cold start
  const [hasSearched, setHasSearched] = useState(false)

  const [matches, setMatches] = useState([])
  const [openList, setOpenList] = useState(false)
  const [cursor, setCursor] = useState(-1)

  const boxRef = useRef(null)
  const skipNextLookup = useRef(false)

  // Wake the API on load. Render spins free instances down after 15 minutes,
  // so the first request otherwise stalls for ~50s and looks broken.
  useEffect(() => {
    let alive = true
    const timer = setTimeout(() => { if (alive) setWaking(true) }, 1200)
    fetch(`${API}/`)
      .catch(() => {})
      .finally(() => { if (alive) { clearTimeout(timer); setWaking(false) } })
    return () => { alive = false; clearTimeout(timer) }
  }, [])

  // Live title lookup against /search, so you can only pick books that exist.
  useEffect(() => {
    if (skipNextLookup.current) { skipNextLookup.current = false; return }
    const q = query.trim()
    const id = setTimeout(async () => {
      if (q.length < 2) { setMatches([]); setOpenList(false); return }
      try {
        const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=6`)
        if (!r.ok) return
        const d = await r.json()
        setMatches(d.results || [])
        setOpenList((d.results || []).length > 0)
        setCursor(-1)
      } catch { /* lookup is a convenience; stay quiet if it fails */ }
    }, 220)
    return () => clearTimeout(id)
  }, [query])

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpenList(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const findNeighbours = useCallback(async (rawTitle) => {
    const title = (rawTitle || '').trim()
    if (!title) return

    skipNextLookup.current = true
    setQuery(title)
    setOpenList(false)
    setLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const r = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, top_n: 6 }),
      })

      if (r.status === 404) {
        setResults([])
        setError(`"${title}" isn't in this shelf of 826 books. Start typing and pick a title from the list.`)
        return
      }
      if (!r.ok) throw new Error('bad status')

      const d = await r.json()
      setResults(d.recommendations || [])
      setAnchor(title)
      setTrail((prev) => (prev[prev.length - 1] === title ? prev : [...prev, title]))
    } catch {
      setResults([])
      setError('Could not reach the library. It may still be waking up — try that again in a moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onKeyDown = (e) => {
    if (!openList || matches.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % matches.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c <= 0 ? matches.length - 1 : c - 1)) }
    else if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); findNeighbours(matches[cursor].title) }
    else if (e.key === 'Escape') { setOpenList(false) }
  }

  const reset = () => {
    setQuery(''); setResults([]); setTrail([]); setAnchor('')
    setError(''); setHasSearched(false); setMatches([]); setOpenList(false)
  }

  return (
    <div className="min-h-screen text-card font-text selection:bg-gilt selection:text-cloth-deep">
      <div className="h-1 w-full bg-gilt/70" />

      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">

        <header className="text-center">
          <p className="font-typed text-[11px] tracking-[.22em] text-gilt/80">24 · 2026</p>
          <h1 className="font-display text-[2.6rem] sm:text-6xl leading-[1.05] mt-4 text-card">
            Happy birthday, Iain
          </h1>
          <p className="mt-5 text-card/70 text-[17px] leading-relaxed max-w-[52ch] mx-auto">
            You built a place to keep track of what you've read. This is the other half:
            name a book you loved and it finds the six that sit closest to it, out of 826.
          </p>
          <p className="mt-3 font-typed text-[12px] text-card/40">Love, Lakshaa</p>
        </header>

        <div ref={boxRef} className="relative mt-12">
          <form onSubmit={(e) => { e.preventDefault(); findNeighbours(query) }}>
            <label htmlFor="title" className="sr-only">Book title</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="title"
                type="text"
                value={query}
                autoComplete="off"
                role="combobox"
                aria-expanded={openList}
                aria-controls="matches"
                aria-autocomplete="list"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => matches.length && setOpenList(true)}
                placeholder="Start typing a title…"
                className="flex-1 bg-card text-ink placeholder:text-ink-soft/60 font-text text-lg
                           px-5 py-4 rounded-[3px] border border-card-edge
                           shadow-[0_1px_0_rgba(255,255,255,.5)_inset,0_10px_24px_rgba(0,0,0,.35)]
                           focus:outline-none focus:ring-2 focus:ring-gilt"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="font-display text-lg px-8 py-4 rounded-[3px] bg-gilt text-cloth-deep
                           border border-gilt hover:bg-[#DCB63A] active:translate-y-px
                           disabled:bg-cloth-light disabled:text-card/35 disabled:border-cloth-light
                           disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Looking…' : 'Find its neighbours'}
              </button>
            </div>
          </form>

          {openList && matches.length > 0 && (
            <ul
              id="matches"
              role="listbox"
              className="absolute z-20 left-0 right-0 mt-1 bg-card text-ink rounded-[3px]
                         border border-card-edge shadow-2xl overflow-hidden"
            >
              {matches.map((m, i) => (
                <li key={m.work_id || i} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => findNeighbours(m.title)}
                    className={`w-full text-left px-5 py-3 font-text text-[15px] border-b border-card-edge/60
                                last:border-0 ${i === cursor ? 'bg-gilt/25' : 'hover:bg-gilt/15'}`}
                  >
                    {m.title}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!hasSearched && (
            <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 text-card/55 text-[15px]">
              <span className="font-typed text-[11px] tracking-[.16em] text-card/35">or begin with</span>
              {STARTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => findNeighbours(t)}
                  className="font-text italic underline decoration-gilt/40 underline-offset-4
                             hover:text-gilt hover:decoration-gilt transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {waking && !hasSearched && (
          <p className="mt-8 text-center font-typed text-[12px] text-card/40">
            Unlocking the library — the server sleeps when nobody's reading.
          </p>
        )}

        {trail.length > 1 && (
          <nav className="mt-12 flex flex-wrap items-center gap-2 font-typed text-[12px] text-card/45">
            {trail.map((t, i) => (
              <span key={`${t}-${i}`} className="flex items-center gap-2">
                {i > 0 && <span className="text-gilt/50">/</span>}
                <button
                  onClick={() => findNeighbours(t)}
                  className={`hover:text-gilt transition-colors ${t === anchor ? 'text-gilt' : ''}`}
                >
                  {t}
                </button>
              </span>
            ))}
            <button onClick={reset} className="ml-2 text-card/30 hover:text-card/70 transition-colors">
              clear
            </button>
          </nav>
        )}

        {error && (
          <p className="mt-12 border-l-2 border-stamp bg-cloth-light/40 px-5 py-4 text-card/80 text-[15px] leading-relaxed">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-16 text-center font-typed text-[12px] text-card/40">
            Reading the shelf…
          </p>
        )}

        {!loading && results.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl text-card/90">
              Closest to <em className="not-italic text-gilt">{anchor}</em>
            </h2>
            <p className="mt-1 mb-7 text-card/45 text-[15px]">
              Pick any one to keep walking down the shelf.
            </p>

            <ol className="space-y-3">
              {results.map((book, i) => {
                const pct = Math.round((book.similarity_score ?? 0) * 100)
                const tags = usefulSubjects(book.subjects)
                return (
                  <li
                    key={book.work_id || i}
                    style={{ animationDelay: `${i * 55}ms` }}
                    className="animate-deal bg-card text-ink rounded-[3px] border border-card-edge
                               shadow-[0_8px_20px_rgba(0,0,0,.3)] p-5 flex gap-5"
                  >
                    <Cover key={book.work_id} workId={book.work_id} title={book.title} />

                    <div className="min-w-0 flex-1 flex flex-col">
                      <h3 className="font-display text-[21px] leading-snug text-ink">
                        {book.title}
                      </h3>

                      {tags.length > 0 && (
                        <p className="mt-1.5 font-typed text-[11px] text-ink-soft leading-relaxed">
                          {tags.join('  ·  ')}
                        </p>
                      )}

                      <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex-1 min-w-[110px] max-w-[130px]">
                          <div className="h-[3px] w-full bg-ink/10 rounded-full overflow-hidden">
                            <div className="h-full bg-stamp rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-typed text-[10px] text-ink-soft">{pct}% alike</span>
                        </div>

                        <button
                          onClick={() => findNeighbours(book.title)}
                          className="font-text italic text-[15px] text-stamp underline
                                     decoration-stamp/30 underline-offset-4 hover:decoration-stamp"
                        >
                          Books near this one
                        </button>

                        {book.work_id && (
                          <a
                            href={`https://openlibrary.org/works/${book.work_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-typed text-[11px] text-ink-soft hover:text-ink underline
                                       decoration-ink-soft/30 underline-offset-4"
                          >
                            details
                          </a>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        {!loading && hasSearched && !error && results.length === 0 && (
          <p className="mt-16 text-center text-card/50 text-[15px]">
            Nothing sits close to that one. Try another title.
          </p>
        )}
      </main>
    </div>
  )
}
