document.getElementById('billCalculator').addEventListener('submit', function (event) {
    event.preventDefault();

    const phase = document.getElementById('phase').value;
    const meterOwner = document.getElementById('meterOwner').value;
    var billingType = document.getElementById('billingType').value;
    var solarGeneration;
    var importReading;
    var exportReading;


    if (billingType === 'normal') {
        solarGeneration = parseFloat(document.getElementById('solarGeneration').value) || 0;
        importReading = parseFloat(document.getElementById('import').value) || 0;
        exportReading = parseFloat(document.getElementById('export').value) || 0;
    } else if (billingType === 'tod') {
        var solarNormal = parseFloat(document.getElementById('solarNormal').value) || 0;
        var solarOffPeak = parseFloat(document.getElementById('solarOffPeak').value) || 0;
        var solarPeak = parseFloat(document.getElementById('solarPeak').value) || 0;
        var importNormal = parseFloat(document.getElementById('importNormal').value) || 0;
        var importOffPeak = parseFloat(document.getElementById('importOffPeak').value) || 0;
        var importPeak = parseFloat(document.getElementById('importPeak').value) || 0;
        var exportNormal = parseFloat(document.getElementById('exportNormal').value) || 0;
        var exportOffPeak = parseFloat(document.getElementById('exportOffPeak').value) || 0;
        var exportPeak = parseFloat(document.getElementById('exportPeak').value) || 0;

        solarGeneration = solarNormal + solarOffPeak + solarPeak;
        importReading = importNormal + importOffPeak + importPeak;
        exportReading = exportNormal + exportOffPeak + exportPeak;
    }

    let accountBalance;
    let generationUsage = solarGeneration - exportReading;

    // Check if all inputs are zero
    if (solarGeneration === 0 && importReading === 0 && exportReading === 0) {
        alert("Enter the details to proceed");
        return;
    }

    // Validate positive values
    if (solarGeneration < 0 || importReading < 0 || exportReading < 0) {
        alert("Please enter positive values.");
        return;
    }

    // Validate export reading
    if (exportReading > solarGeneration) {
        alert("Export reading cannot be greater than Solar Generation Meter Reading.");
        return;
    }

    let unitsConsumed = (solarGeneration - exportReading) + importReading;
    let bankAdjustedUnits = 0;

    if (importReading > exportReading) {
        bankAdjustedUnits = importReading - exportReading;
    } else {
        bankAdjustedUnits = 0;
        accountBalance = exportReading - importReading;
    }

    let billType;
    let fixedCharge;
    let energyCharge;

    if (unitsConsumed <= 250) {
        if (unitsConsumed <= 50) {
            fixedCharge = (phase === 'phase1') ? 40 : 100;
        } else if (unitsConsumed <= 100) {
            fixedCharge = (phase === 'phase1') ? 65 : 140;
        } else if (unitsConsumed <= 150) {
            fixedCharge = (phase === 'phase1') ? 85 : 170;
        } else if (unitsConsumed <= 200) {
            fixedCharge = (phase === 'phase1') ? 120 : 180;
        } else {
            fixedCharge = (phase === 'phase1') ? 130 : 200;
        }
    } else {
        if (unitsConsumed <= 300) {
            fixedCharge = (phase === 'phase1') ? 150 : 205;
        } else if (unitsConsumed <= 350) {
            fixedCharge = (phase === 'phase1') ? 175 : 210;
        } else if (unitsConsumed <= 400) {
            fixedCharge = (phase === 'phase1') ? 200 : 210;
        } else if (unitsConsumed <= 500) {
            fixedCharge = (phase === 'phase1') ? 230 : 235;
        } else {
            fixedCharge = (phase === 'phase1') ? 260 : 260;
        }
    }

    let unitRate;
    let breakdown = '';
    if (bankAdjustedUnits <= 250) {
        billType = "Telescopic";
        if (bankAdjustedUnits <= 50) {
            energyCharge = bankAdjustedUnits * 3.25;
            breakdown = `<p class="calc-step">${bankAdjustedUnits} units * ₹3.25 = ₹${energyCharge.toFixed(2)}</p>`;
        } else if (bankAdjustedUnits <= 100) {
            energyCharge = 50 * 3.25 + (bankAdjustedUnits - 50) * 4.05;
            breakdown = `
            <p class="calc-step">50 units * ₹3.25 = ₹${(50 * 3.25).toFixed(2)}</p>
            <p class="calc-step">${bankAdjustedUnits - 50} units * ₹4.05 = ₹${((bankAdjustedUnits - 50) * 4.05).toFixed(2)}</p>
        `;
        } else if (bankAdjustedUnits <= 150) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + (bankAdjustedUnits - 100) * 5.10;
            breakdown = `
            <p class="calc-step">50 units * ₹3.25 = ₹${(50 * 3.25).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹4.05 = ₹${(50 * 4.05).toFixed(2)}</p>
            <p class="calc-step">${bankAdjustedUnits - 100} units * ₹5.10 = ₹${((bankAdjustedUnits - 100) * 5.10).toFixed(2)}</p>
        `;
        } else if (bankAdjustedUnits <= 200) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + 50 * 5.10 + (bankAdjustedUnits - 150) * 6.95;
            breakdown = `
            <p class="calc-step">50 units * ₹3.25 = ₹${(50 * 3.25).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹4.05 = ₹${(50 * 4.05).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹5.10 = ₹${(50 * 5.10).toFixed(2)}</p>
            <p class="calc-step">${bankAdjustedUnits - 150} units * ₹6.95 = ₹${((bankAdjustedUnits - 150) * 6.95).toFixed(2)}</p>
        `;
        } else if (bankAdjustedUnits <= 250) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + 50 * 5.10 + 50 * 6.95 + (bankAdjustedUnits - 200) * 8.20;
            breakdown = `
            <p class="calc-step">50 units * ₹3.25 = ₹${(50 * 3.25).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹4.05 = ₹${(50 * 4.05).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹5.10 = ₹${(50 * 5.10).toFixed(2)}</p>
            <p class="calc-step">50 units * ₹6.95 = ₹${(50 * 6.95).toFixed(2)}</p>
            <p class="calc-step">${bankAdjustedUnits - 200} units * ₹8.20 = ₹${((bankAdjustedUnits - 200) * 8.20).toFixed(2)}</p>
        `;
        }
        if (bankAdjustedUnits > 0) {
            unitRate = energyCharge / bankAdjustedUnits;
            breakdown += `<p>Total Energy Charge: <b>₹${energyCharge.toFixed(2)}</b></p>`;
            breakdown += `<p>Unit Rate: ₹${unitRate.toFixed(2)} per unit (Avg.)</p>`;
        } else {
            unitRate = 0;
        }
    } else {
        billType = "Non-Telescopic";
        if (bankAdjustedUnits <= 300) {
            energyCharge = bankAdjustedUnits * 6.40;
            unitRate = 6.40;
        } else if (bankAdjustedUnits <= 350) {
            energyCharge = bankAdjustedUnits * 7.25;
            unitRate = 7.25;
        } else if (bankAdjustedUnits <= 400) {
            energyCharge = bankAdjustedUnits * 7.60;
            unitRate = 7.60;
        } else if (bankAdjustedUnits <= 500) {
            energyCharge = bankAdjustedUnits * 7.90;
            unitRate = 7.90;
        } else {
            energyCharge = bankAdjustedUnits * 8.80;
            unitRate = 8.80;
        }
    }

    let meterRent;
    if (phase === 'phase1') {
        if(meterOwner === 'kseb'){
            meterRent = 30 * 1.18; //18% GST
        }else{
            meterRent = 0;
        }
    } else {
        if(meterOwner === 'kseb'){
            meterRent = 35 * 1.18; //18% GST
        }else{
            meterRent = 0;
        }
    }


    const duty = energyCharge * 0.10;
    const fuelSurcharge = bankAdjustedUnits * 0.09;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.10;
    const totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + monthlyFuelSurcharge;
    let billInfo = '';

    if (billingType === 'tod'){
        billType = billType + ' (ToD)';
    }
    if(bankAdjustedUnits > 0){
        billInfo = `
        <tr><td>Bill Type</td><td><b>${billType}</b></td></tr>
        <tr><td>Fixed Charge</td><td><b>₹${fixedCharge}</b></td></tr>
        <tr><td>Meter Rent (GST Inc)</td><td><b>₹${meterRent}</b></td></tr>
        <tr><td>No: of Units Consumed (for Energy calculation)</td><td>${bankAdjustedUnits.toFixed(2)}</td></tr>
        <tr><td>Unit Charge</td><td>₹${unitRate.toFixed(2)}/Unit</td></tr>
        <tr><td>Energy Charge</td><td><b>₹${energyCharge.toFixed(2)}</b></td></tr>
        <tr><td>Duty</td><td><b>₹${duty.toFixed(2)}</b> (10% of the Energy Charge)</td></tr>
        <tr><td>Fuel Surcharge</td><td><b>₹${fuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnits} Unit x 9ps)</td></tr>
        <tr><td>Monthly Fuel Surcharge</td><td><b>₹${monthlyFuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnits}Unit x 10ps)</td></tr>
        <tr><td>Total Bill Amount</td><td><b>₹${totalBillAmount.toFixed(2)}</b></td></tr>
    `;
    }
    else{
        billInfo = `
        <tr><td>Bill Type</td><td>${billType}</td></tr>
        <tr><td>Fixed Charge</td><td><b>₹${fixedCharge}</b></td></tr>
        <tr><td>Meter Rent (GST Inc)</td><td>₹${meterRent}</td></tr>
        <tr><td>Total Bill Amount</td><td><b>₹${totalBillAmount.toFixed(2)}</b></td></tr>
    `;
    }

    document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
                                                   <p>Previous Month Total Import = ${importReading} Unit</p>
                                                   <p>Previous Month Total Export = ${exportReading} Unit</p><hr>
                                                   <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
                                                   <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
                                                   <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;
    document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> `;


    if (importReading > exportReading) {
        document.getElementById('result2').innerHTML = `<hr><p>Previous Month Total Import = ${importReading} Unit</p>
                                                        <p>Previous Month Total Export = ${exportReading} Unit</p> <hr>
                                                        <p>വ്യത്യാസം വരുന്ന <strong class="red-text">${bankAdjustedUnits} Unit </strong> (${importReading}-${exportReading}) ചാർജ് ചെയ്യപ്പെടുന്നതാണ്.</p>`;
        if (billType === 'Telescopic'){
            document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. <hr><p>Energy Charge Calculation (For ${bankAdjustedUnits} Unit):</p>
            ${breakdown} `;
        }else{
            document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. നിലവിലെ താരിഫ് അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. 
                                                            <p>Total Engergy Charge: ${bankAdjustedUnits} x ₹${unitRate.toFixed(2)} = <b>₹${energyCharge.toFixed(2)} </b></p> `; 
        }

        document.getElementById('result4').innerHTML = `Total Bill Amount ഏകദേശം  <strong class="red-text">₹${totalBillAmount.toFixed(2)} </strong> 
                                                        <br><i>(Changes with the GST, Security Deposit interest, Tariff changes, Advance calculation)</i>`;
    } else {
        if (importReading == exportReading) {
            document.getElementById('result2').innerHTML = `<br>Previous Month Total Import = ${importReading} Unit
                                                            <br>Previous Month Total Export = ${exportReading} Unit <hr>
                                                            <p><span class="green-text">ഇവിടെ Export ഉം Import ഉം തുല്ല്യമാണ്. എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല</span> </p>`;
        } else {
            document.getElementById('result2').innerHTML = `<br>Previous Month Total Import = ${importReading} Unit
                                                            <br>Precious Month Total Export = ${exportReading} Unit <hr>
                                                            <p><span class="green-text"><b>Export കൂടുതലായതു കൊണ്ട് എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല.</b></span> </p> `;
        }
        document.getElementById('result3').innerHTML = `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                        <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;
        document.getElementById('result4').innerHTML = `Extra Energy Generation = ${accountBalance} Unit will be added to bank 
                                                        <br>(Export(${exportReading})-Import(${importReading}))`;
    }
    document.getElementById('result5').innerHTML = `Tariff (w.e.f 1/11/2023) changes from time to time so check actual tariff from KSEB`;
    document.getElementById('result6').innerHTML = `If there are any calculation errors in the above, if other options are required, if there is a change in tariff, inform the information @ <span class="green-text"><b><i>calculatoronline2024@gmail.com</i></b></span>
                                                    <span style="font-style: italic">Note: The information provided is for reference only. For accurate details, always refer to official sources.</span>  (v1.0.13)`;


    document.getElementById('result').style.display = 'block';
    document.getElementById('result1').style.display = 'block';
    document.getElementById('result2').style.display = 'block';
    document.getElementById('result3').style.display = 'block';
    document.getElementById('result4').style.display = 'block';
    document.getElementById('result5').style.display = 'block';
    document.getElementById('result6').style.display = 'block';
    document.getElementById('billInfo').innerHTML = billInfo;
    document.getElementById('billDetails').style.display = 'block';
    document.getElementById('printButton').style.display = 'block';
    document.getElementById('moveToTop').style.display = 'block';
});

document.getElementById('billingType').addEventListener('change', function() {
    var billingType = this.value;
    var normalBillingSection = document.getElementById('normalBillingSection');
    var todBillingSection = document.getElementById('todBillingSection');
    var normalNetMeterReadingSection = document.getElementById('normalNetMeterReadingSection');
    var todNetMeterReadingSection = document.getElementById('todNetMeterReadingSection');

    if (billingType === 'normal') {
        normalBillingSection.style.display = 'block';
        normalNetMeterReadingSection.style.display = 'block';
        todBillingSection.style.display = 'none';
        todNetMeterReadingSection.style.display = 'none';
    } else if (billingType === 'tod') {
        normalBillingSection.style.display = 'none';
        normalNetMeterReadingSection.style.display = 'none';
        todBillingSection.style.display = 'block';
        todNetMeterReadingSection.style.display = 'block';
    }

    document.getElementById('result').style.display = 'none';
    document.getElementById('result1').style.display = 'none';
    document.getElementById('result2').style.display = 'none';
    document.getElementById('result3').style.display = 'none';
    document.getElementById('result4').style.display = 'none';
    document.getElementById('result5').style.display = 'none';
    document.getElementById('result6').style.display = 'none';
    document.getElementById('billDetails').style.display = 'none';
    document.getElementById('printButton').style.display = 'none';
    document.getElementById('moveToTop').style.display = 'none';
});

document.getElementById('resetButton').addEventListener('click', function () {
    document.getElementById('billCalculator').reset();
    document.getElementById('result').style.display = 'none';
    document.getElementById('result1').style.display = 'none';
    document.getElementById('result2').style.display = 'none';
    document.getElementById('result3').style.display = 'none';
    document.getElementById('result4').style.display = 'none';
    document.getElementById('result5').style.display = 'none';
    document.getElementById('result6').style.display = 'none';
    document.getElementById('billDetails').style.display = 'none';
    document.getElementById('printButton').style.display = 'none';
    document.getElementById('moveToTop').style.display = 'none';

    var billingType = document.getElementById('billingType').value;
    var normalBillingSection = document.getElementById('normalBillingSection');
    var todBillingSection = document.getElementById('todBillingSection');
    var normalNetMeterReadingSection = document.getElementById('normalNetMeterReadingSection');
    var todNetMeterReadingSection = document.getElementById('todNetMeterReadingSection');

    if (billingType === 'normal') {
        normalBillingSection.style.display = 'block';
        normalNetMeterReadingSection.style.display = 'block';
        todBillingSection.style.display = 'none';
        todNetMeterReadingSection.style.display = 'none';
    } else if (billingType === 'tod') {
        normalBillingSection.style.display = 'none';
        normalNetMeterReadingSection.style.display = 'none';
        todBillingSection.style.display = 'block';
        todNetMeterReadingSection.style.display = 'block';
    }
});

document.getElementById('printButton').addEventListener('click', function() {
    window.print();
});
