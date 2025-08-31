const selfSizerPlugin = {
    id: 'selfSizer',
    afterRender () { applySizeSoon(); },
    afterUpdate () { applySizeSoon(); },
    resize () { applySizeSoon(); }
};
Chart.register( selfSizerPlugin, ChartDataLabels );

function ellipsize ( str, max = 40 ) {
    if ( !str || str.length <= max ) return str || '';
    return str.slice( 0, max - 1 ) + '…';
}


function renderChart ( agg ) {
    const total = agg.reduce( ( a, x ) => a + x.duration, 0 );
    const rowHeight = 28;
    const topBottomPad = 80;
    const minHeight = 220;
    const desired = Math.max( minHeight, agg.length * rowHeight + topBottomPad );
    const canvas = document.getElementById( 'aw-pie-canvas' );
    canvas.height = desired;

  // work in SECONDS on the scale (labels will show HOURS)
  const valuesSec = agg.map(x => Math.round(x.duration));
  const maxSec = Math.max(0, ...valuesSec);

  // ≤ 3 hours -> 15-minute ticks, otherwise 30-minute ticks
  const STEP_15 = 15 * 60;  // 900 sec
  const STEP_30 = 30 * 60;  // 1800 sec
  const stepSec = (maxSec <= 3 * 3600) ? STEP_15 : STEP_30;

  const roundUpToMultiple = (n, m) => (n % m === 0 ? n : n + (m - (n % m)));
  const suggestedMax = roundUpToMultiple(maxSec, stepSec);

  // format tick labels as hours with .25 / .50 / .75 or .5 increments
  const formatHours = (secs) => {
    const hrs = secs / 3600;
    const decimals = (stepSec === STEP_15) ? 2 : 1; // 0.25 steps vs 0.5 steps
    // avoid "-0.00" etc.
    const str = hrs.toFixed(decimals);
    return (decimals === 2) ? str.replace(/\.?0+$/,'').padEnd(str.includes('.') ? 0 : 0, '') : str;
  };

    const data = {
        labels: agg.map( x => x.label ),
        datasets: [ {
            data: valuesSec,
            backgroundColor: agg.map( x => stringHashToColor(x.label) ),
            borderColor: 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            barcalculatePercentageage: 0.8,
            categorycalculatePercentageage: 0.9
        } ]
    };

    const ctx = canvas.getContext( '2d', { alpha: true } );
    if ( ctx.__chartInstance ) { ctx.__chartInstance.destroy(); ctx.__chartInstance = null; }

    const tickColor = getComputedStyle( document.documentElement ).getPropertyValue( '--legendColor' ) || '#333';
    const enableLegend = false;
    const chart = new Chart( ctx, {
        type: 'bar',
        data,
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 8, right: 12, bottom: 8, left: 8 } },
            scales: {
                x: {
                    type: 'linear',
                    beginAtZero: true,
                    suggestedMax,           // clean top tick (multiple of 15/30)
                    ticks: {
                        color: tickColor,
                        stepSize: stepSec, // force 15- or 30-min increments
                        callback: (v) => formatHours(v) // 0, 0.25, 0.5, 0.75, 1.0 ... or 0, 0.5, 1.0 ...
                        // callback: ( v ) => formatDurationFriendly( v )
                        // callback: (v) => v.toFixed(1) // ensures 0.0, 0.5, 1.0...
                    },
                    grid: { display: true }
                },
                y: { display: false }
            },
            plugins: {
                legend: enableLegend ? {
                    position: 'bottom',
                    labels: { color: tickColor, boxWidth: 10 }
                } : { display: false },
                datalabels: {
                    align: 'right',
                    anchor: 'start',
                    clamp: false,
                    clip: false,
                    color: tickColor,
                    offset: 0,
                    font: { weight: '500', size: 12 },
                    formatter: ( value, ctx ) => {
                        const label = ctx.chart.data.labels[ ctx.dataIndex ] || '';
                        // const pct = calculatePercentage( value, total );
                        return `${ ellipsize( label, 40 ) }`;
                        // return `${ ellipsize( label, 40 ) } - ${ formatDurationFriendly( value ) } (${ pct.toFixed( 1 ) }%)`;
                    },
                    listeners: {
                        // custom position: pin to chartArea.left always
                        beforeDraw: ( ctx ) => {
                            const area = ctx.chart.chartArea;
                            ctx.x = area.left + 4; // 4px padding from left edge
                            return ctx;
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ( ctx ) => `${ formatDurationFriendly( ctx.raw || 0 ) } - ${ ( calculatePercentage( ctx.raw, total ) ).toFixed( 1 ) }%`,
                        title: ( items ) => items[ 0 ]?.label || ''
                    }
                }
            },
            animation: { animateScale: true }
        }
    } );
    ctx.__chartInstance = chart;
    applySizeSoon();
}



function renderVisualization () {
    const aggSorted = aggregateEventsByLabel( eventData );
    const slices = limitEventGroupCountsAddExcessToOther( aggSorted, 18 ); // cap; rest -> Other
    renderChart( slices );
}