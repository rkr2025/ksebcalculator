document.getElementById('billCalculator').addEventListener('submit', function(event) {
    event.preventDefault();

    const phase = document.getElementById('phase').value;
    const solarGeneration = parseFloat(document.getElementById('solarGeneration').value);
    const importReading = parseFloat(document.getElementById('import').value);
    const exportReading = parseFloat(document.getElementById('export').value);
    const bankClosing = parseFloat(document.getElementById('bankClosing').value);

    // Validate positive values
    if (solarGeneration < 0 || importReading < 0 || exportReading < 0 || bankClosing < 0) {
        alert("Please enter positive values.");
        return;
    }

    // Validate export reading
    if (exportReading > solarGeneration) {
        alert("Export reading cannot be greater than Solar Generation Meter Reading.");
        return;
    }

    let unitsConsumed = (solarGeneration - exportReading) + importReading;
    
    let bankAdjustedUnits = solarGeneration- unitsConsumed;

    if (bankAdjustedUnits < 0) {
        bankAdjustedUnits = bankAdjustedUnits + bankClosing;
    } else {
        bankAdjustedUnits = 0;
    }
    bankAdjustedUnits = -bankAdjustedUnits;
    if(bankAdjustedUnits < 0){
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
        if (bankAdjustedUnits <= 50) {
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

    const meterRent = 36.58;
    const duty = energyCharge * 0.10;
    const fuelSurcharge = 10.26;
    const generationDuty = solarGeneration * 0.15;
    const monthlyFuelSurcharge = 11.40;
    const totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + generationDuty + monthlyFuelSurcharge;

    const billInfo = `
        <div>Bill Type: ${billType}</div>
        <div>Fixed Charge: ₹${fixedCharge}</div>
        <div>Meter Rent: ₹${meterRent}</div>
        <div>Unit Charge: ₹${unitRate}/Unit</div>
        <div>No: of Units Consumed (adjusted from bank): ${bankAdjustedUnits.toFixed(2)}</div>
        <div>Energy Charge: ₹${energyCharge.toFixed(2)} (${bankAdjustedUnits.toFixed(2)} x ₹${unitRate})</div>
        <div>Duty: ₹${duty.toFixed(2)} (10% of the Energy Charge)</div>
        <div>Fuel Surcharge: ₹${fuelSurcharge.toFixed(2)}</div>
        <div>Generation Duty: ₹${generationDuty.toFixed(2)} (${solarGeneration.toFixed(2)} x 0.15)</div>
        <div>Monthly Fuel Surcharge: ₹${monthlyFuelSurcharge.toFixed(2)}</div>
        <div>Total Bill Amount: ₹${totalBillAmount.toFixed(2)}</div>
    `;

    document.getElementById('result').innerText = `Your total units consumed are ${unitsConsumed.toFixed(2)} kWh.`;
    document.getElementById('billInfo').innerHTML = billInfo;
    document.getElementById('billDetails').style.display = 'block';
});

document.getElementById('resetButton').addEventListener('click', function(event) {
    event.preventDefault();

    // Clear all input fields
    document.getElementById('phase').value = 'phase1';
    document.getElementById('solarGeneration').value = '0';
    document.getElementById('import').value = '0';
    document.getElementById('export').value = '0';
    document.getElementById('bankClosing').value = '0';

    // Clear result
    document.getElementById('result').innerText = '';
    document.getElementById('billDetails').style.display = 'none';
});
