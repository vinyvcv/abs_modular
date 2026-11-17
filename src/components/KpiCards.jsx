import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined'
import { formatMilhar, formatPct } from '../utils/format'
import { MetricCard, MetricGrid } from './ui/MetricCard'

const cardDefinitions = [
  {
    key: 'total',
    variant: 'simple',
    title: 'Total Planejado',
    tip: 'Total diário calculado como a soma de colaboradores escalados e previstos para a data.',
    Icon: CalculateOutlinedIcon,
    tone: 'navy',
    getProps: (kpis) => ({
      value: formatMilhar(Number(kpis?.escalados ?? 0) + Number(kpis?.previstos ?? 0)),
      metaText: 'Escalados + Previstos',
      metaClass: 'text-slate-600'
    })
  },
  {
    key: 'escalados',
    variant: 'simple',
    title: 'Escalados',
    tip: 'Total de colaboradores planejados/escalados para início de jornada até este momento.',
    Icon: GroupsOutlinedIcon,
    tone: 'blue',
    getProps: (kpis) => ({
      value: formatMilhar(kpis?.escalados),
      metaText: 'Quadro em escala ativa',
      metaClass: 'text-blue-800'
    })
  },
  {
    key: 'presentes',
    variant: 'progress',
    title: 'Presentes',
    tip: 'Colaboradores logados ou em atendimento confirmados no sistema.',
    Icon: CheckCircleOutlinedIcon,
    tone: 'green',
    getProps: (kpis) => {
      const esc = Number(kpis?.escalados || 0)
      const pres = Number(kpis?.presentes || 0)
      const pct = esc > 0 ? Math.min(100, Math.max(0, (pres / esc) * 100)) : 0
      return {
        value: formatMilhar(kpis?.presentes),
        progress: esc > 0 ? { pct, barClass: 'bg-emerald-500' } : null,
        metaText: `${pct.toFixed(1)}% de aderência ao escalado`,
        metaClass: 'text-emerald-800'
      }
    }
  },
  {
    key: 'faltas',
    variant: 'progress',
    title: 'Faltas',
    tip: 'Colaboradores que estavam escalados para o período mas não registraram login.',
    Icon: CancelOutlinedIcon,
    tone: 'red',
    getProps: (kpis) => {
      const esc = Number(kpis?.escalados || 0)
      const faltas = Number(kpis?.faltas || 0)
      const pct = esc > 0 && faltas > 0 ? Math.min(100, Math.max(4, (faltas / esc) * 100)) : 0
      return {
        value: formatMilhar(kpis?.faltas),
        progress: esc > 0 && faltas > 0 ? { pct, barClass: 'bg-red-500' } : null,
        metaText: faltas > 0 ? `${formatMilhar(faltas)} ausências registradas` : 'Nenhuma ausência registrada',
        metaClass: faltas > 0 ? 'text-red-800' : 'text-slate-600'
      }
    }
  },
  {
    key: 'previstos',
    variant: 'simple',
    title: 'Previstos',
    tip: 'Colaboradores aguardando o início da janela de trabalho configurada.',
    Icon: AccessTimeOutlinedIcon,
    tone: 'orange',
    getProps: (kpis) => ({
      value: formatMilhar(kpis?.previstos),
      metaText: 'Em janela futura de entrada',
      metaClass: 'text-amber-800'
    })
  },
  {
    key: 'abs',
    variant: 'trend',
    title: 'Absenteísmo',
    tip: 'Percentual de absenteísmo: (Faltas / Escalados) × 100. Meta operacional ≤ 5,0%.',
    Icon: TrendingDownOutlinedIcon,
    tone: 'brandOrange',
    featured: true,
    getProps: (kpis) => {
      const val = Number(kpis?.abs_pct || 0)
      const diff = val - 5.0
      const delta = `${diff > 0 ? '+' : ''}${diff.toFixed(1)} p.p.`

      if (val <= 5.0) {
        return {
          value: formatPct(kpis?.abs_pct),
          trend: {
            direction: 'down',
            tone: 'good',
            delta,
            label: 'Dentro da meta (≤ 5,0%)',
            Icon: CheckCircleOutlinedIcon
          }
        }
      }
      if (val <= 10.0) {
        return {
          value: formatPct(kpis?.abs_pct),
          trend: {
            direction: 'up',
            tone: 'warning',
            delta,
            label: 'Atenção operacional (5%–10%)',
            Icon: WarningAmberOutlinedIcon
          }
        }
      }
      return {
        value: formatPct(kpis?.abs_pct),
        alert: true,
        trend: {
          direction: 'up',
          tone: 'bad',
          delta,
          label: 'Crítico (acima de 10%)',
          Icon: ErrorOutlineOutlinedIcon
        }
      }
    }
  }
]

export default function KpiCards({ kpis = {}, loading = false }) {
  const hasAnyValue =
    Number(kpis?.escalados || 0) > 0 ||
    Number(kpis?.presentes || 0) > 0 ||
    Number(kpis?.previstos || 0) > 0
  const showSkeleton = loading && !hasAnyValue

  return (
    <MetricGrid>
      {cardDefinitions.map(({ key, variant, title, tip, Icon, tone, featured, getProps }) => {
        const computed = getProps(kpis)
        return (
          <MetricCard
            key={key}
            variant={variant}
            title={title}
            tip={tip}
            Icon={Icon}
            tone={tone}
            featured={featured}
            loading={showSkeleton}
            {...computed}
          />
        )
      })}
    </MetricGrid>
  )
}
