'use client'

import { useEffect, useState } from 'react'

// Fixe la deadline à +24h au premier rendu (côté client)
const DEADLINE = Date.now() + 24 * 60 * 60 * 1000

function pad(n: number) { return String(n).padStart(2, '0') }

export default function UrgencyBanner() {
  const [timeLeft, setTimeLeft] = useState({ h: 24, m: 0, s: 0 })
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, DEADLINE - Date.now())
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft({ h, m, s })
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [])

  if (!visible) return null

  return (
    <div className="urgency-banner">
      <div className="urgency-inner">
        {/* Flamme */}
        <span className="urgency-fire">🔥</span>

        {/* Texte principal */}
        <div className="urgency-text">
          <span className="urgency-label">Offre Flash</span>
          <span className="urgency-dash">—</span>
          <span className="urgency-pct">-55%</span>
          <span className="urgency-desc">sur toute la collection · Expire dans</span>
        </div>

        {/* Timer */}
        <div className="urgency-timer">
          <div className="timer-block">
            <span className="timer-value">{pad(timeLeft.h)}</span>
            <span className="timer-unit">h</span>
          </div>
          <span className="timer-sep">:</span>
          <div className="timer-block">
            <span className="timer-value">{pad(timeLeft.m)}</span>
            <span className="timer-unit">m</span>
          </div>
          <span className="timer-sep">:</span>
          <div className="timer-block">
            <span className="timer-value">{pad(timeLeft.s)}</span>
            <span className="timer-unit">s</span>
          </div>
        </div>

        <a href="/boutique" className="urgency-cta">En profiter →</a>
      </div>

      {/* Close */}
      <button className="urgency-close" onClick={() => setVisible(false)} title="Fermer">×</button>
    </div>
  )
}
