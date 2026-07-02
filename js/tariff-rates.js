// KSEB LT-I(a) domestic tariff constants (effective 01-04-2025), extracted from
// the original scripts.js. Values are copied as-is; see git history for tariff
// order references when these change.

// Fixed charge slabs, keyed by upper bound of unitsConsumed. Each entry gives
// the charge for [phase1 (single phase), other (three phase)].
export const FIXED_CHARGE_SLABS = [
    { maxUnits: 50, phase1: 50, other: 130 },
    { maxUnits: 100, phase1: 85, other: 175 },
    { maxUnits: 150, phase1: 105, other: 205 },
    { maxUnits: 200, phase1: 140, other: 215 },
    { maxUnits: 250, phase1: 160, other: 235 },
    { maxUnits: 300, phase1: 220, other: 240 },
    { maxUnits: 350, phase1: 240, other: 250 },
    { maxUnits: 400, phase1: 260, other: 260 },
    { maxUnits: 500, phase1: 285, other: 285 },
    { maxUnits: Infinity, phase1: 310, other: 310 },
];

// Telescopic energy charge slabs (used when billed units <= 250): each band
// bills only the units that fall inside it, at that band's rate.
export const TELESCOPIC_SLABS = [
    { bandUnits: 50, rate: 3.35 },
    { bandUnits: 50, rate: 4.25 },
    { bandUnits: 50, rate: 5.35 },
    { bandUnits: 50, rate: 7.20 },
    { bandUnits: 50, rate: 8.50 },
];

// Non-telescopic slab rates (used when billed units > 250): the whole
// quantity is billed at a single flat rate chosen by which band it falls in.
export const NON_TELESCOPIC_SLABS = [
    { maxUnits: 300, rate: 6.75 },
    { maxUnits: 350, rate: 7.60 },
    { maxUnits: 400, rate: 7.95 },
    { maxUnits: 500, rate: 8.25 },
    { maxUnits: Infinity, rate: 9.20 },
];

// ToD (Time-of-Day) rate multipliers applied to the flat non-telescopic rate.
export const TOD_MULTIPLIERS = {
    normal: 0.9,
    peak: 1.25,
    offPeak: 1.0,
};

// Fraction of the Normal-timezone export surplus carried over into the Peak
// timezone adjustment (connected load above 20kW only).
export const PEAK_CARRYOVER_RATIO = 0.8;

// Meter rent, keyed by phase and meter ownership.
export const METER_RENT = {
    phase1: { kseb: 30, other: 0 },
    other: { kseb: 35, other: 0 },
};

export const DUTY_RATE = 0.10;
export const FUEL_SURCHARGE_PER_UNIT = 0.02; // 2 paise/unit, w.e.f. 01-Jun-2026

// Wheeling: transferring banked export units to another KSEB connection to
// offset its bill. Distribution loss % depends on whether the receiving
// site shares a transformer with the generation site; the wheeling charge
// is billed on both the units actually transferred AND the units lost in
// transit (see js/wheeling-calculator.js).
export const DIST_LOSS_SAME_TRANSFORMER = 4.99; // %
export const DIST_LOSS_DIFFERENT_TRANSFORMER = 7.14; // %
export const WHEELING_RATE_PER_UNIT = 0.64; // Rs per unit

// LT7A/LT7B commercial tariffs, used only for wheeled sites (a wheeled site
// may be a different connection type than the prosumer's own LT-I(a)
// domestic connection above). Flat lookup only -- unlike TELESCOPIC_SLABS,
// the whole quantity bills at a single rate chosen by which band the total
// falls in, same shape as NON_TELESCOPIC_SLABS.
export const LT7A_SLABS = [
    { maxUnits: 100, rate: 6.05 },
    { maxUnits: 200, rate: 6.80 },
    { maxUnits: 300, rate: 7.50 },
    { maxUnits: 500, rate: 8.15 },
    { maxUnits: Infinity, rate: 9.40 },
];

export const LT7B_SLABS = [
    { maxUnits: 100, rate: 5.40 },
    { maxUnits: 200, rate: 6.25 },
    { maxUnits: 300, rate: 6.90 },
    { maxUnits: 500, rate: 8.15 },
    { maxUnits: Infinity, rate: 9.40 },
];
