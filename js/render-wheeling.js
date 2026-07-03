// HTML builder for the Wheeling Summary result panel (js/render-wheeling.js).
// Pure string builder from a wheeling-calculator.js result object, same
// contract as the other render-*.js modules.

import { WHEELING_RATE_PER_UNIT } from './tariff-rates.js';

function money(n) {
    return `₹${n.toFixed(2)}`;
}

function unit(n) {
    return `${n.toFixed(2)} kWh`;
}

function row(label, value, valueStyle = '') {
    return `
                    <tr>
                        <td style="padding: 4px 0; color: var(--text-secondary);">${label}</td>
                        <td style="padding: 4px 0; text-align: right; ${valueStyle}">${value}</td>
                    </tr>`;
}

function siteBlock(site) {
    const transformerNote = site.sameTransformer ? 'same transformer' : 'different transformer';
    return `
        <div style="border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px;">
            <h6 style="margin: 0 0 8px; font-size: 13.5px; font-weight: 700; color: var(--text-primary);">
                ${site.name} <span style="font-weight: 500; color: var(--bank);">(${site.category})</span>
                <span style="font-weight: 500; color: var(--text-muted); font-size: 12px;">(${site.distLossPct}% distribution loss, ${transformerNote})</span>
            </h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tbody>
                    ${row('Bank available before this site', unit(site.bankOpening))}
                    ${row('Available for wheeling (after loss)', unit(site.availableForWheeling))}
                    ${row('Units wheeled to this site', `<strong>${unit(site.wheelingUnitsAdjusted)}</strong>`)}
                    ${row('Remaining billed consumption at site', `${unit(site.unitsAfterWheeling)} of ${unit(site.totalSiteUnits)}`)}
                    ${row('Bank balance carried to next site', unit(site.bankAfterWheeling))}
                    ${row('Energy lost in transit', unit(site.energyLost), 'color: var(--import);')}
                    ${row('Site energy+duty+surcharge before wheeling', money(site.before.total))}
                    ${row('Site energy+duty+surcharge after wheeling', money(site.after.total))}
                    ${row('<strong>Savings at this site</strong>', `<strong>${money(site.saving)}</strong>`, 'color: var(--export);')}
                </tbody>
            </table>
        </div>`;
}

export function renderWheelingResult(wheelingResult) {
    if (!wheelingResult || !wheelingResult.sites || wheelingResult.sites.length === 0) return '';

    const sitesHtml = wheelingResult.sites.map(siteBlock).join('');

    return `
        <div class="bill-chart">
            <h5><u>Wheeling Summary</u></h5>
            <p style="font-size: 0.85em; color: var(--text-muted); margin: 0 0 12px;">
                Your banked surplus was wheeled to ${wheelingResult.sites.length} site(s) in order, each site's leftover balance (after distribution loss) carrying forward to the next.
            </p>
            ${sitesHtml}
            <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 4px;">
                <tbody>
                    ${row('Total units wheeled', unit(wheelingResult.totalAdjustedUnits))}
                    ${row('Total energy lost in transit', unit(wheelingResult.totalEnergyLost))}
                    ${row('<strong>Total savings at wheeled sites</strong>', `<strong>${money(wheelingResult.totalSaving)}</strong>`, 'color: var(--export);')}
                    <tr>
                        <td style="padding: 6px 0; font-weight: 700; color: var(--text-primary);">
                            Wheeling Charge
                            <br><span style="font-weight: 500; font-size: 11.5px; color: var(--text-muted);">(${unit(wheelingResult.totalAdjustedUnits)} + ${unit(wheelingResult.totalEnergyLost)}) &times; ₹${WHEELING_RATE_PER_UNIT.toFixed(2)}/unit</span>
                        </td>
                        <td style="padding: 6px 0; text-align: right; font-weight: 700; color: var(--text-primary);">${money(wheelingResult.wheelingCharge)}</td>
                    </tr>
                </tbody>
            </table>
        </div>`;
}
