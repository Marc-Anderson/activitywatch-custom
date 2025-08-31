// keep your existing plugin + helpers
const selfSizerPlugin = {
  id: 'selfSizer',
  afterRender () { applySizeSoon(); },
  afterUpdate () { applySizeSoon(); },
  resize () { applySizeSoon(); }
};
Chart.register(selfSizerPlugin, ChartDataLabels);

function ellipsize ( str, max = 40 ) {
    if ( !str || str.length <= max ) return str || '';
    return str.slice( 0, max - 1 ) + '…';
}

function formatLabelTwoLines(firstLine, secondLine) {
    const charWidthOffset = 0;
    const length = firstLine.length;
    const pad = ((length - secondLine.length) / 2) + charWidthOffset;
    const bottom = ' '.repeat(pad) + secondLine;
    return `${firstLine}\n${bottom}`;
}

// pick white/black for readability on the slice color
function yyyToRgb (hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [0,0,0];
  return [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)];
}

function contrastOn(bgHex, light='#fff', dark='#111') {
  const [r,g,b] = yyyToRgb(bgHex);
  // WCAG-ish luminance
  const lum = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
  return lum > 0.6 ? dark : light;
}

/**
 * Pie chart with in-slice labels when >= threshold %
 * @param {Array<{label:string,duration:number}>} agg
 * @param {Object} opts
 * @param {number|'auto'} [opts.thresholdPct=6] minimum % to show label (in-slice). 'auto' tries to show ~6-8 labels.
 * @param {boolean} [opts.doughnut=false] use doughnut instead of pie
 * @param {number} [opts.cutout=55] doughnut hole size (percent) if doughnut=true
 */
function renderChart(agg, opts = {}) {
  const {
    thresholdPct = 6,
    doughnut = false,
    cutout = 55
  } = opts;

  const canvas = document.getElementById('aw-pie-canvas');

  // make sure we’ve got a reasonable canvas height for small screens
  const minSide = 260;
  const rect = canvas.getBoundingClientRect?.() || { width: minSide, height: minSide };
  const side = Math.max(minSide, Math.min(rect.width, 700));
  canvas.width = side;
  canvas.height = side;

  // values in SECONDS (you already use seconds elsewhere)
  const valuesSec = agg.map(x => Math.round(x.duration || 0));
  const total = valuesSec.reduce((a,b) => a + b, 0);

  const labels = agg.map(x => x.label);
  const colors = agg.map(x => stringHashToColor(x.label)); // your existing color fn

  // if 'auto', aim to show about 6–8 labels depending on slice sizes
  let threshold = thresholdPct;
  if (threshold === 'auto') {
    // heuristics: larger of 100/(n+4) and 3% (never too tiny),
    // then clamp to at most 12% to avoid showing too few
    const n = valuesSec.length || 1;
    threshold = Math.min(12, Math.max(3, 100 / (n + 4)));
  }

  const data = {
    labels,
    datasets: [{
      data: valuesSec,
      backgroundColor: colors,
      borderColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1
    }]
  };

  const ctx = canvas.getContext('2d', { alpha: true });
  if (ctx.__chartInstance) { ctx.__chartInstance.destroy(); ctx.__chartInstance = null; }

  const tickColor = getComputedStyle(document.documentElement).getPropertyValue('--legendColor') || '#333';
  const chart = new Chart(ctx, {
    type: doughnut ? 'doughnut' : 'pie',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 8 },
      cutout: doughnut ? `${cutout}%` : undefined,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => {
              const v = item.raw || 0;
              const pct = calculatePercentage(v, total).toFixed(1);
              return `${formatDurationFriendly(v)} - ${pct}%`;
            }
          }
        },
        datalabels: {
          // centered, inside the slice
        //   align: 'center',
        //   anchor: 'center',
        //   anchor: 'end',
            anchor: 'end',   // stay relative to slice center
            align: 'start',       // move outward along radius
            offset: 20,         // pixels outward (tune this number)
          clamp: true,
          clip: false,
          // pick readable color per-slice
          color: (ctx) => {
            const bg = colors[ctx.dataIndex] || '#666';
            return contrastOn(bg);
          },
          font: (ctx) => {
            // slightly bolder for larger slices
            const v = ctx.chart.data.datasets[0].data[ctx.dataIndex] || 0;
            const pct = calculatePercentage(v, total);
            const size = pct >= (threshold + 8) ? 14 : 12;
            return { weight: '600', size };
          },
          formatter: (value, ctx) => {
            const pct = calculatePercentage(value, total);
            if (pct < threshold) return ''; // hide if below threshold
            const label = ctx.chart.data.labels[ctx.dataIndex] || '';
            const labelText = label.split( " > " ).pop();
            // show "Label" on first line, and "X%" on second line
            return formatLabelTwoLines(ellipsize(labelText, 24), `${pct.toFixed(1)}%`);
            // return `${ellipsize(labelText, 24)}\n${pct.toFixed(1)}%`;
          }
        }
      },
      animation: { animateRotate: true, animateScale: true }
    }
  });

  ctx.__chartInstance = chart;
  applySizeSoon();
}

// hook it up to your existing pipeline
function renderVisualization () {
  const aggSorted = aggregateEventsByLabel(eventData);
  const slices = limitEventGroupCountsAddExcessToOther(aggSorted, 18); // cap; rest -> Other

  // EXAMPLE 1: fixed threshold (6%)
  renderChart(slices, { thresholdPct: 6, doughnut: false });

  // EXAMPLE 2: auto threshold + doughnut
  // renderChart(slices, { thresholdPct: 'auto', doughnut: true, cutout: 55 });
}
