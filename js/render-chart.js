// Dependency-free inline-SVG charts for the bill result panel
// (js/render-chart.js). Pure string builders, same contract as
// render-tables.js / render-results.js -- no DOM access here.
//
// Palette is the validated categorical set from the dataviz skill
// (references/palette.md), checked with scripts/validate_palette.py
// against this page's white (#ffffff) card surface: all 5- and 3-slot
// selections below pass CVD separation; aqua/yellow fall under the 3:1
// contrast "relief" threshold, so every segment also carries a visible
// text label in the legend (never color-alone).
const COLOR = {
    blue: '#2a78d6',
    aqua: '#1baf7a',
    yellow: '#eda100',
    green: '#008300',
    violet: '#4a3aa7',
    red: '#e34948',
};

const TEXT_SECONDARY = 'var(--text-secondary)';
const TEXT_MUTED = 'var(--text-muted)';

function money(n) {
    return `₹${n.toFixed(2)}`;
}

function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

const CHART_STYLE = `
    <style>
        .bill-chart { margin: 16px 0; }
        .bill-chart h5 { margin-bottom: 10px; }
        .bd-bar { width: 100%; height: 32px; display: block; }
        .bd-segment rect { transition: filter 0.15s ease; cursor: default; }
        .bd-segment:hover rect, .bd-segment:focus rect { filter: brightness(1.12); }
        .bd-segment:focus { outline: none; }
        .bd-segment:focus rect { stroke: var(--text-primary); stroke-width: 1.5; }
        .bd-legend { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 12px; font-size: 13px; }
        .bd-legend-item { display: flex; align-items: center; gap: 6px; color: ${TEXT_SECONDARY}; }
        .bd-swatch { width: 10px; height: 10px; border-radius: 2px; flex: none; }
        .bd-legend-value { color: var(--text-primary); font-weight: 600; margin-left: 2px; }
        .bd-legend-pct { color: ${TEXT_MUTED}; }
        .tod-bars { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .tod-bar-row { display: grid; grid-template-columns: 130px 1fr auto; align-items: center; gap: 10px; font-size: 13px; }
        .tod-bar-label { color: ${TEXT_SECONDARY}; }
        .tod-bar-track { background: var(--surface-muted); border-radius: 4px; height: 20px; overflow: hidden; }
        .tod-bar-fill { display: block; height: 100%; border-radius: 4px; min-width: 2px; }
        .tod-bar-value { color: var(--text-primary); font-weight: 600; text-align: right; white-space: nowrap; }
        @media (max-width: 600px) {
            .tod-bar-row { grid-template-columns: 90px 1fr auto; font-size: 12px; }
        }
    </style>`;

// Fixed slot order -- never reassigned by value/rank, per the categorical
// color rule (color follows the entity, not where it currently ranks).
const BILL_SEGMENTS = [
    { key: 'energyCharge', label: 'Energy Charge', color: COLOR.blue },
    { key: 'fixedCharge', label: 'Fixed Charge', color: COLOR.aqua },
    { key: 'duty', label: 'Duty', color: COLOR.yellow },
    { key: 'meterRent', label: 'Meter Rent', color: COLOR.green },
    { key: 'monthlyFuelSurcharge', label: 'Fuel Surcharge', color: COLOR.violet },
];

// Part-to-whole with long category names -> horizontal stacked bar
// (single stack, since there's only one total per calculation).
export function renderBillBreakdownChart(bill) {
    const total = bill.totalBillAmount;
    if (!total || total <= 0) return '';

    const segments = BILL_SEGMENTS
        .map((s) => ({ ...s, value: bill[s.key] || 0 }))
        .filter((s) => s.value > 0);
    if (segments.length === 0) return '';

    const barWidth = 600;
    const barHeight = 32;
    const gap = 2;
    const usableWidth = barWidth - gap * (segments.length - 1);

    let x = 0;
    const rects = segments.map((s) => {
        const w = Math.max(1, (s.value / total) * usableWidth);
        const pct = (s.value / total) * 100;
        const showInlineLabel = w > 55;
        const html = `
              <g class="bd-segment" tabindex="0" role="img" aria-label="${escapeAttr(s.label)}: ${escapeAttr(money(s.value))}, ${pct.toFixed(1)} percent of total">
                <title>${escapeAttr(s.label)}: ${escapeAttr(money(s.value))} (${pct.toFixed(1)}%)</title>
                <rect x="${x.toFixed(2)}" y="0" width="${w.toFixed(2)}" height="${barHeight}" fill="${s.color}"></rect>
                ${showInlineLabel ? `<text x="${(x + w / 2).toFixed(2)}" y="${barHeight / 2}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="12" font-weight="600">${pct.toFixed(0)}%</text>` : ''}
              </g>`;
        x += w + gap;
        return html;
    }).join('');

    const legend = segments.map((s) => `
            <div class="bd-legend-item">
                <span class="bd-swatch" style="background:${s.color}"></span>
                <span>${s.label}</span>
                <span class="bd-legend-value">${money(s.value)}</span>
                <span class="bd-legend-pct">(${((s.value / total) * 100).toFixed(1)}%)</span>
            </div>`).join('');

    return `
        <div class="bill-chart">
            <h5><u>Bill Breakdown</u></h5>
            <svg class="bd-bar" viewBox="0 0 ${barWidth} ${barHeight}" preserveAspectRatio="none" role="group" aria-label="Bill breakdown, total ${escapeAttr(money(total))}">
                <defs>
                    <clipPath id="bd-clip-${Math.round(total * 100)}">
                        <rect x="0" y="0" width="${barWidth}" height="${barHeight}" rx="4" ry="4"></rect>
                    </clipPath>
                </defs>
                <g clip-path="url(#bd-clip-${Math.round(total * 100)})">
                    ${rects}
                </g>
            </svg>
            <div class="bd-legend">${legend}</div>
        </div>
        ${CHART_STYLE}`;
}

// Compare-magnitude across 3 distinct series -> horizontal bars, one row
// each, scaled to the largest of the three so the priciest zone is always
// full-width and the other two read relative to it.
function todBarRow(label, units, charge, color, maxCharge) {
    const widthPct = maxCharge > 0 ? Math.max(2, (charge / maxCharge) * 100) : 2;
    return `
            <div class="tod-bar-row" role="img" aria-label="${escapeAttr(label)}: ${units.toFixed(2)} units, ${escapeAttr(money(charge))}">
                <span class="tod-bar-label">${label}</span>
                <span class="tod-bar-track"><span class="tod-bar-fill" style="width:${widthPct.toFixed(1)}%;background:${color}"></span></span>
                <span class="tod-bar-value">${money(charge)}</span>
            </div>`;
}

export function renderTodComparisonChart(bill) {
    const above20kW = bill.todBillingAbove20kW > 0;
    const normalCharge = bill.NormalConsumptionAdjusted_energy_charge || 0;
    const peakCharge = (above20kW ? bill.PeakConsumptionAdjusted_energy_charge : bill.PeakConsumptionAdjusted_energy_charge_Below20kW) || 0;
    const offPeakCharge = (above20kW ? bill.OffPeakConsumptionAdjusted_energy_charge : bill.OffPeakConsumptionAdjusted_energy_charge_Below20kW) || 0;
    const normalUnits = bill.Normal_NoOfUnitsFor_energy_calculation || 0;
    const peakUnits = (above20kW ? bill.Peak_NoOfUnitsFor_energy_calculation : bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;
    const offPeakUnits = (above20kW ? bill.OffPeak_NoOfUnitsFor_energy_calculation : bill.OffPeak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;

    if (normalCharge === 0 && peakCharge === 0 && offPeakCharge === 0) return '';

    const maxCharge = Math.max(normalCharge, peakCharge, offPeakCharge);

    const rows = [
        todBarRow('Normal (T1)', normalUnits, normalCharge, COLOR.blue, maxCharge),
        todBarRow('Peak (T2)', peakUnits, peakCharge, COLOR.red, maxCharge),
        todBarRow('Off-Peak (T3)', offPeakUnits, offPeakCharge, COLOR.aqua, maxCharge),
    ].join('');

    return `
        <div class="bill-chart">
            <h5><u>Energy Charge by TimeZone</u></h5>
            <div class="tod-bars">${rows}</div>
            <p style="font-size: 0.85em; color: ${TEXT_MUTED};">Peak (6pm–10pm) is billed at 125% of the base rate — the bar most worth shrinking.</p>
        </div>
        ${CHART_STYLE}`;
}
