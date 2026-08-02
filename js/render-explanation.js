// Plain-language, bilingual (English + Malayalam) walkthrough of the Bill
// Summary table (js/render-explanation.js). One explanation per row, using
// the bill's own numbers, shown directly below the table so a
// non-technical reader can follow how the total was actually arrived at.
// Pure string builder from a `bill` object, same contract as the other
// render-*.js modules.

function u(n) {
    return `${(n || 0).toFixed(2)}`;
}
function m(n) {
    return `₹${(n || 0).toFixed(2)}`;
}
function pct(rate) {
    return `${+((rate || 0) * 100).toFixed(2)}%`;
}

function billTypeItem(bill) {
    const units = u(bill.bankAdjustedUnits);
    if (bill.billType === 'Telescopic') {
        return {
            en: `<strong>Bill Type — Telescopic:</strong> your billed units (${units}) are 250 or fewer, so KSEB splits your usage into small price slabs (0–50, 50–100, and so on) — like income tax slabs — and only the units inside each slab are charged at that slab's rate.`,
            ml: `<strong>Bill Type — Telescopic:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ താഴെയായതിനാൽ, KSEB നിങ്ങളുടെ ഉപയോഗം ചെറിയ സ്ലാബുകളായി (0–50, 50–100, ...) തിരിച്ച് ഓരോ സ്ലാബിലെയും യൂണിറ്റുകൾക്ക് ആ സ്ലാബിന്റെ നിരക്കിൽ മാത്രം ചാർജ് ചെയ്യുന്നു — ആദായനികുതി സ്ലാബുകൾ പോലെ.`,
        };
    }
    if (bill.billType === 'Non-Telescopic') {
        return {
            en: `<strong>Bill Type — Non-Telescopic:</strong> your billed units (${units}) are more than 250, so KSEB charges your <em>entire</em> consumption at a single flat rate, chosen by which band the total falls into — not slab by slab.`,
            ml: `<strong>Bill Type — Non-Telescopic:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ കൂടുതലായതിനാൽ, KSEB നിങ്ങളുടെ <em>മുഴുവൻ</em> ഉപയോഗവും ഒരൊറ്റ നിരക്കിൽ (total ഏത് ബാൻഡിൽ വരുന്നു എന്നതിനെ അടിസ്ഥാനമാക്കി) ചാർജ് ചെയ്യുന്നു — സ്ലാബ് തിരിച്ചല്ല.`,
        };
    }
    if (bill.billType === 'Telescopic-ToD') {
        return {
            en: `<strong>Bill Type — Telescopic-ToD:</strong> Your billed units (${units}) are 250 or fewer, KSEB applies the same simple slab-based pricing as Normal billing this time — no separate Peak/Off-Peak rates apply.`,
            ml: `<strong>Bill Type — Telescopic-ToD:</strong> ബില്ലിംഗിന് എടുക്കുന്ന യൂണിറ്റുകൾ (${units}) 250-ൽ താഴെയും ആയതിനാൽ, ഇത്തവണ Normal ബില്ലിംഗിലേതു പോലുള്ള ലളിതമായ സ്ലാബ് നിരക്കാണ് KSEB ഉപയോഗിക്കുന്നത് — പ്രത്യേകം Peak/Off-Peak നിരക്കുകൾ ബാധകമല്ല.`,
        };
    }
    if (bill.billType === 'Non-Telescopic-ToD') {
        return {
            en: `<strong>Bill Type — Non-Telescopic-ToD:</strong> your consumption is split by time of day. Normal hours (6am–6pm) are billed at 90% of the base rate, Peak hours (6pm–10pm) cost more at 125% (electricity is priciest to supply then), and Off-Peak hours (10pm–6am) are billed at the standard 100% rate.`,
            ml: `<strong>Bill Type — Non-Telescopic-ToD:</strong> നിങ്ങളുടെ ഉപയോഗം സമയം അനുസരിച്ച് വിഭജിച്ചാണ് കണക്കാക്കുന്നത്. Normal സമയം (രാവിലെ 6 മുതൽ വൈകിട്ട് 6 വരെ) അടിസ്ഥാന നിരക്കിന്റെ 90%-ത്തിലും, Peak സമയം (വൈകിട്ട് 6 മുതൽ രാത്രി 10 വരെ) 125%-ത്തിലും (ഈ സമയത്ത് വൈദ്യുതി എത്തിക്കാൻ ചെലവ് കൂടുതലായതിനാൽ), Off-Peak സമയം (രാത്രി 10 മുതൽ രാവിലെ 6 വരെ) സാധാരണ 100% നിരക്കിലുമാണ് ചാർജ് ചെയ്യുന്നത്.`,
        };
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

    return [
        {
            en: `<strong>Solar Generation (${u(bill.solarGeneration)} units${solarBreakdown}):</strong> the electricity your rooftop panels produced this month, as read directly off your solar generation meter.`,
            ml: `<strong>Solar Generation (${u(bill.solarGeneration)} യൂണിറ്റ്${solarBreakdown}):</strong> ഈ മാസം നിങ്ങളുടെ മേൽക്കൂരയിലെ സോളാർ പാനലുകൾ ഉത്പാദിപ്പിച്ച വൈദ്യുതി, സോളാർ ജനറേഷൻ മീറ്ററിൽ നിന്നും എടുത്തത് .`,
        },
        {
            en: `<strong>Import Total (${u(bill.importReading)} units${importBreakdown}):</strong> the electricity you drew from the KSEB grid — the part of your usage that your own solar power didn't cover.`,
            ml: `<strong>Import Total (${u(bill.importReading)} യൂണിറ്റ്${importBreakdown}):</strong> KSEB ഗ്രിഡിൽ നിന്ന് നിങ്ങൾ നേരിട്ട് എടുത്ത് ഉപയോഗിച്ച വൈദ്യുതി — നിങ്ങളുടെ സ്വന്തം സോളാർ കവർ ചെയ്യാതെ പോയ ഭാഗം.`,
        },
        {
            en: `<strong>Export Total (${u(bill.exportReading)} units${exportBreakdown}):</strong> solar power your panels generated but you didn't use immediately at home, so it was sent back out to the KSEB grid instead.`,
            ml: `<strong>Export Total (${u(bill.exportReading)} യൂണിറ്റ്${exportBreakdown}):</strong> നിങ്ങളുടെ പാനലുകൾ ഉത്പാദിപ്പിച്ചെങ്കിലും വീട്ടിൽ ഉടനടി ഉപയോഗിക്കാതെ, പകരം KSEB ഗ്രിഡിലേക്ക് തിരികെ അയച്ച സോളാർ വൈദ്യുതി.`,
        },
        {
            en: `<strong>Direct Usage from Solar = Solar Generation − Export = ${u(bill.solarGeneration)} − ${u(bill.exportReading)} = ${u(bill.generationUsage)} units:</strong> this is the share of your own solar power that you actually used directly, without it ever leaving for the grid.`,
            ml: `<strong>Direct Usage from Solar = Solar Generation − Export = ${u(bill.solarGeneration)} − ${u(bill.exportReading)} = ${u(bill.generationUsage)} യൂണിറ്റ്:</strong> ഇത് ഗ്രിഡിലേക്ക് പോകാതെ നിങ്ങൾ നേരിട്ട് ഉപയോഗിച്ച സ്വന്തം സോളാർ വൈദ്യുതിയുടെ അളവാണ്.`,
        },
        {
            en: `<strong>Total Consumption = Direct Usage from Solar + Import = ${u(bill.generationUsage)} + ${u(bill.importReading)} = ${u(bill.unitsConsumed)} units:</strong> your household's full electricity usage for the month — this is the figure used to work out your Fixed Charge below.`,
            ml: `<strong>Total Consumption = Direct Usage from Solar + Import = ${u(bill.generationUsage)} + ${u(bill.importReading)} = ${u(bill.unitsConsumed)} യൂണിറ്റ്:</strong> ഈ മാസത്തെ നിങ്ങളുടെ വീടിന്റെ മൊത്തം വൈദ്യുതി ഉപയോഗം — താഴെയുള്ള Fixed Charge കണക്കാക്കാൻ ഉപയോഗിക്കുന്ന കണക്കാണിത്.`,
        },
    ];
}

function fixedChargeAndRentItems(bill) {
    const phaseLabel = bill.phase === 'phase1' ? 'Phase 1' : 'Phase 3';
    return [
        {
            en: `<strong>Fixed Charge (${m(bill.fixedCharge)}):</strong> a flat monthly charge KSEB collects just for having a connection at all — it doesn't depend on your solar or your rate slab, only on your Total Consumption (${u(bill.unitsConsumed)} units) and your connection's phase (${phaseLabel}).`,
            ml: `<strong>Fixed Charge (${m(bill.fixedCharge)}):</strong> കണക്ഷൻ ഉള്ളതിന് മാത്രമായി KSEB പ്രതിമാസം ഈടാക്കുന്ന ഒരു നിശ്ചിത ചാർജ് — ഇത് സോളാറിനെയോ റേറ്റ് സ്ലാബിനെയോ ആശ്രയിക്കുന്നില്ല, പകരം നിങ്ങളുടെ Total Consumption (${u(bill.unitsConsumed)} യൂണിറ്റ്), കണക്ഷന്റെ Phase (${phaseLabel}) എന്നിവയെ മാത്രം ആശ്രയിച്ചിരിക്കുന്നു.`,
        },
        {
            en: `<strong>Meter Rent (${m(bill.meterRent)}):</strong> a small monthly rental fee for the meter itself — this only applies if KSEB owns the meter installed at your premises; it's ₹0 if you own your meter.`,
            ml: `<strong>Meter Rent (${m(bill.meterRent)}):</strong> മീറ്ററിന് വേണ്ടിയുള്ള ചെറിയൊരു പ്രതിമാസ വാടക — നിങ്ങളുടെ സ്ഥലത്തുള്ള മീറ്റർ KSEB-യുടേതാണെങ്കിൽ മാത്രമേ ഇത് ബാധകമാകൂ; മീറ്റർ സ്വന്തമാണെങ്കിൽ ഇത് ₹0 ആയിരിക്കും.`,
        },
    ];
}

function energyChargeItems(bill) {
    if (bill.bankAdjustedUnits <= 0) {
        return [{
            en: `<strong>No Energy Charge this period:</strong> your Export + Banked units (${u(bill.exportPlusBank)}) fully covered your Import (${u(bill.importReading)}), so there were zero units left to bill for energy — no Energy Charge, Duty, or Fuel Surcharge apply. ${bill.accountBalance > 0 ? `The leftover ${u(bill.accountBalance)} units carry forward as your banked balance for next time.` : ''}`,
            ml: `<strong>ഈ പിരീഡിൽ Energy Charge ഇല്ല:</strong> നിങ്ങളുടെ Export + Banked units (${u(bill.exportPlusBank)}) Import-നെ (${u(bill.importReading)}) പൂർണ്ണമായി കവർ ചെയ്തതിനാൽ, എനർജിക്ക് ബില്ല് ചെയ്യാൻ ഒരു യൂണിറ്റ് പോലും ബാക്കിയില്ല — Energy Charge, Duty, Fuel Surcharge എന്നിവയൊന്നും ബാധകമല്ല. ${bill.accountBalance > 0 ? `ബാക്കിയുള്ള ${u(bill.accountBalance)} യൂണിറ്റ് അടുത്ത തവണത്തേക്ക് ബാങ്ക് ബാലൻസായി തുടരും.` : ''}`,
        }];
    }

    const items = [{
        en: `<strong>No. of Units Consumed for Energy Calculation (${u(bill.bankAdjustedUnits)} units):</strong> before charging you for energy, KSEB first offsets your Import against your Export and any banked (saved-up) units from earlier months. What's left after that offset — ${u(bill.bankAdjustedUnits)} units here — is what you're actually billed for.`,
        ml: `<strong>Energy Calculation-നായി എടുക്കുന്ന യൂണിറ്റുകൾ (${u(bill.bankAdjustedUnits)} യൂണിറ്റ്):</strong> എനർജിക്ക് ചാർജ് ചെയ്യുന്നതിന് മുൻപ്, KSEB നിങ്ങളുടെ Import-നെ Export-ഉം മുൻ മാസങ്ങളിലെ ബാങ്ക് യൂണിറ്റുകളും ഉപയോഗിച്ച് ആദ്യം തട്ടിക്കിഴിക്കുന്നു. അതിന് ശേഷം ബാക്കിയുള്ളത് — ഇവിടെ ${u(bill.bankAdjustedUnits)} യൂണിറ്റ് — ആണ് നിങ്ങൾക്ക് യഥാർത്ഥത്തിൽ ബില്ല് ചെയ്യുന്നത്.`,
    }];

    if (bill.billType === 'Non-Telescopic' || bill.billType === 'Non-Telescopic-ToD') {
        items.push({
            en: `<strong>Unit Charge (${m(bill.unitRate)}/unit) and Energy Charge (${m(bill.energyCharge)}):</strong> since your units exceed 250, every one of your ${u(bill.bankAdjustedUnits)} billed units is charged at this single flat rate for your band${bill.billType === 'Non-Telescopic-ToD' ? ', then adjusted up or down depending on which time-of-day zone each unit falls in (see Bill Type above)' : ''}.`,
            ml: `<strong>Unit Charge (${m(bill.unitRate)}/യൂണിറ്റ്), Energy Charge (${m(bill.energyCharge)}):</strong> യൂണിറ്റുകൾ 250-ൽ കൂടുതലായതിനാൽ, നിങ്ങളുടെ ${u(bill.bankAdjustedUnits)} ബില്ല് യൂണിറ്റുകളും ഈ ഒറ്റ നിരക്കിലാണ് ചാർജ് ചെയ്യുന്നത്${bill.billType === 'Non-Telescopic-ToD' ? ', ഓരോ യൂണിറ്റും ഏത് സമയ മേഖലയിലാണെന്നത് അനുസരിച്ച് (മുകളിൽ Bill Type കാണുക) പിന്നീട് കൂട്ടുകയോ കുറയ്ക്കുകയോ ചെയ്യും' : ''}.`,
        });
    } else {
        items.push({
            en: `<strong>Unit Charge and Energy Charge (${m(bill.energyCharge)}):</strong> your ${u(bill.bankAdjustedUnits)} units are split across the telescopic price slabs (see the small rows above Energy Charge in the table) — each slab's units are charged at that slab's own rate, and the amounts add up to your total Energy Charge.`,
            ml: `<strong>Unit Charge, Energy Charge (${m(bill.energyCharge)}):</strong> നിങ്ങളുടെ ${u(bill.bankAdjustedUnits)} യൂണിറ്റുകൾ telescopic സ്ലാബുകളായി തിരിച്ചിരിക്കുന്നു (Energy Charge-ന് മുകളിലുള്ള ചെറിയ വരികൾ കാണുക) — ഓരോ സ്ലാബിലെയും യൂണിറ്റുകൾ ആ സ്ലാബിന്റെ നിരക്കിൽ ചാർജ് ചെയ്ത് ആകെ Energy Charge ആയി കൂട്ടിച്ചേർക്കുന്നു.`,
        });
    }

    items.push({
        en: `<strong>Duty (${pct(bill.dutyRate)} of Energy Charge = ${m(bill.duty)}):</strong> this is the Kerala Electricity Duty, a state tax calculated as a percentage of your Energy Charge — not on your whole bill, just the energy portion.`,
        ml: `<strong>Duty (Energy Charge-ന്റെ ${pct(bill.dutyRate)} = ${m(bill.duty)}):</strong> ഇത് Kerala Electricity Duty ആണ് — Energy Charge-ന്റെ ശതമാനമായി കണക്കാക്കുന്ന ഒരു സംസ്ഥാന നികുതി, മുഴുവൻ ബില്ലിന്റെയുമല്ല, എനർജി ഭാഗത്തിന്റെ മാത്രം.`,
    });

    items.push({
        en: `<strong>Monthly Fuel Surcharge (${u(bill.bankAdjustedUnits)} units × ${Math.round((bill.fuelSurchargePerUnit || 0) * 100)}ps = ${m(bill.monthlyFuelSurcharge)}):</strong> an extra per-unit charge KSEB adds on top to cover changing fuel costs for power generation, applied to the same units billed for energy above.`,
        ml: `<strong>Monthly Fuel Surcharge (${u(bill.bankAdjustedUnits)} യൂണിറ്റ് × ${Math.round((bill.fuelSurchargePerUnit || 0) * 100)}ps = ${m(bill.monthlyFuelSurcharge)}):</strong> വൈദ്യുതി ഉത്പാദനത്തിന്റെ ഇന്ധനച്ചെലവിലെ വ്യതിയാനം നികത്താൻ KSEB അധികമായി ഈടാക്കുന്ന ഒരു യൂണിറ്റ്-അടിസ്ഥാന ചാർജ്, മുകളിൽ എനർജിക്ക് ബില്ല് ചെയ്ത അതേ യൂണിറ്റുകൾക്ക് തന്നെ ബാധകം.`,
    });

    return items;
}

function wheelingItem(bill) {
    if (!bill.wheelingResult || !(bill.wheelingResult.wheelingCharge > 0)) return null;
    const siteCount = bill.wheelingResult.sites.length;
    return {
        en: `<strong>Wheeling Charge (${m(bill.wheelingResult.wheelingCharge)}):</strong> you chose to transfer some of your banked solar units to ${siteCount} other connection${siteCount === 1 ? '' : 's'}, and KSEB charges a small per-unit fee for "wheeling" (transporting) that power through their network to reach them.`,
        ml: `<strong>Wheeling Charge (${m(bill.wheelingResult.wheelingCharge)}):</strong> നിങ്ങളുടെ ബാങ്ക് ചെയ്ത സോളാർ യൂണിറ്റുകളിൽ ചിലത് മറ്റ് ${siteCount} കണക്ഷനുകളിലേക്ക് കൈമാറാൻ തിരഞ്ഞെടുത്തതിനാൽ, ആ വൈദ്യുതി KSEB-യുടെ ശൃംഖലയിലൂടെ "wheel" ചെയ്ത് എത്തിക്കുന്നതിന് ഒരു ചെറിയ യൂണിറ്റ്-അടിസ്ഥാന ചാർജ് ഈടാക്കുന്നു.`,
    };
}

function totalItem(bill) {
    const parts = ['Fixed Charge', 'Meter Rent'];
    if (bill.bankAdjustedUnits > 0) parts.push('Energy Charge', 'Duty', 'Fuel Surcharge');
    if (bill.wheelingResult && bill.wheelingResult.wheelingCharge > 0) parts.push('Wheeling Charge');
    const partsListEn = parts.join(' + ');
    const partsListMl = parts.join(' + ');
    return {
        en: `<strong>Total Bill Amount (${m(bill.totalBillAmount)}):</strong> everything above added together — ${partsListEn}`,
        ml: `<strong>Total Bill Amount (${m(bill.totalBillAmount)}):</strong> മുകളിൽ പറഞ്ഞവയെല്ലാം കൂട്ടിച്ചേർത്തത് — ${partsListMl}`,
    };
}

function buildList(items) {
    return `<ol class="bill-explain-list">${items.map((item) => `<li>${item}</li>`).join('')}</ol>`;
}

export function buildBillExplanation(bill) {
    if (!bill || !bill.totalBillAmount) return '';

    const items = [
        billTypeItem(bill),
        ...usageItems(bill),
        ...fixedChargeAndRentItems(bill),
        ...energyChargeItems(bill),
        wheelingItem(bill),
        totalItem(bill),
    ].filter(Boolean);

    const englishList = buildList(items.map((item) => item.en));
    const malayalamList = buildList(items.map((item) => item.ml));

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
            <div data-bill-lang-content="en" hidden>${englishList}</div>
            <div data-bill-lang-content="ml">${malayalamList}</div>
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
                .bill-explain-list { margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.7; color: var(--text-secondary); }
                .bill-explain-list li { margin-bottom: 10px; }
                .bill-explain-list strong { color: var(--text-primary); }
            </style>
        </div>`;
}
