export default function Logo({ size = 40, showText = true, textSize = 'text-xl' }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: size, height: size, flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
          <defs>
            <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed"/>
              <stop offset="50%" stopColor="#06b6d4"/>
              <stop offset="100%" stopColor="#7c3aed"/>
            </linearGradient>
            <linearGradient id="lg2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4"/>
              <stop offset="100%" stopColor="#7c3aed"/>
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          {/* Outer circle background */}
          <circle cx="50" cy="50" r="48" fill="url(#lg1)" opacity="0.15"/>
          <circle cx="50" cy="50" r="48" stroke="url(#lg1)" strokeWidth="1.5" fill="none" opacity="0.4"/>
          {/* Infinity loop path */}
          <path
            d="M 25 50 C 25 35, 38 28, 50 35 C 62 42, 75 35, 75 50 C 75 65, 62 72, 50 65 C 38 58, 25 65, 25 50 Z"
            stroke="url(#lg1)" strokeWidth="5" fill="none" strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Inner crossing detail */}
          <path
            d="M 42 44 C 46 48, 54 52, 58 56"
            stroke="url(#lg2)" strokeWidth="5" fill="none" strokeLinecap="round"
            opacity="0.9"
          />
          <path
            d="M 58 44 C 54 48, 46 52, 42 56"
            stroke="url(#lg1)" strokeWidth="5" fill="none" strokeLinecap="round"
            opacity="0.9"
          />
          {/* Center dot */}
          <circle cx="50" cy="50" r="4" fill="url(#lg1)"/>
          {/* Sparkle dots */}
          <circle cx="25" cy="50" r="3" fill="#06b6d4" opacity="0.8"/>
          <circle cx="75" cy="50" r="3" fill="#7c3aed" opacity="0.8"/>
        </svg>
      </div>
      {showText && (
        <span className={`font-display font-bold gradient-text ${textSize}`}
          style={{letterSpacing:'-0.5px'}}>
          Learnly
        </span>
      )}
    </div>
  )
}
