// Cut-out magazine letters, like a ransom note.
// Every choice is derived from the character's position so the layout is
// stable across re-renders — random-on-every-paint would jitter horribly.

const FONTS = ['font-r1', 'font-r2', 'font-r3', 'font-r4', 'font-r5']

const TILES = [
  { bg: 'bg-cut-black',  fg: 'text-cream' },
  { bg: 'bg-cut-orange', fg: 'text-cut-black' },
  { bg: 'bg-cut-grey',   fg: 'text-cut-paper' },
  { bg: 'bg-cut-paper',  fg: 'text-cut-black' },
  { bg: 'bg-cut-wood',   fg: 'text-cut-paper' },
  { bg: 'bg-cut-pink',   fg: 'text-cut-black' },
  { bg: 'bg-cut-yellow', fg: 'text-cut-black' },
  { bg: 'bg-cut-teal',   fg: 'text-cut-paper' },
]

// Cheap deterministic hash so each letter gets a stable "random" look.
const hash = (s, i) => {
  let h = 2166136261
  for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619)
  return Math.abs(h ^ Math.imul(i + 1, 2654435761))
}

export default function Ransom({ text, size = 'text-[46px] sm:text-[76px]', className = '' }) {
  const chars = [...text]
  return (
    <span className={`inline-flex flex-wrap justify-center items-center gap-x-1 gap-y-2 ${className}`}
          aria-label={text} role="img">
      {chars.map((ch, i) => {
        if (ch === ' ') return <span key={i} className="w-4 sm:w-7" aria-hidden="true" />

        const h = hash(text, i)
        const font = FONTS[h % FONTS.length]
        const tile = TILES[(h >> 3) % TILES.length]
        const tilt = ((h >> 6) % 13) - 6            // -6deg … +6deg
        const rise = ((h >> 10) % 9) - 4            // -4px … +4px
        const upper = (h >> 13) % 3 !== 0           // mixed case, like cut magazine type

        return (
          <span
            key={i}
            aria-hidden="true"
            style={{ '--tilt': `${tilt}deg`, transform: `translateY(${rise}px) rotate(${tilt}deg)` }}
            className={`animate-drop torn inline-block px-2 pb-1 pt-0.5 leading-none
                        shadow-[2px_3px_0_rgba(26,26,24,.22)]
                        ${font} ${tile.bg} ${tile.fg} ${size}`}
          >
            {upper ? ch.toUpperCase() : ch.toLowerCase()}
          </span>
        )
      })}
    </span>
  )
}