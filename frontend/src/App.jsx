import { useState, useEffect, useRef, useCallback } from 'react'
import Ransom from './Ransom'
import Reader from './Reader'

const API = import.meta.env.VITE_API_BASE || 'https://iain-book-recommender.onrender.com'

const STARTERS = ['Dracula', 'The Secret History', 'The Hobbit', 'Casino Royale', 'The Road']

// Spine colours, picked by genre so a shelf reads at a glance.
const BANDS = [
  { label: 'Horror',       color: '#8B1E2D', test: /horror|vampire|ghost|gothic|supernatural|monster/i },
  { label: 'Crime',        color: '#16704A', test: /detective|mystery|crime|murder|thriller|suspense|noir|spies/i },
  { label: 'Fantasy & SF', color: '#6C3F8F', test: /fantasy|science fiction|dragons|magic|wizard|space|dystop/i },
  { label: 'Romance',      color: '#C43C6B', test: /romance|love stories|courtship|marriage/i },
  { label: 'Adventure',    color: '#0E7C8C', test: /travel|adventure|voyage|sea stories|survival|expedition/i },
  { label: 'History',      color: '#1E4C8A', test: /history|biography|autobiograph|war|memoir|politic/i },
  { label: "Children's",   color: '#D29A12', test: /children|juvenile|picture book|schools/i },
]
const FICTION = { label: 'Fiction', color: '#E8873A' }
const bandFor = (subjects) => {
  const hay = (Array.isArray(subjects) ? subjects : []).join(' ')
  return BANDS.find((b) => b.test.test(hay)) || FICTION
}

// Real cover if we resolved one offline (src/add_covers.py), else try the work
// OLID, else fall through to a drawn cover.
const coverUrls = (book) => {
  const urls = []
  if (book.cover_id) urls.push(`https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`)
  if (book.work_id) urls.push(`https://covers.openlibrary.org/b/olid/${book.work_id}-L.jpg?default=false`)
  return urls
}

const titleSize = (t = '') =>
  t.length > 60 ? 'text-[10px]' : t.length > 40 ? 'text-[12px]' : t.length > 24 ? 'text-[14px]' : 'text-[16px]'

function Book3D({ book, index, onPick }) {
  const band = bandFor(book.subjects)
  const urls = coverUrls(book)
  const [attempt, setAttempt] = useState(0)
  const [tilt, setTilt] = useState({ x: 0, y: -18 })
  const src = urls[attempt]

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    setTilt({ x: -py * 22, y: px * 34 })
  }

  const pct = Math.round((book.similarity_score ?? 0) * 100)

  return (
    <div className="scene animate-shelve" style={{ animationDelay: `${index * 80}ms` }}>
      <button
        onClick={onPick}
        onMouseMove={onMove}
        onMouseLeave={() => setTilt({ x: 0, y: -18 })}
        aria-label={`Find books near ${book.title}`}
        className="group block w-full text-left"
      >
        <div
          className="preserve-3d relative aspect-[2/3] w-full transition-transform duration-300 ease-out
                     group-hover:scale-[1.04]"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {/* page block, sitting behind the cover so it parallaxes in 3D */}
          <div className="absolute inset-0 rounded-r-[3px] bg-[#EFE9D8]"
               style={{ transform: 'translateZ(-14px) translateX(7px)',
                        backgroundImage: 'repeating-linear-gradient(90deg,#EFE9D8 0 2px,#D8D0BA 2px 3px)' }} />

          {/* the cover */}
          <div className="absolute inset-0 overflow-hidden rounded-r-[3px] backface-hidden
                          shadow-[0_16px_30px_rgba(26,26,24,.35)]"
               style={{ backgroundColor: band.color }}>
            {src ? (
              <img
                src={src}
                alt=""
                loading="lazy"
                onError={() => setAttempt((a) => a + 1)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col text-cream">
                <div className="h-[22%] flex items-center justify-center">
                  <span className="text-[8px] tracking-[.2em] uppercase opacity-80">{band.label}</span>
                </div>
                <div className="flex-1 bg-cut-paper text-ink flex items-center justify-center px-2 text-center">
                  <span className={`font-ui font-medium leading-tight line-clamp-5 ${titleSize(book.title)}`}>
                    {book.title}
                  </span>
                </div>
                <div className="h-[22%] flex items-center justify-center">
                  <span className="w-7 h-7 rounded-full bg-cut-paper flex items-center justify-center
                                   font-ui font-bold text-[12px]" style={{ color: band.color }}>24</span>
                </div>
              </div>
            )}
            {/* spine shading + gloss */}
            <div className="absolute inset-y-0 left-0 w-[13%]"
                 style={{ background: 'linear-gradient(90deg,rgba(0,0,0,.42),rgba(0,0,0,.06) 60%,transparent)' }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                 style={{ background: 'linear-gradient(115deg,transparent 42%,rgba(255,255,255,.28) 50%,transparent 58%)' }} />
          </div>
        </div>
      </button>

      <p className="mt-3 font-type text-[11px] text-ink-soft leading-snug">
        <span className="text-ink">{pct}% alike</span> · {band.label.toLowerCase()}
      </p>
      <p className="font-ui text-[13px] text-ink leading-snug line-clamp-2">{book.title}</p>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [anchor, setAnchor] = useState('')
  const [trail, setTrail] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [waking, setWaking] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [matches, setMatches] = useState([])
  const [openList, setOpenList] = useState(false)
  const [cursor, setCursor] = useState(-1)

  const boxRef = useRef(null)
  const skipNext = useRef(false)
  const resultsRef = useRef(null)

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => { if (alive) setWaking(true) }, 1200)
    fetch(`${API}/`).catch(() => {}).finally(() => {
      if (alive) { clearTimeout(t); setWaking(false) }
    })
    return () => { alive = false; clearTimeout(t) }
  }, [])

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return }
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
      } catch { /* autocomplete is a nicety */ }
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

  const findNeighbours = useCallback(async (raw) => {
    const title = (raw || '').trim()
    if (!title) return
    skipNext.current = true
    setQuery(title); setOpenList(false); setLoading(true)
    setError(''); setHasSearched(true)
    try {
      const r = await fetch(`${API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, top_n: 6 }),
      })
      if (r.status === 404) {
        setResults([])
        setError(`"${title}" isn't one of the 826. Start typing and pick from the list.`)
        return
      }
      if (!r.ok) throw new Error('bad status')
      const d = await r.json()
      setResults(d.recommendations || [])
      setAnchor(title)
      setTrail((p) => (p[p.length - 1] === title ? p : [...p, title]))
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } catch {
      setResults([])
      setError('Could not reach the shelf. It may still be waking up — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }, [])

  const onKeyDown = (e) => {
    if (!openList || !matches.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => (c + 1) % matches.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => (c <= 0 ? matches.length - 1 : c - 1)) }
    else if (e.key === 'Enter' && cursor >= 0) { e.preventDefault(); findNeighbours(matches[cursor].title) }
    else if (e.key === 'Escape') setOpenList(false)
  }

  const surprise = () => {
    const pool = matches.length ? matches.map((m) => m.title) : STARTERS
    findNeighbours(pool[Math.floor(Math.random() * pool.length)])
  }

  const reset = () => {
    setQuery(''); setResults([]); setTrail([]); setAnchor('')
    setError(''); setHasSearched(false); setMatches([]); setOpenList(false)
  }

  return (
    <div className="min-h-screen font-ui text-ink selection:bg-tape selection:text-cream">
      <main className="max-w-5xl mx-auto px-5 pt-12 pb-28">

        <header className="text-center">
          <div className="mx-auto w-[190px] sm:w-[230px] mb-2">
            <Reader />
          </div>

          <Ransom text="Happy 24th Iain" />

          <p className="mt-7 mx-auto max-w-[52ch] text-ink-soft text-[17px] leading-relaxed">
            You built somewhere to log what you've read, so I built the opposite.
            Name a book you loved and 826 of them shuffle to show you the six
            that stand closest on the shelf.
          </p>
          <p className="mt-2 font-type text-[13px] text-ink-soft/70">love, Lakshaa</p>
        </header>

        <div ref={boxRef} className="relative mt-10 max-w-2xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); findNeighbours(query) }}>
            <label htmlFor="title" className="sr-only">Book title</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="title" type="text" value={query} autoComplete="off"
                role="combobox" aria-expanded={openList} aria-controls="matches" aria-autocomplete="list"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => matches.length && setOpenList(true)}
                placeholder="Type a book you love…"
                className="flex-1 bg-cut-paper text-ink placeholder:text-ink-soft/60 text-lg px-5 py-4
                           rounded-[2px] border-[3px] border-ink shadow-[5px_5px_0_#1A1A18]
                           focus:outline-none focus:border-tape"
              />
              <button
                type="submit" disabled={loading || !query.trim()}
                className="bg-ink text-cream font-medium text-lg px-7 py-4 rounded-[2px]
                           shadow-[5px_5px_0_#E8873A] hover:bg-tape hover:text-ink
                           hover:shadow-[5px_5px_0_#1A1A18] active:translate-x-[2px] active:translate-y-[2px]
                           active:shadow-[2px_2px_0_#1A1A18] transition-all
                           disabled:bg-ink-soft/40 disabled:text-cream/60 disabled:shadow-none
                           disabled:cursor-not-allowed"
              >
                {loading ? 'Shuffling…' : 'Pull it off the shelf'}
              </button>
            </div>
          </form>

          {openList && matches.length > 0 && (
            <ul id="matches" role="listbox"
                className="absolute z-30 left-0 right-0 mt-1 bg-cut-paper text-ink rounded-[2px]
                           border-[3px] border-ink shadow-[5px_5px_0_#1A1A18] overflow-hidden">
              {matches.map((m, i) => (
                <li key={m.work_id || i} role="option" aria-selected={i === cursor}>
                  <button type="button"
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => findNeighbours(m.title)}
                    className={`w-full text-left px-5 py-3 text-[15px] border-b border-ink/15 last:border-0
                                ${i === cursor ? 'bg-tape text-ink' : 'hover:bg-ink/5'}`}>
                    {m.title}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[14px]">
            {!hasSearched && STARTERS.map((t) => (
              <button key={t} onClick={() => findNeighbours(t)}
                className="px-3 py-1 border-2 border-ink rounded-[2px] bg-cream
                           hover:bg-ink hover:text-cream transition-colors">
                {t}
              </button>
            ))}
            <button onClick={surprise}
              className="px-3 py-1 border-2 border-ink rounded-[2px] bg-cut-yellow
                         hover:bg-ink hover:text-cream transition-colors">
              Surprise me
            </button>
          </div>

          {waking && !hasSearched && (
            <p className="mt-5 text-center font-type text-[12px] text-ink-soft/70">
              turning the lights on — the shelf sleeps when nobody's reading
            </p>
          )}
        </div>

        {trail.length > 1 && (
          <nav className="mt-12 flex flex-wrap items-center justify-center gap-2 text-[12px]">
            {trail.map((t, i) => (
              <button key={`${t}-${i}`} onClick={() => findNeighbours(t)}
                className={`px-2.5 py-1 border-2 border-ink rounded-[2px] transition-colors
                  ${t === anchor ? 'bg-ink text-cream' : 'bg-cream hover:bg-cut-yellow'}`}>
                {t}
              </button>
            ))}
            <button onClick={reset} className="ml-1 font-type text-ink-soft hover:text-ink">start over</button>
          </nav>
        )}

        {error && (
          <p className="mt-12 max-w-2xl mx-auto border-[3px] border-ink bg-cut-yellow px-5 py-4
                        shadow-[5px_5px_0_#1A1A18] text-[15px]">
            {error}
          </p>
        )}

        {loading && (
          <p className="mt-20 text-center font-type text-[13px] text-ink-soft tracking-wide">
            reading the shelf…
          </p>
        )}

        {!loading && results.length > 0 && (
          <section ref={resultsRef} className="mt-16 scroll-mt-6">
            <p className="text-center font-type text-[14px] text-ink-soft">
              standing next to <span className="text-ink">{anchor}</span>
            </p>

            <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-10">
              {results.map((book, i) => (
                <Book3D key={book.work_id || i} book={book} index={i}
                        onPick={() => findNeighbours(book.title)} />
              ))}
            </div>

            <div className="mt-4 h-3 bg-ink rounded-[1px] shadow-[0_8px_16px_rgba(26,26,24,.28)]" />
            <p className="mt-6 text-center font-type text-[13px] text-ink-soft">
              tap any cover to keep walking down the shelf
            </p>
          </section>
        )}

        {!loading && hasSearched && !error && results.length === 0 && (
          <p className="mt-20 text-center text-ink-soft">Nothing stands near that one. Try another.</p>
        )}
      </main>
    </div>
  )
}