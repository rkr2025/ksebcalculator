// Read-only recap of what was actually entered -- Billing Setup, Solar
// Generation, and KSEB Net Meter Consumption (js/render-print-summary.js).
// The interactive form (#billCalculator) is hidden entirely when printing
// (styles.css), so without this the printed page would show the computed
// bill with no record of which inputs produced it. Pure string builder
// from a `bill` object, same contract as the other render-*.js modules --
// only ever shown via the `@media print` override on #printInputsSummary,
// never during normal on-screen viewing.

function u(n) {
    return `${(n || 0).toFixed(2)} Unit`;
}

function row(label, value) {
    return `
        <tr>
            <td style="padding: 6px 10px; border: 1px solid var(--border);">${label}</td>
            <td style="padding: 6px 10px; border: 1px solid var(--border); text-align: right;">${value}</td>
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

function solarGenerationRows(bill) {
    if (bill.billingType === 'normal') {
        return row('Solar Generation', u(bill.solarGeneration));
    }
    return row('Normal (6am–6pm)', u(bill.solarNormal))
        + row('Off Peak (10pm–6am)', u(bill.solarOffPeak))
        + row('Peak (6pm–10pm)', u(bill.solarPeak))
        + row('<strong>Total</strong>', `<strong>${u(bill.solarGeneration)}</strong>`);
}

function netMeterRows(bill) {
    if (bill.billingType === 'normal') {
        return row('Import Total', u(bill.importReading)) + row('Export Total', u(bill.exportReading));
    }
    return row('Import — Normal (6am–6pm)', u(bill.importNormal))
        + row('Import — Off Peak (10pm–6am)', u(bill.importOffPeak))
        + row('Import — Peak (6pm–10pm)', u(bill.importPeak))
        + row('<strong>Import Total</strong>', `<strong>${u(bill.importReading)}</strong>`)
        + row('Export — Normal (6am–6pm)', u(bill.exportNormal))
        + row('Export — Off Peak (10pm–6am)', u(bill.exportOffPeak))
        + row('Export — Peak (6pm–10pm)', u(bill.exportPeak))
        + row('<strong>Export Total</strong>', `<strong>${u(bill.exportReading)}</strong>`);
}

function section(title, rowsHtml) {
    return `
        <h5 style="margin: 16px 0 8px;">${title}</h5>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 13px;">
            <tbody>${rowsHtml}</tbody>
        </table>`;
}

export function buildPrintInputsSummary(bill) {
    if (!bill || !bill.totalBillAmount) return '';
    return `
        <div class="bill-chart">
            <h4 style="text-align: center;"><u>Entered Values</u></h4>
            ${section('Billing Setup', billingSetupRows(bill))}
            ${section('Solar Generation', solarGenerationRows(bill))}
            ${section('KSEB Net Meter Consumption', netMeterRows(bill))}
        </div>`;
}
