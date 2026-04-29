export default function Logo({ size = 50, showText = true, textSize = 'text-xl' }) {
  return (
    <div className="flex items-center gap-3">
      
      {/* LOGO IMAGE */}
      <img
        src="/logo.png"
        alt="Learnly Logo"
        style={{ width: size, height: size }}
        className="rounded-2xl object-cover shadow-[0_0_20px_rgba(124,58,237,0.6)]"
      />

      {/* TEXT */}
      {showText && (
        <span
          className={`font-display font-bold gradient-text ${textSize}`}
          style={{ letterSpacing: '-0.5px' }}
        >
          Learnly
        </span>
      )}
    </div>
  )
}