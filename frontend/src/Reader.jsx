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
  jumper:    '#6E2A38',   // burgundy
  jumperRib: '#54202B',   // darker burgundy for the neck ribbing and cuffs
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
  const { skin, skinShade, hair, hairLift, beard, jumper, jumperRib, earring, bookCover, mug } = IAIN

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

        <path d="M52 186 Q54 140 100 137 Q146 140 148 186Z" fill={jumper} />
        {/* shoulder falloff, so the knit reads as fabric rather than a flat shape */}
        <path d="M52 186 Q54 148 74 140 L80 186Z" fill="#000" opacity=".10" />
        <path d="M148 186 Q146 148 126 140 L120 186Z" fill="#000" opacity=".10" />
        {/* crew neck: the opening, then the rib around it */}
        <path d="M86 138 Q100 152 114 138 Q100 146 86 138Z" fill={skinShade} />
        <path d="M85 137 Q100 151 115 137" stroke={jumperRib} strokeWidth="4.5"
              fill="none" strokeLinecap="round" />

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
        {/* SLEEVES — drawn before the book so the arms pass BEHIND it */}
        <path d="M68 144 Q54 156 53 174" stroke={jumper} strokeWidth="15"
              fill="none" strokeLinecap="round" />
        <path d="M132 144 Q146 156 147 174" stroke={jumper} strokeWidth="15"
              fill="none" strokeLinecap="round" />
        <path d="M53 174 L53 178" stroke={jumperRib} strokeWidth="15"
              fill="none" strokeLinecap="round" />
        <path d="M147 174 L147 178" stroke={jumperRib} strokeWidth="15"
              fill="none" strokeLinecap="round" />
        {/* wrists emerging from the cuffs */}
        <path d="M53 180 L55 184" stroke={skin} strokeWidth="12"
              fill="none" strokeLinecap="round" />
        <path d="M147 180 L145 184" stroke={skin} strokeWidth="12"
              fill="none" strokeLinecap="round" />

        {/* THE BOOK — narrower than his shoulders, so the arms show either side */}
        <g>
          <path d="M60 140 Q100 152 140 140 L140 186 Q100 198 60 186Z" fill={bookCover} />
          <path d="M65 145 Q100 156 135 145 L135 182 Q100 193 65 182Z" fill="#FBF8EC" />
          <path d="M100 156 L100 193" stroke="#C9BFA6" strokeWidth="1.6" opacity=".9" />

          <g className="animate-pageflip"
             style={{ transformOrigin: '0% 50%', transformBox: 'fill-box' }}>
            <path d="M100 156 Q117 152 135 145 L135 182 Q117 189 100 193Z"
                  fill="#F4F0E2" stroke="#DED8C6" strokeWidth="1" />
          </g>

          <g stroke="#B9B2A0" strokeWidth="1.5" strokeLinecap="round" opacity=".75" fill="none">
            <path d="M72 157 Q84 162 94 165" />
            <path d="M72 165 Q84 170 94 173" />
            <path d="M72 173 Q83 177 91 179" />
          </g>
        </g>

        {/* HANDS — after the book, so they grip the front of it */}
        <ellipse cx="59" cy="180" rx="8" ry="8.5" fill={skin} />
        <ellipse cx="141" cy="180" rx="8" ry="8.5" fill={skin} />
        <path d="M63 176 Q69 172 74 169" stroke={skin} strokeWidth="5"
              fill="none" strokeLinecap="round" />
        <path d="M137 176 Q131 172 126 169" stroke={skin} strokeWidth="5"
              fill="none" strokeLinecap="round" />
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