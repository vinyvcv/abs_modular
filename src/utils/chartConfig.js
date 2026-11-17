export const HAPVIDA_PALETTE = {
  blueNavy: '#002D62',
  bluePrimary: '#0B4F9C',
  orange: '#FF6600',
  greenEmerald: '#10B981',
  redCoral: '#EF4444',
  amber: '#F59E0B',
  cyan: '#06B6D4',
  purple: '#8B5CF6',
  slate900: '#0F172A',
  slate700: '#334155',
  slate500: '#64748B',
  slate400: '#94A3B8',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  white: '#FFFFFF'
}

/**
 * Cria um tooltip HTML corporativo Hapvida para ApexCharts
 */
export function buildCustomTooltip({ headerTitle, items = [] }) {
  const itemsHtml = items
    .map(
      (item) => `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 6px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="width: 9px; height: 9px; border-radius: 50%; background-color: ${item.color}; display: inline-block;"></span>
        <span style="font-size: 12px; color: #475569; font-weight: 500;">${item.label}</span>
      </div>
      <span style="font-size: 12px; font-weight: 700; color: #0f172a; font-family: 'Outfit', sans-serif;">
        ${item.value}
      </span>
    </div>
  `
    )
    .join('')

  return `
    <div style="
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      padding: 10px 14px;
      min-width: 170px;
      font-family: 'Inter', sans-serif;
    ">
      <div style="
        font-size: 12px;
        font-weight: 700;
        color: #002D62;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 6px;
        font-family: 'Outfit', sans-serif;
      ">
        ${headerTitle}
      </div>
      ${itemsHtml}
    </div>
  `
}

/**
 * Opções padrão compartilhadas para gráficos ApexCharts do Painel Hapvida
 */
export const baseChartOptions = {
  chart: {
    fontFamily: 'Inter, Outfit, sans-serif',
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 600,
      dynamicAnimation: {
        enabled: true,
        speed: 350
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
    borderColor: '#f1f5f9',
    strokeDashArray: 4,
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
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    labels: {
      colors: '#475569'
    },
    markers: {
      radius: 4,
      width: 10,
      height: 10
    },
    itemMargin: {
      horizontal: 12,
      vertical: 6
    }
  }
}
