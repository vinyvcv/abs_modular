import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { Box, Card, CardContent, Typography, useMediaQuery } from '@mui/material'

/**
 * Card do par. Quando `height` é setado, o corpo rola por dentro
 * (mesmo truque do Quasar: column + col scroll).
 */
const PairCard = forwardRef(function PairCard(
  { title, children, height, scrollBody = false },
  ref
) {
  const locked = typeof height === 'number' && height > 0

  return (
    <Card
      ref={ref}
      variant="outlined"
      style={
        locked
          ? {
              height: `${height}px`,
              maxHeight: `${height}px`,
              overflow: 'hidden'
            }
          : undefined
      }
      sx={{
        mb: 0,
        width: '100%',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          px: 2,
          py: 0.75,
          flex: '0 0 auto'
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      <CardContent
        sx={{
          p: 0,
          '&:last-child': { pb: 0 },
          ...(scrollBody && locked
            ? {
                // flex-basis 0 + height 0: obriga o corpo a caber no card
                flex: '1 1 0%',
                minHeight: 0,
                height: 0,
                overflow: 'auto'
              }
            : { flex: '0 0 auto' })
        }}
      >
        {children}
      </CardContent>
    </Card>
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
  left,
  right,
  sx
}) {
  // Quasar usava 1024; manter lado a lado um pouco antes
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
      // offsetHeight ignora transform/zoom de getBoundingClientRect
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3, ...sx }}>
        <PairCard title={leftTitle}>{left}</PairCard>
        <PairCard title={rightTitle}>{right}</PairCard>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)',
        gap: 2,
        alignItems: 'start',
        mb: 3,
        ...sx
      }}
    >
      <PairCard title={leftTitle} height={pairHeight} scrollBody>
        {left}
      </PairCard>
      <PairCard ref={rightRef} title={rightTitle}>
        {right}
      </PairCard>
    </Box>
  )
}
