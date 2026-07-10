// Plain-language "what does this bill mean" analysis (js/render-insights.js).
// Pure string builder from a `bill` object, same contract as the other
// render-*.js modules. A couple of insights (solar impact) run a second,
// "what-if" computeBill() call against modified inputs -- that's the one
// place this file depends on calculator.js rather than just reading fields
// off `bill`.
//
// Each insight function returns either null (nothing to say) or
// { type, icon, html }, where `type` is 'info' | 'success' | 'warning' --
// used by renderBillAnalysis() to pick the card's accent color from the same
// validated palette used elsewhere (--primary/--solar/--import).

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
    if (parts.length === 0) return null;

    const top = parts[0];
    const topPct = pct(top.value, bill.totalBillAmount);
    return {
        type: 'info',
        icon: '💰',
        html: `<strong>${top.label}</strong> is the biggest part of your bill at ${formatPct(topPct)} (${money(top.value)} of ${money(bill.totalBillAmount)}).`,
    };
}

function effectiveRateInsight(bill) {
    if (bill.bankAdjustedUnits <= 0) return null;
    const effectiveRate = bill.totalBillAmount / bill.bankAdjustedUnits;
    return {
        type: 'info',
        icon: '📐',
        html: `Including fixed charge, duty and surcharge, you're paying an average of <strong>${money(effectiveRate)} per unit</strong> across your ${bill.bankAdjustedUnits.toFixed(1)} billed units (base energy rate: ${money(bill.unitRate)}/unit).`,
    };
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
                return {
                    type: 'info',
                    icon: '📶',
                    html: `You're in the ${money(slab.rate)}/unit telescopic band. You have ${headroom.toFixed(1)} unit(s) of headroom before crossing 250 units, where billing switches entirely to a flat non-telescopic rate.`,
                };
            }
            return {
                type: 'info',
                icon: '📶',
                html: `You're in the ${money(slab.rate)}/unit telescopic band (up to ${cumulative} units). ${headroom.toFixed(1)} more unit(s) this period would push additional usage into the next, higher-rate band.`,
            };
        }
    }
    return null;
}

// Non-telescopic slabs are a cliff -- crossing the threshold re-rates ALL
// billed units, not just the marginal ones, so it's worth a sharper warning.
function nonTelescopicSlabInsight(bill) {
    for (let i = 0; i < NON_TELESCOPIC_SLABS.length; i += 1) {
        const slab = NON_TELESCOPIC_SLABS[i];
        if (bill.bankAdjustedUnits > slab.maxUnits) continue;

        const nextSlab = NON_TELESCOPIC_SLABS[i + 1];
        if (!nextSlab) return null;

        const headroom = slab.maxUnits - bill.bankAdjustedUnits;
        if (headroom > 20) return null;

        const extraCost = bill.bankAdjustedUnits * (nextSlab.rate - slab.rate);
        return {
            type: 'warning',
            icon: '⚠️',
            html: `<strong>Careful:</strong> you're just ${headroom.toFixed(1)} unit(s) below the ${slab.maxUnits}-unit threshold. Crossing it moves your entire ${bill.bankAdjustedUnits.toFixed(0)} units to the ${money(nextSlab.rate)}/unit rate (up from ${money(slab.rate)}) -- roughly ${money(extraCost)} more than if you stay under ${slab.maxUnits}.`,
        };
    }
    return null;
}

function slabInsight(bill) {
    if (bill.bankAdjustedUnits <= 0) {
        return {
            type: 'success',
            icon: '🎉',
            html: `Your export and banked units fully covered this period's usage -- no energy charge was billed.`,
        };
    }
    const isTelescopic = bill.billType === 'Telescopic' || bill.billType === 'Telescopic-ToD';
    return isTelescopic ? telescopicSlabInsight(bill) : nonTelescopicSlabInsight(bill);
}

// Only meaningful for a real T1/T2/T3 ToD split (not the Telescopic-ToD
// flat-slab path, where there's no per-timezone charge to compare).
function todPeakInsight(bill) {
    if (bill.billingType !== 'tod' || bill.todType === 'normal') return null;

    const above20kW = bill.todBillingAbove20kW > 0;
    const peakCharge = (above20kW ? bill.PeakConsumptionAdjusted_energy_charge : bill.PeakConsumptionAdjusted_energy_charge_Below20kW) || 0;
    const peakUnits = (above20kW ? bill.Peak_NoOfUnitsFor_energy_calculation : bill.Peak_NoOfUnitsFor_energy_calculation_Below20kW) || 0;
    const unitRate = above20kW ? bill.unitRate : bill.unitRate_Below20kW;

    if (peakCharge <= 0) {
        return {
            type: 'success',
            icon: '✅',
            html: `None of your billed usage fell in the Peak (6pm-10pm) window, so you avoided the 125% peak surcharge entirely.`,
        };
    }

    const peakPctOfEnergy = pct(peakCharge, bill.energyCharge);
    const potentialSavings = peakUnits * unitRate * 0.25; // 125% -> 100% if shifted to Off-Peak
    return {
        type: 'warning',
        icon: '⏰',
        html: `Peak-hour (6pm-10pm) usage made up ${formatPct(peakPctOfEnergy)} of your energy charge (${money(peakCharge)}), billed at a 25% premium over the base rate. Shifting those ${peakUnits.toFixed(1)} unit(s) to Off-Peak hours could have saved roughly ${money(potentialSavings)}.`,
    };
}

// Re-runs computeBill() as if none of this period's solar generation/export
// had happened, to estimate solar's actual rupee impact on this bill.
function solarImpactInsight(bill) {
    if (!bill.solarGeneration || bill.solarGeneration <= 0) return null;

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
    if (noSolarBill.error) return null;

    const savings = noSolarBill.totalBillAmount - bill.totalBillAmount;
    if (savings <= 0) return null;
    return {
        type: 'success',
        icon: '☀️',
        html: `Your solar generation saved you an estimated <strong>${money(savings)}</strong> this period, compared to importing all ${bill.unitsConsumed.toFixed(0)} units from KSEB.`,
    };
}

function bankBalanceInsight(bill) {
    if (bill.accountBalance > 0) {
        return {
            type: 'success',
            icon: '🏦',
            html: `You have a surplus of ${bill.accountBalance.toFixed(1)} unit(s) this period, which carries forward as banked units for future bills.`,
        };
    }
    if (bill.myBankDepositAtKseb > 0) {
        return {
            type: 'info',
            icon: '🏦',
            html: `${bill.myBankDepositAtKseb.toFixed(1)} banked unit(s) were applied toward this bill.`,
        };
    }
    return null;
}

export function renderBillAnalysis(bill) {
    if (!bill.totalBillAmount) return '';

    const insights = [
        costBreakdownInsight(bill),
        effectiveRateInsight(bill),
        slabInsight(bill),
        todPeakInsight(bill),
        solarImpactInsight(bill),
        bankBalanceInsight(bill),
    ].filter(Boolean);

    if (!insights.length) return '';

    const cards = insights.map((insight) => `
        <div class="insight-card insight-card--${insight.type}">
            <span class="insight-card-icon">${insight.icon}</span>
            <p class="insight-card-text">${insight.html}</p>
        </div>`).join('');

    return `
        <div class="bill-chart">
            <h5 class="insight-section-title">📈 Bill Analysis</h5>
            <div class="insight-grid">${cards}</div>
        </div>`;
}
