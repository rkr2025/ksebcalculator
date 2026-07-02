// Plain-language "what does this bill mean" analysis (js/render-insights.js).
// Pure string builder from a `bill` object, same contract as the other
// render-*.js modules. A couple of insights (solar impact) run a second,
// "what-if" computeBill() call against modified inputs -- that's the one
// place this file depends on calculator.js rather than just reading fields
// off `bill`.

import { computeBill } from './calculator.js';
import { TELESCOPIC_SLABS, NON_TELESCOPIC_SLABS } from './tariff-rates.js';

function money(n) {
    return `₹${n.toFixed(2)}`;
}

function pct(value, total) {
    return total > 0 ? (value / total) * 100 : 0;
}

function formatPct(p) {
    return `${p.toFixed(1)}%`;
}

function costBreakdownInsight(bill) {
    const parts = [
        { label: 'Energy Charge', value: bill.energyCharge },
        { label: 'Fixed Charge', value: bill.fixedCharge },
        { label: 'Duty', value: bill.duty },
        { label: 'Meter Rent', value: bill.meterRent },
        { label: 'Fuel Surcharge', value: bill.monthlyFuelSurcharge },
    ].filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
    if (parts.length === 0) return '';

    const top = parts[0];
    const topPct = pct(top.value, bill.totalBillAmount);
    return `<li><strong>${top.label}</strong> is the biggest part of your bill at ${formatPct(topPct)} (${money(top.value)} of ${money(bill.totalBillAmount)}).</li>`;
}

function effectiveRateInsight(bill) {
    if (bill.bankAdjustedUnits <= 0) return '';
    const effectiveRate = bill.totalBillAmount / bill.bankAdjustedUnits;
    return `<li>Including fixed charge, duty and surcharge, you're paying an average of <strong>${money(effectiveRate)} per unit</strong> across your ${bill.bankAdjustedUnits.toFixed(1)} billed units (base energy rate: ${money(bill.unitRate)}/unit).</li>`;
}

// Telescopic bands are marginal -- only the units inside a band cost that
// band's rate, so crossing into the next band is a soft nudge, not a cliff.
function telescopicSlabInsight(bill) {
    let cumulative = 0;
    for (const slab of TELESCOPIC_SLABS) {
        cumulative += slab.bandUnits;
        if (bill.bankAdjustedUnits <= cumulative) {
            const headroom = cumulative - bill.bankAdjustedUnits;
            if (cumulative >= 250) {
                return `<li>You're in the ${money(slab.rate)}/unit telescopic band. You have ${headroom.toFixed(1)} unit(s) of headroom before crossing 250 units, where billing switches entirely to a flat non-telescopic rate.</li>`;
            }
            return `<li>You're in the ${money(slab.rate)}/unit telescopic band (up to ${cumulative} units). ${headroom.toFixed(1)} more unit(s) this period would push additional usage into the next, higher-rate band.</li>`;
        }
    }
    return '';
}

// Non-telescopic slabs are a cliff -- crossing the threshold re-rates ALL
// billed units, not just the marginal ones, so it's worth a sharper warning.
function nonTelescopicSlabInsight(bill) {
    for (let i = 0; i < NON_TELESCOPIC_SLABS.length; i += 1) {
        const slab = NON_TELESCOPIC_SLABS[i];
        if (bill.bankAdjustedUnits > slab.maxUnits) continue;

        const nextSlab = NON_TELESCOPIC_SLABS[i + 1];
        if (!nextSlab) return '';

        const headroom = slab.maxUnits - bill.bankAdjustedUnits;
        if (headroom > 20) return '';

        const extraCost = bill.bankAdjustedUnits * (nextSlab.rate - slab.rate);
        return `<li><strong>Careful:</strong> you're just ${headroom.toFixed(1)} unit(s) below the ${slab.maxUnits}-unit threshold. Crossing it moves your entire ${bill.bankAdjustedUnits.toFixed(0)} units to the ${money(nextSlab.rate)}/unit rate (up from ${money(slab.rate)}) -- roughly ${money(extraCost)} more than if you stay under ${slab.maxUnits}.</li>`;
    }
    return '';
}

function slabInsight(bill) {
    if (bill.bankAdjustedUnits <= 0) {
        return `<li>🎉 Your export and banked units fully covered this period's usage -- no energy charge was billed.</li>`;
    }
    const isTelescopic = bill.billType === 'Telescopic' || bill.billType === 'Telescopic-ToD';
    return isTelescopic ? telescopicSlabInsight(bill) : nonTelescopicSlabInsight(bill);
}

// Only meaningful for a real T1/T2/T3 ToD split (not the Telescopic-ToD
// flat-slab path, where there's no per-timezone charge to compare).
function todPeakInsight(bill) {
    if (bill.billingType !== 'tod' || bill.todType === 'normal') return '';

    const above20kW = bill.todBillingAbove20kW > 0;
    const peakCharge = (above20kW ? bill.PeakConsumptionAdjusted_energy_charge : bill.PeakConsumptionAdjusted_energy_charge_Below20kW) || 0;
    const peakUnits = (above20kW ? bill.Peak_NoOfUnitsFor_energy_calculation : bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;
    const unitRate = above20kW ? bill.unitRate : bill.unitRate_Below20kW;

    if (peakCharge <= 0) {
        return `<li>None of your billed usage fell in the Peak (6pm-10pm) window, so you avoided the 125% peak surcharge entirely.</li>`;
    }

    const peakPctOfEnergy = pct(peakCharge, bill.energyCharge);
    const potentialSavings = peakUnits * unitRate * 0.25; // 125% -> 100% if shifted to Off-Peak
    return `<li>Peak-hour (6pm-10pm) usage made up ${formatPct(peakPctOfEnergy)} of your energy charge (${money(peakCharge)}), billed at a 25% premium over the base rate. Shifting those ${peakUnits.toFixed(1)} unit(s) to Off-Peak hours could have saved roughly ${money(potentialSavings)}.</li>`;
}

// Re-runs computeBill() as if none of this period's solar generation/export
// had happened, to estimate solar's actual rupee impact on this bill.
function solarImpactInsight(bill) {
    if (!bill.solarGeneration || bill.solarGeneration <= 0) return '';

    const baseInputs = {
        phase: bill.phase,
        meterOwner: bill.meterOwner,
        billingType: bill.billingType,
        connectedLoad: bill.connectedLoad,
        hasBankBalance: false,
        bankedUnits: 0,
    };

    const whatIfInputs = bill.billingType === 'normal'
        ? { ...baseInputs, solarGeneration: 0, importReading: bill.unitsConsumed, exportReading: 0 }
        : {
            ...baseInputs,
            solarNormal: 0,
            solarOffPeak: 0,
            solarPeak: 0,
            importNormal: bill.importNormal + bill.generationUsage,
            importPeak: bill.importPeak,
            importOffPeak: bill.importOffPeak,
            exportNormal: 0,
            exportOffPeak: 0,
            exportPeak: 0,
        };

    const noSolarBill = computeBill(whatIfInputs);
    if (noSolarBill.error) return '';

    const savings = noSolarBill.totalBillAmount - bill.totalBillAmount;
    if (savings <= 0) return '';
    return `<li>Your solar generation saved you an estimated <strong>${money(savings)}</strong> this period, compared to importing all ${bill.unitsConsumed.toFixed(0)} units from KSEB.</li>`;
}

function bankBalanceInsight(bill) {
    if (bill.accountBalance > 0) {
        return `<li>You have a surplus of ${bill.accountBalance.toFixed(1)} unit(s) this period, which carries forward as banked units for future bills.</li>`;
    }
    if (bill.myBankDepositAtKseb > 0) {
        return `<li>${bill.myBankDepositAtKseb.toFixed(1)} banked unit(s) were applied toward this bill.</li>`;
    }
    return '';
}

export function renderBillAnalysis(bill) {
    if (!bill.totalBillAmount) return '';

    const items = [
        costBreakdownInsight(bill),
        effectiveRateInsight(bill),
        slabInsight(bill),
        todPeakInsight(bill),
        solarImpactInsight(bill),
        bankBalanceInsight(bill),
    ].filter(Boolean).join('');

    if (!items) return '';

    return `
        <div class="bill-chart">
            <h5><u>Bill Analysis</u></h5>
            <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">${items}</ul>
        </div>`;
}
