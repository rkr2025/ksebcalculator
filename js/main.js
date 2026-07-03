// Entry point: wires up DOM events to the pure calculator/render layers
// (js/main.js). Besides reading-inputs.js (a self-contained DOM-only
// widget), this is the only file that touches document/window.

import { computeBill, BILL_ERRORS } from './calculator.js';
import { renderBillResults } from './render-results.js';
import { getRandomQuote } from './quotes.js';
import { fetchOnlineQuote } from './quote-service.js';
import { initReadingGroups } from './reading-inputs.js';
import { initWheelingUI } from './wheeling-ui.js';
import { computeWheelingResult } from './wheeling-calculator.js';

const resetReadingGroups = initReadingGroups();
const wheelingUI = initWheelingUI();

// Theme toggle. The initial dark/light state is already applied by the
// inline script in index.html's <head> (before first paint, to avoid a
// flash of the wrong theme) -- this just syncs the switch to match and
// wires up future changes.
const themeToggle = document.getElementById('themeToggle');
themeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
themeToggle.addEventListener('change', function () {
    if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
});

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
    document.getElementById('printButton').style.display = 'block';
    document.getElementById('moveToTop').style.display = 'block';
}

function hideResultPanels() {
    RESULT_PANEL_IDS.forEach((id) => {
        document.getElementById(id).style.display = 'none';
    });
    document.getElementById('billDetails').style.display = 'none';
    document.getElementById('printButton').style.display = 'none';
    document.getElementById('moveToTop').style.display = 'none';
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

document.getElementById('resetButton').addEventListener('click', function () {
    document.getElementById('billCalculator').reset();
    resetReadingGroups();
    wheelingUI.reset();
    hideResultPanels();

    document.getElementById('bankedUnitSection').style.display =
        document.getElementById('mybank').value === 'Yes' ? 'block' : 'none';
    document.getElementById('connectedLoadContainer').style.display =
        document.getElementById('billingType').value === 'tod' ? 'block' : 'none';

    updateBillingTypeSections(document.getElementById('billingType').value);
});

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

document.addEventListener('DOMContentLoaded', function () {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);

    // Show a static quote immediately (instant, no network wait), then
    // swap it for a live motivational quote if one arrives in time. Any
    // fetch failure just leaves the static quote in place.
    const quoteElement = document.getElementById('quote');
    quoteElement.textContent = getRandomQuote();
    fetchOnlineQuote().then((onlineQuote) => {
        if (onlineQuote) {
            quoteElement.textContent = onlineQuote;
        }
    });
});
