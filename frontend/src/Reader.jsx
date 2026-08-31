// An animated Iain, reading.
//
// Drawn from the photo: big dark curly shag, no glasses, light stubble,
// stud earring, open smile. Everything below is still a knob if you
// want to nudge it.
const IAIN = {
  skin:      '#CE9A6E',   // warm mid tan
  skinShade: '#B57F55',   // shading under the jaw and nose
  hair:      '#241610',   // near-black brown
  hairLift:  '#3A2418',   // lighter curl highlights
  beard:     '#2B1C14',   // stubble
  shirt:     '#F5F3EC',   // white shirt from the photo
  tie:       '#23211E',   // dark tie — set to null to lose it
  earring:   true,
  bookCover: '#E8873A',
  mug:       true,
}

// The curl mass: lumps placed by hand so it reads as a shag, not a helmet.
const CURLS = [
  [72, 44, 17], [92, 34, 19], [114, 33, 19], [133, 45, 17],
  [60, 62, 15], [146, 62, 15], [55, 82, 13], [151, 82, 13],
  [58, 100, 13], [148, 100, 13], [64, 116, 12], [142, 116, 12],
  [82, 40, 15], [122, 39, 15], [102, 30, 16],
]

const HIGHLIGHTS = [[88, 40, 7], [118, 38, 7], [64, 66, 6], [140, 66, 6]]

export default function Reader() {
  const { skin, skinShade, hair, hairLift, beard, shirt, tie, earring, bookCover, mug } = IAIN

  return (
    <svg viewBox="0 0 200 210" className="w-full h-full" role="img"
         aria-label="An illustration of Iain reading a book">

      <ellipse cx="100" cy="197" rx="64" ry="7" fill="#1A1A18" opacity=".10" />

      <g className="animate-bob" style={{ transformOrigin: '100px 120px' }}>

        {/* hair mass behind the head, so curls sit round the face */}
        <g fill={hair}>
          <ellipse cx="100" cy="80" rx="52" ry="52" />
          <path d="M52 84 Q48 118 62 138 Q70 120 68 96Z" />
          <path d="M148 84 Q152 118 138 138 Q130 120 132 96Z" />
          {CURLS.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
        </g>

        <path d="M52 186 Q54 140 100 137 Q146 140 148 186Z" fill={shirt} />
        <path d="M88 137 L100 152 L112 137 Q100 143 88 137Z" fill={skinShade} opacity=".35" />
        {tie && <path d="M100 152 L106 160 L103 186 L97 186 L94 160Z" fill={tie} />}

        <rect x="92" y="112" width="16" height="22" rx="7" fill={skinShade} />

        <ellipse cx="100" cy="86" rx="37" ry="41" fill={skin} />
        <ellipse cx="63" cy="90" rx="6" ry="9" fill={skin} />
        <ellipse cx="137" cy="90" rx="6" ry="9" fill={skin} />
        {earring && <circle cx="138" cy="99" r="3" fill="#D9C07A" />}

        {/* stubble: jaw, chin, moustache */}
        <g fill={beard} opacity=".5">
          <path d="M67 96 Q70 132 100 134 Q130 132 133 96 Q126 120 100 120 Q74 120 67 96Z" />
        </g>
        <path d="M86 100 Q100 96 114 100 Q100 103 86 100Z" fill={beard} opacity=".75" />

        {/* the smile */}
        <path d="M82 104 Q100 108 118 104 Q116 124 100 124 Q84 124 82 104Z" fill="#6E332C" />
        <path d="M84 105 Q100 109 116 105 Q115 114 100 114 Q85 114 84 105Z" fill="#FBF9F2" />

        <path d="M96 88 Q100 98 104 96" stroke={skinShade} strokeWidth="2.4"
              fill="none" strokeLinecap="round" />

        <g className="animate-blink" style={{ transformOrigin: '100px 84px' }}>
          <ellipse cx="85" cy="84" rx="4.4" ry="4.4" fill="#2B1A12" />
          <ellipse cx="115" cy="84" rx="4.4" ry="4.4" fill="#2B1A12" />
          <circle cx="86.5" cy="82.5" r="1.4" fill="#fff" opacity=".85" />
          <circle cx="116.5" cy="82.5" r="1.4" fill="#fff" opacity=".85" />
        </g>

        <path d="M75 73 Q85 67 95 72" stroke={hair} strokeWidth="3.6" fill="none" strokeLinecap="round" />
        <path d="M105 72 Q115 67 125 73" stroke={hair} strokeWidth="3.6" fill="none" strokeLinecap="round" />

        {/* fringe curls falling over the forehead */}
        <g fill={hair}>
          <circle cx="80" cy="56" r="14" /><circle cx="100" cy="50" r="15" /><circle cx="120" cy="56" r="14" />
        </g>
        <g fill={hairLift} opacity=".45">
          {HIGHLIGHTS.map(([cx, cy, r], i) => <circle key={i} cx={cx} cy={cy} r={r} />)}
        </g>

        {/* the book */}
        <g>
          <path d="M50 150 L100 142 L150 150 L150 194 L100 186 L50 194Z" fill={bookCover} />
          <path d="M100 142 L100 186" stroke="#1A1A18" strokeWidth="2" opacity=".35" />
          <path d="M56 152 L100 145 L100 183 L56 190Z" fill="#FBF8EC" />
          <path d="M144 152 L100 145 L100 183 L144 190Z" fill="#FBF8EC" />

          <g className="animate-pageflip" style={{ transformOrigin: '100px 164px', transformBox: 'fill-box' }}>
            <path d="M100 145 L142 152 L142 189 L100 183Z" fill="#F2EEE0" stroke="#DED8C6" strokeWidth="1" />
          </g>

          <g stroke="#B9B2A0" strokeWidth="1.6" strokeLinecap="round" opacity=".8">
            <path d="M64 160 L92 156" /><path d="M64 167 L92 163" /><path d="M64 174 L86 170" />
          </g>
        </g>

        <path d="M54 180 Q44 166 48 152" stroke={skin} strokeWidth="13" fill="none" strokeLinecap="round" />
        <path d="M146 180 Q156 166 152 152" stroke={skin} strokeWidth="13" fill="none" strokeLinecap="round" />
      </g>

      {mug && (
        <g>
          <path d="M158 173 h20 v15 a10 10 0 0 1 -20 0Z" fill="#C9483F" />
          <path d="M178 176 a7 7 0 0 1 0 9" stroke="#C9483F" strokeWidth="3" fill="none" />
          <g stroke="#8C8C8C" strokeWidth="2.4" fill="none" strokeLinecap="round">
            <path className="animate-steam" style={{ transformOrigin: '164px 171px' }} d="M164 171 q4 -5 0 -10" />
            <path className="animate-steam" style={{ transformOrigin: '172px 171px', animationDelay: '1.1s' }} d="M172 171 q4 -5 0 -10" />
          </g>
        </g>
      )}
    </svg>
  )
}