import { animate, useInView, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 1,
  ease = 'easeOut',
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const isInView = useInView(ref, { once: true, margin: '0px' })

  const formatValue = useCallback(
    (latest) => {
      const options = { useGrouping: !!separator, maximumFractionDigits: 0 }
      const formatted = Intl.NumberFormat('en-US', options).format(Math.round(latest))
      return separator ? formatted.replace(/,/g, separator) : formatted
    },
    [separator]
  )

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(direction === 'down' ? to : from)
  }, [from, to, direction, formatValue])

  useEffect(() => {
    if (!isInView || !startWhen) return

    const startValue = direction === 'down' ? to : from
    const endValue = direction === 'down' ? from : to

    // Respect reduced-motion: land on the final value with no count animation
    if (reduceMotion) {
      if (ref.current) ref.current.textContent = formatValue(endValue)
      onStart?.()
      onEnd?.()
      return
    }

    onStart?.()
    // A real tween (not a spring) so the total run time is exact, not approximate
    const controls = animate(startValue, endValue, {
      duration,
      delay,
      ease,
      onUpdate: (latest) => {
        if (ref.current) ref.current.textContent = formatValue(latest)
      },
      onComplete: () => onEnd?.(),
    })

    return () => controls.stop()
  }, [isInView, startWhen, reduceMotion, direction, from, to, delay, duration, ease, onStart, onEnd, formatValue])

  return <span className={className} ref={ref} />
}
