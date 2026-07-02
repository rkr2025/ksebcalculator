// HTML table builders for the ToD adjustment/breakdown panels
// (js/render-tables.js). These replace ~10 near-identical hand-written
// table functions from the original scripts.js with one shared renderer
// (renderInfoTable) plus small row-data builders -- the rendered HTML is
// unchanged, only the duplication is gone.

const CELL = 'border: 1px solid #ddd; padding: 6px;';
const CELL_RIGHT = `${CELL} text-align: right;`;

const green = (html) => `<strong class="green-text">${html}</strong>`;
const red = (html) => `<strong class="red-text">${html}</strong>`;
const unit = (value) => `${value.toFixed(2)} Unit`;
const money = (value) => `₹${value.toFixed(2)}`;

// Shared 2-column (Description / Details) info table used by every
// Normal/Peak/Off-Peak adjustment message and the header message's siblings.
function renderInfoTable(title, rows) {
    const rowsHtml = rows.map(({ label, value }) => `
              <tr>
                <td style="${CELL}">${label}</td>
                <td style="${CELL_RIGHT}">${value}</td>
              </tr>`).join('');

    return `
        <hr>
        <h5><u>${title}</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}
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

export function getHeaderMessage({ importNormal, importPeak, importOffPeak, exportNormal, myBankDepositAtKseb }) {
    const rows = [
        ['#e6ffe6', 'Normal Hours Import <span style="font-style: italic; color: #666;">(6am to 6pm)</span>', '#008000', unit(importNormal)],
        ['#fff0e6', 'Peak Hours Import <span style="font-style: italic; color: #666;">(6pm to 10pm)</span>', '#ff4500', unit(importPeak)],
        ['#e6f2ff', 'Off-Peak Import <span style="font-style: italic; color: #666;">(10pm to 6am)</span>', '#1e90ff', unit(importOffPeak)],
        ['#f0f0ff', 'Normal Hour Export', '#0000cd', unit(exportNormal)],
        ['#f2e6ff', 'Banked Units', '#800080', unit(myBankDepositAtKseb)],
    ].map(([bg, label, color, value]) => `
                    <tr style="background-color: ${bg};">
                        <td style="border: 1px solid #ddd; padding: 8px;">${label}</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${color};"><strong>${value}</strong></td>
                    </tr>`).join('');

    return `
        <hr>
        <h5 style="text-align: center; color: #333;"><u><strong>ToD Billing Based on T1, T2, T3 (w.e.f 01-02-2025)</strong></u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #f2f2f2; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 60%;">Description</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 40%;">Details</th>
                    </tr>
                </thead>
                <tbody>${rows}
                </tbody>
            </table>
        </div>
        <style>
            @media (max-width: 600px) {
                table { font-size: 12px; }
                th, td { padding: 6px; }
            }
        </style>
        <hr>
    `;
}

export function getExportNormalAdjustmentMessage({
    exportPlusBank, importNormal, unitRate, NormalConsumptionAdjusted,
    PeakConsumptionAdjusted_80_percent, Normal_NoOfUnitsFor_energy_calculation,
    exportReading, myBankDepositAtKseb,
}) {
    const exportPlusBankRow = { label: 'Export + Bank', value: green(`${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} = ${exportPlusBank.toFixed(2)} Unit`) };
    const normalUsageRow = { label: 'പകൽ സമയ ഉപയോഗം (Normal Time Usage)', value: red(unit(importNormal)) };

    if (exportPlusBank > importNormal) {
        return renderInfoTable('Normal TimeZone Adjustment Details', [
            exportPlusBankRow,
            normalUsageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Normal TimeZone Energy Consumption', value: green(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: `Remaining Energy After Normal Adjustment<br>(${exportPlusBank.toFixed(2)} - ${importNormal.toFixed(2)})`, value: green(unit(NormalConsumptionAdjusted)) },
            { label: `Peak TimeZone Adjustment (80% of Remaining)<br>(${NormalConsumptionAdjusted.toFixed(2)} x 80%)`, value: green(unit(PeakConsumptionAdjusted_80_percent)) },
        ]);
    }
    if (exportPlusBank === importNormal) {
        return renderInfoTable('Normal TimeZone Adjustment Details', [
            exportPlusBankRow,
            normalUsageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Normal TimeZone Energy Consumption', value: green(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: 'Peak TimeZone Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable('Normal TimeZone Adjustment Details', [
        exportPlusBankRow,
        normalUsageRow,
        { label: `Remaining Units to Charge<br>(${importNormal.toFixed(2)} - ${exportPlusBank.toFixed(2)})`, value: red(unit(Math.abs(exportPlusBank - importNormal))) },
        { label: 'Normal TimeZone Energy Consumption', value: red(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡`) },
        { label: `Charge Rate (90% of Normal Rate)<br>(₹${unitRate.toFixed(2)} x 0.9)`, value: money(unitRate * 0.9) },
    ]);
}

export function getExportNormalAdjustmentMessageBelow20kW({
    exportPlusBank, importNormal, unitRate_Below20kW, NormalConsumptionAdjusted,
    NormalConsumptionAdjusted_Below20kW, Normal_NoOfUnitsFor_energy_calculation,
    exportReading, myBankDepositAtKseb,
}) {
    const exportPlusBankRow = { label: 'Export + Bank', value: green(`${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} = ${exportPlusBank.toFixed(2)} Unit`) };
    const normalUsageRow = { label: 'പകൽ സമയ ഉപയോഗം (Normal Time Usage)', value: red(unit(importNormal)) };
    const title = 'Normal TimeZone Adjustment Details (Below 20kW)';

    if (exportPlusBank > importNormal) {
        return renderInfoTable(title, [
            exportPlusBankRow,
            normalUsageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Normal TimeZone Energy Consumption', value: green(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: `Remaining Energy After Normal Adjustment<br>(${exportPlusBank.toFixed(2)} - ${importNormal.toFixed(2)})`, value: green(unit(NormalConsumptionAdjusted)) },
            { label: `Peak TimeZone Energy Adjustment<br>(${exportPlusBank.toFixed(2)} - ${importNormal.toFixed(2)})`, value: green(unit(Math.abs(exportPlusBank - importNormal))) },
            { label: 'Effective Energy (Below 20kW)', value: green(unit(NormalConsumptionAdjusted_Below20kW)) },
        ]);
    }
    if (exportPlusBank === importNormal) {
        return renderInfoTable(title, [
            exportPlusBankRow,
            normalUsageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Normal TimeZone Energy Consumption', value: green(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: 'Peak TimeZone Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable(title, [
        exportPlusBankRow,
        normalUsageRow,
        { label: `Remaining Units to Charge<br>(${importNormal.toFixed(2)} - ${exportPlusBank.toFixed(2)})`, value: red(unit(Math.abs(exportPlusBank - importNormal))) },
        { label: 'Normal TimeZone Energy Consumption', value: red(`${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡`) },
        { label: `Charge Rate (90% of Normal Rate)<br>(₹${unitRate_Below20kW.toFixed(2)} x 0.9)`, value: money(unitRate_Below20kW * 0.9) },
    ]);
}

export function getExportPeakAdjustmentMessage({
    PeakConsumptionAdjusted_80_percent, importPeak, PeakConsumptionAdjusted,
    Peak_NoOfUnitsFor_energy_calculation, unitRate,
}) {
    const adjustedRow = { label: 'Peak Hours Adjusted Energy', value: green(unit(PeakConsumptionAdjusted_80_percent)) };
    const usageRow = { label: 'Peak TimeZone Usage (6pm to 10pm)', value: red(unit(importPeak)) };
    const title = 'Peak TimeZone Adjustment Details';

    if (PeakConsumptionAdjusted_80_percent > importPeak) {
        return renderInfoTable(title, [
            adjustedRow,
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Peak TimeZone Energy Consumption', value: green(`${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: `Left-over Energy<br>(${PeakConsumptionAdjusted_80_percent.toFixed(2)} - ${importPeak.toFixed(2)})`, value: green(unit(PeakConsumptionAdjusted_80_percent - importPeak)) },
            { label: `Effective Energy to Transfer<br>(${(PeakConsumptionAdjusted * 0.8).toFixed(2)} / 0.8)`, value: green(unit(PeakConsumptionAdjusted)) },
            { label: 'Off-Peak TimeZone Adjustment', value: green(unit(PeakConsumptionAdjusted)) },
        ]);
    }
    if (PeakConsumptionAdjusted_80_percent === importPeak) {
        return renderInfoTable(title, [
            { label: 'Remaining Export Energy', value: green(unit(PeakConsumptionAdjusted_80_percent)) },
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Peak TimeZone Energy Consumption', value: green(`${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: 'Further Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable(title, [
        adjustedRow,
        usageRow,
        { label: `Remaining Units to Charge<br>(${importPeak.toFixed(2)} - ${PeakConsumptionAdjusted_80_percent.toFixed(2)})`, value: red(unit(Math.abs(importPeak - PeakConsumptionAdjusted_80_percent))) },
        { label: 'Peak TimeZone Energy Consumption', value: red(`${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡`) },
        { label: `Charge Rate (125% of Normal Rate)<br>(₹${unitRate.toFixed(2)} x 1.25)`, value: red(money(unitRate * 1.25)) },
    ]);
}

export function getExportPeakAdjustmentMessageBelow20kW({
    NormalConsumptionAdjusted_Below20kW, importPeak,
    Peak_NoOfUnitsFor_energy_calculation_Below20kW, unitRate_Below20kW,
}) {
    const peakConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted_Below20kW - importPeak;
    const adjustedRow = { label: 'Peak Hours Adjusted Energy', value: green(unit(NormalConsumptionAdjusted_Below20kW)) };
    const usageRow = { label: 'Peak TimeZone Usage (6pm to 10pm)', value: red(unit(importPeak)) };
    const title = 'Peak TimeZone Adjustment Details (Below 20kW)';

    if (NormalConsumptionAdjusted_Below20kW > importPeak) {
        return renderInfoTable(title, [
            adjustedRow,
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Peak TimeZone Energy Consumption', value: green(`${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌`) },
            { label: `Remaining Energy After Adjustment<br>(${NormalConsumptionAdjusted_Below20kW.toFixed(2)} - ${importPeak.toFixed(2)})`, value: green(unit(peakConsumptionAdjusted_Below20kW)) },
            { label: `Off-Peak TimeZone Energy Adjustment<br>(${NormalConsumptionAdjusted_Below20kW.toFixed(2)} - ${importPeak.toFixed(2)})`, value: green(unit(Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak))) },
        ]);
    }
    if (NormalConsumptionAdjusted_Below20kW === importPeak) {
        return renderInfoTable(title, [
            { label: 'Remaining Export Energy', value: green(unit(NormalConsumptionAdjusted_Below20kW)) },
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted 👍') },
            { label: 'Peak TimeZone Energy Consumption', value: green(`${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌`) },
            { label: 'Further Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable(title, [
        adjustedRow,
        usageRow,
        { label: `Remaining Units to Charge<br>(${importPeak.toFixed(2)} - ${NormalConsumptionAdjusted_Below20kW.toFixed(2)})`, value: red(unit(Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak))) },
        { label: 'Peak TimeZone Energy Consumption', value: red(`${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡`) },
        { label: `Charge Rate (125% of Normal Rate)<br>(₹${unitRate_Below20kW.toFixed(2)} x 1.25)`, value: red(money(unitRate_Below20kW * 1.25)) },
    ]);
}

export function getExportOffPeakAdjustmentMessage({
    importOffPeak, PeakConsumptionAdjusted, OffPeakConsumptionAdjusted,
    OffPeak_NoOfUnitsFor_energy_calculation, unitRate,
}) {
    const adjustedRow = { label: 'Peak Hours Adjusted Energy', value: green(unit(PeakConsumptionAdjusted)) };
    const usageRow = { label: 'Off-Peak TimeZone Usage (10pm to 6am)', value: red(unit(importOffPeak)) };
    const title = 'Off-Peak TimeZone Adjustment Details';

    if (PeakConsumptionAdjusted > importOffPeak) {
        return renderInfoTable(title, [
            adjustedRow,
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted') },
            { label: 'Off-Peak TimeZone Energy Consumption', value: green(`${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: `Remaining Energy After Adjustment<br>(${PeakConsumptionAdjusted.toFixed(2)} - ${importOffPeak.toFixed(2)})`, value: green(unit(OffPeakConsumptionAdjusted)) },
            { label: `Off-Peak TimeZone Energy Adjustment<br>(${PeakConsumptionAdjusted.toFixed(2)} - ${importOffPeak.toFixed(2)})`, value: green(unit(Math.abs(PeakConsumptionAdjusted - importOffPeak))) },
            { label: 'Final Bank Adjustment', value: green(unit(OffPeakConsumptionAdjusted)) },
        ]);
    }
    if (PeakConsumptionAdjusted === importOffPeak) {
        return renderInfoTable(title, [
            { label: 'Remaining Export Energy', value: green(unit(PeakConsumptionAdjusted)) },
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted') },
            { label: 'Off-Peak TimeZone Energy Consumption', value: green(`${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌`) },
            { label: 'Further Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable(title, [
        { label: 'Off-Peak Adjusted Energy', value: green(unit(PeakConsumptionAdjusted)) },
        usageRow,
        { label: `Remaining Units to Charge<br>(${importOffPeak.toFixed(2)} - ${PeakConsumptionAdjusted.toFixed(2)})`, value: red(unit(Math.abs(PeakConsumptionAdjusted - importOffPeak))) },
        { label: 'Off-Peak TimeZone Energy Consumption', value: red(`${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡`) },
        { label: 'Charge Rate (Normal Rate)', value: red(money(unitRate)) },
    ]);
}

export function getExportOffPeakAdjustmentMessageBelow20kW({
    importOffPeak, PeakConsumptionAdjusted_Below20kW, OffPeakConsumptionAdjusted_Below20kW,
    unitRate_Below20kW, OffPeak_NoOfUnitsFor_energy_calculation_Below20kW,
}) {
    const adjustedRow = { label: 'Peak Hours Adjusted Energy', value: green(unit(PeakConsumptionAdjusted_Below20kW)) };
    const usageRow = { label: 'Off-Peak TimeZone Usage (10pm to 6am)', value: red(unit(importOffPeak)) };
    const title = 'Off-Peak TimeZone Adjustment Details (Below 20kW)';

    if (PeakConsumptionAdjusted_Below20kW > importOffPeak) {
        return renderInfoTable(title, [
            adjustedRow,
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted') },
            { label: 'Off-Peak TimeZone Energy Consumption', value: green(`${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌`) },
            { label: `Remaining Energy After Adjustment<br>(${PeakConsumptionAdjusted_Below20kW.toFixed(2)} - ${importOffPeak.toFixed(2)})`, value: green(unit(OffPeakConsumptionAdjusted_Below20kW)) },
            { label: `Off-Peak TimeZone Energy Adjustment<br>(${PeakConsumptionAdjusted_Below20kW.toFixed(2)} - ${importOffPeak.toFixed(2)})`, value: green(unit(Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak))) },
            { label: 'Final Bank Adjustment', value: green(unit(OffPeakConsumptionAdjusted_Below20kW)) },
        ]);
    }
    if (PeakConsumptionAdjusted_Below20kW === importOffPeak) {
        return renderInfoTable(title, [
            { label: 'Remaining Export Energy', value: green(unit(PeakConsumptionAdjusted_Below20kW)) },
            usageRow,
            { label: 'Adjustment Status', value: green('Fully Adjusted') },
            { label: 'Off-Peak TimeZone Energy Consumption', value: green(`${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌`) },
            { label: 'Further Adjustment', value: 'No further adjustment possible' },
        ]);
    }
    return renderInfoTable(title, [
        { label: 'Off-Peak Adjusted Energy', value: green(unit(PeakConsumptionAdjusted_Below20kW)) },
        usageRow,
        { label: `Remaining Units to Charge<br>(${importOffPeak.toFixed(2)} - ${PeakConsumptionAdjusted_Below20kW.toFixed(2)})`, value: red(unit(Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak))) },
        { label: 'Off-Peak TimeZone Energy Consumption', value: red(`${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡`) },
        { label: 'Charge Rate (Normal Rate)', value: red(money(unitRate_Below20kW)) },
    ]);
}

// Standalone 4-column (Description/Units/Rate/Charge) summary table -- used
// as-is for both the above-20kW and below-20kW(>250 units) ToD branches; the
// caller passes whichever set of Normal/Peak/Off-Peak values applies.
export function getEnergyCaluculationMessage({
    bankAdjustedUnits, Normal_NoOfUnitsFor_energy_calculation, Peak_NoOfUnitsFor_energy_calculation,
    OffPeak_NoOfUnitsFor_energy_calculation, unitRate, NormalConsumptionAdjusted_energy_charge,
    PeakConsumptionAdjusted_energy_charge, OffPeakConsumptionAdjusted_energy_charge, energyCharge,
}) {
    return `
        <hr>
        <h5><u>Energy Calculation Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 40%;">Description</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Units</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Rate</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Charge (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone (90%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${(unitRate * 0.9).toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${red(NormalConsumptionAdjusted_energy_charge.toFixed(2))}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone (125%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${(unitRate * 1.25).toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${red(PeakConsumptionAdjusted_energy_charge.toFixed(2))}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone (100%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${unitRate.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${red(OffPeakConsumptionAdjusted_energy_charge.toFixed(2))}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="border: 1px solid #ddd; padding: 6px;"><strong>Total Energy Consumption</strong></td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong>${bankAdjustedUnits.toFixed(2)}</strong></td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">-</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${red(energyCharge.toFixed(2))}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p style="font-size: 0.9em;">Base Unit Rate: ₹${unitRate.toFixed(2)} | Total Energy Charge = Normal (T1) + Peak (T2) + Off-Peak (T3)</p>
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
}

// Renders the telescopic slab breakdown (breakdownRows from calculator.js)
// as the same "<p class='calc-step'>N units * ₹R = ₹A</p>" lines the
// original inline breakdown string used, optionally followed by the
// Total/Unit-Rate summary lines (only shown when units > 0).
export function renderTelescopicBreakdown(breakdownRows, energyCharge, unitRate, units, { highlightTotal } = {}) {
    let breakdown = breakdownRows
        .map(({ units: bandUnits, rate, amount }) => `<p class="calc-step">${bandUnits} units * ₹${rate.toFixed(2)} = ₹${amount.toFixed(2)}</p>`)
        .join('\n                ');

    if (units > 0) {
        const totalLabel = highlightTotal ? `<b>${red(money(energyCharge))}</b>` : `<b>${money(energyCharge)}</b>`;
        breakdown += `<p>Total Energy Charge: ${totalLabel}</p>`;
        breakdown += `<p>Unit Rate: ₹${unitRate.toFixed(2)} per unit (Avg.)</p>`;
    }

    return breakdown;
}
