document.getElementById('billCalculator').addEventListener('submit', function(event) {
    event.preventDefault();

    const solarGeneration = parseFloat(document.getElementById('solarGeneration').value);
    const importReading = parseFloat(document.getElementById('import').value);
    const exportReading = parseFloat(document.getElementById('export').value);

    // Validate export reading
    if (exportReading > solarGeneration) {
        alert("Export reading cannot be greater than Solar Generation Meter Reading.");
        return;
    }

    let unitsConsumed;

    if (exportReading > importReading) {
        unitsConsumed = (solarGeneration - exportReading) + importReading;
    } else {
        unitsConsumed = importReading - exportReading;
    }

    const resultText = `Your total units consumed are ${unitsConsumed.toFixed(2)} kWh.`;

    document.getElementById('result').innerText = resultText;
});
