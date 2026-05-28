"use client"
import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

function generateCandles(count) {
  const candles = []
  let price = 100
  for (let i = 0; i < count; i++) {
    const open = price
    const close = open + (Math.random() - 0.48) * 6
    const high = Math.max(open, close) + Math.random() * 3
    const low = Math.min(open, close) - Math.random() * 3
    candles.push({ open, high, low, close, x: i * 12 + 20 })
    price = close
  }
  return candles
}

function generateLinePoints(count) {
  const points = []
  let y = 150
  for (let i = 0; i < count; i++) {
    y += (Math.random() - 0.48) * 8
    points.push({ x: i * 8, y })
  }
  return points
}

function CandleLayer({ candles, offset, speed, startY, opacity, reverse }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, startY])
  const fade = useTransform(scrollY, [0, 400], [opacity, opacity * 0.3])

  return (
    <motion.svg
      className="absolute top-10 left-0 w-full h-full"
      viewBox="0 0 720 300"
      preserveAspectRatio="none"
      style={{ y, opacity: fade }}
    >
      {candles.map((c, i) => {
        const isUp = c.close >= c.open
        const x = ((i * 12 + 20) + offset * speed * (reverse ? -1 : 1)) % 740
        return (
          <g key={i}>
            <line x1={x} y1={c.low} x2={x} y2={c.high} stroke={isUp ? "#00FF88" : "#FF4757"} strokeWidth="2" />
            <rect x={x - 4} y={Math.min(c.open, c.close)} width="8" height={Math.abs(c.close - c.open) || 1} fill={isUp ? "#00FF88" : "#FF4757"} rx="1" />
          </g>
        )
      })}
    </motion.svg>
  )
}

function LineLayer({ points }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, -120])
  const fade = useTransform(scrollY, [0, 500], [0.25, 0.05])

  return (
    <motion.svg
      className="absolute top-20 left-0 w-full h-full"
      viewBox="0 0 960 200"
      preserveAspectRatio="none"
      style={{ y, opacity: fade }}
    >
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        <motion.polyline
          points={points.map(p => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#00D4FF"
          strokeWidth="2"
          animate={{ x: [-960, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <motion.polygon
          points={points.map(p => `${p.x},${p.y}`).join(" ") + " 960,200 0,200"}
          fill="url(#lineGrad)"
          animate={{ x: [-960, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      </g>
    </motion.svg>
  )
}

function TickerTape() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 80])
  const pairs = ["EURUSD","GBPUSD","XAUUSD","BTCUSD","ETHUSD","USDJPY","GBPJPY","AUDUSD"]

  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 h-10 flex items-center overflow-hidden border-t border-[var(--border)]"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.06), transparent)",
        y,
      }}
    >
      <motion.div
        className="flex gap-10 whitespace-nowrap text-xs font-mono tracking-wider"
        animate={{ x: [0, -2000] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const change = (Math.random() - 0.45) * 3
          const isUp = change >= 0
          return (
            <span key={i} className={isUp ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]"}>
              {pairs[i % pairs.length]} <span className="font-bold">{isUp ? "▲" : "▼"}</span> {isUp ? "+" : ""}{change.toFixed(2)}%
            </span>
          )
        })}
      </motion.div>
    </motion.div>
  )
}

export default function MarketBackground() {
  const [candles, setCandles] = useState([])
  const [linePoints, setLinePoints] = useState([])
  const [offset, setOffset] = useState(0)
  const { scrollY } = useScroll()
  const mainOpacity = useTransform(scrollY, [0, 300, 600], [1, 0.5, 0])

  useEffect(() => {
    setCandles(generateCandles(60))
    setLinePoints(generateLinePoints(150))
    const interval = setInterval(() => setOffset(prev => (prev + 1) % 720), 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" style={{ opacity: mainOpacity }}>
      <CandleLayer candles={candles} offset={offset} speed={0.3} startY={150} opacity={0.12} />
      <LineLayer points={linePoints} />
      <CandleLayer candles={candles} offset={offset} speed={0.6} startY={-150} opacity={0.08} reverse />
      <TickerTape />
    </div>
  )
}
