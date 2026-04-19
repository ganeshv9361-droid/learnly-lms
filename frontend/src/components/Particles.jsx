import { useEffect, useRef } from 'react'

export default function Particles() {
  const containerRef = useRef()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const particles = []
    const count = 25

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div')
      const size = Math.random() * 6 + 2
      const colors = ['#7c3aed','#06b6d4','#8b5cf6','#0d9488','#a78bfa']
      const color = colors[Math.floor(Math.random() * colors.length)]
      const duration = Math.random() * 15 + 10
      const delay = Math.random() * 10
      const left = Math.random() * 100

      p.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${left}%;
        bottom: -10px;
        opacity: 0;
        animation: particle-float ${duration}s ${delay}s linear infinite;
        filter: blur(${size > 5 ? 1 : 0}px);
      `
      container.appendChild(p)
      particles.push(p)
    }

    return () => particles.forEach(p => p.remove())
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0" />
  )
}
