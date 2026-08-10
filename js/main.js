// Entry point: wires up DOM events to the pure calculator/render layers
// (js/main.js). Besides reading-inputs.js, wheeling-ui.js, card-info.js and
// voice-input.js (each a self-contained DOM-only widget), this is the only
// file that touches document/window.

import { computeBill, BILL_ERRORS } from './calculator.js';
import { renderBillResults, APP_VERSION_LABEL } from './render-results.js';
import { getRandomQuote } from './quotes.js';
import { fetchOnlineQuote } from './quote-service.js';
import { initReadingGroups } from './reading-inputs.js';
import { initWheelingUI } from './wheeling-ui.js';
import { computeWheelingResult } from './wheeling-calculator.js';
import { initCardInfoPanels } from './card-info.js';
import { initVoiceInput } from './voice-input.js';
import {
    TELESCOPIC_SLABS,
    NON_TELESCOPIC_SLABS,
    FIXED_CHARGE_SLABS,
    METER_RENT,
    DIST_LOSS_SAME_TRANSFORMER,
    DIST_LOSS_DIFFERENT_TRANSFORMER,
    WHEELING_RATE_PER_UNIT,
    LT7A_SLABS,
    LT7B_SLABS,
    DUTY_RATE,
    FUEL_SURCHARGE_PER_UNIT,
} from './tariff-rates.js';

const resetReadingGroups = initReadingGroups();
const wheelingUI = initWheelingUI();
initCardInfoPanels();
initVoiceInput();

const RESULT_PANEL_IDS = ['billExplanation', 'billChart', 'billAnalysis', 'wheelingBreakdown', 'result', 'result2', 'result3', 'result6'];
// Print-only -- populated/cleared alongside the panels above, but never
// shown on screen (styles.css forces display:none outside @media print),
// so it's handled separately from RESULT_PANEL_IDS's show/hide-on-screen loop.
const PRINT_ONLY_PANEL_ID = 'printInputsSummary';

function num(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

// Same idea as num(), but for Admin Option RATE OVERRIDES specifically: a
// blank field must fall back to the tariff-rates.js default (per the
// documented "Anything malformed falls back silently to the real default"
// contract), not silently become the number 0 -- 0 is itself a perfectly
// finite, valid-looking rate, so computeBill()'s Number.isFinite() check
// can't tell "left blank" apart from "user deliberately typed 0" once num()
// has already collapsed both to the same value. Returning undefined here
// lets that check correctly reject a blank field instead of honoring it as
// a ₹0 override.
function numOrUndefined(id) {
    const raw = document.getElementById(id).value;
    if (raw.trim() === '') return undefined;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}

// Builds the Admin Option "Core Tariff Rates" overrides as full slab
// objects -- band *boundaries* (bandUnits/maxUnits) are never user-edited,
// only the ₹ rate inside each band, so these always pair the fixed
// boundary with whatever the field currently holds (its default value when
// locked, or the user's edited value when unlocked). Read unconditionally,
// same as dutyRatePercent/fuelSurchargePaise below -- calculator.js falls
// back to its own defaults if a field somehow holds something invalid.
function buildTelescopicSlabs() {
    return TELESCOPIC_SLABS.map((slab, i) => ({ bandUnits: slab.bandUnits, rate: numOrUndefined(`telescopicRate${i + 1}`) }));
}
function buildNonTelescopicSlabs() {
    return NON_TELESCOPIC_SLABS.map((slab, i) => ({ maxUnits: slab.maxUnits, rate: numOrUndefined(`nonTelescopicRate${i + 1}`) }));
}
// LT7A/LT7B (commercial) rates for wheeled sites -- same boundary-fixed,
// rate-editable pattern as the other slab builders above, read from the
// Wheeling card's own Admin Option fields instead of Core Tariff Rates'.
function buildLt7aSlabs() {
    return LT7A_SLABS.map((slab, i) => ({ maxUnits: slab.maxUnits, rate: numOrUndefined(`lt7aRate${i + 1}`) }));
}
function buildLt7bSlabs() {
    return LT7B_SLABS.map((slab, i) => ({ maxUnits: slab.maxUnits, rate: numOrUndefined(`lt7bRate${i + 1}`) }));
}
function buildFixedChargeSlabs() {
    return FIXED_CHARGE_SLABS.map((slab, i) => ({
        maxUnits: slab.maxUnits,
        phase1: numOrUndefined(`fixedChargeSlab${i + 1}Phase1`),
        other: numOrUndefined(`fixedChargeSlab${i + 1}Other`),
    }));
}
// Consumer-owned meters are always ₹0 rent (not a revisable rate, so not
// user-edited here) -- only the two KSEB-owned cells come from the form.
function buildMeterRentTable() {
    return {
        phase1: { kseb: numOrUndefined('meterRentPhase1Kseb'), other: 0 },
        other: { kseb: numOrUndefined('meterRentPhase3Kseb'), other: 0 },
    };
}

function readFormInputs() {
    const phase = document.getElementById('phase').value;
    const meterOwner = document.getElementById('meterOwner').value;
    const billingType = document.getElementById('billingType').value;
    const hasBankBalance = document.getElementById('mybank').value === 'Yes';

    const inputs = {
        phase,
        meterOwner,
        billingType,
        hasBankBalance,
        bankedUnits: hasBankBalance ? num('bankedUnitInput') : 0,
        dutyRatePercent: numOrUndefined('dutyRatePercent'),
        fuelSurchargePaise: numOrUndefined('fuelSurchargeInput'),
        telescopicSlabs: buildTelescopicSlabs(),
        nonTelescopicSlabs: buildNonTelescopicSlabs(),
        fixedChargeSlabs: buildFixedChargeSlabs(),
        meterRentTable: buildMeterRentTable(),
    };

    if (billingType === 'normal') {
        inputs.solarGeneration = num('solarGeneration');
        inputs.importReading = num('import');
        inputs.exportReading = num('export');
    } else if (billingType === 'tod') {
        inputs.solarNormal = num('solarNormal');
        inputs.solarOffPeak = num('solarOffPeak');
        inputs.solarPeak = num('solarPeak');
        inputs.importNormal = num('importNormal');
        inputs.importOffPeak = num('importOffPeak');
        inputs.importPeak = num('importPeak');
        inputs.exportNormal = num('exportNormal');
        inputs.exportOffPeak = num('exportOffPeak');
        inputs.exportPeak = num('exportPeak');
        inputs.connectedLoad = document.getElementById('load').value;
    }

    return inputs;
}

// For the print-only "Entered Values" summary: the actual Previous/Present
// meter readings the user typed, for whichever fields had "Calculate from
// Previous & Present meter readings" enabled -- readFormInputs() only sees
// the computed diff (written into the real field by reading-inputs.js), so
// this has to separately re-read the _initial/_final boxes themselves.
// Fields left in plain-total mode are simply omitted, not backfilled with a
// fabricated reading pair.
function collectReadingPairs() {
    const pairs = {};
    function addIfEnabled(toggleId, fieldIds) {
        const toggle = document.getElementById(toggleId);
        if (!toggle || !toggle.checked) return;
        fieldIds.forEach((fieldId) => {
            const initial = document.getElementById(`${fieldId}_initial`);
            const final = document.getElementById(`${fieldId}_final`);
            if (initial && final) {
                pairs[fieldId] = { previous: parseFloat(initial.value) || 0, present: parseFloat(final.value) || 0 };
            }
        });
    }
    addIfEnabled('solarGenReadingModeToggle', ['solarGeneration']);
    addIfEnabled('solarReadingModeToggle', ['solarNormal', 'solarOffPeak', 'solarPeak']);
    addIfEnabled('netMeterReadingModeToggle', ['import', 'export']);
    addIfEnabled('importReadingModeToggle', ['importNormal', 'importOffPeak', 'importPeak']);
    addIfEnabled('exportReadingModeToggle', ['exportNormal', 'exportOffPeak', 'exportPeak']);
    return pairs;
}

function clearResultPanels() {
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).innerHTML = '';
    });
    document.getElementById(PRINT_ONLY_PANEL_ID).innerHTML = '';
}

function showResultPanels() {
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).style.display = 'block';
    });
    document.getElementById('billDetails').style.display = 'block';
    document.getElementById('printActionsRow').style.display = 'flex';
    document.getElementById('quote').style.display = 'block';
}

function hideResultPanels() {
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById('billDetails').style.display = 'none';
    document.getElementById('printActionsRow').style.display = 'none';
    document.getElementById('quote').style.display = 'none';
    // Unlike the panels above, printInputsSummary's on-screen-hidden state
    // comes from an !important stylesheet rule (so @media print can
    // override it) rather than this inline style -- so a direct Ctrl+P
    // print right after Reset/hide, before recalculating, would otherwise
    // still render whatever stale bill it was last populated with. Clearing
    // it here (not just hiding it) closes that gap.
    document.getElementById(PRINT_ONLY_PANEL_ID).innerHTML = '';
}

function updateBillingTypeSections(billingType) {
    const normalBillingSection = document.getElementById('normalBillingSection');
    const todBillingSection = document.getElementById('todBillingSection');
    const normalNetMeterReadingSection = document.getElementById('normalNetMeterReadingSection');
    const todNetMeterReadingSection = document.getElementById('todNetMeterReadingSection');
    const connectedLoadContainer = document.getElementById('connectedLoadContainer');

    if (billingType === 'normal') {
        normalBillingSection.style.display = 'block';
        normalNetMeterReadingSection.style.display = 'block';
        todBillingSection.style.display = 'none';
        todNetMeterReadingSection.style.display = 'none';
        connectedLoadContainer.style.display = 'none';
    } else if (billingType === 'tod') {
        normalBillingSection.style.display = 'none';
        normalNetMeterReadingSection.style.display = 'none';
        todBillingSection.style.display = 'block';
        todNetMeterReadingSection.style.display = 'block';
        connectedLoadContainer.style.display = 'block';
    }
}

document.getElementById('billCalculator').addEventListener('submit', function (event) {
    event.preventDefault();
    clearResultPanels();

    const bill = computeBill(readFormInputs());
    if (bill.error) {
        alert(BILL_ERRORS[bill.error]);
        // Without this, a previously-calculated bill's panels (now cleared
        // to empty by clearResultPanels() above, but still `display:block`
        // from that earlier successful calculation) would stay visible as a
        // wall of empty boxes instead of disappearing along with the error.
        hideResultPanels();
        return;
    }

    if (wheelingUI.isEnabled()) {
        const wheelingOverrides = {
            sameTransformerPct: numOrUndefined('wheelSameTransformerLoss'),
            differentTransformerPct: numOrUndefined('wheelDiffTransformerLoss'),
            wheelingRatePerUnit: numOrUndefined('wheelingRatePerUnitInput'),
            // Same Admin Option rates as the prosumer's own bill above -- a
            // wheeled LT1 (domestic) site is billed on the same tariff table.
            telescopicSlabs: buildTelescopicSlabs(),
            nonTelescopicSlabs: buildNonTelescopicSlabs(),
            lt7aSlabs: buildLt7aSlabs(),
            lt7bSlabs: buildLt7bSlabs(),
            // The bill's own EFFECTIVE duty rate / fuel surcharge (already
            // resolved from either the Admin Option override or the
            // tariff-rates.js default by computeBill() above) -- reused here
            // so a wheeled site's before/after comparison matches the
            // prosumer's own bill instead of silently reverting to the
            // hardcoded defaults whenever Duty/Fuel Surcharge is overridden.
            dutyRate: bill.dutyRate,
            fuelSurchargePerUnit: bill.fuelSurchargePerUnit,
        };
        const wheelingResult = computeWheelingResult(bill.accountBalance, wheelingUI.getSites(), wheelingOverrides);
        if (wheelingResult.sites.length > 0) {
            bill.wheelingResult = wheelingResult;
            bill.totalBillAmount = Math.round((bill.totalBillAmount + wheelingResult.wheelingCharge) * 100) / 100;
            // accountBalance is "what carries forward as banked units" --
            // after wheeling, that's whatever's left post-loss, not the
            // pre-wheeling surplus.
            bill.accountBalance = wheelingResult.finalBankBalance;
        }
    }

    const panels = renderBillResults(bill, collectReadingPairs());
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).innerHTML = panels[id];
    });
    document.getElementById('billInfo').innerHTML = panels.billInfo;
    document.getElementById(PRINT_ONLY_PANEL_ID).innerHTML = panels.printInputsSummary;

    // Daily Thought only appears once a bill has actually been calculated --
    // show a static quote immediately (instant, no network wait), then swap
    // it for a live motivational quote if one arrives in time. Any fetch
    // failure just leaves the static quote in place.
    const quoteElement = document.getElementById('quote');
    quoteElement.textContent = getRandomQuote();
    fetchOnlineQuote().then((onlineQuote) => {
        if (onlineQuote) {
            quoteElement.textContent = onlineQuote;
        }
    }).catch(() => {
        // fetchOnlineQuote() already resolves to null on any failure rather
        // than rejecting, so this should never fire -- kept as a defensive
        // backstop against a future edit narrowing its internal try/catch,
        // so a quote-fetch failure can never surface as an unhandled
        // rejection or interrupt the Calculate Bill flow above.
    });

    showResultPanels();
    document.getElementById('billDetails').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('billingType').addEventListener('change', function () {
    updateBillingTypeSections(this.value);
    hideResultPanels();
});

document.getElementById('mybank').addEventListener('change', function () {
    document.getElementById('bankedUnitSection').style.display = this.value === 'Yes' ? 'block' : 'none';
    // Same reasoning as the billingType change handler above -- a bill
    // calculated before this toggle changed no longer reflects the current
    // (now input-incomplete) form state, so don't leave it on screen.
    hideResultPanels();
});

// Shared by all four "Admin Option" rate groups below (Duty & Fuel
// Surcharge, Core Tariff Rates, Meter Rent, Wheeling Distribution Loss % &
// Rate): each has an "Edit these rates" toggle that unlocks a fixed list of
// fields, plus a "Reset to Default Rates" button that restores the real
// tariff-rates.js values and re-locks the group -- the explicit,
// discoverable way to "go back to the calculator's built-in rates" the
// fields' own toggle-uncheck alone doesn't provide (unchecking only greys
// the fields back out, it doesn't touch whatever value is already typed in).
function wireRateGroup(toggleId, resetButtonId, fieldIds, defaults) {
    const toggle = document.getElementById(toggleId);
    toggle.addEventListener('change', function () {
        fieldIds.forEach((id) => { document.getElementById(id).disabled = !this.checked; });
    });
    document.getElementById(resetButtonId).addEventListener('click', () => {
        fieldIds.forEach((id, i) => { document.getElementById(id).value = defaults[i]; });
        toggle.checked = false;
        fieldIds.forEach((id) => { document.getElementById(id).disabled = true; });
    });
}

const DUTY_SURCHARGE_FIELD_IDS = ['dutyRatePercent', 'fuelSurchargeInput'];
const DUTY_SURCHARGE_DEFAULTS = [DUTY_RATE * 100, FUEL_SURCHARGE_PER_UNIT * 100];
wireRateGroup('dutySurchargeEditToggle', 'resetDutySurchargeButton', DUTY_SURCHARGE_FIELD_IDS, DUTY_SURCHARGE_DEFAULTS);

const TARIFF_RATE_FIELD_IDS = [
    'telescopicRate1', 'telescopicRate2', 'telescopicRate3', 'telescopicRate4', 'telescopicRate5',
    'nonTelescopicRate1', 'nonTelescopicRate2', 'nonTelescopicRate3', 'nonTelescopicRate4', 'nonTelescopicRate5',
    ...FIXED_CHARGE_SLABS.flatMap((slab, i) => [`fixedChargeSlab${i + 1}Phase1`, `fixedChargeSlab${i + 1}Other`]),
];
const TARIFF_RATE_DEFAULTS = [
    ...TELESCOPIC_SLABS.map((s) => s.rate),
    ...NON_TELESCOPIC_SLABS.map((s) => s.rate),
    ...FIXED_CHARGE_SLABS.flatMap((s) => [s.phase1, s.other]),
];
wireRateGroup('tariffRatesEditToggle', 'resetTariffRatesButton', TARIFF_RATE_FIELD_IDS, TARIFF_RATE_DEFAULTS);

wireRateGroup(
    'meterRentEditToggle',
    'resetMeterRentButton',
    ['meterRentPhase1Kseb', 'meterRentPhase3Kseb'],
    [METER_RENT.phase1.kseb, METER_RENT.other.kseb],
);

const WHEELING_RATE_FIELD_IDS = [
    'wheelSameTransformerLoss', 'wheelDiffTransformerLoss', 'wheelingRatePerUnitInput',
    'lt7aRate1', 'lt7aRate2', 'lt7aRate3', 'lt7aRate4', 'lt7aRate5',
    'lt7bRate1', 'lt7bRate2', 'lt7bRate3', 'lt7bRate4', 'lt7bRate5',
];
const WHEELING_RATE_DEFAULTS = [
    DIST_LOSS_SAME_TRANSFORMER, DIST_LOSS_DIFFERENT_TRANSFORMER, WHEELING_RATE_PER_UNIT,
    ...LT7A_SLABS.map((s) => s.rate),
    ...LT7B_SLABS.map((s) => s.rate),
];
wireRateGroup('wheelingLossEditToggle', 'resetWheelingRatesButton', WHEELING_RATE_FIELD_IDS, WHEELING_RATE_DEFAULTS);


// Trigger the change events on page load so the visible sections match
// whichever options are marked `selected` in index.html.
document.getElementById('billingType').dispatchEvent(new Event('change'));
document.getElementById('mybank').dispatchEvent(new Event('change'));

// Solar Diary (solar-diary.html) hands off its tracked readings here via
// localStorage so the user can see the full T1/T2/T3 breakdown without that
// page having to duplicate this whole render layer. The stashed object is
// already shaped exactly like readFormInputs()'s output.
function setFieldValue(id, value) {
    document.getElementById(id).value = value;
}

function applyBillHandoff() {
    const raw = localStorage.getItem('kseb_bill_handoff');
    if (!raw) return;
    localStorage.removeItem('kseb_bill_handoff');

    let inputs;
    try {
        inputs = JSON.parse(raw);
    } catch {
        return;
    }

    setFieldValue('phase', inputs.phase);
    setFieldValue('meterOwner', inputs.meterOwner);
    setFieldValue('billingType', inputs.billingType);
    document.getElementById('billingType').dispatchEvent(new Event('change'));

    setFieldValue('mybank', inputs.hasBankBalance ? 'Yes' : 'No');
    document.getElementById('mybank').dispatchEvent(new Event('change'));
    if (inputs.hasBankBalance) {
        setFieldValue('bankedUnitInput', inputs.bankedUnits);
    }

    if (inputs.billingType === 'tod') {
        setFieldValue('load', inputs.connectedLoad);
        setFieldValue('solarNormal', inputs.solarNormal);
        setFieldValue('solarOffPeak', inputs.solarOffPeak);
        setFieldValue('solarPeak', inputs.solarPeak);
        setFieldValue('importNormal', inputs.importNormal);
        setFieldValue('importOffPeak', inputs.importOffPeak);
        setFieldValue('importPeak', inputs.importPeak);
        setFieldValue('exportNormal', inputs.exportNormal);
        setFieldValue('exportOffPeak', inputs.exportOffPeak);
        setFieldValue('exportPeak', inputs.exportPeak);
    } else if (inputs.billingType === 'normal') {
        setFieldValue('solarGeneration', inputs.solarGeneration);
        setFieldValue('import', inputs.importReading);
        setFieldValue('export', inputs.exportReading);
    }

    document.getElementById('billCalculator').scrollIntoView({ behavior: 'smooth' });
}

applyBillHandoff();

function resetCalculator() {
    document.getElementById('billCalculator').reset();
    resetReadingGroups();
    wheelingUI.reset();
    hideResultPanels();

    document.getElementById('bankedUnitSection').style.display =
        document.getElementById('mybank').value === 'Yes' ? 'block' : 'none';
    document.getElementById('connectedLoadContainer').style.display =
        document.getElementById('billingType').value === 'tod' ? 'block' : 'none';
    // <details> isn't a form control, so form.reset() doesn't collapse it --
    // do that explicitly so Reset also shrinks it back to its default state.
    document.getElementById('adminOptionsContainer').open = false;
    document.getElementById('connectedLoadContainer').open = false;
    document.getElementById('dutySurchargeContainer').open = false;
    document.getElementById('tariffRatesContainer').open = false;
    document.getElementById('meterRentContainer').open = false;
    document.getElementById('wheelingLossContainer').open = false;
    // form.reset() restores the Edit-these-rates checkboxes to unchecked
    // and each rate field's `value` to its HTML default, but it doesn't
    // touch the `disabled` property on those inputs -- re-sync them so
    // Reset also greys the fields back out.
    DUTY_SURCHARGE_FIELD_IDS.forEach((id) => { document.getElementById(id).disabled = true; });
    TARIFF_RATE_FIELD_IDS.forEach((id) => { document.getElementById(id).disabled = true; });
    document.getElementById('meterRentPhase1Kseb').disabled = true;
    document.getElementById('meterRentPhase3Kseb').disabled = true;
    WHEELING_RATE_FIELD_IDS.forEach((id) => { document.getElementById(id).disabled = true; });

    updateBillingTypeSections(document.getElementById('billingType').value);
}

document.getElementById('resetButton').addEventListener('click', resetCalculator);
document.getElementById('resetButton2').addEventListener('click', resetCalculator);

document.getElementById('printButton').addEventListener('click', function () {
    window.print();
});

function updateCurrentDateTime() {
    const clockTimeElement = document.getElementById('clockTime');
    const clockDateElement = document.getElementById('clockDate');
    const now = new Date();

    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    clockTimeElement.innerHTML = timeString.replace(/:/g, '<span class="digital-clock-colon">:</span>');

    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    clockDateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
}

let clockIntervalId = null;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('appVersionFooter').textContent = APP_VERSION_LABEL;

    updateCurrentDateTime();
    clockIntervalId = setInterval(updateCurrentDateTime, 1000);

    // The clock's 1s interval and blink animation keep forcing reflows
    // while the browser paginates the print preview, which is what was
    // making printing feel slow (and the clock is hidden in print anyway
    // via the styles.css @media print block).
    window.addEventListener('beforeprint', function () {
        if (clockIntervalId) clearInterval(clockIntervalId);
    });
    window.addEventListener('afterprint', function () {
        updateCurrentDateTime();
        clockIntervalId = setInterval(updateCurrentDateTime, 1000);
    });

    // FAQ language toggle (English/Malayalam). Always reset to Malayalam
    // whenever the FAQ card is collapsed, so it's the default the next time
    // it's expanded -- rather than remembering whatever was last selected.
    const faqLangButtons = document.querySelectorAll('.faq-lang-toggle .faq-lang-btn');
    const faqLangContents = document.querySelectorAll('.faq-list[data-faq-lang-content]');
    if (faqLangButtons.length) {
        const setFaqLang = (lang) => {
            faqLangButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.faqLang === lang));
            faqLangContents.forEach((el) => { el.hidden = el.dataset.faqLangContent !== lang; });
        };
        faqLangButtons.forEach((btn) => {
            btn.addEventListener('click', () => setFaqLang(btn.dataset.faqLang));
        });
        setFaqLang('ml');

        const faqCardDetails = faqLangButtons[0].closest('details.faq-card');
        if (faqCardDetails) {
            faqCardDetails.addEventListener('toggle', () => {
                if (!faqCardDetails.open) {
                    setFaqLang('ml');
                }
            });
        }
    }

    // Bill Explanation / ToD Calculation Explained / Wheeling Calculation
    // Explained language toggles (English/Malayalam), same look as the FAQ
    // one above -- delegated rather than bound directly, since all three
    // panels' HTML is replaced fresh on every "Calculate Bill" click (each
    // recalculation's markup already defaults to Malayalam active, so no
    // extra initial-state JS is needed here). All three panels share the
    // same bill-explain-lang-* markup shape, so one listener factory
    // covers them all.
    function wireBillLangToggle(containerId) {
        const container = document.getElementById(containerId);
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.bill-explain-lang-btn');
            if (!btn) return;
            const lang = btn.dataset.billLang;
            container.querySelectorAll('.bill-explain-lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.billLang === lang));
            container.querySelectorAll('[data-bill-lang-content]').forEach((el) => { el.hidden = el.dataset.billLangContent !== lang; });
        });
    }
    wireBillLangToggle('billExplanation');
    wireBillLangToggle('result2');
    wireBillLangToggle('wheelingBreakdown');

});
