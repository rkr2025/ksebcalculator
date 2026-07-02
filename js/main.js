// Entry point: wires up DOM events to the pure calculator/render layers
// (js/main.js). This is the only file that touches document/window.

import { computeBill, BILL_ERRORS } from './calculator.js';
import { renderBillResults } from './render-results.js';
import { getRandomQuote } from './quotes.js';

const RESULT_PANEL_IDS = ['result', 'result1', 'result2', 'result3', 'result4', 'result6'];

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

document.getElementById('resetButton').addEventListener('click', function () {
    document.getElementById('billCalculator').reset();
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
    const currentDateTimeElement = document.getElementById('current-date-time');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentDateTimeElement.textContent = new Date().toLocaleString('en-US', options);
}

document.addEventListener('DOMContentLoaded', function () {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 1000);

    const quoteElement = document.getElementById('quote');
    quoteElement.textContent = getRandomQuote();
});
