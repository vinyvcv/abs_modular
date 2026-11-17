import { COLORS, RADII, SHADOWS, TYPOGRAPHY } from '../theme'

export const HAPVIDA_PALETTE = {
  blueNavy: COLORS.brand.navy,
  bluePrimary: COLORS.brand.blue,
  orange: COLORS.brand.orange,
  greenEmerald: COLORS.semantic.successEmerald,
  redCoral: COLORS.semantic.redCoral,
  amber: COLORS.semantic.amber,
  cyan: COLORS.semantic.cyan,
  purple: COLORS.semantic.purple,
  slate900: COLORS.text.primary,
  slate700: COLORS.text.secondary,
  slate500: COLORS.text.subtle,
  slate400: COLORS.text.placeholder,
  slate200: COLORS.border.hairline,
  slate100: COLORS.surface.subtle,
  white: COLORS.surface.card
}

/**
 * Tooltip HTML corporativo Hapvida para ApexCharts com fonte tabular e contraste AA
 */
export function buildCustomTooltip({ headerTitle, items = [] }) {
  const itemsHtml = items
    .map(
      (item) => `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${item.color}; display: inline-block; flex-shrink: 0;"></span>
        <span style="font-size: 12px; color: ${COLORS.text.muted}; font-weight: 500;">${item.label}</span>
      </div>
      <span style="font-size: 12px; font-weight: 700; color: ${COLORS.text.primary}; font-family: ${TYPOGRAPHY.fonts.mono}; font-variant-numeric: tabular-nums; text-align: right;">
        ${item.value}
      </span>
    </div>
  `
    )
    .join('')

  return `
    <div style="
      background: ${COLORS.surface.card};
      border: 1px solid ${COLORS.border.hairline};
      border-radius: ${RADII.control}px;
      box-shadow: ${SHADOWS.popover};
      padding: 10px 14px;
      min-width: 192px;
      font-family: ${TYPOGRAPHY.fonts.sans};
    ">
      <div style="
        font-size: 12px;
        font-weight: 700;
        color: ${COLORS.brand.navy};
        border-bottom: 1px solid ${COLORS.surface.subtle};
        padding-bottom: 6px;
        font-family: ${TYPOGRAPHY.fonts.display};
      ">
        ${headerTitle}
      </div>
      ${itemsHtml}
    </div>
  `
}

/**
 * Linha de referência da meta operacional de ABS (padrão <= 5,0%) para eixos secundários (%)
 */
export function buildAbsTargetAnnotation(target = 5, yAxisIndex = 1) {
  return {
    yaxis: [
      {
        y: target,
        yAxisIndex,
        borderColor: COLORS.brand.orange,
        strokeDashArray: 4,
        borderWidth: 1.5,
        opacity: 0.75,
        label: {
          borderColor: COLORS.brand.orange,
          borderWidth: 1,
          borderRadius: 4,
          offsetY: -4,
          style: {
            color: COLORS.brand.orange,
            background: COLORS.surface.card,
            fontSize: '10px',
            fontWeight: 700,
            fontFamily: TYPOGRAPHY.fonts.mono,
            padding: { left: 6, right: 6, top: 2, bottom: 2 }
          },
          text: `Meta ≤ ${String(target).replace('.', ',')}%`
        }
      }
    ]
  }
}

/**
 * Realça visualmente a categoria selecionada em gráficos clicáveis, atenuando as demais
 */
export function getInteractiveBarColor(baseColor, categories, selectedCategory, dataPointIndex) {
  if (!selectedCategory || !Array.isArray(categories)) return baseColor
  const cat = String(categories[dataPointIndex] ?? '').trim().toLowerCase()
  const sel = String(selectedCategory).trim().toLowerCase()
  if (cat === sel) return baseColor
  return `${baseColor}38`
}

/**
 * Opções padrão compartilhadas para gráficos ApexCharts do Painel Hapvida
 */
export const baseChartOptions = {
  chart: {
    fontFamily: TYPOGRAPHY.fonts.sans,
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 380,
      dynamicAnimation: {
        enabled: true,
        speed: 250
      }
    },
    toolbar: {
      show: true,
      tools: {
        download: true,
        selection: false,
        zoom: false,
        zoomin: false,
        zoomout: false,
        pan: false,
        reset: false
      }
    }
  },
  grid: {
    borderColor: COLORS.surface.subtle,
    strokeDashArray: 4,
    padding: { left: 8, right: 8 },
    xaxis: {
      lines: {
        show: false
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      borderRadiusApplication: 'end'
    }
  },
  states: {
    hover: {
      filter: { type: 'darken', value: 0.92 }
    },
    active: {
      filter: { type: 'none' }
    }
  },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    fontSize: '12px',
    fontFamily: TYPOGRAPHY.fonts.sans,
    fontWeight: 600,
    labels: {
      colors: COLORS.text.muted
    },
    markers: {
      radius: 3,
      width: 10,
      height: 10
    },
    itemMargin: {
      horizontal: 14,
      vertical: 6
    }
  }
}

export const chartDataLabelStyle = {
  fontSize: '11px',
  fontFamily: TYPOGRAPHY.fonts.mono,
  fontWeight: 700,
  colors: [COLORS.text.primary]
}

export const chartDataLabelBg = {
  enabled: true,
  foreColor: COLORS.surface.card,
  borderRadius: 4,
  padding: 4,
  opacity: 0.94,
  borderColor: COLORS.brand.orange
}
