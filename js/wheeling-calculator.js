// Pure wheeling-charge calculation (js/wheeling-calculator.js). No DOM
// access -- takes the prosumer's available bank surplus plus a list of
// receiving sites, returns the full per-site and combined result.
//
// Ported from a sister app's wheeling feature. That app bills each site
// against one of several category tariffs (LT1/LT7A/LT7B) loaded from CSV.
// This app doesn't load tariffs from CSV, but does now carry the LT7A/LT7B
// commercial flat-rate tables alongside the LT-I(a) domestic tariff (see
// tariff-rates.js): a wheeled site's own connection may be a different
// category than the prosumer's own domestic connection.
//   - LT1 (domestic): billed with the same telescopic/non-telescopic/ToD
//     engine calculator.js uses for the prosumer's own consumption. Sites
//     have no "connected load" concept here, so a ToD LT1 site always gets
//     a real T1/T2/T3 split (never the flat Telescopic-ToD slabs
//     calculator.js uses for below-20kW-and-under-250-units bills).
//   - LT7A/LT7B (commercial): flat lookup only -- `units x rate`, rate
//     chosen by which band the *total* falls in, no telescoping and no ToD
//     zone multipliers (a commercial connection's zone split, if entered,
//     only ever matters for the units total, never for per-zone pricing).
//
// The core algorithm (distribution loss, sequential per-site bank
// depletion, before/after billing to derive savings, wheeling charge on
// adjusted+lost units) is preserved as specified.

import {
    DIST_LOSS_SAME_TRANSFORMER,
    DIST_LOSS_DIFFERENT_TRANSFORMER,
    WHEELING_RATE_PER_UNIT,
    DUTY_RATE,
    FUEL_SURCHARGE_PER_UNIT,
    LT7A_SLABS,
    LT7B_SLABS,
} from './tariff-rates.js';
import {
    computeEnergyChargeForUnits,
    computeTodEnergyChargeForSplit,
    netTodAgainstOffset,
} from './calculator.js';

function round2(n) {
    return Math.round(n * 100) / 100;
}

function siteTotalUnits(site) {
    return site.todAvailable
        ? site.todNormal + site.todPeak + site.todOffPeak
        : site.units;
}

function pickFlatRate(units, slabs) {
    return slabs.find((s) => units <= s.maxUnits).rate;
}

// LT7A/LT7B: units x single flat rate for the whole quantity, chosen by
// which band the total falls in -- no telescoping, no ToD multipliers.
function computeFlatCategoryCharge(units, category) {
    const slabs = category === 'LT7A' ? LT7A_SLABS : LT7B_SLABS;
    const rate = pickFlatRate(units, slabs);
    return { billType: category, unitRate: rate, energyCharge: units * rate };
}

// Bills `units` (and, for an LT1 ToD site, `split`) at whichever tariff the
// site's category calls for.
function billForCategory(site, units, split) {
    if (site.category === 'LT7A' || site.category === 'LT7B') {
        return computeFlatCategoryCharge(units, site.category);
    }
    if (site.todAvailable) {
        return computeTodEnergyChargeForSplit(split);
    }
    return computeEnergyChargeForUnits(units);
}

// Bills a site's consumption twice -- once for its full (pre-wheeling)
// consumption, once for what's left after `unitsAfterWheeling`/
// `splitAfterWheeling` -- to derive the saving wheeling produced at this
// site. Fixed charge and meter rent are deliberately excluded: they depend
// only on the site's own connection (phase/load), not on wheeling, so they
// cancel out of the before/after comparison.
function billSite(site, unitsAfterWheeling, splitAfterWheeling) {
    const totalUnits = siteTotalUnits(site);
    const beforeSplit = { normalUnits: site.todNormal, peakUnits: site.todPeak, offPeakUnits: site.todOffPeak };

    const before = billForCategory(site, totalUnits, beforeSplit);
    const after = billForCategory(site, unitsAfterWheeling, splitAfterWheeling);

    const dutyBefore = before.energyCharge * DUTY_RATE;
    const surchargeBefore = totalUnits * FUEL_SURCHARGE_PER_UNIT;
    const totalBefore = before.energyCharge + dutyBefore + surchargeBefore;

    const dutyAfter = after.energyCharge * DUTY_RATE;
    const surchargeAfter = unitsAfterWheeling * FUEL_SURCHARGE_PER_UNIT;
    const totalAfter = after.energyCharge + dutyAfter + surchargeAfter;

    return {
        before: { ...before, duty: dutyBefore, surcharge: surchargeBefore, total: totalBefore },
        after: { ...after, duty: dutyAfter, surcharge: surchargeAfter, total: totalAfter },
        saving: totalBefore - totalAfter,
    };
}

// `availableBankUnits` is the prosumer's own closing bank surplus for this
// bill (calculator.js's `accountBalance`) -- the units that would otherwise
// carry forward as banked credit, now offered to `sites` instead. Sites are
// processed in order; each site's leftover post-loss balance becomes the
// next site's opening balance.
export function computeWheelingResult(availableBankUnits, sites) {
    if (!sites || sites.length === 0) {
        return {
            sites: [], totalAdjustedUnits: 0, totalEnergyLost: 0, totalSaving: 0, wheelingCharge: 0, finalBankBalance: Math.max(availableBankUnits || 0, 0),
        };
    }

    let newBank = Math.max(availableBankUnits || 0, 0);
    const results = [];
    let totalAdjustedUnits = 0;
    let totalEnergyLost = 0;
    let totalSaving = 0;

    sites.forEach((site, index) => {
        const distLossPct = site.sameTransformer ? DIST_LOSS_SAME_TRANSFORMER : DIST_LOSS_DIFFERENT_TRANSFORMER;
        const lossFactor = 1 - distLossPct / 100;

        const bankOpening = newBank;
        const availableForWheeling = round2(bankOpening * lossFactor);
        const totalSiteUnits = siteTotalUnits(site);
        const wheelingUnitsAdjusted = round2(Math.min(availableForWheeling, totalSiteUnits));
        const availableAfterWheel = round2(availableForWheeling - wheelingUnitsAdjusted);
        const bankAfterWheeling = lossFactor > 0 ? round2(availableAfterWheel / lossFactor) : 0;
        const energyLost = round2(bankOpening - wheelingUnitsAdjusted - bankAfterWheeling);
        const unitsAfterWheeling = round2(Math.max(totalSiteUnits - wheelingUnitsAdjusted, 0));

        const splitAfterWheeling = site.todAvailable
            ? netTodAgainstOffset({
                offsetUnits: wheelingUnitsAdjusted,
                importNormal: site.todNormal,
                importPeak: site.todPeak,
                importOffPeak: site.todOffPeak,
            })
            : null;

        const billing = billSite(site, unitsAfterWheeling, splitAfterWheeling);

        results.push({
            siteIndex: index + 1,
            name: site.name || `Site ${index + 1}`,
            category: site.category || 'LT1',
            sameTransformer: site.sameTransformer,
            distLossPct,
            bankOpening,
            availableForWheeling,
            wheelingUnitsAdjusted,
            availableAfterWheel,
            bankAfterWheeling,
            energyLost,
            totalSiteUnits,
            unitsAfterWheeling,
            splitAfterWheeling,
            ...billing,
        });

        totalAdjustedUnits += wheelingUnitsAdjusted;
        totalEnergyLost += energyLost;
        totalSaving += billing.saving;
        newBank = bankAfterWheeling;
    });

    const wheelingCharge = round2((totalAdjustedUnits + totalEnergyLost) * WHEELING_RATE_PER_UNIT);

    return {
        sites: results,
        totalAdjustedUnits: round2(totalAdjustedUnits),
        totalEnergyLost: round2(totalEnergyLost),
        totalSaving: round2(totalSaving),
        wheelingCharge,
        finalBankBalance: newBank,
    };
}
