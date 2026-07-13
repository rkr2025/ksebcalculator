// Entry point: wires up DOM events to the pure calculator/render layers
// (js/main.js). Besides reading-inputs.js (a self-contained DOM-only
// widget), this is the only file that touches document/window.

import { computeBill, BILL_ERRORS, computeMeterRent } from './calculator.js';
import { renderBillResults } from './render-results.js';
import { getRandomQuote } from './quotes.js';
import { fetchOnlineQuote } from './quote-service.js';
import { initReadingGroups } from './reading-inputs.js';
import { initWheelingUI } from './wheeling-ui.js';
import { computeWheelingResult } from './wheeling-calculator.js';

const resetReadingGroups = initReadingGroups();
const wheelingUI = initWheelingUI();

const RESULT_PANEL_IDS = ['billChart', 'billAnalysis', 'wheelingBreakdown', 'result', 'result1', 'result2', 'result3', 'result4', 'result6'];

function num(id) {
    return parseFloat(document.getElementById(id).value) || 0;
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
        dutyRatePercent: num('dutyRatePercent'),
        fuelSurchargePaise: num('fuelSurchargeInput'),
        meterRentOverride: num('meterRentInput'),
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

function clearResultPanels() {
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).innerHTML = '';
    });
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
        return;
    }

    if (wheelingUI.isEnabled()) {
        const wheelingResult = computeWheelingResult(bill.accountBalance, wheelingUI.getSites());
        if (wheelingResult.sites.length > 0) {
            bill.wheelingResult = wheelingResult;
            bill.totalBillAmount = Math.round((bill.totalBillAmount + wheelingResult.wheelingCharge) * 100) / 100;
            // accountBalance is "what carries forward as banked units" --
            // after wheeling, that's whatever's left post-loss, not the
            // pre-wheeling surplus.
            bill.accountBalance = wheelingResult.finalBankBalance;
        }
    }

    const panels = renderBillResults(bill);
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).innerHTML = panels[id];
    });
    document.getElementById('billInfo').innerHTML = panels.billInfo;

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
});

// Duty Rate / Fuel Surcharge start greyed out at the current KSEB defaults;
// this toggle is the only way to unlock editing them.
document.getElementById('dutySurchargeEditToggle').addEventListener('change', function () {
    document.getElementById('dutyRatePercent').disabled = !this.checked;
    document.getElementById('fuelSurchargeInput').disabled = !this.checked;
});

// Meter Rent starts greyed out too, kept in sync with Phase/Meter Owner
// (the same table js/calculator.js's computeMeterRent() reads) until the
// user unlocks editing it, at which point it stops auto-updating.
function updateMeterRentDefault() {
    const phase = document.getElementById('phase').value;
    const meterOwner = document.getElementById('meterOwner').value;
    document.getElementById('meterRentPhaseLabel').textContent = phase === 'phase1' ? 'Phase 1' : 'Phase 3';
    if (document.getElementById('meterRentEditToggle').checked) return;
    document.getElementById('meterRentInput').value = computeMeterRent(phase, meterOwner);
}

document.getElementById('phase').addEventListener('change', updateMeterRentDefault);
document.getElementById('meterOwner').addEventListener('change', updateMeterRentDefault);
document.getElementById('meterRentEditToggle').addEventListener('change', function () {
    document.getElementById('meterRentInput').disabled = !this.checked;
    if (!this.checked) updateMeterRentDefault();
});
updateMeterRentDefault();

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
    document.getElementById('meterRentContainer').open = false;
    // form.reset() restores the Edit-these-rates checkboxes to unchecked,
    // but it doesn't touch the `disabled` property on the rate inputs --
    // re-sync them so Reset also greys the fields back out.
    document.getElementById('dutyRatePercent').disabled = true;
    document.getElementById('fuelSurchargeInput').disabled = true;
    document.getElementById('meterRentInput').disabled = true;
    updateMeterRentDefault();

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

});
