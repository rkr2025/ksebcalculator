document.getElementById('billCalculator').addEventListener('submit', function (event) {
    event.preventDefault();

    const phase = document.getElementById('phase').value;
    const solarGeneration = parseFloat(document.getElementById('solarGeneration').value);
    const importReading = parseFloat(document.getElementById('import').value);
    const exportReading = parseFloat(document.getElementById('export').value);
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
    if (bankAdjustedUnits <= 250) {
        billType = "Telescopic";
        if (bankAdjustedUnits <= 50) {
            energyCharge = bankAdjustedUnits * 3.25;
        } else if (bankAdjustedUnits <= 100) {
            energyCharge = 50 * 3.25 + (bankAdjustedUnits - 50) * 4.05;
        } else if (bankAdjustedUnits <= 150) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + (bankAdjustedUnits - 100) * 5.10;
        } else if (bankAdjustedUnits <= 200) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + 50 * 5.10 + (bankAdjustedUnits - 150) * 6.95;
        } else if (bankAdjustedUnits <= 250) {
            energyCharge = 50 * 3.25 + 50 * 4.05 + 50 * 5.10 + 50 * 6.95 + (bankAdjustedUnits - 200) * 8.20;
        }
        if (bankAdjustedUnits > 0) {
            unitRate = energyCharge / bankAdjustedUnits;
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
        meterRent = 30;
    } else {
        meterRent = 35;
    }


    const duty = energyCharge * 0.10;
    const fuelSurcharge = bankAdjustedUnits * 0.09;
    const generationDuty = solarGeneration * 0.15;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.10;
    const totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + generationDuty + monthlyFuelSurcharge;
    const billInfo = `
        <tr><td>Bill Type</td><td>${billType}</td></tr>
        <tr><td>Fixed Charge</td><td>₹${fixedCharge}</td></tr>
        <tr><td>Meter Rent (GST Inc)</td><td>₹${meterRent}</td></tr>
        <tr><td>Unit Charge</td><td>₹${unitRate.toFixed(2)}/Unit</td></tr>
        <tr><td>No: of Units Consumed (for Energy calculation)</td><td>${bankAdjustedUnits.toFixed(2)}</td></tr>
        <tr><td>Energy Charge</td><td>₹${energyCharge.toFixed(2)} (${bankAdjustedUnits.toFixed(2)} x ₹${unitRate.toFixed(2)})</td></tr>
        <tr><td>Duty</td><td>₹${duty.toFixed(2)} (10% of the Energy Charge)</td></tr>
        <tr><td>Fuel Surcharge</td><td>₹${fuelSurcharge.toFixed(2)} (Consumption: ${bankAdjustedUnits}Unit x 9ps)</td></tr>
        <tr><td>Generation Duty</td><td>₹${generationDuty.toFixed(2)} (Solar Generation ${solarGeneration}Unit x 15ps)</td></tr>
        <tr><td>Monthly Fuel Surcharge</td><td>₹${monthlyFuelSurcharge.toFixed(2)} (Consumption: ${bankAdjustedUnits}Unit x 10ps)</td></tr>
        <tr><td>Total Bill Amount</td><td>₹${totalBillAmount.toFixed(2)}</td></tr>
    `;

    document.getElementById('result').innerHTML = `ആകെ Solar Generation <strong class="green-text">${solarGeneration}</strong> യൂണിറ്റ് ആകുന്നു.ഇതിൽ നിന്നും <strong class="red-text">${generationUsage}</strong> യൂണിറ്റ് നേരിട്ട് താങ്കൾ ഉപയോഗിച്ചിട്ടുണ്ട് . KSEB യിൽ നിന്നും <strong class="red-text">${importReading}</strong> യൂണിറ്റ് ഉപയോഗിച്ചിട്ടുണ്ട്. അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം. `;
    document.getElementById('result1').innerHTML = `നിലവിലെ താരിഫ് (${phase}) അനുസരിച്ച് <strong class="red-text">${unitsConsumed}</strong> യൂണിറ്റിന് ₹${fixedCharge} ആണ് Fixed Charge ആയി വരുന്നത്.`;


    if (importReading > exportReading) {
        document.getElementById('result2').innerText = `താങ്കൾ കഴിഞ്ഞ മാസം ${importReading} യൂണിറ്റ്  Import ഉം  ${exportReading} യൂണിറ്റ് Export ഉം ചെയ്തിട്ടുണ്ട്.  വ്യത്യാസം വരുന്ന ${bankAdjustedUnits} യൂണിറ്റ് ചാർജ് ചെയ്യപ്പെടുന്നതാണ് . `;
        document.getElementById('result3').innerText = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. നിലവിലെ താരിഫ് അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. Total Engergy Charge: ${bankAdjustedUnits} x ₹${unitRate.toFixed(2)} = ₹${energyCharge.toFixed(2)}  `;
        document.getElementById('result4').innerText = `Total Bill Amount ഏകദേശം  ₹${totalBillAmount.toFixed(2)} (GST, Meter rent, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം )`;
    } else {
        if (importReading == exportReading) {
            document.getElementById('result2').innerText = `താങ്കൾ കഴിഞ്ഞ മാസം ${importReading} യൂണിറ്റ്  Import ഉം  ${exportReading} യൂണിറ്റ് Export ഉം ചെയ്തിട്ടുണ്ട്. ഇവിടെ Export ഉം Import ഉം തുല്ല്യമാണ്. എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല. `;
        } else {
            document.getElementById('result2').innerHTML = `താങ്കൾ കഴിഞ്ഞ മാസം ${importReading} യൂണിറ്റ്  Import ഉം  ${exportReading} യൂണിറ്റ് Export ഉം ചെയ്തിട്ടുണ്ട്. <span class="green-text">Export കൂടുതലായതു കൊണ്ട് എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല.</span> `;
        }
        document.getElementById('result3').innerText = `Total Bill Amount ഏകദേശം  ₹${totalBillAmount.toFixed(2)} (GST, Meter rent, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം )`;
        document.getElementById('result4').innerText = `ഇവിടെ അധികമായി Generate ചെയ്‌തത്  ${accountBalance} യൂണിറ്റ് (Export-Import) ആണ്. അത്  ബാങ്ക് അക്കൗണ്ടിലേക്ക് ചേർക്കുന്നതാണ്.`;
    }
    document.getElementById('result5').innerText = `ഇത് ഒരു ഏകദേശ കണക്ക് ആകുന്നു. താരിഫ് (w.e.f 1/11/2023) ഓരോ തവണയും മാറ്റം വരാറുണ്ട്, അത് കൊണ്ട് യഥാർത്ഥ താരിഫ് KSEB യിൽ നിന്നും മനസിലാക്കുക  `;
    document.getElementById('result6').innerHTML = `മേൽ കൊടുത്തിട്ടുള്ളതിൽ calculation തെറ്റുകൾ ഉണ്ടെങ്കിൽ , വേറെ ഓപ്ഷനുകൾ ആവശ്യമാണെങ്കിൽ , താരിഫ് മാറ്റം ഉണ്ടെങ്കിൽ ആ വിവരങ്ങൾ calculatoronline2024@gmail.com എന്ന വിലാസത്തിൽ അറിയിക്കുക. 
                                                    <span style="font-style: italic">Note: The information provided is for reference only. For accurate details, always refer to official sources.</span>  (v1.0.3)`;


    document.getElementById('result').style.display = 'block';
    document.getElementById('result1').style.display = 'block';
    document.getElementById('result2').style.display = 'block';
    document.getElementById('result3').style.display = 'block';
    document.getElementById('result4').style.display = 'block';
    document.getElementById('result5').style.display = 'block';
    document.getElementById('result6').style.display = 'block';
    document.getElementById('billInfo').innerHTML = billInfo;
    document.getElementById('billDetails').style.display = 'block';
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
});
