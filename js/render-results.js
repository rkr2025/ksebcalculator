// Builds the HTML strings for every result panel (js/render-results.js).
// Pure string-building from a `bill` object (the return value of
// calculator.js's computeBill) -- no DOM access, so main.js is the only
// place that touches document.getElementById/innerHTML.

import {
    getHeaderMessage,
    getExportNormalAdjustmentMessage,
    getExportNormalAdjustmentMessageBelow20kW,
    getExportPeakAdjustmentMessage,
    getExportPeakAdjustmentMessageBelow20kW,
    getExportOffPeakAdjustmentMessage,
    getExportOffPeakAdjustmentMessageBelow20kW,
    getEnergyCaluculationMessage,
    renderTelescopicBreakdown,
} from './render-tables.js';
import { renderBillBreakdownChart, renderTodComparisonChart } from './render-chart.js';
import { renderBillAnalysis } from './render-insights.js';
import { renderWheelingResult } from './render-wheeling.js';
import { FUEL_SURCHARGE_PER_UNIT } from './tariff-rates.js';

const FUEL_SURCHARGE_PAISE_LABEL = `${Math.round(FUEL_SURCHARGE_PER_UNIT * 100)}ps`;

const SOLAR_DIARY_PROMO_HTML = `
                    <p style="font-size: 16px; color: var(--text-secondary); line-height: 1.8; margin: 15px 0 0; background: var(--surface-muted); padding: 10px; border-radius: 5px; font-weight: bold; animation: glow 1.5s ease-in-out infinite alternate;">
                        <span style="font-size: 18px; color: #e74c3c;">🌞 New Release:</span> New <a href="solar-diary.html" style="color: #2ecc71; font-style: italic; text-decoration: none; font-weight: bold; position: relative; transition: color 0.3s ease;" class="solar-diary-link">Solar Diary</a> app released! Try it out and track your energy usage.
                    </p>
                    <style>
                        @keyframes glow {
                            0% { box-shadow: 0 0 5px rgba(46, 204, 113, 0.3); }
                            100% { box-shadow: 0 0 15px rgba(46, 204, 113, 0.7); }
                        }
                        .solar-diary-link::after {
                            content: '';
                            position: absolute;
                            width: 0;
                            height: 2px;
                            bottom: -2px;
                            left: 0;
                            background-color: #27ae60;
                            transition: width 0.3s ease;
                        }
                        .solar-diary-link:hover::after {
                            width: 100%;
                        }
                        .solar-diary-link:hover {
                            color: #27ae60;
                        }
                    </style>`;

const ENDING_NOTE_HTML = `
    <div style="background: var(--surface-muted); padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); margin: 20px auto; max-width: 90%; font-family: 'Georgia', serif; border-left: 4px solid #2ecc71;">
        <p style="font-size: 14px; color: var(--text-primary); line-height: 1.6; margin: 0;">
            <strong style="color: #e67e22;">Rates:</strong> Tariffs (effective 1/04/2025) are subject to change. For reference only; consult official <span style="color: #3498db; font-weight: bold;">KSEB</span> sources for authoritative, accurate details.
        </p>
        <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin: 15px 0 0;">
            <strong style="color: #27ae60;">Support:</strong> For calculation discrepancies, mistakes, or additional options, contact
            <a href="mailto:calculatoronline2024@gmail.com" style="color: #2ecc71; font-style: italic; text-decoration: none; transition: color 0.3s ease;">calculatoronline2024@gmail.com</a>.
            <span style="display: block; margin-top: 8px; font-size: 12px; color: var(--text-muted);">(Version 3.0.08: Last updated: 03-July-2026) </span>
        </p>
    </div>
`;

// ToD-only "(T1: x + T2: y + T3: z)" sub-label under a usage row; blank for
// Normal billing, which only ever has a single combined reading.
function todSubLabel(bill, normalField, peakField, offPeakField) {
    if (bill.billingType !== 'tod') return '';
    return `<br><span style="font-size: 11px; color: var(--text-muted);">T1: ${(bill[normalField] || 0).toFixed(2)} + T2: ${(bill[peakField] || 0).toFixed(2)} + T3: ${(bill[offPeakField] || 0).toFixed(2)}</span>`;
}

function usageRows(bill) {
    const { solarGeneration, importReading, exportReading, generationUsage, unitsConsumed } = bill;

    return `
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Solar Generation${todSubLabel(bill, 'solarNormal', 'solarPeak', 'solarOffPeak')}</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;"><strong class="green-text">${solarGeneration.toFixed(2)} Unit</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Import Total${todSubLabel(bill, 'importNormal', 'importPeak', 'importOffPeak')}</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;">${importReading.toFixed(2)} Unit</td>
                        </tr>
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Export Total${todSubLabel(bill, 'exportNormal', 'exportPeak', 'exportOffPeak')}</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;">${exportReading.toFixed(2)} Unit</td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Direct Usage from Solar<br><span style="font-size: 11px; color: var(--text-muted);">Solar − Export</span></td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;"><strong class="red-text">${generationUsage.toFixed(2)} Unit</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Total Consumption<br><span style="font-size: 11px; color: var(--text-muted);">Direct Solar Usage + Import</span></td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;"><strong class="red-text">${unitsConsumed.toFixed(2)} Unit</strong></td>
                        </tr>`;
}

// The per-slab / per-timezone lines behind the single "Energy Charge"
// total -- whichever of the three tariff paths bill went through
// (calculator.js's applyTariffRules): telescopic bands, a flat
// non-telescopic rate, or a real T1/T2/T3 ToD split. See CLAUDE.md's
// "above20kW" field-selection pattern (also used in render-insights.js and
// solar-diary.html) for why Peak/OffPeak read from different fields
// depending on connected load.
function energyBreakdownRows(bill) {
    if (bill.breakdownRows && bill.breakdownRows.length > 0) {
        return bill.breakdownRows.map((row) => `
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px 10px 10px 24px; font-size: 13px;">${row.units} unit(s) @ ₹${row.rate.toFixed(2)}</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; font-size: 13px;">₹${row.amount.toFixed(2)}</td>
                        </tr>`).join('');
    }

    if (bill.billType === 'Non-Telescopic') {
        return `
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px 10px 10px 24px; font-size: 13px;">${(bill.bankAdjustedUnits || 0).toFixed(2)} unit(s) @ ₹${(bill.unitRate || 0).toFixed(2)}</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; font-size: 13px;">₹${(bill.energyCharge || 0).toFixed(2)}</td>
                        </tr>`;
    }

    if (bill.billType === 'Non-Telescopic-ToD') {
        const above20kW = bill.todBillingAbove20kW > 0;
        const normalUnits = bill.Normal_NoOfUnitsFor_energy_calculation || 0;
        const peakUnits = (above20kW ? bill.Peak_NoOfUnitsFor_energy_calculation : bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;
        const offPeakUnits = (above20kW ? bill.OffPeak_NoOfUnitsFor_energy_calculation : bill.OffPeak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;
        const normalCharge = bill.NormalConsumptionAdjusted_energy_charge || 0;
        const peakCharge = (above20kW ? bill.PeakConsumptionAdjusted_energy_charge : bill.PeakConsumptionAdjusted_energy_charge_Below20kW) || 0;
        const offPeakCharge = (above20kW ? bill.OffPeakConsumptionAdjusted_energy_charge : bill.OffPeakConsumptionAdjusted_energy_charge_Below20kW) || 0;

        return `
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px 10px 10px 24px; font-size: 13px;">Normal (T1, 6am-6pm): ${normalUnits.toFixed(2)} units @ 90%</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; font-size: 13px;">₹${normalCharge.toFixed(2)}</td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px 10px 10px 24px; font-size: 13px;">Peak (T2, 6pm-10pm): ${peakUnits.toFixed(2)} units @ 125%</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; font-size: 13px;">₹${peakCharge.toFixed(2)}</td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px 10px 10px 24px; font-size: 13px;">Off-Peak (T3, 10pm-6am): ${offPeakUnits.toFixed(2)} units @ 100%</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; font-size: 13px;">₹${offPeakCharge.toFixed(2)}</td>
                        </tr>`;
    }

    return '';
}

function buildBillSummaryTable(bill) {
    const { billType, fixedCharge, meterRent, unitRate, duty, monthlyFuelSurcharge, totalBillAmount } = bill;
    const energyChargeToUse = bill.energyCharge || 0;
    const bankAdjustedUnitsToUse = bill.bankAdjustedUnits || 0;

    const detailRows = bankAdjustedUnitsToUse > 0 ? `
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">No: of Units Consumed<br>(for Energy Calculation)</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #2ecc71;">${bankAdjustedUnitsToUse.toFixed(2)} Unit</td>
                        </tr>
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Unit Charge</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #3498db;">₹${(unitRate || 0).toFixed(2)}/Unit</td>
                        </tr>${energyBreakdownRows(bill)}
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Energy Charge</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #e74c3c;"><strong>₹${energyChargeToUse.toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Duty<br>(10% of Energy Charge)</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(duty || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Monthly Fuel Surcharge<br>(Consumption: ${bankAdjustedUnitsToUse.toFixed(2)} Unit x ${FUEL_SURCHARGE_PAISE_LABEL})</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(monthlyFuelSurcharge || 0).toFixed(2)}</strong></td>
                        </tr>` : '';

    const wheelingRow = bill.wheelingResult && bill.wheelingResult.wheelingCharge > 0 ? `
                        <tr style="background-color: var(--bank-light);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Wheeling Charge<br>(to ${bill.wheelingResult.sites.length} site${bill.wheelingResult.sites.length > 1 ? 's' : ''})</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #4a3aa7;"><strong>₹${bill.wheelingResult.wheelingCharge.toFixed(2)}</strong></td>
                        </tr>` : '';

    return `
             <h4 style="position: absolute; left: 50%; transform: translateX(-50%); color: var(--text-primary); margin-bottom: 10px; text-align: center;"><u>Bill Summary</u></h4>
            <div style="overflow-x: auto; margin: 20px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px; background: var(--surface); box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px;">

                    <thead>
                        <tr style="background: linear-gradient(90deg, #3498db, #2980b9); color: white;">
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: left; width: 60%; border-top-left-radius: 8px;">Description</th>
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: right; width: 40%; border-top-right-radius: 8px;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Bill Type</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right;"><strong>${billType || 'N/A'}</strong></td>
                        </tr>${usageRows(bill)}
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Fixed Charge</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(fixedCharge || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface);">
                            <td style="border: 1px solid var(--border); padding: 10px;">Meter Rent</td>
                            <td style="border: 1px solid var(--border); padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(meterRent || 0).toFixed(2)}</strong></td>
                        </tr>${detailRows}${wheelingRow}
                        <tr style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white;">
                            <td style="border: 1px solid #27ae60; padding: 10px; font-weight: bold; border-bottom-left-radius: 8px;">Total Bill Amount</td>
                            <td style="border: 1px solid #27ae60; padding: 10px; text-align: right; font-weight: bold; border-bottom-right-radius: 8px;">₹${(totalBillAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table { font-size: 12px; }
                    td, th { padding: 8px; }
                }
            </style>
        `;
}

// Covers both plain "normal" billing and ToD-Telescopic-below-20kW billing
// (bill.todType === 'normal'): both use the flat telescopic/non-telescopic
// slabs rather than a T1/T2/T3 split.
function buildNormalBillingResult(bill) {
    const {
        solarGeneration, importReading, exportReading, myBankDepositAtKseb,
        generationUsage, unitsConsumed, fixedCharge, phase,
        exportPlusBank, bankAdjustedUnits, billType, breakdownRows, unitRate,
        energyCharge, totalBillAmount, accountBalance,
    } = bill;

    const result = `
            <hr>
            <h5><u>Energy Usage and Charges</u></h5>
            <div style="overflow-x: auto; margin: 16px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: var(--surface-muted);">
                            <th style="border: 1px solid var(--border); padding: 6px; text-align: left; width: 60%;">Description</th>
                            <th style="border: 1px solid var(--border); padding: 6px; text-align: right; width: 40%;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Total Solar Generation</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="green-text">${solarGeneration} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">  Total Import</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${importReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">  Total Export</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${exportReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Banked Units</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${myBankDepositAtKseb} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Direct energy usage from Solar<br>(SolarGeneration(${solarGeneration}) - Export(${exportReading}))</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${generationUsage} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Energy Usage from KSEB</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${importReading} Unit</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 6px;">Total Consumption<br>(${generationUsage} + ${importReading})</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${unitsConsumed} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Fixed Charge for ${unitsConsumed} Unit (${phase})<br>(w.e.f 1/4/2025)</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">₹${fixedCharge}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table {
                        font-size: 12px;
                    }
                    th, td {
                        padding: 4px;
                    }
                }
            </style>
            <hr>
        `;

    const result1 = importReading > exportPlusBank
        ? `<p>Energy Consumption for the month is <strong class="red-text">${Math.abs(importReading - exportPlusBank).toFixed(2)} Unit </strong>(${importReading}-${exportPlusBank}) - (Energy charge is calculated based on this consumption)</p>`
        : 'Energy consumption for the month is zero as the consumption is adjusted from the export+bank';

    let result2;
    let result3;
    let result4;

    if (importReading > exportPlusBank) {
        result2 = `
                <hr>
                <h5><u>Energy Usage Summary</u></h5>
                <div style="overflow-x: auto; margin: 20px 0;">
                    <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color: var(--surface-muted);">
                                <th style="border: 1px solid var(--border); padding: 6px; text-align: left; width: 60%;">Description</th>
                                <th style="border: 1px solid var(--border); padding: 6px; text-align: right; width: 40%;">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid var(--border); padding: 6px;">  Total Import</td>
                                <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${importReading || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid var(--border); padding: 6px;">  Total Export</td>
                                <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${exportReading || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid var(--border); padding: 6px;">Banking Units</td>
                                <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${myBankDepositAtKseb || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid var(--border); padding: 6px;">Difference to be Charged<br>(${importReading || 0} - ${exportPlusBank || 0})</td>
                                <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${bankAdjustedUnits || 0} Unit</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <style>
                    @media (max-width: 600px) {
                        table { font-size: 12px; }
                        th, td { padding: 4px; }
                    }
                </style>
                <hr>
            `;

        if (billType === 'Telescopic' || billType === 'Telescopic-ToD') {
            const breakdown = renderTelescopicBreakdown(breakdownRows, energyCharge, unitRate, bankAdjustedUnits, {
                highlightTotal: billType === 'Telescopic-ToD',
            });
            result3 = `
                    <p>Your Billing Type: ${billType || 'Unknown'}</p>
                    <hr>
                    <h5><u>Energy Charge Calculation</u></h5>
                    <p>For ${bankAdjustedUnits || 0} Unit:</p>
                    ${breakdown || 'No breakdown available'}
                `;
        } else {
            result3 = `
                    <p>Your Billing Type: ${billType || 'Unknown'}</p>
                    <p>As per the existing tariff Unit rate:  ₹${(unitRate || 0).toFixed(2)}.</p>
                    <div style="overflow-x: auto; margin: 20px 0;">
                        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: var(--surface-muted);">
                                    <th style="border: 1px solid var(--border); padding: 6px; text-align: left; width: 60%;">Description</th>
                                    <th style="border: 1px solid var(--border); padding: 6px; text-align: right; width: 40%;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid var(--border); padding: 6px;">Total Energy Charge<br>(${bankAdjustedUnits || 0} x ₹${(unitRate || 0).toFixed(2)})</td>
                                    <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong>₹${(energyCharge || 0).toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <style>
                        @media (max-width: 600px) {
                            table { font-size: 12px; }
                            th, td { padding: 4px; }
                        }
                    </style>
                `;
        }

        result4 = `
                <h5><u>Total Bill Amount</u></h5>
                <p>ഏകദേശം <strong class="red-text">₹${(totalBillAmount || 0).toFixed(2)}</strong></p>
                <p style="font-size: 0.9em; font-style: italic;">(GST, Security Deposit interest, Tariff changes, Advance calculation എന്നിവയിൽ മാറ്റങ്ങൾ വരാം)</p>
                    ${SOLAR_DIARY_PROMO_HTML}
            `;
    } else {
        if (importReading === exportPlusBank) {
            result2 = buildEqualOrSurplusSummary(bill, 'Import = Export, No Energy Charge');
        } else {
            result2 = buildEqualOrSurplusSummary(bill, 'Export > Import, No Energy Charge');
        }

        result3 = `
                <h5><u>Total Bill Amount</u></h5>
                <p>ഏകദേശം <strong class="red-text">₹${(totalBillAmount || 0).toFixed(2)}</strong></p>
                <p style="font-size: 0.9em; font-style: italic;">(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</p>
            `;

        result4 = `
                <h5><u>Bank Adjustment</u></h5>
                ${(accountBalance || 0) > 0 ? `
                    <p>Final Bank Closing = <strong class="green-text">${accountBalance || 0} Unit</strong></p>
                    <p style="font-size: 0.9em;">(Export+Bank(${exportPlusBank || 0}) - Import(${importReading || 0}))</p>
                    ${SOLAR_DIARY_PROMO_HTML}
                ` : `
                    <p>No Energy units to be added to bank 👎</p>
                    ${SOLAR_DIARY_PROMO_HTML}
                `}
            `;
    }

    return { result, result1, result2, result3, result4 };
}

function buildEqualOrSurplusSummary(bill, statusText) {
    const { importReading, exportReading, myBankDepositAtKseb } = bill;
    return `
                    <hr>
                    <h5><u>Energy Usage Summary</u></h5>
                    <div style="overflow-x: auto; margin: 20px 0;">
                        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: var(--surface-muted);">
                                    <th style="border: 1px solid var(--border); padding: 6px; text-align: left; width: 60%;">Description</th>
                                    <th style="border: 1px solid var(--border); padding: 6px; text-align: right; width: 40%;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid var(--border); padding: 6px;">  Total Import</td>
                                    <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${importReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid var(--border); padding: 6px;">  Total Export</td>
                                    <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${exportReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid var(--border); padding: 6px;">Banked Unit</td>
                                    <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${myBankDepositAtKseb || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid var(--border); padding: 6px;">Adjustment Status</td>
                                    <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="green-text">${statusText}</strong>😌</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <style>
                        @media (max-width: 600px) {
                            table { font-size: 12px; }
                            th, td { padding: 4px; }
                        }
                    </style>
                    <hr>
                `;
}

// The real T1/T2/T3 ToD split path: connected load above 20kW (any billed
// units), or below 20kW with billed units > 250.
function buildTodSplitResult(bill) {
    const {
        solarGeneration, importReading, exportReading, myBankDepositAtKseb,
        importNormal, importPeak, importOffPeak, exportNormal, exportPeak, exportOffPeak,
        generationUsage, unitsConsumed, fixedCharge, phase, totalBillAmount,
        todBillingAbove20kW,
    } = bill;

    const result = `
            <hr>
            <h5><u>Energy Usage Details</u></h5>
            <div style="overflow-x: auto; margin: 20px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: var(--surface-muted);">
                            <th style="border: 1px solid var(--border); padding: 6px; text-align: left; width: 60%;">Description</th>
                            <th style="border: 1px solid var(--border); padding: 6px; text-align: right; width: 40%;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Total Solar Generation</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="green-text">${solarGeneration} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">  Total Import<br>(T1 (${importNormal.toFixed(2)}) + T2 (${importPeak.toFixed(2)}) + T3 (${importOffPeak.toFixed(2)}))</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${importReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">  Total Export<br>(T1 (${exportNormal.toFixed(2)}) + T2 (${exportPeak}) + T3 (${exportOffPeak}))</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${exportReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Banked Units</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;">${myBankDepositAtKseb} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">Direct energy Usage from solar<br>(SolarGeneration(${solarGeneration}) - Export(${exportReading}))</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${generationUsage} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid var(--border); padding: 6px;">KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് (From KSEB)</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${importReading} Unit</strong></td>
                        </tr>
                        <tr style="background-color: var(--surface-muted);">
                            <td style="border: 1px solid var(--border); padding: 6px;">ആകെ വൈദ്യുതി ഉപയോഗം (Total Consumption)<br>(${generationUsage} + ${importReading})</td>
                            <td style="border: 1px solid var(--border); padding: 6px; text-align: right;"><strong class="red-text">${unitsConsumed} Unit</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table {
                        font-size: 12px;
                    }
                    th, td {
                        padding: 4px;
                    }
                }
            </style>
            <hr>
        `;

    const result1 = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 1/4/2025)`;

    const totalBillAmountBlock = `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                            <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;

    let result2;
    let result3;

    if (todBillingAbove20kW > 0) {
        result2 = getHeaderMessage(bill)
            + '<u><strong>T1 - Normal TimeZone (6am to 6pm) Calculations </strong></u>'
            + getExportNormalAdjustmentMessage(bill)
            + '<u><strong>T2 - Peak TimeZone (6pm to 10pm) Calculations </strong></u>'
            + getExportPeakAdjustmentMessage(bill)
            + '<u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u>'
            + getExportOffPeakAdjustmentMessage(bill);

        result3 = getEnergyCaluculationMessage(bill) + totalBillAmountBlock;
    } else {
        result2 = getHeaderMessage(bill)
            + '<u><strong>T1 - Normal TimeZone (6am to 6pm) Calculations </strong></u>'
            + getExportNormalAdjustmentMessageBelow20kW({
                ...bill,
                NormalConsumptionAdjusted: bill.NormalConsumptionAdjusted_Below20kW,
            });

        result3 = '<b><u><strong>T2 - Peak TimeZone (6pm to 10pm) (Connected Load < 20kW)</strong></u></b>'
            + getExportPeakAdjustmentMessageBelow20kW(bill)
            + '<b><u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u></b>'
            + getExportOffPeakAdjustmentMessageBelow20kW(bill)
            + getEnergyCaluculationMessage({
                ...bill,
                bankAdjustedUnits: bill.bankAdjustedUnits_Below20kW,
                Peak_NoOfUnitsFor_energy_calculation: bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW,
                OffPeak_NoOfUnitsFor_energy_calculation: bill.OffPeak_NoOfUnitsFor_energy_calculation_Below20kW,
                unitRate: bill.unitRate_Below20kW,
                PeakConsumptionAdjusted_energy_charge: bill.PeakConsumptionAdjusted_energy_charge_Below20kW,
                OffPeakConsumptionAdjusted_energy_charge: bill.OffPeakConsumptionAdjusted_energy_charge_Below20kW,
                energyCharge: bill.energyCharge_Below20kW,
            })
            + `<b>${totalBillAmountBlock}</b>`;
    }

    return { result, result1, result2, result3, result4: '' };
}

export function renderBillResults(bill) {
    const billInfo = buildBillSummaryTable(bill);
    const isNormalPath = bill.billingType === 'normal' || bill.todType === 'normal';
    const panels = isNormalPath ? buildNormalBillingResult(bill) : buildTodSplitResult(bill);

    const billChart = renderBillBreakdownChart(bill) + renderTodComparisonChart(bill);
    const billAnalysis = renderBillAnalysis(bill);
    const wheelingBreakdown = renderWheelingResult(bill.wheelingResult);

    return {
        billInfo,
        billChart,
        billAnalysis,
        wheelingBreakdown,
        result: panels.result,
        result1: panels.result1,
        result2: panels.result2,
        result3: panels.result3,
        result4: panels.result4,
        result6: ENDING_NOTE_HTML,
    };
}
