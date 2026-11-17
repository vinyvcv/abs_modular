import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined'
import Tooltip from '@mui/material/Tooltip'
import { formatMilhar, formatPct } from '../utils/format'

const cardDefinitions = [
  {
    key: 'total',
    title: 'Total Planejado',
    tip: 'Total diário calculado como a soma de colaboradores escalados e previstos para a data.',
    Icon: CalculateOutlinedIcon,
    iconColor: '#002D62',
    iconBg: '#F1F5F9',
    getValue: (kpis) => formatMilhar(Number(kpis?.escalados ?? 0) + Number(kpis?.previstos ?? 0)),
    getBadge: () => ({
      text: 'Escalados + Previstos',
      bg: '#F8FAFC',
      color: '#475569',
      border: '#E2E8F0'
    })
  },
  {
    key: 'escalados',
    title: 'Escalados',
    tip: 'Total de colaboradores planejados/escalados para início de jornada até este momento.',
    Icon: GroupsOutlinedIcon,
    iconColor: '#0B4F9C',
    iconBg: '#EFF6FF',
    getValue: (kpis) => formatMilhar(kpis?.escalados),
    getBadge: () => ({
      text: 'Quadro em escala ativa',
      bg: '#EFF6FF',
      color: '#1D4ED8',
      border: '#DBEAFE'
    })
  },
  {
    key: 'presentes',
    title: 'Presentes',
    tip: 'Colaboradores logados ou em atendimento confirmados no sistema.',
    Icon: CheckCircleOutlinedIcon,
    iconColor: '#10B981',
    iconBg: '#ECFDF5',
    getValue: (kpis) => formatMilhar(kpis?.presentes),
    getBadge: (kpis) => {
      const esc = Number(kpis?.escalados || 0)
      const pres = Number(kpis?.presentes || 0)
      const pct = esc > 0 ? ((pres / esc) * 100).toFixed(1) : 0
      return {
        text: `${pct}% aderência`,
        bg: '#ECFDF5',
        color: '#047857',
        border: '#A7F3D0'
      }
    }
  },
  {
    key: 'faltas',
    title: 'Faltas',
    tip: 'Colaboradores que estavam escalados para o período mas não registraram login.',
    Icon: CancelOutlinedIcon,
    iconColor: '#EF4444',
    iconBg: '#FEF2F2',
    getValue: (kpis) => formatMilhar(kpis?.faltas),
    getBadge: (kpis) => {
      const faltas = Number(kpis?.faltas || 0)
      return {
        text: faltas > 0 ? `${formatMilhar(faltas)} ausências` : 'Sem faltas',
        bg: '#FEF2F2',
        color: '#B91C1C',
        border: '#FECACA'
      }
    }
  },
  {
    key: 'previstos',
    title: 'Previstos',
    tip: 'Colaboradores aguardando o início da janela de trabalho configurada.',
    Icon: AccessTimeOutlinedIcon,
    iconColor: '#D97706',
    iconBg: '#FFFBEB',
    getValue: (kpis) => formatMilhar(kpis?.previstos),
    getBadge: () => ({
      text: 'Janela futura',
      bg: '#FFFBEB',
      color: '#B45309',
      border: '#FDE68A'
    })
  },
  {
    key: 'abs',
    title: 'Absenteísmo',
    tip: 'Percentual de absenteísmo: (Faltas / Escalados) * 100. Meta operacional <= 5.0%.',
    Icon: TrendingDownOutlinedIcon,
    iconColor: '#FF6600',
    iconBg: '#FFF7ED',
    getValue: (kpis) => formatPct(kpis?.abs_pct),
    getBadge: (kpis) => {
      const val = Number(kpis?.abs_pct || 0)
      if (val <= 5.0) {
        return { text: '● Dentro da meta (≤ 5%)', bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' }
      }
      if (val <= 10.0) {
        return { text: '▲ Atenção (5% a 10%)', bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' }
      }
      return { text: '▲ Crítico (> 10%)', bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' }
    }
  }
]

export default function KpiCards({ kpis = {} }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}
    >
      {cardDefinitions.map(({ key, title, tip, Icon, iconColor, iconBg, getValue, getBadge }) => {
        const badge = getBadge(kpis)
        return (
          <div
            key={key}
            className="custom-kpi-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'default'
            }}
          >
            <div className="card-main-content">
              <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <div className="kpi-title" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {title}
                  </span>
                  <Tooltip title={tip} arrow placement="top">
                    <InfoOutlinedIcon
                      sx={{
                        fontSize: 14,
                        color: '#94A3B8',
                        cursor: 'help',
                        transition: 'color 0.2s',
                        '&:hover': { color: '#0B4F9C' }
                      }}
                    />
                  </Tooltip>
                </div>
                <div className="kpi-value">{getValue(kpis)}</div>
              </div>

              <div
                className="kpi-icon-container"
                style={{
                  backgroundColor: iconBg,
                  color: iconColor
                }}
              >
                <Icon sx={{ fontSize: 20 }} />
              </div>
            </div>

            <div style={{ padding: '0 18px 14px 18px' }}>
              <span
                className="kpi-badge"
                style={{
                  backgroundColor: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                  margin: 0
                }}
              >
                {badge.text}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
