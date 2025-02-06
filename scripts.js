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

    if (billingType === 'normal'){
        if (importReading > exportReading) {
            bankAdjustedUnits = importReading - exportReading;
        } else {
            bankAdjustedUnits = 0;
            accountBalance = exportReading - importReading;
        }
    }else{
        //TOD Billing to be changed TODO:
        if (importReading > exportReading) {
            bankAdjustedUnits = importReading - exportReading;
        } else {
            bankAdjustedUnits = 0;
            accountBalance = exportReading - importReading;
        }
    }

    let billType;
    let fixedCharge;
    let energyCharge;
    let unitRate;
    let breakdown = '';

    let NormalConsumptionAdjusted = 0;
    let NormalConsumptionAdjusted_energy_charge = 0;
    let Normal_NoOfUnitsFor_energy_calculation = 0;

    let PeakConsumptionAdjusted = 0;
    let PeakConsumptionAdjusted_80_percent = 0;
    let PeakConsumptionAdjusted_to_Bank = 0;
    let PeakConsumptionAdjusted_energy_charge = 0;
    let Peak_NoOfUnitsFor_energy_calculation = 0;

    let OffPeakConsumptionAdjusted = 0;
    let OffPeakConsumptionAdjusted_energy_charge = 0;
    let OffPeak_NoOfUnitsFor_energy_calculation = 0;

    function applyNewTariffRules() {
  
        if (unitsConsumed <= 250) {
            if (unitsConsumed <= 50) {
                fixedCharge = (phase === 'phase1') ? 45 : 120;
            } else if (unitsConsumed <= 100) {
                fixedCharge = (phase === 'phase1') ? 75 : 160;
            } else if (unitsConsumed <= 150) {
                fixedCharge = (phase === 'phase1') ? 95 : 190;
            } else if (unitsConsumed <= 200) {
                fixedCharge = (phase === 'phase1') ? 130 : 200;
            } else {
                fixedCharge = (phase === 'phase1') ? 145 : 220;
            }
        } else {
            if (unitsConsumed <= 300) {
                fixedCharge = (phase === 'phase1') ? 190 : 225;
            } else if (unitsConsumed <= 350) {
                fixedCharge = (phase === 'phase1') ? 215 : 235;
            } else if (unitsConsumed <= 400) {
                fixedCharge = (phase === 'phase1') ? 235 : 240;
            } else if (unitsConsumed <= 500) {
                fixedCharge = (phase === 'phase1') ? 265 : 265;
            } else {
                fixedCharge = (phase === 'phase1') ? 290 : 290;
            }
        }
    
        if (billingType == 'normal') {
            if (bankAdjustedUnits <= 250) {
                billType = "Telescopic";
                if (bankAdjustedUnits <= 50) {
                    energyCharge = bankAdjustedUnits * 3.30;
                    breakdown = `<p class="calc-step">${bankAdjustedUnits} units * ₹3.30 = ₹${energyCharge.toFixed(2)}</p>`;
                } else if (bankAdjustedUnits <= 100) {
                    energyCharge = 50 * 3.30 + (bankAdjustedUnits - 50) * 4.15;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 50} units * ₹4.15 = ₹${((bankAdjustedUnits - 50) * 4.15).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 150) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + (bankAdjustedUnits - 100) * 5.25;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 100} units * ₹5.25 = ₹${((bankAdjustedUnits - 100) * 5.25).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 200) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + 50 * 5.25 + (bankAdjustedUnits - 150) * 7.10;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹5.25 = ₹${(50 * 5.25).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 150} units * ₹7.10 = ₹${((bankAdjustedUnits - 150) * 7.10).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 250) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + 50 * 5.25 + 50 * 7.10 + (bankAdjustedUnits - 200) * 8.35;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹5.25 = ₹${(50 * 5.25).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹7.10 = ₹${(50 * 7.10).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 200} units * ₹8.35 = ₹${((bankAdjustedUnits - 200) * 8.35).toFixed(2)}</p>
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
                    energyCharge = bankAdjustedUnits * 6.55;
                    unitRate = 6.55;
                } else if (bankAdjustedUnits <= 350) {
                    energyCharge = bankAdjustedUnits * 7.40;
                    unitRate = 7.40;
                } else if (bankAdjustedUnits <= 400) {
                    energyCharge = bankAdjustedUnits * 7.75;
                    unitRate = 7.75;
                } else if (bankAdjustedUnits <= 500) {
                    energyCharge = bankAdjustedUnits * 8.05;
                    unitRate = 8.05;
                } else {
                    energyCharge = bankAdjustedUnits * 9.00;
                    unitRate = 9.00;
                }
            }
        } else {
            //TOD BILLING TYPE
            if (bankAdjustedUnits <= 250) {
                billType = "Telescopic";
                if (bankAdjustedUnits <= 50) {
                    energyCharge = bankAdjustedUnits * 3.30;
                    breakdown = `<p class="calc-step">${bankAdjustedUnits} units * ₹3.30 = ₹${energyCharge.toFixed(2)}</p>`;
                } else if (bankAdjustedUnits <= 100) {
                    energyCharge = 50 * 3.30 + (bankAdjustedUnits - 50) * 4.15;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 50} units * ₹4.15 = ₹${((bankAdjustedUnits - 50) * 4.15).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 150) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + (bankAdjustedUnits - 100) * 5.25;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 100} units * ₹5.25 = ₹${((bankAdjustedUnits - 100) * 5.25).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 200) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + 50 * 5.25 + (bankAdjustedUnits - 150) * 7.10;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹5.25 = ₹${(50 * 5.25).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 150} units * ₹7.10 = ₹${((bankAdjustedUnits - 150) * 7.10).toFixed(2)}</p>
                `;
                } else if (bankAdjustedUnits <= 250) {
                    energyCharge = 50 * 3.30 + 50 * 4.15 + 50 * 5.25 + 50 * 7.10 + (bankAdjustedUnits - 200) * 8.35;
                    breakdown = `
                    <p class="calc-step">50 units * ₹3.30 = ₹${(50 * 3.30).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹4.15 = ₹${(50 * 4.15).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹5.25 = ₹${(50 * 5.25).toFixed(2)}</p>
                    <p class="calc-step">50 units * ₹7.10 = ₹${(50 * 7.10).toFixed(2)}</p>
                    <p class="calc-step">${bankAdjustedUnits - 200} units * ₹8.35 = ₹${((bankAdjustedUnits - 200) * 8.35).toFixed(2)}</p>
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
                //Normal Usage calculation
                if(exportReading > importNormal){
                    NormalConsumptionAdjusted = exportReading - importNormal;
                    NormalConsumptionAdjusted_energy_charge = 0;
                    console.log('I NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                }
                else if(exportReading == importNormal) {
                    NormalConsumptionAdjusted_energy_charge = 0;
                    NormalConsumptionAdjusted = 0;
                    console.log('II NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                } else {
                    Normal_NoOfUnitsFor_energy_calculation = importNormal - exportReading;
                    NormalConsumptionAdjusted = 0;
                    console.log('III Normal_NoOfUnitsFor_energy_calculation is : ' + Normal_NoOfUnitsFor_energy_calculation);
                    console.log('III NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                }

                //Peak Usage calculation
                PeakConsumptionAdjusted_80_percent = NormalConsumptionAdjusted * 0.8;
                PeakConsumptionAdjusted_to_Bank = NormalConsumptionAdjusted - PeakConsumptionAdjusted_80_percent;
                console.log('2 PeakConsumptionAdjusted_80_percent is : ' + PeakConsumptionAdjusted_80_percent);
                console.log('3 PeakConsumptionAdjusted_to_Bank is : ' + PeakConsumptionAdjusted_to_Bank);
                if(PeakConsumptionAdjusted_80_percent > importPeak){
                    PeakConsumptionAdjusted = PeakConsumptionAdjusted_80_percent - importPeak;
                    PeakConsumptionAdjusted_energy_charge = 0;
                    console.log('IV PeakConsumptionAdjusted is : ' + PeakConsumptionAdjusted);
                }else if(PeakConsumptionAdjusted_80_percent == importPeak) {
                    PeakConsumptionAdjusted_energy_charge = 0;
                    PeakConsumptionAdjusted = 0;
                    console.log('V PeakConsumptionAdjusted is : ' + PeakConsumptionAdjusted);
                } else {
                    Peak_NoOfUnitsFor_energy_calculation = importPeak - PeakConsumptionAdjusted_80_percent;
                    PeakConsumptionAdjusted = 0;
                    console.log('VI Peak_NoOfUnitsFor_energy_calculation is : ' + Peak_NoOfUnitsFor_energy_calculation);
                    console.log('VI PeakConsumptionAdjusted is : ' + PeakConsumptionAdjusted);
                }

                //OffPeak Usage calculation
                console.log('4 PeakConsumptionAdjusted is : ' + PeakConsumptionAdjusted);
                if(PeakConsumptionAdjusted > importOffPeak){
                    OffPeakConsumptionAdjusted = PeakConsumptionAdjusted - importOffPeak;
                    OffPeakConsumptionAdjusted_energy_charge = 0;
                    console.log('VII OffPeakConsumptionAdjusted is : ' + OffPeakConsumptionAdjusted);
                    
                }else if(PeakConsumptionAdjusted == importPeak) {
                    OffPeakConsumptionAdjusted_energy_charge = 0;
                    OffPeakConsumptionAdjusted = 0;
                    console.log('VIII OffPeakConsumptionAdjusted is : ' + OffPeakConsumptionAdjusted);
                } else {
                    OffPeak_NoOfUnitsFor_energy_calculation = importOffPeak - PeakConsumptionAdjusted;
                    OffPeakConsumptionAdjusted = 0;
                    console.log('IX OffPeak_NoOfUnitsFor_energy_calculation is : ' + OffPeak_NoOfUnitsFor_energy_calculation);
                    console.log('IX OffPeakConsumptionAdjusted is : ' + OffPeakConsumptionAdjusted);
                }
            
                bankAdjustedUnits = Normal_NoOfUnitsFor_energy_calculation + Peak_NoOfUnitsFor_energy_calculation + OffPeak_NoOfUnitsFor_energy_calculation;
                console.log('bankAdjustedUnits is : ' + bankAdjustedUnits);
                if (bankAdjustedUnits <= 300) {
                    unitRate = 6.55;
                } else if (bankAdjustedUnits <= 350) {
                    unitRate = 7.40;
                } else if (bankAdjustedUnits <= 400) {
                    unitRate = 7.75; 
                } else if (bankAdjustedUnits <= 500) {
                    unitRate = 8.05;
                } else {
                    unitRate = 9.00;
                }
                console.log('1 unitRate is : ' + unitRate);            
                NormalConsumptionAdjusted_energy_charge = Normal_NoOfUnitsFor_energy_calculation * unitRate * 0.9;
                PeakConsumptionAdjusted_energy_charge = Peak_NoOfUnitsFor_energy_calculation * unitRate * 1.25;
                OffPeakConsumptionAdjusted_energy_charge = OffPeak_NoOfUnitsFor_energy_calculation * unitRate * 1;
                
                console.log('X NormalConsumptionAdjusted_energy_charge is : ' + NormalConsumptionAdjusted_energy_charge);
                console.log('X PeakConsumptionAdjusted_energy_charge is : ' + PeakConsumptionAdjusted_energy_charge);
                console.log('X OffPeakConsumptionAdjusted_energy_charge is : ' + OffPeakConsumptionAdjusted_energy_charge);
                
                energyCharge = NormalConsumptionAdjusted_energy_charge + PeakConsumptionAdjusted_energy_charge + OffPeakConsumptionAdjusted_energy_charge;
                console.log('XI energyCharge is : ' + energyCharge);    
            } // Original TOD Billing
        } //Tod billing close
    } //function brace close

    applyNewTariffRules();

    let meterRent;
    if (phase === 'phase1') {
        if(meterOwner === 'kseb'){
            meterRent = 30; //18% GST
        }else{
            meterRent = 0;
        }
    } else {
        if(meterOwner === 'kseb'){
            meterRent = 35; //18% GST
        }else{
            meterRent = 0;
        }
    }

    const duty = energyCharge * 0.10;
    const fuelSurcharge = bankAdjustedUnits * 0.09;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.10;
    const totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + monthlyFuelSurcharge;
    let billInfo = '';

    if(bankAdjustedUnits > 0){
        billInfo = `
        <tr><td>Bill Type</td><td><b>${billType}</b></td></tr>
        <tr><td>Fixed Charge</td><td><b>₹${fixedCharge}</b></td></tr>
        <tr><td>Meter Rent</td><td><b>₹${meterRent}</b></td></tr>
        <tr><td>No: of Units Consumed (for Energy calculation)</td><td>${bankAdjustedUnits.toFixed(2)}</td></tr>
        <tr><td>Unit Charge</td><td>₹${unitRate.toFixed(2)}/Unit</td></tr>
        <tr><td>Energy Charge</td><td><b>₹${energyCharge.toFixed(2)}</b></td></tr>
        <tr><td>Duty</td><td><b>₹${duty.toFixed(2)}</b> (10% of the Energy Charge)</td></tr>
        <tr><td>Fuel Surcharge</td><td><b>₹${fuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnits.toFixed(2)} Unit x 9ps)</td></tr>
        <tr><td>Monthly Fuel Surcharge</td><td><b>₹${monthlyFuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnits.toFixed(2)}Unit x 10ps)</td></tr>
        <tr><td>Total Bill Amount</td><td><b>₹${totalBillAmount.toFixed(2)}</b></td></tr>
    `;
    }
    else{
        billInfo = `
        <tr><td>Bill Type</td><td>${billType}</td></tr>
        <tr><td>Fixed Charge</td><td><b>₹${fixedCharge}</b></td></tr>
        <tr><td>Meter Rent</td><td>₹${meterRent}</td></tr>
        <tr><td>Total Bill Amount</td><td><b>₹${totalBillAmount.toFixed(2)}</b></td></tr>
    `;
    }
    if(billingType == 'normal'){
        //NORMAL BILLING HERE
        document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
                                                    <p>Previous Month Total Import = ${importReading} Unit</p>
                                                    <p>Previous Month Total Export = ${exportReading} Unit</p><hr>
                                                    <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
                                                    <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
                                                    <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;
        document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)`;


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
    } else{
        //TOD Billing - From 2nd Feb 2025 onwards
        if(bankAdjustedUnits <= 250){
            //NORMAL TOD BILL CALCULATION HERE - If it is less than 250 units do the normal calculation as previous
            document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
            <p>Previous Month Total Import = ${importReading} Unit</p>
            <p>Previous Month Total Export = ${exportReading} Unit</p><hr>
            <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
            <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
            <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;
            document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)`;


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
        }else{
            //ORIGINAL TOD BILL CALCULATION HERE
            document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
            <p>Previous Month Total Import = ${importReading} Unit (T1 + T2 + T3 Import)</p>
            <p>Previous Month Total Export = ${exportReading} Unit (T1 + T2 + T3 Export)</p><hr>
            <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
            <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
            <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;
            document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)`;

            document.getElementById('result2').innerHTML = `    <u>ToD Billing Based on T1, T2, T3 w.e.f 01-02-2025</u>
                    <hr><p> Normal Import   [T1 <i>6am to 6pm </i> ] =  <strong class="green-text">${importNormal} Unit</strong></p>
                    <p> Peak Import     [T2 <i>6pm to 10pm </i> ] =  <strong class="green-text">${importPeak} Unit</strong></p>
                    <p> Off-Peak Import [T3 <i>10pm to 6am </i>] =  <strong class="green-text">${importOffPeak} Unit</strong></p>
                    <p> Normal Export =  <strong class="green-text">${exportNormal} Unit</strong></p> 
                    <p><u> To Adjust with Peak TimeZone</u> </p>
                    <p> Normal TimeZone Energy Adjustment = ${Math.abs(exportReading - importNormal).toFixed(2)} Unit (${exportReading}-${importNormal}) </p>

                    <p> Effective Energy =  <strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit </strong> (${NormalConsumptionAdjusted.toFixed(2)} x 80%) </p>
                    <p> Peak TimeZone Energy Adjustment = ${Math.abs(importPeak - PeakConsumptionAdjusted_80_percent).toFixed(2)} Unit (${PeakConsumptionAdjusted_80_percent.toFixed(2)}-${importPeak})</p>
                    <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(importOffPeak - PeakConsumptionAdjusted).toFixed(2)} Unit ( ${PeakConsumptionAdjusted.toFixed(2)} - ${importOffPeak} )</p>
                <hr>
                    <p>Total Energy consumption : ${bankAdjustedUnits.toFixed(2)} Unit (${Normal_NoOfUnitsFor_energy_calculation}+ ${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} +${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)})</p>
                    <p>Energy Charge for ${bankAdjustedUnits.toFixed(2)} Unit is : <strong>₹${unitRate} </strong> </p>
                    <p> Normal TimeZone Energy Charge : <strong class="red-text">₹${NormalConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)} x 90%) </p>
                    <p> Peak TimeZone Energy Charge : <strong class="red-text">₹${PeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)} x 125%) </p>
                    <p> Off-Peak TimeZone Energy Charge : <strong class="red-text">₹${OffPeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)}) </p>
                <hr>
                    <p> Total Energy Charge : <strong class="red-text">₹${energyCharge.toFixed(2)}</strong> ( ${NormalConsumptionAdjusted_energy_charge.toFixed(2)} (T1) + ${PeakConsumptionAdjusted_energy_charge.toFixed(2)} (T2) + ${OffPeakConsumptionAdjusted_energy_charge.toFixed(2)} (T3)) </p>
                    `;
            document.getElementById('result3').innerHTML = `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;
            if(PeakConsumptionAdjusted_to_Bank > 0) {
                document.getElementById('result4').innerHTML = `Extra Energy Generation = ${PeakConsumptionAdjusted_to_Bank.toFixed(2)} Unit will be added to bank`;
            }
        }
    }

    //Ending Note - Section End
    document.getElementById('result5').innerHTML = `Tariff (w.e.f 5/12/2024) changes from time to time so check actual tariff from KSEB`;
    document.getElementById('result6').innerHTML = `If there are any calculation errors in the above, if other options are required, if there is a change in tariff, inform the information @ <span class="green-text"><b><i>calculatoronline2024@gmail.com</i></b></span>
                                                    <span style="font-style: italic">Note: The information provided is for reference only. For accurate details, always refer to official sources.</span>  (v1.0.15)`;


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
