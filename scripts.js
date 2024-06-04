document.getElementById('billCalculator').addEventListener('submit', function(event) {
    event.preventDefault();

    const phase = document.getElementById('phase').value;
    const solarGeneration = parseFloat(document.getElementById('solarGeneration').value);
    const importReading = parseFloat(document.getElementById('import').value);
    const exportReading = parseFloat(document.getElementById('export').value);

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
    }

    let billType;
    let fixedCharge;
    let energyCharge;

    if (unitsConsumed <= 250) {
        billType = "Telescopic";
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
        billType = "Non-Telescopic";
        if (unitsConsumed <= 300) {
            fixedCharge = (phase === 'phase1') ? 150 : 205;
        } else if (unitsConsumed <= 350) {
            fixedCharge = (phase === 'phase1') ? 175 : 210;
        } else if (unitsConsumed <= 400) {
            fixedCharge = (phase === 'phase1') ? 200 : 210;
        } else if (unitsConsumed <= 500) {
            fixedCharge = (phase === 'phase1') ? 230 : 235;
        } else {
            fixedCharge = (phase === 'phase1') ? 260 : 235;
        }
    }

    let unitRate;
    if (bankAdjustedUnits <= 250) {
        if (bankAdjustedUnits <= 40) {
            energyCharge = bankAdjustedUnits * 1.50;
            unitRate = 1.50;
        } else if (bankAdjustedUnits <= 50) {
            energyCharge = bankAdjustedUnits * 3.25;
            unitRate = 3.25;
        } else if (bankAdjustedUnits <= 100) {
            energyCharge = bankAdjustedUnits * 4.05;
            unitRate = 4.05;
        } else if (bankAdjustedUnits <= 150) {
            energyCharge = bankAdjustedUnits * 5.10;
            unitRate = 5.10;
        } else if (bankAdjustedUnits <= 200) {
            energyCharge = bankAdjustedUnits * 6.95;
            unitRate = 6.95;
        } else {
            energyCharge = bankAdjustedUnits * 8.20;
            unitRate = 8.20;
        }
    } else {
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

    const meterRent = 41.38;
    const duty = energyCharge * 0.10;
    const fuelSurcharge = bankAdjustedUnits * 0.09;
    const generationDuty = solarGeneration * 0.15;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.10;
    const totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + generationDuty + monthlyFuelSurcharge;

    const billInfo = `
        <tr><td>Bill Type</td><td>${billType}</td></tr>
        <tr><td>Fixed Charge</td><td>₹${fixedCharge}</td></tr>
        <tr><td>Meter Rent (GST Inc)</td><td>₹${meterRent}</td></tr>
        <tr><td>Unit Charge</td><td>₹${unitRate}/Unit</td></tr>
        <tr><td>No: of Units Consumed (for Energy calculation)</td><td>${bankAdjustedUnits.toFixed(2)}</td></tr>
        <tr><td>Energy Charge</td><td>₹${energyCharge.toFixed(2)} (${bankAdjustedUnits.toFixed(2)} x ₹${unitRate})</td></tr>
        <tr><td>Duty</td><td>₹${duty.toFixed(2)} (10% of the Energy Charge)</td></tr>
        <tr><td>Fuel Surcharge</td><td>₹${fuelSurcharge.toFixed(2)}</td></tr>
        <tr><td>Generation Duty</td><td>₹${generationDuty.toFixed(2)} (${solarGeneration.toFixed(2)} x 0.15)</td></tr>
        <tr><td>Monthly Fuel Surcharge</td><td>₹${monthlyFuelSurcharge.toFixed(2)}</td></tr>
        <tr><td>Total Bill Amount</td><td>₹${totalBillAmount.toFixed(2)}</td></tr>
    `;

    document.getElementById('result').innerText = `Your total units consumed are ${unitsConsumed.toFixed(2)} kWh.`;
    document.getElementById('result1').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
    document.getElementById('result2').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
    document.getElementById('result3').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
    document.getElementById('result4').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
    document.getElementById('result5').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
    document.getElementById('result6').innerText = `നിലവിലെ ഉപയോഗം അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. `;
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

document.getElementById('resetButton').addEventListener('click', function() {
    document.getElementById('billCalculator').reset();
    // document.getElementById('result').innerText = '';
    // document.getElementById('result1').innerText = '';
    // document.getElementById('result2').innerText = '';
    // document.getElementById('result3').innerText = '';
    // document.getElementById('result4').innerText = '';
    // document.getElementById('result5').innerText = '';
    // document.getElementById('result6').innerText = '';
    document.getElementById('result').style.display = 'none';
    document.getElementById('result1').style.display = 'none';
    document.getElementById('result2').style.display = 'none';
    document.getElementById('result3').style.display = 'none';
    document.getElementById('result4').style.display = 'none';
    document.getElementById('result5').style.display = 'none';
    document.getElementById('result6').style.display = 'none';
    document.getElementById('billDetails').style.display = 'none';
});
