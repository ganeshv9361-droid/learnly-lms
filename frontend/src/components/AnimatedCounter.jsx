import { useEffect, useState, useRef } from 'react'

export default function AnimatedCounter({ value, suffix = '', duration = 1000 }) {
  const [display, setDisplay] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const target = parseFloat(value) || 0
    startRef.current = null

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target * 10) / 10)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span>{display}{suffix}</span>
}
