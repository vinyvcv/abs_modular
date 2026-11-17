import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { Box, useMediaQuery } from '@mui/material'
import { UI_CLASSES } from '../theme'

const PairCard = forwardRef(function PairCard(
  { title, action, children, height, scrollBody = false },
  ref
) {
  const locked = typeof height === 'number' && height > 0

  return (
    <section
      ref={ref}
      style={
        locked
          ? {
              height: `${height}px`,
              maxHeight: `${height}px`,
              overflow: 'hidden'
            }
          : undefined
      }
      className={`${UI_CLASSES.cardSurface} w-full min-w-0 flex flex-col`}
    >
      <div className={`${UI_CLASSES.cardHeader} min-h-card-head flex-none`}>
        <h3 className={UI_CLASSES.cardHeaderTitle}>{title}</h3>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div
        className={
          scrollBody && locked
            ? 'flex-1 min-h-0 h-0 overflow-auto'
            : 'flex-none'
        }
      >
        {children}
      </div>
    </section>
  )
})

/**
 * Altura do par = altura natural do painel direito (Situações).
 * Esquerdo (Resumo) iguala e faz scroll interno.
 */
export function MatchShorterPair({
  enabled,
  deps = [],
  leftTitle,
  rightTitle,
  leftAction,
  rightAction,
  left,
  right,
  sx
}) {
  const isDesktop = useMediaQuery('(min-width:900px)', { defaultMatches: true })
  const active = enabled ?? isDesktop
  const rightRef = useRef(null)
  const [pairHeight, setPairHeight] = useState(0)

  useLayoutEffect(() => {
    if (!active) {
      setPairHeight(0)
      return undefined
    }

    const el = rightRef.current
    if (!el) return undefined

    const measure = () => {
      const h = el.offsetHeight || Math.round(el.getBoundingClientRect().height)
      if (h > 0) setPairHeight((prev) => (prev === h ? prev : h))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    const t1 = window.setTimeout(measure, 50)
    const t2 = window.setTimeout(measure, 300)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps])

  if (!active) {
    return (
      <Box className="flex flex-col gap-4 mb-6" sx={sx}>
        <PairCard title={leftTitle} action={leftAction}>{left}</PairCard>
        <PairCard title={rightTitle} action={rightAction}>{right}</PairCard>
      </Box>
    )
  }

  return (
    <Box
      className="grid grid-cols-[minmax(0,2fr)_minmax(240px,1fr)] gap-4 items-start mb-6"
      sx={sx}
    >
      <PairCard title={leftTitle} action={leftAction} height={pairHeight} scrollBody>
        {left}
      </PairCard>
      <PairCard ref={rightRef} title={rightTitle} action={rightAction}>
        {right}
      </PairCard>
    </Box>
  )
}
