// Read-only recap of what was actually entered -- Billing Setup, Solar
// Generation, and KSEB Net Meter Consumption (js/render-print-summary.js).
// The interactive form (#billCalculator) is hidden entirely when printing
// (styles.css), so without this the printed page would show the computed
// bill with no record of which inputs produced it. Pure string builder
// from a `bill` object plus an optional `readingPairs` map, same contract
// as the other render-*.js modules -- only ever shown via the `@media
// print` override on #printInputsSummary, never during normal on-screen
// viewing.
//
// `readingPairs` (built by main.js, since it's the only place that reads
// the DOM) is `{ [fieldId]: { previous, present } }` -- present only for
// fields where "Calculate from Previous & Present meter readings" was
// actually enabled, so a value entered as a plain direct total shows just
// that total, with no fabricated Previous/Present line underneath it.

function u(n) {
    return `${(n || 0).toFixed(2)} Unit`;
}

function readingSubLabel(readingPairs, fieldId) {
    const pair = readingPairs && readingPairs[fieldId];
    if (!pair) return '';
    return `Previous: ${pair.previous.toFixed(2)}, Present: ${pair.present.toFixed(2)}`;
}

function row(label, value, subLabel) {
    const sub = subLabel ? `<br><span style="font-size: 11px; color: var(--text-muted);">${subLabel}</span>` : '';
    return `
        <tr>
            <td style="padding: 6px 10px; border: 1px solid var(--border);">${label}${sub}</td>
            <td style="padding: 6px 10px; border: 1px solid var(--border); text-align: right; white-space: nowrap;">${value}</td>
        </tr>`;
}

function billingSetupRows(bill) {
    const phaseLabel = bill.phase === 'phase1' ? 'Phase 1' : 'Phase 3';
    const meterOwnerLabel = bill.meterOwner === 'kseb' ? 'KSEB' : 'Consumer';
    const billingTypeLabel = bill.billingType === 'tod' ? 'Time of Day (ToD)' : 'Normal';
    const bankedLabel = bill.myBankDepositAtKseb > 0 ? `Yes (${u(bill.myBankDepositAtKseb)})` : 'No';

    let rows = row('Phase', phaseLabel)
        + row('Meter Owner', meterOwnerLabel)
        + row('Billing Type', billingTypeLabel)
        + row('Banked Units?', bankedLabel);
    if (bill.billingType === 'tod') {
        rows += row('Connected Load', bill.connectedLoad === 'below20k' ? 'Below 20kW' : 'Above 20kW');
    }
    return rows;
}

function solarGenerationRows(bill, readingPairs) {
    if (bill.billingType === 'normal') {
        return row('Solar Generation', u(bill.solarGeneration), readingSubLabel(readingPairs, 'solarGeneration'));
    }
    return row('Normal (6am–6pm)', u(bill.solarNormal), readingSubLabel(readingPairs, 'solarNormal'))
        + row('Off Peak (10pm–6am)', u(bill.solarOffPeak), readingSubLabel(readingPairs, 'solarOffPeak'))
        + row('Peak (6pm–10pm)', u(bill.solarPeak), readingSubLabel(readingPairs, 'solarPeak'))
        + row('<strong>Total</strong>', `<strong>${u(bill.solarGeneration)}</strong>`);
}

function netMeterRows(bill, readingPairs) {
    if (bill.billingType === 'normal') {
        return row('Import Total', u(bill.importReading), readingSubLabel(readingPairs, 'import'))
            + row('Export Total', u(bill.exportReading), readingSubLabel(readingPairs, 'export'));
    }
    return row('Import — Normal (6am–6pm)', u(bill.importNormal), readingSubLabel(readingPairs, 'importNormal'))
        + row('Import — Off Peak (10pm–6am)', u(bill.importOffPeak), readingSubLabel(readingPairs, 'importOffPeak'))
        + row('Import — Peak (6pm–10pm)', u(bill.importPeak), readingSubLabel(readingPairs, 'importPeak'))
        + row('<strong>Import Total</strong>', `<strong>${u(bill.importReading)}</strong>`)
        + row('Export — Normal (6am–6pm)', u(bill.exportNormal), readingSubLabel(readingPairs, 'exportNormal'))
        + row('Export — Off Peak (10pm–6am)', u(bill.exportOffPeak), readingSubLabel(readingPairs, 'exportOffPeak'))
        + row('Export — Peak (6pm–10pm)', u(bill.exportPeak), readingSubLabel(readingPairs, 'exportPeak'))
        + row('<strong>Export Total</strong>', `<strong>${u(bill.exportReading)}</strong>`);
}

function section(title, rowsHtml) {
    return `
        <h5 style="margin: 16px 0 8px;">${title}</h5>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 13px;">
            <tbody>${rowsHtml}</tbody>
        </table>`;
}

export function buildPrintInputsSummary(bill, readingPairs) {
    if (!bill || !bill.totalBillAmount) return '';
    return `
        <div class="bill-chart">
            <h4 style="text-align: center;"><u>Entered Values</u></h4>
            ${section('Billing Setup', billingSetupRows(bill))}
            ${section('Solar Generation', solarGenerationRows(bill, readingPairs))}
            ${section('KSEB NetMeter Info', netMeterRows(bill, readingPairs))}
        </div>`;
}
