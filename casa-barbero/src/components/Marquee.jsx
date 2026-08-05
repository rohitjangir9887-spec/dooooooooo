import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import styles from './Marquee.module.css'

const ITEMS = [
  'Casa Barbero', 'Manila', 'Expert Cuts', 'Skin Fades',
  'Since 2020', 'Clean Lines', 'Walk-ins Welcome', 'Honest Prices',
]

const SPEED = 0.55 // px per frame, ~33px/s

export default function Marquee() {
  const trackRef = useRef(null)
  const offsetRef = useRef(0)
  const halfWidthRef = useRef(0)
  const dirRef = useRef(1) // 1 = leftward, -1 = rightward
  const draggingRef = useRef(false)
  const pausedRef = useRef(false)
  const lastXRef = useRef(0)
  const velRef = useRef(0)
  const reduceMotion = useReducedMotion()

  const apply = () => {
    if (trackRef.current) trackRef.current.style.transform = `translateX(${offsetRef.current}px)`
  }

  const wrap = () => {
    const half = halfWidthRef.current
    if (!half) return
    if (offsetRef.current <= -half) offsetRef.current += half
    if (offsetRef.current > 0) offsetRef.current -= half
  }

  useEffect(() => {
    if (trackRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2
      offsetRef.current = -halfWidthRef.current
      apply()
    }
  }, [])

  useEffect(() => {
    if (reduceMotion) return
    let frame
    const step = () => {
      if (!draggingRef.current && !pausedRef.current) {
        offsetRef.current -= SPEED * dirRef.current
        wrap()
        apply()
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [reduceMotion])

  function onPointerDown(e) {
    draggingRef.current = true
    lastXRef.current = e.clientX
    velRef.current = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e) {
    if (!draggingRef.current) return
    const dx = e.clientX - lastXRef.current
    lastXRef.current = e.clientX
    velRef.current = dx
    offsetRef.current += dx
    wrap()
    apply()
  }

  function endDrag() {
    if (!draggingRef.current) return
    draggingRef.current = false
    dirRef.current = velRef.current > 0 ? -1 : 1
  }

  const track = [...ITEMS, ...ITEMS]

  return (
    <div
      className={styles.strip}
      aria-hidden="true"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <div className={styles.track} ref={trackRef}>
        {track.map((text, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.word}>{text}</span>
            <span className={styles.dot} />
          </span>
        ))}
      </div>
    </div>
  )
}
