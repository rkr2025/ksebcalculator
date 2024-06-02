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
    let billType;
    let fixedCharge;

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

    const billInfo = `Bill Type: ${billType}<br>Fixed Charge: ₹${fixedCharge}`;

    document.getElementById('result').innerText = `Your total units consumed are ${unitsConsumed.toFixed(2)} kWh.`;
    document.getElementById('billInfo').innerHTML = billInfo;
    document.getElementById('billDetails').style.display = 'block';
});

document.getElementById('resetButton').addEventListener('click', function(event) {
    event.preventDefault();

    // Clear all input fields
    document.getElementById('phase').value = 'phase1';
    document.getElementById('solarGeneration').value = '';
    document.getElementById('import').value = '';
    document.getElementById('export').value = '';

    // Clear result
    document.getElementById('result').innerText = '';
    document.getElementById('billDetails').style.display = 'none';
});
