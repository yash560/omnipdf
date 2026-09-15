import { ParsedTableData } from './csv-matrix';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'donut';

export interface ChartConfig {
  type: ChartType;
  xAxisColumn: string;
  yAxisColumn: string;
  title: string;
  colorScheme: 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'violet';
}

export function detectColumnTypes(data: ParsedTableData): {
  categorical: string[];
  numerical: string[];
} {
  const categorical: string[] = [];
  const numerical: string[] = [];

  data.headers.forEach((header) => {
    let numericCount = 0;
    let sampleCount = 0;

    for (let i = 0; i < Math.min(20, data.rows.length); i++) {
      const val = data.rows[i][header];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        sampleCount++;
        const num = Number(val);
        if (!isNaN(num)) numericCount++;
      }
    }

    if (sampleCount > 0 && numericCount / sampleCount >= 0.8) {
      numerical.push(header);
    } else {
      categorical.push(header);
    }
  });

  return { categorical, numerical };
}

const PALETTES: Record<string, string[]> = {
  indigo: ['#6366f1', '#818cf8', '#a5b4fc', '#4f46e5', '#3730a3'],
  emerald: ['#10b981', '#34d399', '#6ee7b7', '#059669', '#065f46'],
  rose: ['#f43f5e', '#fb7185', '#fda4af', '#e11d48', '#9f1239'],
  amber: ['#f59e0b', '#fbbf24', '#fcd34d', '#d97706', '#92400e'],
  cyan: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#155e75'],
  violet: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed', '#5b21b6'],
};

export function renderChartSvg(
  data: ParsedTableData,
  config: ChartConfig,
  width = 650,
  height = 360
): string {
  const colors = PALETTES[config.colorScheme] || PALETTES.indigo;
  const primaryColor = colors[0];

  // Limit to top 15 rows for readable chart presentation
  const chartRows = data.rows.slice(0, 15);
  const labels = chartRows.map((r) => String(r[config.xAxisColumn] || ''));
  const values = chartRows.map((r) => {
    const v = parseFloat(String(r[config.yAxisColumn] || '0').replace(/[^0-9.-]/g, ''));
    return isNaN(v) ? 0 : v;
  });

  const maxVal = Math.max(1, ...values);
  const minVal = Math.min(0, ...values);
  const valRange = maxVal - minVal;

  const padLeft = 60;
  const padRight = 30;
  const padTop = 50;
  const padBottom = 60;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Render Bar Chart
  if (config.type === 'bar') {
    const barWidth = Math.max(12, Math.min(45, (plotW / labels.length) * 0.7));
    const step = plotW / labels.length;

    const bars = values.map((val, idx) => {
      const barH = (val / maxVal) * plotH;
      const x = padLeft + idx * step + (step - barWidth) / 2;
      const y = padTop + (plotH - barH);
      const color = colors[idx % colors.length];

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="6" fill="${color}" opacity="0.9" />
        <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="10" font-weight="bold" fill="#71717a">${val}</text>
        <text x="${x + barWidth / 2}" y="${height - padBottom + 18}" text-anchor="middle" font-size="10" font-weight="600" fill="#71717a" transform="rotate(25, ${x + barWidth / 2}, ${height - padBottom + 18})">${labels[idx].substring(0, 10)}</text>
      `;
    }).join('');

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="transparent" />
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#18181b">${config.title || `${config.yAxisColumn} by ${config.xAxisColumn}`}</text>
        <!-- Grid lines -->
        <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="#e4e4e7" stroke-width="1" />
        <line x1="${padLeft}" y1="${padTop + plotH / 2}" x2="${width - padRight}" y2="${padTop + plotH / 2}" stroke="#f4f4f5" stroke-dasharray="4" />
        ${bars}
      </svg>
    `;
  }

  // Render Line / Area Chart
  if (config.type === 'line' || config.type === 'area') {
    const step = plotW / Math.max(1, labels.length - 1);
    const points = values.map((val, idx) => {
      const x = padLeft + idx * step;
      const y = padTop + (plotH - (val / maxVal) * plotH);
      return { x, y, val, label: labels[idx] };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x},${padTop + plotH} L ${points[0].x},${padTop + plotH} Z`;

    const dots = points.map((p) => `
      <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${primaryColor}" stroke="#ffffff" stroke-width="2" />
      <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="10" font-weight="bold" fill="#71717a">${p.val}</text>
      <text x="${p.x}" y="${height - padBottom + 18}" text-anchor="middle" font-size="10" font-weight="600" fill="#71717a">${p.label.substring(0, 8)}</text>
    `).join('');

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
        <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#18181b">${config.title || `${config.yAxisColumn} by ${config.xAxisColumn}`}</text>
        <line x1="${padLeft}" y1="${padTop + plotH}" x2="${width - padRight}" y2="${padTop + plotH}" stroke="#e4e4e7" stroke-width="1" />
        ${config.type === 'area' ? `<path d="${areaD}" fill="${primaryColor}" opacity="0.2" />` : ''}
        <path d="${pathD}" fill="none" stroke="${primaryColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
        ${dots}
      </svg>
    `;
  }

  // Render Pie / Donut
  const total = Math.max(1, values.reduce((a, b) => a + b, 0));
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = Math.min(plotW, plotH) / 2.2;
  const innerRadius = config.type === 'donut' ? radius * 0.55 : 0;

  let currentAngle = 0;
  const slices = values.map((val, idx) => {
    const sliceAngle = (val / total) * 2 * Math.PI;
    const x1 = cx + radius * Math.cos(currentAngle);
    const y1 = cy + radius * Math.sin(currentAngle);
    const x2 = cx + radius * Math.cos(currentAngle + sliceAngle);
    const y2 = cy + radius * Math.sin(currentAngle + sliceAngle);

    const ix1 = cx + innerRadius * Math.cos(currentAngle + sliceAngle);
    const iy1 = cy + innerRadius * Math.sin(currentAngle + sliceAngle);
    const ix2 = cx + innerRadius * Math.cos(currentAngle);
    const iy2 = cy + innerRadius * Math.sin(currentAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const color = colors[idx % colors.length];

    let d = '';
    if (innerRadius > 0) {
      d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    currentAngle += sliceAngle;
    return `<path d="${d}" fill="${color}" stroke="#ffffff" stroke-width="2" />`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <text x="${width / 2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#18181b">${config.title || `${config.yAxisColumn} Breakdown`}</text>
      ${slices}
    </svg>
  `;
}
