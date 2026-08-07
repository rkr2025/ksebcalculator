// Plain-language, bilingual (English + Malayalam) walkthrough of the Bill
// Summary table (js/render-explanation.js). One explanation per row, using
// the bill's own numbers, shown directly below the table so a
// non-technical reader can follow how the total was actually arrived at.
// Pure string builder from a `bill` object, same contract as the other
// render-*.js modules.

import { TOD_MULTIPLIERS } from './tariff-rates.js';

// Bolded so the reader's own bill figures stand out from the surrounding
// narrative prose -- unlike generic rule numbers written directly into a
// sentence (slab thresholds like "250", ToD percentages like "90%"), every
// number that flows through these three helpers is specific to THIS bill.
function u(n) {
    return `<strong>${(n || 0).toFixed(2)}</strong>`;
}
function m(n) {
    return `<strong>₹${(n || 0).toFixed(2)}</strong>`;
}
// Same as m(), but red -- reserved for a figure that is itself one of the
// charges actually added into the user's Total Bill Amount (Fixed Charge,
// Meter Rent, Energy Charge, Duty, Fuel Surcharge, Wheeling Charge, or a
// ToD zone's Energy Charge), reused here when that same figure is restated
// in ANOTHER row's narrative (e.g. Duty's description repeating the Energy
// Charge it's a percentage of). Matches the existing .red-text convention
// buildExplainTable() already applies to a charge row's own Amount column
// -- a rate (₹/unit) or a reference total for a wheeled site's own bill is
// NOT itself a charge to the user, so those keep using plain m().
function mc(n) {
    return `<strong class="red-text">₹${(n || 0).toFixed(2)}</strong>`;
}
function pct(rate) {
    return `<strong>${+((rate || 0) * 100).toFixed(2)}%</strong>`;
}
function ps(rate) {
    return `<strong>${Math.round((rate || 0) * 100)}ps</strong>`;
}
// site.name is free text typed by the user (index.html's "Site Name
// (optional)" field) and is used verbatim as a row label below, which
// buildExplainTable() interpolates unescaped into innerHTML -- escape it
// here so a name like `<img src=x onerror=...>` can't execute.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Two row shapes feed buildExplainTable() below:
// - wideRow: pure narrative, no figure to call out -- spans both columns.
// - dataRow: a labelled figure (Description | Amount). `isCharge: true`
//   marks it as money actually billed (not just a quantity like "units"),
//   so buildExplainTable can highlight it in red -- reusing the site's
//   existing .red-text convention from render-tables.js -- whenever that
//   amount is greater than zero, making "what am I actually being charged
//   for" visible at a glance. `favorable: true` is the opposite case (a
//   saving, not a cost) and highlights in green instead, reusing the same
//   .green-text convention render-tables.js already uses for good news.
function wideRow(en, ml) {
    return { wide: true, en, ml };
}
function dataRow({
    label, detail, amountValue = null, isCharge = false, favorable = false, en, ml,
}) {
    return {
        label, detail, amountValue, isCharge, favorable, en, ml,
    };
}

function buildExplainTable(rows, lang) {
    const bodyRows = rows.map((row) => {
        if (row.wide) {
            return `<tr><td class="bill-explain-wide">${row[lang]}</td></tr>`;
        }
        // Same highlight rule as before (red = a charge that actually added
        // to the bill, green = a favorable/saving figure) -- now applied to
        // the single value shown under the label, since the separate Amount
        // column has been folded into this one column.
        const highlightClass = row.isCharge && row.amountValue > 0
            ? 'red-text'
            : (row.favorable && row.amountValue > 0 ? 'green-text' : null);
        const detailHtml = highlightClass ? `<span class="${highlightClass}">${row.detail}</span>` : row.detail;
        return `
            <tr>
                <td class="bill-explain-desc"><strong class="bill-explain-desc-label">${row.label}</strong><div class="bill-explain-desc-value">${detailHtml}</div><div class="bill-explain-desc-text">${row[lang]}</div></td>
            </tr>`;
    }).join('');

    return `
        <div class="bill-explain-table-wrap">
            <table class="bill-explain-table">
                <thead><tr><th>Description</th></tr></thead>
                <tbody>${bodyRows}</tbody>
            </table>
        </div>`;
}

function billTypeItem(bill) {
    const units = u(bill.bankAdjustedUnits);
    if (bill.billType === 'Telescopic') {
        return wideRow(
            `<strong>Bill Type — Telescopic:</strong> your billed units (${units}) are 250 or fewer, so KSEB splits your usage into small price slabs (0–50, 50–100, and so on) — like income tax slabs — and only the units inside each slab are charged at that slab's rate.`,
            `<strong>Bill Type — Telescopic:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ താഴെയായതിനാൽ, KSEB നിങ്ങളുടെ ഉപയോഗം ചെറിയ സ്ലാബുകളായി (0–50, 50–100, ...) തിരിച്ച് ഓരോ സ്ലാബിലെയും യൂണിറ്റുകൾക്ക് ആ സ്ലാബിന്റെ നിരക്കിൽ മാത്രം ചാർജ് ചെയ്യുന്നു — ആദായനികുതി സ്ലാബുകൾ പോലെ.`,
        );
    }
    if (bill.billType === 'Non-Telescopic') {
        return wideRow(
            `<strong>Bill Type — Non-Telescopic:</strong> your billed units (${units}) are more than 250, so KSEB charges your <em>entire</em> consumption at a single flat rate, chosen by which band the total falls into — not slab by slab.`,
            `<strong>Bill Type — Non-Telescopic:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ കൂടുതലായതിനാൽ, KSEB നിങ്ങളുടെ <em>മുഴുവൻ</em> ഉപയോഗവും ഒരൊറ്റ നിരക്കിൽ (total ഏത് ബാൻഡിൽ വരുന്നു എന്നതിനെ അടിസ്ഥാനമാക്കി) ചാർജ് ചെയ്യുന്നു — സ്ലാബ് തിരിച്ചല്ല.`,
        );
    }
    if (bill.billType === 'Telescopic-ToD') {
        return wideRow(
            `<strong>Bill Type — Telescopic-ToD:</strong> Your billed units (${units}) are 250 or fewer, KSEB applies the same simple slab-based pricing as Normal billing this time — no separate Peak/Off-Peak rates apply.`,
            `<strong>Bill Type — Telescopic-ToD:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ താഴെ ആയതിനാൽ, Normal ബില്ലിംഗിലേതു പോലുള്ള ലളിതമായ സ്ലാബ് നിരക്കാണ് KSEB ഉപയോഗിക്കുന്നത് — പ്രത്യേകം Peak/Off-Peak നിരക്കുകൾ ബാധകമല്ല.`,
        );
    }
    if (bill.billType === 'Non-Telescopic-ToD') {
        return wideRow(
            `<strong>Bill Type — Non-Telescopic-ToD:</strong> your consumption is split by time of day. Normal hours (6am–6pm) are billed at 90% of the base rate, Peak hours (6pm–10pm) cost more at 125% (electricity is priciest to supply then), and Off-Peak hours (10pm–6am) are billed at the standard 100% rate.`,
            `<strong>Bill Type — Non-Telescopic-ToD:</strong> നിങ്ങളുടെ ഉപയോഗം സമയം അനുസരിച്ച് വിഭജിച്ചാണ് കണക്കാക്കുന്നത്. Normal സമയം (രാവിലെ 6 മുതൽ വൈകിട്ട് 6 വരെ) അടിസ്ഥാന നിരക്കിന്റെ 90%-ത്തിലും, Peak സമയം (വൈകിട്ട് 6 മുതൽ രാത്രി 10 വരെ) 125%-ത്തിലും, Off-Peak സമയം (രാത്രി 10 മുതൽ രാവിലെ 6 വരെ) സാധാരണ 100% നിരക്കിലുമാണ് ചാർജ് ചെയ്യുന്നത്.`,
        );
    }
    return null;
}

// Same T1 (Normal) / T2 (Peak) / T3 (Off-Peak) breakdown shown under these
// same three rows in the Bill Summary table itself (see render-results.js's
// todSubLabel()) -- blank for Normal billing, which only ever has a single
// combined reading with no timezone split to show.
function todBreakdown(bill, normalField, peakField, offPeakField) {
    if (bill.billingType !== 'tod') return '';
    return ` (T1: ${u(bill[normalField])} + T2: ${u(bill[peakField])} + T3: ${u(bill[offPeakField])})`;
}

function usageItems(bill) {
    const solarBreakdown = todBreakdown(bill, 'solarNormal', 'solarPeak', 'solarOffPeak');
    const importBreakdown = todBreakdown(bill, 'importNormal', 'importPeak', 'importOffPeak');
    const exportBreakdown = todBreakdown(bill, 'exportNormal', 'exportPeak', 'exportOffPeak');

    // Explains what the "(T1: ... + T2: ... + T3: ...)" tags appended to
    // Solar Generation/Import/Export below actually mean -- only relevant
    // for ToD bills, since Normal billing never shows that breakdown.
    const todNoteRow = bill.billingType === 'tod' ? [wideRow(
        `<strong>What T1 / T2 / T3 mean:</strong> T1 = Normal (6am–6pm), T2 = Peak (6pm–10pm), T3 = Off-Peak (10pm–6am) — the three time-of-day zones your meter records separately. The figures below tag each line with its own T1/T2/T3 split.`,
        `<strong>T1 / T2 / T3 എന്താണ്:</strong> T1 = Normal (രാവിലെ 6 മുതൽ വൈകിട്ട് 6 വരെ), T2 = Peak (വൈകിട്ട് 6 മുതൽ രാത്രി 10 വരെ), T3 = Off-Peak (രാത്രി 10 മുതൽ രാവിലെ 6 വരെ) — നിങ്ങളുടെ മീറ്റർ പ്രത്യേകം രേഖപ്പെടുത്തുന്ന മൂന്ന് സമയമേഖലകൾ. താഴെയുള്ള ഓരോ വരിക്കും അതിന്റേതായ T1/T2/T3 വിഭജനം കാണിച്ചിട്ടുണ്ട്.`,
    )] : [];

    return [
        ...todNoteRow,
        dataRow({
            label: 'Solar Generation',
            detail: `${u(bill.solarGeneration)} units${solarBreakdown}`,
            en: `the electricity your rooftop panels produced this month, as read directly off your solar generation meter.`,
            ml: `ഈ മാസം നിങ്ങളുടെ മേൽക്കൂരയിലെ സോളാർ പാനലുകൾ ഉത്പാദിപ്പിച്ച വൈദ്യുതി, സോളാർ ജനറേഷൻ മീറ്ററിൽ നിന്നും എടുത്തത്.`,
        }),
        dataRow({
            label: 'Import Total',
            detail: `${u(bill.importReading)} units${importBreakdown}`,
            en: `the electricity you drew from the KSEB grid — the part of your usage that your own solar power didn't cover.`,
            ml: `KSEB ഗ്രിഡിൽ നിന്ന് നിങ്ങൾ ഉപയോഗിച്ച വൈദ്യുതി — നിങ്ങളുടെ സ്വന്തം സോളാർ കവർ ചെയ്യാതെ പോയ ഭാഗം.`,
        }),
        dataRow({
            label: 'Export Total',
            detail: `${u(bill.exportReading)} units${exportBreakdown}`,
            en: `solar power your panels generated but you didn't use immediately at home, so it was sent back out to the KSEB grid instead.`,
            ml: `നിങ്ങളുടെ പാനലുകൾ ഉത്പാദിപ്പിച്ചെങ്കിലും വീട്ടിൽ ഉപയോഗിക്കാതെ, പകരം KSEB ഗ്രിഡിലേക്ക് തിരികെ അയച്ച സോളാർ വൈദ്യുതി.`,
        }),
        dataRow({
            label: 'Direct Usage from Solar',
            detail: `${u(bill.generationUsage)} units`,
            en: `Solar Generation − Export = ${u(bill.solarGeneration)} − ${u(bill.exportReading)} = ${u(bill.generationUsage)} units — the share of your own solar power you actually used directly, without it ever leaving for the grid.`,
            ml: `Solar Generation − Export = ${u(bill.solarGeneration)} − ${u(bill.exportReading)} = ${u(bill.generationUsage)} യൂണിറ്റ് — ഗ്രിഡിലേക്ക് പോകാതെ നിങ്ങൾ നേരിട്ട് ഉപയോഗിച്ച സ്വന്തം സോളാർ വൈദ്യുതിയുടെ അളവ്.`,
        }),
        dataRow({
            label: 'Total Consumption',
            detail: `${u(bill.unitsConsumed)} units`,
            en: `Direct Usage from Solar + Import = ${u(bill.generationUsage)} + ${u(bill.importReading)} = ${u(bill.unitsConsumed)} units — your household's full electricity usage for the month, used to work out your Fixed Charge below.`,
            ml: `Direct Usage from Solar + Import = ${u(bill.generationUsage)} + ${u(bill.importReading)} = ${u(bill.unitsConsumed)} യൂണിറ്റ് — ഈ മാസത്തെ നിങ്ങളുടെ വീടിന്റെ മൊത്തം വൈദ്യുതി ഉപയോഗം, താഴെയുള്ള Fixed Charge കണക്കാക്കാൻ ഉപയോഗിക്കുന്ന കണക്ക്.`,
        }),
    ];
}

function fixedChargeAndRentItems(bill) {
    const phaseLabel = bill.phase === 'phase1' ? 'Phase 1' : 'Phase 3';
    return [
        dataRow({
            label: 'Fixed Charge',
            detail: m(bill.fixedCharge),
            amountValue: bill.fixedCharge,
            isCharge: true,
            en: `a flat monthly charge KSEB collects just for having a connection at all — it doesn't depend on your solar or your rate slab, only on your Total Consumption (${u(bill.unitsConsumed)} units) and your connection's phase (${phaseLabel}).`,
            ml: `കണക്ഷൻ ഉള്ളതിന് മാത്രമായി KSEB പ്രതിമാസം ഈടാക്കുന്ന ഒരു നിശ്ചിത ചാർജ് — ഇത് സോളാറിനെയോ റേറ്റ് സ്ലാബിനെയോ ആശ്രയിക്കുന്നില്ല, പകരം നിങ്ങളുടെ Total Consumption (${u(bill.unitsConsumed)} യൂണിറ്റ്), കണക്ഷന്റെ Phase (${phaseLabel}) എന്നിവയെ മാത്രം ആശ്രയിച്ചിരിക്കുന്നു.`,
        }),
        dataRow({
            label: 'Meter Rent',
            detail: m(bill.meterRent),
            amountValue: bill.meterRent,
            isCharge: true,
            en: `a small monthly rental fee for the meter itself — this only applies if KSEB owns the meter installed at your premises; it's ₹0 if you own your meter.`,
            ml: `മീറ്ററിന് വേണ്ടിയുള്ള ചെറിയൊരു പ്രതിമാസ വാടക — നിങ്ങളുടെ സ്ഥലത്തുള്ള മീറ്റർ KSEB-യുടേതാണെങ്കിൽ മാത്രമേ ഇത് ബാധകമാകൂ; മീറ്റർ സ്വന്തമാണെങ്കിൽ ഇത് ₹0 ആയിരിക്കും.`,
        }),
    ];
}

// Shared by energyChargeItems() (Non-Telescopic-ToD's inline zone summary)
// and todNettingItems() (the fuller ToD Calculation Explained walkthrough)
// -- both need the same above/below-20kW-aware per-zone units/rate/charge
// fields, just narrated at different levels of detail.
function getTodZoneBreakdown(bill) {
    const above20kW = bill.todBillingAbove20kW > 0;
    const normalUnits = bill.Normal_NoOfUnitsFor_energy_calculation;
    const peakUnits = above20kW ? bill.Peak_NoOfUnitsFor_energy_calculation : bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW;
    const offPeakUnits = above20kW ? bill.OffPeak_NoOfUnitsFor_energy_calculation : bill.OffPeak_NoOfUnitsFor_energy_calculation_Below20kW;
    const totalUnits = above20kW ? bill.bankAdjustedUnits : bill.bankAdjustedUnits_Below20kW;
    const energyCharge = above20kW ? bill.energyCharge : bill.energyCharge_Below20kW;
    const unitRate = above20kW ? bill.unitRate : bill.unitRate_Below20kW;
    const normalRate = unitRate * TOD_MULTIPLIERS.normal;
    const peakRate = unitRate * TOD_MULTIPLIERS.peak;
    const normalCharge = bill.NormalConsumptionAdjusted_energy_charge;
    const peakCharge = above20kW ? bill.PeakConsumptionAdjusted_energy_charge : bill.PeakConsumptionAdjusted_energy_charge_Below20kW;
    const offPeakCharge = above20kW ? bill.OffPeakConsumptionAdjusted_energy_charge : bill.OffPeakConsumptionAdjusted_energy_charge_Below20kW;
    return {
        above20kW, normalUnits, peakUnits, offPeakUnits, totalUnits, energyCharge,
        unitRate, normalRate, peakRate, normalCharge, peakCharge, offPeakCharge,
    };
}

function energyChargeItems(bill) {
    if (bill.bankAdjustedUnits <= 0) {
        return [wideRow(
            `<strong>No Energy Charge this period:</strong> your Export + Banked units (${u(bill.exportPlusBank)}) fully covered your Import (${u(bill.importReading)}), so there were zero units left to bill for energy — no Energy Charge, Duty, or Fuel Surcharge apply. ${bill.accountBalance > 0 ? `The leftover ${u(bill.accountBalance)} units carry forward as your banked balance for next time.` : ''}`,
            `<strong>ഈ പിരീഡിൽ Energy Charge ഇല്ല:</strong> നിങ്ങളുടെ Export + Banked units (${u(bill.exportPlusBank)}) Import-നെ (${u(bill.importReading)}) പൂർണ്ണമായി കവർ ചെയ്തതിനാൽ, ബില്ല് ചെയ്യാൻ ഒരു യൂണിറ്റ് പോലും ബാക്കിയില്ല — Energy Charge, Duty, Fuel Surcharge എന്നിവയൊന്നും ബാധകമല്ല. ${bill.accountBalance > 0 ? `ബാക്കിയുള്ള ${u(bill.accountBalance)} യൂണിറ്റ് അടുത്ത തവണത്തേക്ക് ബാങ്ക് ബാലൻസായി തുടരും.` : ''}`,
        )];
    }

    const items = [
        dataRow({
            label: 'Units for Energy Calculation',
            detail: `${u(bill.bankAdjustedUnits)} units`,
            en: `before charging you for energy, KSEB first offsets your Import against your Export and any banked (saved-up) units from earlier months. What's left after that offset is what you're actually billed for.`,
            ml: `എനർജിക്ക് ചാർജ് ചെയ്യുന്നതിന് മുൻപ്, KSEB നിങ്ങളുടെ Import-നെ Export-ഉം മുൻ മാസങ്ങളിലെ ബാങ്ക് യൂണിറ്റുകളും ഉപയോഗിച്ച് ആദ്യം തട്ടിക്കിഴിക്കുന്നു. അതിന് ശേഷം ബാക്കിയുള്ളതാണ് നിങ്ങൾക്ക് യഥാർത്ഥത്തിൽ ബില്ല് ചെയ്യുന്നത്.`,
        }),
    ];

    if (bill.billType === 'Non-Telescopic' || bill.billType === 'Non-Telescopic-ToD') {
        let zoneLinesEn = '';
        let zoneLinesMl = '';
        if (bill.billType === 'Non-Telescopic-ToD') {
            // Spell out each zone's own units/multiplier/charge, one per
            // line, instead of just pointing back at the Bill Type row --
            // same values as the T1/T2/T3 Energy Charge rows below, just
            // summarized together here.
            const z = getTodZoneBreakdown(bill);
            zoneLinesEn = `<br>Normal (T1, 6am–6pm): ${u(z.normalUnits)} units @ 90% = ${m(z.normalCharge)}`
                + `<br>Peak (T2, 6pm–10pm): ${u(z.peakUnits)} units @ 125% = ${m(z.peakCharge)}`
                + `<br>Off-Peak (T3, 10pm–6am): ${u(z.offPeakUnits)} units @ 100% = ${m(z.offPeakCharge)}`
                + `<br>Total = ${mc(z.energyCharge)}`;
            zoneLinesMl = `<br>Normal (T1, രാവിലെ 6–വൈകിട്ട് 6): ${u(z.normalUnits)} യൂണിറ്റ് @ 90% = ${m(z.normalCharge)}`
                + `<br>Peak (T2, വൈകിട്ട് 6–രാത്രി 10): ${u(z.peakUnits)} യൂണിറ്റ് @ 125% = ${m(z.peakCharge)}`
                + `<br>Off-Peak (T3, രാത്രി 10–രാവിലെ 6): ${u(z.offPeakUnits)} യൂണിറ്റ് @ 100% = ${m(z.offPeakCharge)}`
                + `<br>ആകെ = ${mc(z.energyCharge)}`;
        }
        items.push(dataRow({
            label: 'Energy Charge',
            detail: m(bill.energyCharge),
            amountValue: bill.energyCharge,
            isCharge: true,
            en: `at ${m(bill.unitRate)}/unit, since your units exceed 250, every one of your ${u(bill.bankAdjustedUnits)} billed units is charged at this single flat rate for your band${bill.billType === 'Non-Telescopic-ToD' ? ', then adjusted up or down depending on which time-of-day zone each unit falls in:' : '.'}${zoneLinesEn}`,
            ml: `${m(bill.unitRate)}/യൂണിറ്റ് നിരക്കിൽ, യൂണിറ്റുകൾ 250-ൽ കൂടുതലായതിനാൽ, നിങ്ങളുടെ ${u(bill.bankAdjustedUnits)} ബില്ല് യൂണിറ്റുകളും ഈ ഒറ്റ നിരക്കിലാണ് ചാർജ് ചെയ്യുന്നത്${bill.billType === 'Non-Telescopic-ToD' ? ', ഓരോ യൂണിറ്റും ഏത് സമയ മേഖലയിലാണെന്നത് അനുസരിച്ച് പിന്നീട് കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യും:' : '.'}${zoneLinesMl}`,
        }));
    } else {
        // Spell out the actual per-slab arithmetic, one slab per line (e.g.
        // "50.00 units × ₹3.35/unit = ₹167.50"), instead of pointing the
        // reader at a separate table, so the calculation is legible in this
        // row alone.
        const rows = bill.breakdownRows || [];
        const slabLinesEn = rows.map((r) => `${u(r.units)} units × ${m(r.rate)}/unit = ${m(r.amount)}`).join('<br>');
        const slabLinesMl = rows.map((r) => `${u(r.units)} യൂണിറ്റ് × ${m(r.rate)}/യൂണിറ്റ് = ${m(r.amount)}`).join('<br>');
        items.push(dataRow({
            label: 'Energy Charge',
            detail: m(bill.energyCharge),
            amountValue: bill.energyCharge,
            isCharge: true,
            en: `your ${u(bill.bankAdjustedUnits)} units are split across the telescopic price slabs, each billed at that slab's own rate:<br>${slabLinesEn}<br>Total = ${mc(bill.energyCharge)}.`,
            ml: `നിങ്ങളുടെ ${u(bill.bankAdjustedUnits)} യൂണിറ്റുകൾ telescopic സ്ലാബുകളായി തിരിച്ച്, ഓരോ സ്ലാബും അതിന്റെ സ്വന്തം നിരക്കിൽ ചാർജ് ചെയ്യുന്നു:<br>${slabLinesMl}<br>ആകെ = ${mc(bill.energyCharge)}.`,
        }));
    }

    items.push(dataRow({
        label: 'Duty',
        detail: m(bill.duty),
        amountValue: bill.duty,
        isCharge: true,
        en: `${pct(bill.dutyRate)} of Energy Charge — the Kerala Electricity Duty, a state tax calculated as a percentage of your Energy Charge, not on your whole bill.`,
        ml: `Energy Charge-ന്റെ ${pct(bill.dutyRate)} — ഇത് Kerala Electricity Duty ആണ്, Energy Charge-ന്റെ ശതമാനമായി കണക്കാക്കുന്ന ഒരു സംസ്ഥാന നികുതി, മുഴുവൻ ബില്ലിന്റെയുമല്ല.`,
    }));

    items.push(dataRow({
        label: 'Monthly Fuel Surcharge',
        detail: m(bill.monthlyFuelSurcharge),
        amountValue: bill.monthlyFuelSurcharge,
        isCharge: true,
        en: `${u(bill.bankAdjustedUnits)} units × ${ps(bill.fuelSurchargePerUnit)} — an extra per-unit charge KSEB adds on top to cover changing fuel costs for power generation.`,
        ml: `${u(bill.bankAdjustedUnits)} യൂണിറ്റ് × ${ps(bill.fuelSurchargePerUnit)} — വൈദ്യുതി ഉത്പാദനത്തിന്റെ ഇന്ധനച്ചെലവിലെ വ്യതിയാനം നികത്താൻ KSEB അധികമായി ഈടാക്കുന്ന ഒരു യൂണിറ്റ്-അടിസ്ഥാന ചാർജ്.`,
    }));

    return items;
}

function wheelingItem(bill) {
    if (!bill.wheelingResult || !(bill.wheelingResult.wheelingCharge > 0)) return null;
    const siteCount = bill.wheelingResult.sites.length;
    return dataRow({
        label: 'Wheeling Charge',
        detail: m(bill.wheelingResult.wheelingCharge),
        amountValue: bill.wheelingResult.wheelingCharge,
        isCharge: true,
        en: `you chose to transfer some of your banked solar units to <strong>${siteCount}</strong> other connection${siteCount === 1 ? '' : 's'}, and KSEB charges a small per-unit fee for "wheeling" (transporting) that power through their network to reach them.`,
        ml: `നിങ്ങളുടെ ബാങ്ക് ചെയ്ത സോളാർ യൂണിറ്റുകളിൽ ചിലത് മറ്റ് <strong>${siteCount}</strong> കണക്ഷനുകളിലേക്ക് കൈമാറാൻ തിരഞ്ഞെടുത്തതിനാൽ, ആ വൈദ്യുതി KSEB-യുടെ ശൃംഖലയിലൂടെ "wheel" ചെയ്ത് എത്തിക്കുന്നതിന് ഒരു ചെറിയ യൂണിറ്റ്-അടിസ്ഥാന ചാർജ് ഈടാക്കുന്നു.`,
    });
}

function totalItem(bill) {
    const parts = ['Fixed Charge', 'Meter Rent'];
    if (bill.bankAdjustedUnits > 0) parts.push('Energy Charge', 'Duty', 'Fuel Surcharge');
    if (bill.wheelingResult && bill.wheelingResult.wheelingCharge > 0) parts.push('Wheeling Charge');
    const partsList = parts.join(' + ');
    return dataRow({
        label: 'Total Bill Amount',
        detail: m(bill.totalBillAmount),
        amountValue: bill.totalBillAmount,
        isCharge: true,
        en: `${partsList} — everything above, added together.`,
        ml: `${partsList} — മുകളിൽ പറഞ്ഞവയെല്ലാം കൂട്ടിച്ചേർത്തത്.`,
    });
}

// Walks through the T1/T2/T3 netting algorithm those dense adjustment
// tables (js/render-tables.js) actually implement -- export+bank offsets
// Normal import first, only 80% of any leftover carries into Peak (above
// 20kW connections only -- see calculator.js's computeTodBelow20kWAbove250
// comment on why that 80% cut doesn't apply below 20kW), then whatever's
// left after Peak carries fully into Off-Peak.
function todNettingItems(bill) {
    // Same per-zone rate/charge fields the Energy Calculation Details table
    // (getEnergyCaluculationMessage in render-tables.js) is built from --
    // narrated here in prose with the bill's own numbers plugged in, instead
    // of read off a 4-column table, so the arithmetic is easy to follow.
    const {
        above20kW, normalUnits, peakUnits, offPeakUnits, totalUnits, energyCharge,
        unitRate, normalRate, peakRate, normalCharge, peakCharge, offPeakCharge,
    } = getTodZoneBreakdown(bill);

    const carryoverRow = above20kW
        ? wideRow(
            `<strong>Only 80% carries forward into Peak:</strong> whatever's left over after offsetting Normal doesn't carry into Peak at full value — only 80% of it does. This is KSEB's rule for connections above 20kW, so your solar surplus stretches a little less far into covering Peak-hour usage.`,
            `<strong>Peak-ലേക്ക് 80% മാത്രം കൈമാറും:</strong> Normal-നെതിരെ തട്ടിക്കിഴിച്ചതിന് ശേഷം ബാക്കിയാവുന്നത് മുഴുവനും Peak-ലേക്ക് കൈമാറില്ല — അതിന്റെ 80% മാത്രമേ കൈമാറൂ. 20kW-ന് മുകളിലുള്ള കണക്ഷനുകൾക്കുള്ള KSEB-യുടെ നിയമമാണിത്, ഇത് നിങ്ങളുടെ സോളാർ മിച്ചം Peak-സമയ ഉപയോഗം കവർ ചെയ്യുന്നതിൽ അല്പം കുറവ് വരുത്തും.`,
        )
        : wideRow(
            `<strong>Full carryover into Peak (no 80% cut):</strong> for connections at or below 20kW, the entire Normal leftover carries into Peak at full value — unlike above-20kW connections, there's no 80% reduction here.`,
            `<strong>Peak-ലേക്ക് പൂർണ്ണമായി കൈമാറും (80% കുറവ് ഇല്ല):</strong> 20kW-യോ അതിൽ താഴെയോ ഉള്ള കണക്ഷനുകൾക്ക്, Normal-ൽ നിന്ന് ബാക്കിയാവുന്നത് മുഴുവനും Peak-ലേക്ക് പൂർണ്ണമായി കൈമാറും — 20kW-ന് മുകളിലുള്ളവയിൽ നിന്ന് വ്യത്യസ്തമായി ഇവിടെ 80% കുറവ് ഇല്ല.`,
        );

    return [
        wideRow(
            `<strong>Three Time Zones, Three Rates:</strong> ToD billing splits your usage into T1 – Normal (6am–6pm, billed at 90% of the base rate), T2 – Peak (6pm–10pm, billed at 125% — electricity costs the most to supply then), and T3 – Off-Peak (10pm–6am, billed at the standard 100% rate).`,
            `<strong>മൂന്ന് സമയമേഖലകൾ, മൂന്ന് നിരക്കുകൾ:</strong> ToD ബില്ലിംഗ് നിങ്ങളുടെ ഉപയോഗത്തെ T1 – Normal (രാവിലെ 6 മുതൽ വൈകിട്ട് 6 വരെ, അടിസ്ഥാന നിരക്കിന്റെ 90%), T2 – Peak (വൈകിട്ട് 6 മുതൽ രാത്രി 10 വരെ, 125% — ഈ സമയത്ത് വൈദ്യുതി വിതരണച്ചെലവ് ഏറ്റവും കൂടുതലായതിനാൽ), T3 – Off-Peak (രാത്രി 10 മുതൽ രാവിലെ 6 വരെ, സാധാരണ 100% നിരക്ക്) എന്നിങ്ങനെ മൂന്നായി തിരിക്കുന്നു.`,
        ),
        wideRow(
            `<strong>Your Export + Bank offsets Import — in a strict order:</strong> KSEB doesn't net your solar export and banked units against your total import all at once. It offsets T1 (Normal) import first; anything left over next offsets T2 (Peak) import; and whatever remains after that finally offsets T3 (Off-Peak) import.`,
            `<strong>Export + Bank, Import-നെ ഒരു നിശ്ചിത ക്രമത്തിൽ തട്ടിക്കിഴിക്കുന്നു:</strong> നിങ്ങളുടെ സോളാർ export ഉം ബാങ്ക് യൂണിറ്റുകളും മൊത്തം import-നെതിരെ ഒറ്റയടിക്ക് തട്ടിക്കിഴിക്കില്ല. ആദ്യം T1 (Normal) import-നെതിരെ തട്ടിക്കിഴിക്കും; ബാക്കിയുള്ളത് അടുത്തതായി T2 (Peak) import-നെതിരെയും; അതിന് ശേഷം ബാക്കിയുള്ളത് അവസാനം T3 (Off-Peak) import-നെതിരെയും തട്ടിക്കിഴിക്കും.`,
        ),
        carryoverRow,
        wideRow(
            `<strong>Whatever's still unmet after netting is what gets billed:</strong> in each zone, if your import is more than your export/bank could offset, the shortfall is charged at that zone's own rate — 90% for Normal, 125% for Peak, 100% for Off-Peak — and the three zones' charges add up to your total Energy Charge.`,
            `<strong>തട്ടിക്കിഴിച്ചതിന് ശേഷം ബാക്കിയുള്ളതാണ് ബില്ല് ചെയ്യുന്നത്:</strong> ഓരോ മേഖലയിലും, export/bank കൊണ്ട് തട്ടിക്കിഴിക്കാൻ കഴിയാത്തത്ര import ഉണ്ടെങ്കിൽ, ആ കുറവ് ആ മേഖലയുടെ സ്വന്തം നിരക്കിൽ ചാർജ് ചെയ്യും — Normal-ന് 90%, Peak-ന് 125%, Off-Peak-ന് 100% — ഈ മൂന്ന് മേഖലകളിലെയും ചാർജുകൾ കൂട്ടിച്ചേർത്താണ് നിങ്ങളുടെ ആകെ Energy Charge ലഭിക്കുന്നത്.`,
        ),
        dataRow({
            label: 'T1 (Normal) Billed Units',
            detail: `${u(normalUnits)} units`,
            en: `the portion of your Normal-hour usage left unmet after export/bank offset — this is what actually gets charged for T1.`,
            ml: `Export/Bank കൊണ്ട് തട്ടിക്കിഴിച്ചതിന് ശേഷം ബാക്കിയുള്ള T1 (Normal) ഉപയോഗം — ഇതാണ് T1-ന് യഥാർത്ഥത്തിൽ ചാർജ് ചെയ്യുന്നത്.`,
        }),
        dataRow({
            label: 'T2 (Peak) Billed Units',
            detail: `${u(peakUnits)} units`,
            en: `the portion of your Peak-hour usage left unmet after the carried-over export/bank offset — this is what actually gets charged for T2.`,
            ml: `കൈമാറ്റം ചെയ്ത Export/Bank കൊണ്ട് തട്ടിക്കിഴിച്ചതിന് ശേഷം ബാക്കിയുള്ള T2 (Peak) ഉപയോഗം — ഇതാണ് T2-ന് യഥാർത്ഥത്തിൽ ചാർജ് ചെയ്യുന്നത്.`,
        }),
        dataRow({
            label: 'T3 (Off-Peak) Billed Units',
            detail: `${u(offPeakUnits)} units`,
            en: `the portion of your Off-Peak usage left unmet after netting — this is what actually gets charged for T3.`,
            ml: `തട്ടിക്കിഴിച്ചതിന് ശേഷം ബാക്കിയുള്ള T3 (Off-Peak) ഉപയോഗം — ഇതാണ് T3-ന് യഥാർത്ഥത്തിൽ ചാർജ് ചെയ്യുന്നത്.`,
        }),
        dataRow({
            label: 'Base Unit Rate',
            detail: `${m(unitRate)}/unit`,
            en: `KSEB starts from this single base rate for your ${u(totalUnits)} billed units, then adjusts it up or down per zone below.`,
            ml: `നിങ്ങളുടെ ${u(totalUnits)} ബില്ല് യൂണിറ്റുകൾക്ക് KSEB ഈ അടിസ്ഥാന നിരക്കിൽ നിന്ന് തുടങ്ങി, താഴെ ഓരോ മേഖലയ്ക്കും അത് കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യുന്നു.`,
        }),
        dataRow({
            label: 'T1 (Normal) Energy Charge',
            detail: m(normalCharge),
            amountValue: normalCharge,
            isCharge: true,
            en: `${u(normalUnits)} units × ${m(normalRate)} (90% of ${m(unitRate)}) — your Normal-hour billed units, charged at 90% of the base rate.`,
            ml: `${u(normalUnits)} യൂണിറ്റ് × ${m(normalRate)} (${m(unitRate)}-ന്റെ 90%) — നിങ്ങളുടെ Normal-സമയ ബില്ല് യൂണിറ്റുകൾ, അടിസ്ഥാന നിരക്കിന്റെ 90%-ത്തിൽ ചാർജ് ചെയ്തത്.`,
        }),
        dataRow({
            label: 'T2 (Peak) Energy Charge',
            detail: m(peakCharge),
            amountValue: peakCharge,
            isCharge: true,
            en: `${u(peakUnits)} units × ${m(peakRate)} (125% of ${m(unitRate)}) — Peak-hour units cost 25% more than the base rate, since electricity is priciest to supply during 6pm–10pm.`,
            ml: `${u(peakUnits)} യൂണിറ്റ് × ${m(peakRate)} (${m(unitRate)}-ന്റെ 125%) — Peak-സമയ യൂണിറ്റുകൾക്ക് അടിസ്ഥാന നിരക്കിനെക്കാൾ 25% അധികം ചെലവ് വരും.`,
        }),
        dataRow({
            label: 'T3 (Off-Peak) Energy Charge',
            detail: m(offPeakCharge),
            amountValue: offPeakCharge,
            isCharge: true,
            en: `${u(offPeakUnits)} units × ${m(unitRate)} (100%, the standard rate) — Off-Peak units are billed at the plain base rate, no premium or discount.`,
            ml: `${u(offPeakUnits)} യൂണിറ്റ് × ${m(unitRate)} (100%, സാധാരണ നിരക്ക്) — Off-Peak യൂണിറ്റുകൾ സാധാരണ അടിസ്ഥാന നിരക്കിൽ തന്നെ ചാർജ് ചെയ്യുന്നു.`,
        }),
        dataRow({
            label: 'Total Energy Charge',
            detail: m(energyCharge),
            amountValue: energyCharge,
            isCharge: true,
            en: `${mc(normalCharge)} + ${mc(peakCharge)} + ${mc(offPeakCharge)} — adding up all three zones' charges, before Duty and Fuel Surcharge are added on top.`,
            ml: `${mc(normalCharge)} + ${mc(peakCharge)} + ${mc(offPeakCharge)} — ഈ മൂന്ന് മേഖലകളിലെയും ചാർജുകൾ കൂട്ടിച്ചേർത്തത്, Duty, Fuel Surcharge എന്നിവ ഇനിയും കൂട്ടിച്ചേർക്കാനുണ്ട്.`,
        }),
        ...totalBillFromEnergyChargeItems(bill, energyCharge),
    ];
}

// Everything else that turns the Energy Charge above into the final Total
// Bill Amount -- Fixed Charge and Meter Rent are flat, independent of ToD
// zones; Duty and Fuel Surcharge scale off the SAME branch-aware
// energyCharge/totalUnits already resolved by the caller (so they always
// match, above 20kW or below).
function totalBillFromEnergyChargeItems(bill, energyCharge) {
    const wheelingCharge = bill.wheelingResult && bill.wheelingResult.wheelingCharge > 0 ? bill.wheelingResult.wheelingCharge : 0;
    const phaseLabel = bill.phase === 'phase1' ? 'Phase 1' : 'Phase 3';

    const parts = ['Fixed Charge', 'Meter Rent', 'Energy Charge', 'Duty', 'Fuel Surcharge'];
    if (wheelingCharge > 0) parts.push('Wheeling Charge');
    const partsList = parts.join(' + ');

    const items = [
        dataRow({
            label: 'Fixed Charge',
            detail: m(bill.fixedCharge),
            amountValue: bill.fixedCharge,
            isCharge: true,
            en: `a flat monthly charge based on your total consumption and connection phase (${phaseLabel}) — doesn't depend on the T1/T2/T3 split above.`,
            ml: `നിങ്ങളുടെ ആകെ ഉപയോഗവും കണക്ഷന്റെ Phase-ഉം (${phaseLabel}) അടിസ്ഥാനമാക്കിയുള്ള ഒരു നിശ്ചിത പ്രതിമാസ ചാർജ് — മുകളിലെ T1/T2/T3 വിഭജനത്തെ ആശ്രയിക്കുന്നില്ല.`,
        }),
        dataRow({
            label: 'Meter Rent',
            detail: m(bill.meterRent),
            amountValue: bill.meterRent,
            isCharge: true,
            en: `only applies if KSEB owns the meter at your premises; ₹0 if you own it.`,
            ml: `മീറ്റർ KSEB-യുടേതാണെങ്കിൽ മാത്രം ബാധകം; സ്വന്തം മീറ്ററാണെങ്കിൽ ₹0.`,
        }),
        dataRow({
            label: 'Duty',
            detail: m(bill.duty),
            amountValue: bill.duty,
            isCharge: true,
            en: `${pct(bill.dutyRate)} of Energy Charge (${mc(energyCharge)}) — the Kerala Electricity Duty, a state tax on just the energy portion of your bill.`,
            ml: `Energy Charge-ന്റെ (${mc(energyCharge)}) ${pct(bill.dutyRate)} — Kerala Electricity Duty, ബില്ലിന്റെ എനർജി ഭാഗത്തിന് മാത്രമുള്ള ഒരു സംസ്ഥാന നികുതി.`,
        }),
        dataRow({
            label: 'Monthly Fuel Surcharge',
            detail: m(bill.monthlyFuelSurcharge),
            amountValue: bill.monthlyFuelSurcharge,
            isCharge: true,
            en: `${u(bill.bankAdjustedUnits)} units × ${ps(bill.fuelSurchargePerUnit)} — an extra per-unit charge to cover changing fuel costs, applied to the same units billed for energy above.`,
            ml: `${u(bill.bankAdjustedUnits)} യൂണിറ്റ് × ${ps(bill.fuelSurchargePerUnit)} — ഇന്ധനച്ചെലവിലെ വ്യതിയാനം നികത്താൻ അധികമായി ഈടാക്കുന്ന ഒരു യൂണിറ്റ്-അടിസ്ഥാന ചാർജ്.`,
        }),
    ];

    if (wheelingCharge > 0) {
        const siteCount = bill.wheelingResult.sites.length;
        items.push(dataRow({
            label: 'Wheeling Charge',
            detail: m(wheelingCharge),
            amountValue: wheelingCharge,
            isCharge: true,
            en: `transferring banked solar units to <strong>${siteCount}</strong> other connection${siteCount === 1 ? '' : 's'} — KSEB's per-unit fee for "wheeling" that power through their network.`,
            ml: `ബാങ്ക് ചെയ്ത സോളാർ യൂണിറ്റുകൾ മറ്റ് <strong>${siteCount}</strong> കണക്ഷനുകളിലേക്ക് കൈമാറുന്നതിന് — ആ വൈദ്യുതി KSEB ശൃംഖലയിലൂടെ "wheel" ചെയ്യുന്നതിനുള്ള യൂണിറ്റ്-അടിസ്ഥാന ചാർജ്.`,
        }));
    }

    items.push(dataRow({
        label: 'Total Bill Amount',
        detail: m(bill.totalBillAmount),
        amountValue: bill.totalBillAmount,
        isCharge: true,
        en: `${partsList} — everything above, added together, is your final bill for this period.`,
        ml: `${partsList} — മുകളിൽ പറഞ്ഞവയെല്ലാം കൂട്ടിച്ചേർത്താൽ ലഭിക്കുന്നതാണ് ഈ പിരീഡിലെ നിങ്ങളുടെ അവസാന ബില്ല്.`,
    }));

    return items;
}

// Walks through wheeling-calculator.js's per-site algorithm: the bank
// surplus is offered to each site IN ORDER, distribution loss is deducted
// before it reaches a site, whatever's left over carries forward as the
// next site's opening balance, and the site is billed before/after to work
// out how much wheeling actually saved there. Narrated with the bill's own
// wheelingResult numbers so a multi-site transfer is easy to follow.
function wheelingNettingItems(wheelingResult) {
    const rows = [
        wideRow(
            `<strong>What is Wheeling?</strong> Wheeling lets you transfer your banked solar surplus to other KSEB connections you own or manage, so it offsets <em>their</em> bills instead of just sitting as your own banked credit. KSEB deducts a distribution loss for transporting that power through their network, and charges a small per-unit fee for the service.`,
            `<strong>എന്താണ് Wheeling?</strong> നിങ്ങളുടെ ബാങ്ക് ചെയ്ത സോളാർ മിച്ചം മറ്റ് KSEB കണക്ഷനുകളിലേക്ക് കൈമാറാൻ Wheeling അനുവദിക്കുന്നു — അത് നിങ്ങളുടെ സ്വന്തം ബാങ്ക് ബാലൻസായി കിടക്കുന്നതിന് പകരം <em>ആ കണക്ഷനുകളുടെ</em> ബില്ല് കുറയ്ക്കാൻ ഉപയോഗിക്കുന്നു. ആ വൈദ്യുതി ശൃംഖലയിലൂടെ എത്തിക്കുന്നതിന് KSEB ഒരു distribution loss കുറയ്ക്കുകയും, സേവനത്തിന് ഒരു ചെറിയ യൂണിറ്റ്-അടിസ്ഥാന ചാർജ് ഈടാക്കുകയും ചെയ്യുന്നു.`,
        ),
        wideRow(
            `<strong>Order and Carryover:</strong> your bank surplus is offered to each site in the order you listed them. Whatever's left at a site after its own distribution loss carries forward as the opening balance for the next site — so the order matters.`,
            `<strong>ക്രമവും കൈമാറ്റവും:</strong> നിങ്ങളുടെ ബാങ്ക് മിച്ചം നിങ്ങൾ ലിസ്റ്റ് ചെയ്ത ക്രമത്തിൽ തന്നെ ഓരോ സൈറ്റിനും നൽകുന്നു. ഒരു സൈറ്റിന്റെ സ്വന്തം distribution loss കഴിഞ്ഞ് ബാക്കിയാവുന്നത് അടുത്ത സൈറ്റിന്റെ ആരംഭ ബാലൻസായി കൈമാറും — അതിനാൽ ക്രമം പ്രധാനമാണ്.`,
        ),
    ];

    wheelingResult.sites.forEach((site) => {
        const siteName = escapeHtml(site.name);
        const transformerNote = site.sameTransformer ? 'same transformer' : 'a different transformer';
        const transformerNoteMl = site.sameTransformer ? 'ഒരേ transformer' : 'വ്യത്യസ്ത transformer';
        rows.push(
            dataRow({
                label: `${siteName} — Bank Available`,
                detail: `${u(site.bankOpening)} units`,
                en: `the balance offered to this site before any loss is deducted — either your own closing bank surplus (for the first site) or whatever the previous site left over.`,
                ml: `നഷ്ടം കുറയ്ക്കുന്നതിന് മുൻപ് ഈ സൈറ്റിന് നൽകുന്ന ബാലൻസ് — ആദ്യ സൈറ്റിനെങ്കിൽ നിങ്ങളുടെ സ്വന്തം ബാങ്ക് മിച്ചം, അല്ലെങ്കിൽ മുൻ സൈറ്റിൽ നിന്ന് ബാക്കിയായത്.`,
            }),
            dataRow({
                label: `${siteName} — After ${site.distLossPct}% Distribution Loss`,
                detail: `${u(site.availableForWheeling)} units`,
                en: `${u(site.bankOpening)} × (100% − <strong>${site.distLossPct}%</strong>) = ${u(site.availableForWheeling)} units — this site is on ${transformerNote}, so KSEB deducts <strong>${site.distLossPct}%</strong> for the transport before any of it can be wheeled.`,
                ml: `${u(site.bankOpening)} × (100% − <strong>${site.distLossPct}%</strong>) = ${u(site.availableForWheeling)} യൂണിറ്റ് — ഈ സൈറ്റ് ${transformerNoteMl} ആയതിനാൽ, wheel ചെയ്യുന്നതിന് മുൻപ് തന്നെ KSEB <strong>${site.distLossPct}%</strong> transport-നായി കുറയ്ക്കുന്നു.`,
            }),
            dataRow({
                label: `${siteName} — Units Wheeled`,
                detail: `${u(site.wheelingUnitsAdjusted)} units`,
                en: `the smaller of what's available (${u(site.availableForWheeling)} units) and what this site actually consumed (${u(site.totalSiteUnits)} units) — you can't wheel in more than the site needs.`,
                ml: `ലഭ്യമായത് (${u(site.availableForWheeling)} യൂണിറ്റ്), ഈ സൈറ്റ് യഥാർത്ഥത്തിൽ ഉപയോഗിച്ചത് (${u(site.totalSiteUnits)} യൂണിറ്റ്) എന്നിവയിൽ ചെറുത് — സൈറ്റിന് ആവശ്യമുള്ളതിലും കൂടുതൽ wheel ചെയ്യാനാവില്ല.`,
            }),
            dataRow({
                label: `${siteName} — Savings`,
                detail: m(site.saving),
                amountValue: site.saving,
                favorable: true,
                en: `billed before wheeling (${m(site.before.total)}) minus billed after wheeling (${m(site.after.total)}) — how much this site's own bill dropped because of the units wheeled to it.`,
                ml: `wheeling-ന് മുൻപ് ബില്ല് ചെയ്തത് (${m(site.before.total)}) മൈനസ് wheeling-ന് ശേഷം ബില്ല് ചെയ്തത് (${m(site.after.total)}) — wheel ചെയ്ത യൂണിറ്റുകൾ കാരണം ഈ സൈറ്റിന്റെ സ്വന്തം ബില്ലിൽ ഉണ്ടായ കുറവ്.`,
            }),
        );
    });

    rows.push(
        dataRow({
            label: 'Total Units Wheeled',
            detail: `${u(wheelingResult.totalAdjustedUnits)} units`,
            en: `the sum of the units actually wheeled across all sites above.`,
            ml: `മുകളിലെ എല്ലാ സൈറ്റുകളിലേക്കും യഥാർത്ഥത്തിൽ wheel ചെയ്ത യൂണിറ്റുകളുടെ ആകെത്തുക.`,
        }),
        dataRow({
            label: 'Total Energy Lost in Transit',
            detail: `${u(wheelingResult.totalEnergyLost)} units`,
            en: `bank units that never reached any site and never came back to you either — consumed entirely by distribution loss along the way.`,
            ml: `ഒരു സൈറ്റിലും എത്താതെയും തിരികെ നിങ്ങൾക്ക് ലഭിക്കാതെയും distribution loss ആയി പൂർണ്ണമായി നഷ്ടപ്പെട്ട ബാങ്ക് യൂണിറ്റുകൾ.`,
        }),
        dataRow({
            label: 'Total Savings at Wheeled Sites',
            detail: m(wheelingResult.totalSaving),
            amountValue: wheelingResult.totalSaving,
            favorable: true,
            en: `adding up every site's individual savings above — the combined benefit of wheeling, before its own charge is deducted below.`,
            ml: `മുകളിലെ ഓരോ സൈറ്റിന്റെയും savings കൂട്ടിച്ചേർത്തത് — Wheeling-ന്റെ ആകെ പ്രയോജനം, താഴെയുള്ള അതിന്റെ സ്വന്തം ചാർജ് കുറയ്ക്കുന്നതിന് മുൻപ്.`,
        }),
        dataRow({
            label: 'Wheeling Charge',
            detail: m(wheelingResult.wheelingCharge),
            amountValue: wheelingResult.wheelingCharge,
            isCharge: true,
            en: `(${u(wheelingResult.totalAdjustedUnits)} units wheeled + ${u(wheelingResult.totalEnergyLost)} units lost) × ${m(wheelingResult.wheelingRatePerUnit)}/unit — KSEB charges this fee on both the units that reached a site AND the units lost in transit, added to your own bill above.`,
            ml: `(wheel ചെയ്ത ${u(wheelingResult.totalAdjustedUnits)} യൂണിറ്റ് + നഷ്ടപ്പെട്ട ${u(wheelingResult.totalEnergyLost)} യൂണിറ്റ്) × ${m(wheelingResult.wheelingRatePerUnit)}/യൂണിറ്റ് — സൈറ്റിൽ എത്തിയ യൂണിറ്റുകൾക്കും transit-ൽ നഷ്ടപ്പെട്ട യൂണിറ്റുകൾക്കും KSEB ഈ ചാർജ് ഈടാക്കുന്നു, ഇത് നിങ്ങളുടെ സ്വന്തം ബില്ലിലേക്ക് കൂട്ടിച്ചേർക്കും.`,
        }),
    );

    return rows;
}

// Shared by both panels below -- keeps the table look, the language toggle,
// and the red-highlight-if-charged convention identical between them.
const EXPLAIN_STYLE_BLOCK = `
    <style>
        .bill-explain-lang-toggle { display: flex; gap: 8px; padding: 0 0 12px; }
        .bill-explain-lang-toggle .bill-explain-lang-btn {
            font: inherit; font-size: 11.5px; font-weight: 600; padding: 3px 10px;
            border: 1px solid var(--border); border-radius: 14px;
            background: var(--surface-muted); color: var(--text-secondary); cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .bill-explain-lang-toggle .bill-explain-lang-btn:hover { transform: translateY(-1px); }
        .bill-explain-lang-toggle .bill-explain-lang-btn.active {
            background: linear-gradient(180deg, var(--primary), var(--primary-dark));
            border-color: var(--primary); color: #fff; box-shadow: var(--shadow-sm);
        }
        /* Amount text like "400.00 units (T1: 300.00 + T2: 60.00 + T3:
           40.00)" is too long to force onto one line on a narrow screen --
           this wrapper is the fallback if the column ever still can't fit
           its content, so the table scrolls instead of the whole page. */
        .bill-explain-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .bill-explain-table { width: 100%; min-width: 280px; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
        .bill-explain-table th {
            text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em;
            color: var(--text-muted); padding: 6px 10px; border: 1px solid var(--border); background: var(--surface-muted);
        }
        .bill-explain-table td { padding: 10px; border: 1px solid var(--border); vertical-align: top; overflow-wrap: break-word; }
        /* Scoped to the label specifically (not a bare "td strong" rule) --
           the value below it has its own <strong> tags, sometimes nested in
           a .red-text/.green-text span, and a bare descendant selector here
           would win on specificity over that span's color and silently
           override it back to text-primary. */
        .bill-explain-desc-label { color: var(--text-primary); }
        /* The row's value, shown once right under the label -- ahead of the
           explanation sentence below it -- so a number is easy to match to
           its own row without a separate Amount column to eye-jump to. */
        .bill-explain-desc-value { font-size: 13.5px; font-weight: 600; margin: 3px 0 4px; color: var(--text-primary); }
        .bill-explain-desc-text { font-size: 12px; font-weight: 400; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }
        .bill-explain-wide { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .bill-explain-wide strong { color: var(--text-primary); }
    </style>`;

// Only meaningful for the real T1/T2/T3 split path (billingType 'tod' with
// todType NOT 'normal' -- Telescopic-ToD has no separate timezone netting
// to explain, same simple slabs as Normal billing). Reuses the exact same
// bill-explain-lang-* classes/markup shape as buildBillExplanation() below
// so it's styled by that panel's <style> block and picked up by the same
// kind of event-delegated language toggle in main.js -- it deliberately
// doesn't repeat that <style> block here, since buildBillExplanation()
// always renders alongside this on any valid bill (both gate on
// bill.totalBillAmount), so the shared classes are already styled once.
// Returns raw content only (no card/box wrapper) -- render-results.js
// nests this inside the single outer "ToD Calculation Explained" box
// alongside the header table and the T1/T2/T3/Energy cards.
export function buildTodCalculationExplanation(bill) {
    if (!bill || bill.billingType !== 'tod' || bill.todType === 'normal') return '';

    const rows = todNettingItems(bill);
    const englishTable = buildExplainTable(rows, 'en');
    const malayalamTable = buildExplainTable(rows, 'ml');

    return `
        <div class="bill-explain-lang-toggle" role="group" aria-label="ToD calculation explanation language">
            <button type="button" class="bill-explain-lang-btn active" data-bill-lang="ml">മലയാളം</button>
            <button type="button" class="bill-explain-lang-btn" data-bill-lang="en">English</button>
        </div>
        <div data-bill-lang-content="en" hidden>${englishTable}</div>
        <div data-bill-lang-content="ml" lang="ml">${malayalamTable}</div>`;
}

// Only meaningful when a wheeling transfer actually happened this bill.
// Reuses the same bill-explain-lang-* markup/classes as the other two
// panels, styled by buildBillExplanation()'s shared <style> block -- which
// always renders on the same page as this one, since both this panel and
// renderWheelingResult() (the raw per-site table it sits alongside) are
// gated on the same bill.wheelingResult.sites.length check.
export function buildWheelingCalculationExplanation(bill) {
    // Same gate as renderWheelingResult() in render-wheeling.js -- units
    // actually wheeled, not just sites configured (see the comment there).
    if (!bill || !bill.wheelingResult || !bill.wheelingResult.sites || bill.wheelingResult.totalAdjustedUnits <= 0) return '';

    const rows = wheelingNettingItems(bill.wheelingResult);
    const englishTable = buildExplainTable(rows, 'en');
    const malayalamTable = buildExplainTable(rows, 'ml');

    return `
        <div class="bill-chart">
            <h5><u>🗣️ Wheeling Summary Calculation Explained</u></h5>
            <div class="bill-explain-lang-toggle" role="group" aria-label="Wheeling calculation explanation language">
                <button type="button" class="bill-explain-lang-btn active" data-bill-lang="ml">മലയാളം</button>
                <button type="button" class="bill-explain-lang-btn" data-bill-lang="en">English</button>
            </div>
            <div data-bill-lang-content="en" hidden>${englishTable}</div>
            <div data-bill-lang-content="ml" lang="ml">${malayalamTable}</div>
        </div>`;
}

export function buildBillExplanation(bill) {
    if (!bill || !bill.totalBillAmount) return '';

    const rows = [
        billTypeItem(bill),
        ...usageItems(bill),
        ...fixedChargeAndRentItems(bill),
        ...energyChargeItems(bill),
        wheelingItem(bill),
        totalItem(bill),
    ].filter(Boolean);

    const englishTable = buildExplainTable(rows, 'en');
    const malayalamTable = buildExplainTable(rows, 'ml');

    // Toggle mirrors the "Solar - Frequently Asked Questions" language
    // switcher (same visual style, same Malayalam-by-default), but is
    // wired up via event delegation in main.js rather than bound directly
    // -- this panel's HTML is replaced fresh on every "Calculate Bill"
    // click, unlike the FAQ's static content, so direct listeners would be
    // lost on each recalculation.
    return `
        <div class="bill-chart">
            <h5><u>🗣️ Bill Explained in Simple Words</u></h5>
            <div class="bill-explain-lang-toggle" role="group" aria-label="Bill explanation language">
                <button type="button" class="bill-explain-lang-btn active" data-bill-lang="ml">മലയാളം</button>
                <button type="button" class="bill-explain-lang-btn" data-bill-lang="en">English</button>
            </div>
            <div data-bill-lang-content="en" hidden>${englishTable}</div>
            <div data-bill-lang-content="ml" lang="ml">${malayalamTable}</div>
            ${EXPLAIN_STYLE_BLOCK}
        </div>`;
}
