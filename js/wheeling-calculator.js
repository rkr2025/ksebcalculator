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
    TELESCOPIC_SLABS,
    NON_TELESCOPIC_SLABS,
} from './tariff-rates.js';
import {
    computeEnergyChargeForUnits,
    computeTodEnergyChargeForSplit,
    netTodAgainstOffset,
    validSlabs,
} from './calculator.js';

function round2(n) {
    return Math.round(n * 100) / 100;
}

// Same 0-100% bound as calculator.js's own validPercent() (duplicated
// locally rather than imported, matching this file's existing small-helper
// duplication style) -- an out-of-range distribution-loss % override (e.g.
// a stray "150" typo) would otherwise produce a negative loss factor and a
// nonsensical (negative-cost) wheeling result instead of being rejected.
function validPercent(value) {
    return Number.isFinite(value) && value >= 0 && value <= 100;
}

// Site Name is free text (index.html's "Site Name (optional)" field) that
// ends up interpolated straight into innerHTML by render-wheeling.js and
// render-explanation.js -- escaped once here, at the point it enters the
// result object, so every consumer downstream is safe by construction
// instead of each render file having to remember to escape it itself.
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
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
function computeFlatCategoryCharge(units, category, rates) {
    const slabs = category === 'LT7A' ? rates.lt7aSlabs : rates.lt7bSlabs;
    const rate = pickFlatRate(units, slabs);
    return { billType: category, unitRate: rate, energyCharge: units * rate };
}

// Bills `units` (and, for an LT1 ToD site, `split`) at whichever tariff the
// site's category calls for. LT1 (domestic) sites are billed on the SAME
// telescopic/non-telescopic table as the prosumer's own bill, so the
// prosumer's own Admin Option overrides apply here too. LT7A/LT7B
// (commercial) have their own Admin Option overrides (`rates.lt7aSlabs`/
// `rates.lt7bSlabs`), independent of LT1's rates.
function billForCategory(site, units, split, rates) {
    if (site.category === 'LT7A' || site.category === 'LT7B') {
        return computeFlatCategoryCharge(units, site.category, rates);
    }
    if (site.todAvailable) {
        return computeTodEnergyChargeForSplit(split, rates);
    }
    return computeEnergyChargeForUnits(units, rates);
}

// Bills a site's consumption twice -- once for its full (pre-wheeling)
// consumption, once for what's left after `unitsAfterWheeling`/
// `splitAfterWheeling` -- to derive the saving wheeling produced at this
// site. Fixed charge and meter rent are deliberately excluded: they depend
// only on the site's own connection (phase/load), not on wheeling, so they
// cancel out of the before/after comparison.
function billSite(site, unitsAfterWheeling, splitAfterWheeling, rates) {
    const totalUnits = siteTotalUnits(site);
    const beforeSplit = { normalUnits: site.todNormal, peakUnits: site.todPeak, offPeakUnits: site.todOffPeak };

    const before = billForCategory(site, totalUnits, beforeSplit, rates);
    const after = billForCategory(site, unitsAfterWheeling, splitAfterWheeling, rates);

    const dutyBefore = before.energyCharge * rates.dutyRate;
    const surchargeBefore = totalUnits * rates.fuelSurchargePerUnit;
    const totalBefore = before.energyCharge + dutyBefore + surchargeBefore;

    const dutyAfter = after.energyCharge * rates.dutyRate;
    const surchargeAfter = unitsAfterWheeling * rates.fuelSurchargePerUnit;
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
//
// `overrides` lets the Admin Option fields in index.html substitute the
// current KSEB distribution-loss percentages (4.99% / 7.14%), the wheeling
// rate per unit (₹0.64), the telescopic/non-telescopic per-unit rates (for
// LT1 wheeled sites, billed on the prosumer's own tariff table), and/or the
// LT7A/LT7B flat commercial rates with new ones if KSEB revises them -- each
// falls back to its tariff-rates.js constant when not provided/valid (e.g.
// the field is left at its default, or main.js is called without overrides
// at all).
export function computeWheelingResult(availableBankUnits, sites, overrides = {}) {
    if (!sites || sites.length === 0) {
        return {
            sites: [], totalAdjustedUnits: 0, totalEnergyLost: 0, totalSaving: 0, wheelingCharge: 0, finalBankBalance: Math.max(availableBankUnits || 0, 0),
        };
    }

    const sameTransformerPct = validPercent(overrides.sameTransformerPct)
        ? overrides.sameTransformerPct : DIST_LOSS_SAME_TRANSFORMER;
    const differentTransformerPct = validPercent(overrides.differentTransformerPct)
        ? overrides.differentTransformerPct : DIST_LOSS_DIFFERENT_TRANSFORMER;
    const wheelingRatePerUnit = Number.isFinite(overrides.wheelingRatePerUnit) && overrides.wheelingRatePerUnit >= 0
        ? overrides.wheelingRatePerUnit : WHEELING_RATE_PER_UNIT;
    // The prosumer's own bill's EFFECTIVE duty rate / fuel surcharge (bill.dutyRate
    // is already a 0-1 fraction, bill.fuelSurchargePerUnit already in rupees --
    // see calculator.js's computeBill()) -- reused here so a wheeled site's
    // before/after comparison stays consistent with the prosumer's own bill
    // instead of silently reverting to the tariff-rates.js defaults whenever
    // Duty/Fuel Surcharge is overridden via Admin Options.
    const dutyRate = Number.isFinite(overrides.dutyRate) && overrides.dutyRate >= 0 && overrides.dutyRate <= 1
        ? overrides.dutyRate : DUTY_RATE;
    const fuelSurchargePerUnit = Number.isFinite(overrides.fuelSurchargePerUnit) && overrides.fuelSurchargePerUnit >= 0
        ? overrides.fuelSurchargePerUnit : FUEL_SURCHARGE_PER_UNIT;
    // Each key resolved independently (not "override all or none") --
    // otherwise overriding only telescopicSlabs would leave nonTelescopicSlabs
    // undefined and crash computeNonTelescopicCharge's slab lookup. Validated
    // with the same validSlabs() shape/finite-number check computeBill() uses
    // for its own slab overrides (not just a truthy check) -- a blank Admin
    // Option field now surfaces as an `undefined` rate inside an otherwise
    // truthy array (see main.js's numOrUndefined()), which a plain `||`
    // fallback wouldn't catch and would silently propagate as NaN charges.
    const rates = {
        telescopicSlabs: validSlabs(overrides.telescopicSlabs, TELESCOPIC_SLABS.length, ['rate'])
            ? overrides.telescopicSlabs : TELESCOPIC_SLABS,
        nonTelescopicSlabs: validSlabs(overrides.nonTelescopicSlabs, NON_TELESCOPIC_SLABS.length, ['rate'])
            ? overrides.nonTelescopicSlabs : NON_TELESCOPIC_SLABS,
        lt7aSlabs: validSlabs(overrides.lt7aSlabs, LT7A_SLABS.length, ['rate'])
            ? overrides.lt7aSlabs : LT7A_SLABS,
        lt7bSlabs: validSlabs(overrides.lt7bSlabs, LT7B_SLABS.length, ['rate'])
            ? overrides.lt7bSlabs : LT7B_SLABS,
        dutyRate,
        fuelSurchargePerUnit,
    };

    let newBank = Math.max(availableBankUnits || 0, 0);
    const results = [];
    let totalAdjustedUnits = 0;
    let totalEnergyLost = 0;
    let totalSaving = 0;

    sites.forEach((site, index) => {
        const distLossPct = site.sameTransformer ? sameTransformerPct : differentTransformerPct;
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

        const billing = billSite(site, unitsAfterWheeling, splitAfterWheeling, rates);

        results.push({
            siteIndex: index + 1,
            name: escapeHtml(site.name || `Site ${index + 1}`),
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

    const wheelingCharge = round2((totalAdjustedUnits + totalEnergyLost) * wheelingRatePerUnit);

    return {
        sites: results,
        totalAdjustedUnits: round2(totalAdjustedUnits),
        totalEnergyLost: round2(totalEnergyLost),
        totalSaving: round2(totalSaving),
        wheelingCharge,
        wheelingRatePerUnit,
        finalBankBalance: newBank,
    };
}
