// Pure bill-calculation logic for the KSEB calculator (js/calculator.js).
// No DOM access here -- everything is data in, data out, so it can be unit
// tested and reused by the render layer without touching document/window.
//
// This is a structural port of the calculation logic that used to live
// inline inside the form 'submit' handler in scripts.js. Behavior is
// preserved exactly, including one known display bug: for ToD billing with
// connected load below 20kW and total billed units <= 250, the *_Below20kW
// timezone-split fields (NormalConsumptionAdjusted_Below20kW,
// Peak_NoOfUnitsFor_energy_calculation_Below20kW, etc.) are never populated
// -- billing in that case uses the flat Telescopic-ToD slabs instead of a
// T1/T2/T3 split. The render layer still reads those fields to build its
// breakdown tables, so it will display 0.00 Unit / ₹0.00 in that case even
// though the real (correct) total bill amount is non-zero. This mirrors the
// original scripts.js behavior and was intentionally left unchanged.

import {
    FIXED_CHARGE_SLABS,
    TELESCOPIC_SLABS,
    NON_TELESCOPIC_SLABS,
    TOD_MULTIPLIERS,
    PEAK_CARRYOVER_RATIO,
    METER_RENT,
    DUTY_RATE,
    FUEL_SURCHARGE_PER_UNIT,
} from './tariff-rates.js';

export const BILL_ERRORS = {
    ALL_ZERO: 'All inputs are zero. Please enter valid readings.',
    NEGATIVE_VALUE: 'Please enter positive values for solar generation, import, and export readings.',
    EXPORT_EXCEEDS_GENERATION: 'Export units cannot be greater than Solar Generation units.',
};

function computeFixedCharge(unitsConsumed, phase) {
    const slab = FIXED_CHARGE_SLABS.find((s) => unitsConsumed <= s.maxUnits);
    return phase === 'phase1' ? slab.phase1 : slab.other;
}

function pickNonTelescopicRate(units) {
    return NON_TELESCOPIC_SLABS.find((s) => units <= s.maxUnits).rate;
}

// Bills `units` progressively across the telescopic bands (used whenever
// billed units <= 250, for both normal billing and ToD-below-20kW billing).
function computeTelescopicCharge(units) {
    let remaining = units;
    let energyCharge = 0;
    const breakdownRows = [];

    for (const slab of TELESCOPIC_SLABS) {
        if (remaining <= 0) break;
        const bandUnits = Math.min(slab.bandUnits, remaining);
        const amount = bandUnits * slab.rate;
        energyCharge += amount;
        breakdownRows.push({ units: bandUnits, rate: slab.rate, amount });
        remaining -= bandUnits;
    }

    const unitRate = units > 0 ? energyCharge / units : 0;
    return { energyCharge, unitRate, breakdownRows };
}

// Bills the whole `units` quantity at a single flat rate (used whenever
// billed units > 250, for normal billing).
function computeNonTelescopicCharge(units) {
    const rate = pickNonTelescopicRate(units);
    return { energyCharge: units * rate, unitRate: rate };
}

// ToD billing, connected load above 20kW: nets export+bank against Normal
// (T1) usage, carries PEAK_CARRYOVER_RATIO of any leftover into Peak (T2),
// then whatever's left of that into Off-Peak (T3).
function computeTodAbove20kW({ exportPlusBank, importNormal, importPeak, importOffPeak }) {
    let NormalConsumptionAdjusted = 0;
    let Normal_NoOfUnitsFor_energy_calculation = 0;
    if (exportPlusBank > importNormal) {
        NormalConsumptionAdjusted = exportPlusBank - importNormal;
    } else if (exportPlusBank !== importNormal) {
        Normal_NoOfUnitsFor_energy_calculation = importNormal - exportPlusBank;
    }

    const PeakConsumptionAdjusted_80_percent = NormalConsumptionAdjusted * PEAK_CARRYOVER_RATIO;
    let PeakConsumptionAdjusted = 0;
    let Peak_NoOfUnitsFor_energy_calculation = 0;
    if (PeakConsumptionAdjusted_80_percent > importPeak) {
        PeakConsumptionAdjusted = PeakConsumptionAdjusted_80_percent - importPeak;
    } else if (PeakConsumptionAdjusted_80_percent !== importPeak) {
        Peak_NoOfUnitsFor_energy_calculation = importPeak - PeakConsumptionAdjusted_80_percent;
    }

    // Re-express the Peak-timezone leftover on the full (non-80%-scaled)
    // basis before comparing it against Off-Peak usage.
    PeakConsumptionAdjusted = PeakConsumptionAdjusted / PEAK_CARRYOVER_RATIO;

    let OffPeakConsumptionAdjusted = 0;
    let OffPeak_NoOfUnitsFor_energy_calculation = 0;
    if (PeakConsumptionAdjusted > importOffPeak) {
        OffPeakConsumptionAdjusted = PeakConsumptionAdjusted - importOffPeak;
    } else if (PeakConsumptionAdjusted !== importOffPeak) {
        OffPeak_NoOfUnitsFor_energy_calculation = importOffPeak - PeakConsumptionAdjusted;
    }

    const bankAdjustedUnits = Normal_NoOfUnitsFor_energy_calculation
        + Peak_NoOfUnitsFor_energy_calculation
        + OffPeak_NoOfUnitsFor_energy_calculation;

    const unitRate = pickNonTelescopicRate(bankAdjustedUnits);

    const NormalConsumptionAdjusted_energy_charge = Normal_NoOfUnitsFor_energy_calculation * unitRate * TOD_MULTIPLIERS.normal;
    const PeakConsumptionAdjusted_energy_charge = Peak_NoOfUnitsFor_energy_calculation * unitRate * TOD_MULTIPLIERS.peak;
    const OffPeakConsumptionAdjusted_energy_charge = OffPeak_NoOfUnitsFor_energy_calculation * unitRate * TOD_MULTIPLIERS.offPeak;
    const energyCharge = NormalConsumptionAdjusted_energy_charge + PeakConsumptionAdjusted_energy_charge + OffPeakConsumptionAdjusted_energy_charge;

    return {
        billType: 'Non-Telescopic-ToD',
        NormalConsumptionAdjusted,
        Normal_NoOfUnitsFor_energy_calculation,
        PeakConsumptionAdjusted_80_percent,
        PeakConsumptionAdjusted,
        Peak_NoOfUnitsFor_energy_calculation,
        OffPeakConsumptionAdjusted,
        OffPeak_NoOfUnitsFor_energy_calculation,
        bankAdjustedUnits,
        unitRate,
        NormalConsumptionAdjusted_energy_charge,
        PeakConsumptionAdjusted_energy_charge,
        OffPeakConsumptionAdjusted_energy_charge,
        energyCharge,
    };
}

// ToD billing, connected load below 20kW, total billed units > 250: same
// T1/T2/T3 netting idea as the above-20kW case, but WITHOUT the 80%
// peak-carryover scaling (this asymmetry is intentional per the original
// tariff message text, not copy-paste drift).
function computeTodBelow20kWAbove250({ exportPlusBank, importNormal, importPeak, importOffPeak }) {
    let NormalConsumptionAdjusted = 0;
    let Normal_NoOfUnitsFor_energy_calculation = 0;
    if (exportPlusBank > importNormal) {
        NormalConsumptionAdjusted = exportPlusBank - importNormal;
    } else if (exportPlusBank !== importNormal) {
        Normal_NoOfUnitsFor_energy_calculation = importNormal - exportPlusBank;
    }

    const NormalConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted;
    let PeakConsumptionAdjusted_Below20kW = 0;
    let Peak_NoOfUnitsFor_energy_calculation_Below20kW = 0;
    if (NormalConsumptionAdjusted_Below20kW > importPeak) {
        PeakConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted_Below20kW - importPeak;
    } else if (NormalConsumptionAdjusted_Below20kW !== importPeak) {
        Peak_NoOfUnitsFor_energy_calculation_Below20kW = importPeak - NormalConsumptionAdjusted_Below20kW;
    }

    let OffPeakConsumptionAdjusted_Below20kW = 0;
    let OffPeak_NoOfUnitsFor_energy_calculation_Below20kW = 0;
    if (PeakConsumptionAdjusted_Below20kW > importOffPeak) {
        OffPeakConsumptionAdjusted_Below20kW = PeakConsumptionAdjusted_Below20kW - importOffPeak;
    } else if (PeakConsumptionAdjusted_Below20kW !== importOffPeak) {
        OffPeak_NoOfUnitsFor_energy_calculation_Below20kW = importOffPeak - PeakConsumptionAdjusted_Below20kW;
    }

    const bankAdjustedUnits_Below20kW = Normal_NoOfUnitsFor_energy_calculation
        + Peak_NoOfUnitsFor_energy_calculation_Below20kW
        + OffPeak_NoOfUnitsFor_energy_calculation_Below20kW;

    const unitRate_Below20kW = pickNonTelescopicRate(bankAdjustedUnits_Below20kW);

    const NormalConsumptionAdjusted_energy_charge = Normal_NoOfUnitsFor_energy_calculation * unitRate_Below20kW * TOD_MULTIPLIERS.normal;
    const PeakConsumptionAdjusted_energy_charge_Below20kW = Peak_NoOfUnitsFor_energy_calculation_Below20kW * unitRate_Below20kW * TOD_MULTIPLIERS.peak;
    const OffPeakConsumptionAdjusted_energy_charge_Below20kW = OffPeak_NoOfUnitsFor_energy_calculation_Below20kW * unitRate_Below20kW * TOD_MULTIPLIERS.offPeak;
    const energyCharge_Below20kW = NormalConsumptionAdjusted_energy_charge
        + PeakConsumptionAdjusted_energy_charge_Below20kW
        + OffPeakConsumptionAdjusted_energy_charge_Below20kW;

    return {
        billType: 'Non-Telescopic-ToD',
        NormalConsumptionAdjusted,
        NormalConsumptionAdjusted_Below20kW,
        Normal_NoOfUnitsFor_energy_calculation,
        PeakConsumptionAdjusted_Below20kW,
        Peak_NoOfUnitsFor_energy_calculation_Below20kW,
        OffPeakConsumptionAdjusted_Below20kW,
        OffPeak_NoOfUnitsFor_energy_calculation_Below20kW,
        bankAdjustedUnits_Below20kW,
        unitRate_Below20kW,
        NormalConsumptionAdjusted_energy_charge,
        PeakConsumptionAdjusted_energy_charge_Below20kW,
        OffPeakConsumptionAdjusted_energy_charge_Below20kW,
        energyCharge_Below20kW,
    };
}

function emptyTariffFields(bankAdjustedUnits) {
    return {
        billType: '',
        energyCharge: 0,
        unitRate: 0,
        breakdownRows: [],
        bankAdjustedUnits,
        todType: '',
        NormalConsumptionAdjusted: 0,
        Normal_NoOfUnitsFor_energy_calculation: 0,
        PeakConsumptionAdjusted_80_percent: 0,
        PeakConsumptionAdjusted: 0,
        Peak_NoOfUnitsFor_energy_calculation: 0,
        OffPeakConsumptionAdjusted: 0,
        OffPeak_NoOfUnitsFor_energy_calculation: 0,
        NormalConsumptionAdjusted_Below20kW: 0,
        PeakConsumptionAdjusted_Below20kW: 0,
        Peak_NoOfUnitsFor_energy_calculation_Below20kW: 0,
        OffPeakConsumptionAdjusted_Below20kW: 0,
        OffPeak_NoOfUnitsFor_energy_calculation_Below20kW: 0,
        unitRate_Below20kW: 0,
        energyCharge_Below20kW: 0,
        bankAdjustedUnits_Below20kW: 0,
        NormalConsumptionAdjusted_energy_charge: 0,
        PeakConsumptionAdjusted_energy_charge: 0,
        OffPeakConsumptionAdjusted_energy_charge: 0,
        PeakConsumptionAdjusted_energy_charge_Below20kW: 0,
        OffPeakConsumptionAdjusted_energy_charge_Below20kW: 0,
    };
}

function applyTariffRules({
    billingType, unitsConsumed, bankAdjustedUnits, phase, todBillingAbove20kW,
    exportPlusBank, importNormal, importPeak, importOffPeak,
}) {
    const fixedCharge = computeFixedCharge(unitsConsumed, phase);
    const fields = emptyTariffFields(bankAdjustedUnits);

    if (billingType === 'normal') {
        if (bankAdjustedUnits <= 250) {
            fields.billType = 'Telescopic';
            Object.assign(fields, computeTelescopicCharge(bankAdjustedUnits));
        } else {
            fields.billType = 'Non-Telescopic';
            Object.assign(fields, computeNonTelescopicCharge(bankAdjustedUnits));
        }
        return { fixedCharge, ...fields };
    }

    // ToD billing
    if (todBillingAbove20kW > 0) {
        Object.assign(fields, computeTodAbove20kW({ exportPlusBank, importNormal, importPeak, importOffPeak }));
    } else if (bankAdjustedUnits <= 250) {
        fields.billType = 'Telescopic-ToD';
        fields.todType = 'normal';
        Object.assign(fields, computeTelescopicCharge(bankAdjustedUnits));
    } else {
        const below20kW = computeTodBelow20kWAbove250({ exportPlusBank, importNormal, importPeak, importOffPeak });
        Object.assign(fields, below20kW);
        fields.energyCharge = below20kW.energyCharge_Below20kW;
        fields.bankAdjustedUnits = below20kW.bankAdjustedUnits_Below20kW;
        fields.unitRate = below20kW.unitRate_Below20kW;
    }

    return { fixedCharge, ...fields };
}

function computeMeterRent(phase, meterOwner) {
    const table = phase === 'phase1' ? METER_RENT.phase1 : METER_RENT.other;
    return meterOwner === 'kseb' ? table.kseb : table.other;
}

// Reads the raw form inputs and returns the full computed bill, or
// `{ error: <BILL_ERRORS key> }` if validation fails.
export function computeBill(rawInputs) {
    const { phase, meterOwner, billingType, connectedLoad, hasBankBalance } = rawInputs;
    const myBankDepositAtKseb = hasBankBalance ? (rawInputs.bankedUnits || 0) : 0;

    let solarGeneration = 0;
    let importReading = 0;
    let exportReading = 0;
    let solarNormal = 0, solarOffPeak = 0, solarPeak = 0;
    let importNormal = 0, importOffPeak = 0, importPeak = 0;
    let exportNormal = 0, exportOffPeak = 0, exportPeak = 0;
    let todBillingAbove20kW = 0;

    if (billingType === 'normal') {
        solarGeneration = rawInputs.solarGeneration || 0;
        importReading = rawInputs.importReading || 0;
        exportReading = rawInputs.exportReading || 0;
    } else if (billingType === 'tod') {
        solarNormal = rawInputs.solarNormal || 0;
        solarOffPeak = rawInputs.solarOffPeak || 0;
        solarPeak = rawInputs.solarPeak || 0;
        importNormal = rawInputs.importNormal || 0;
        importOffPeak = rawInputs.importOffPeak || 0;
        importPeak = rawInputs.importPeak || 0;
        exportNormal = rawInputs.exportNormal || 0;
        exportOffPeak = rawInputs.exportOffPeak || 0;
        exportPeak = rawInputs.exportPeak || 0;

        todBillingAbove20kW = connectedLoad === 'below20k' ? 0 : 1;

        solarGeneration = solarNormal + solarOffPeak + solarPeak;
        importReading = importNormal + importOffPeak + importPeak;
        exportReading = exportNormal + exportOffPeak + exportPeak;
    }

    const exportPlusBank = exportReading + myBankDepositAtKseb;
    const generationUsage = solarGeneration - exportReading;

    if (solarGeneration === 0 && importReading === 0 && exportReading === 0) {
        return { error: 'ALL_ZERO' };
    }
    if (solarGeneration < 0 || importReading < 0 || exportReading < 0 || myBankDepositAtKseb < 0) {
        return { error: 'NEGATIVE_VALUE' };
    }
    if (exportReading > solarGeneration) {
        return { error: 'EXPORT_EXCEEDS_GENERATION' };
    }

    const unitsConsumed = generationUsage + importReading;

    let bankAdjustedUnits = 0;
    let accountBalance = 0;
    if (importReading > exportPlusBank) {
        bankAdjustedUnits = importReading - exportPlusBank;
    } else {
        accountBalance = exportPlusBank - importReading;
    }

    const rules = applyTariffRules({
        billingType, unitsConsumed, bankAdjustedUnits, phase, todBillingAbove20kW,
        exportPlusBank, importNormal, importPeak, importOffPeak,
    });

    const meterRent = computeMeterRent(phase, meterOwner);
    const duty = rules.energyCharge * DUTY_RATE;
    const monthlyFuelSurcharge = rules.bankAdjustedUnits * FUEL_SURCHARGE_PER_UNIT;
    const totalBillAmount = Math.round(rules.fixedCharge + meterRent + rules.energyCharge + duty + monthlyFuelSurcharge);

    return {
        error: null,
        phase,
        meterOwner,
        billingType,
        connectedLoad,
        todBillingAbove20kW,
        solarGeneration,
        importReading,
        exportReading,
        solarNormal,
        solarOffPeak,
        solarPeak,
        importNormal,
        importOffPeak,
        importPeak,
        exportNormal,
        exportOffPeak,
        exportPeak,
        myBankDepositAtKseb,
        exportPlusBank,
        generationUsage,
        unitsConsumed,
        accountBalance,
        meterRent,
        duty,
        monthlyFuelSurcharge,
        totalBillAmount,
        ...rules,
    };
}
