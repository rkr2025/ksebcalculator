document.getElementById('billCalculator').addEventListener('submit', function (event) {
    event.preventDefault();

    const phase = document.getElementById('phase').value;
    const meterOwner = document.getElementById('meterOwner').value;
    var billingType = document.getElementById('billingType').value;
    var doYouhaveBankBalance = document.getElementById('mybank').value;

    document.getElementById('result').innerHTML = ``;
    document.getElementById('result1').innerHTML = ``;
    document.getElementById('result2').innerHTML = ``;
    document.getElementById('result3').innerHTML = ``;
    document.getElementById('result4').innerHTML = ``;
    document.getElementById('result5').innerHTML = ``;
    document.getElementById('result6').innerHTML = ``;

    console.log('Bank Balanace: '  + doYouhaveBankBalance );

    var connectedLoad='';
    var todBillingAbove20kW = 0;
    var myBankDepositAtKseb = 0;

    var solarGeneration = 0;
    var importReading = 0;
    var exportReading = 0;
    var exportPlusBank = 0;
    var todType='';

    if(doYouhaveBankBalance === 'Yes'){
        myBankDepositAtKseb = parseFloat(document.getElementById('bankedUnitInput').value) || 0;
    }else{
        myBankDepositAtKseb = 0;
    }

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

        connectedLoad = document.getElementById('load').value;
        console.log('connectedLoad ' + connectedLoad);
        if(connectedLoad === 'below20k'){
            todBillingAbove20kW = 0;
            console.log('ToD Billing Method for Below 20kW');
        }else{
    
            todBillingAbove20kW = 1;
            console.log('ToD Billing Method for Above 20kW');
        }
        console.log('ToD Billing Method ' + todBillingAbove20kW);



        solarGeneration = solarNormal + solarOffPeak + solarPeak;
        importReading = importNormal + importOffPeak + importPeak;
        exportReading = exportNormal + exportOffPeak + exportPeak;
    }
    exportPlusBank = exportReading + myBankDepositAtKseb;

    console.log('Solar Generation: ' + solarGeneration);
    console.log('Import reading: ' + importReading);
    console.log('export reading: ' + exportReading);
    console.log('kseb banked unit: ' + myBankDepositAtKseb);
    console.log('Total Export -> export plus Bank: ' + exportPlusBank);


    let accountBalance = 0;
    let generationUsage = solarGeneration - exportReading;

    // Check if all inputs are zero
    if (solarGeneration === 0 && importReading === 0 && exportReading === 0) {
        alert("All inputs are zero. Please enter valid readings.");
        return;
    }

    // Validate positive values
    if (solarGeneration < 0 || importReading < 0 || exportReading < 0 || myBankDepositAtKseb < 0) {
        alert("Please enter positive values for solar generation, import, and export readings.");
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
        if (importReading > exportPlusBank) {
            bankAdjustedUnits = importReading - exportPlusBank;
        } else {
            bankAdjustedUnits = 0;
            accountBalance = exportPlusBank - importReading;
        }
    }else{
        //TOD Billing to be changed TODO:
        if (importReading > exportPlusBank) {
            bankAdjustedUnits = importReading - exportPlusBank;
        } else {
            bankAdjustedUnits = 0;
            accountBalance = exportPlusBank - importReading;
        }
    }

    console.log('net Bank adjusted Units: ' + bankAdjustedUnits);

    let billType='';
    let fixedCharge = 0;
    let energyCharge = 0;
    let unitRate = 0;
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


    // Below connected load 20KW
    let NormalConsumptionAdjusted_Below20kW = 0;

    let PeakConsumptionAdjusted_Below20kW = 0;
    let PeakConsumptionAdjusted_energy_charge_Below20kW = 0;
    let Peak_NoOfUnitsFor_energy_calculation_Below20kW = 0;

    let OffPeakConsumptionAdjusted_Below20kW = 0;
    let OffPeakConsumptionAdjusted_energy_charge_Below20kW = 0;
    let OffPeak_NoOfUnitsFor_energy_calculation_Below20kW = 0;
    let unitRate_Below20kW = 0;
    let energyCharge_Below20kW = 0;
    let bankAdjustedUnits_Below20kW = 0;


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
        console.log('Check 3');
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

    console.log('fixed charge:' + fixedCharge);
    console.log('bankAdjusted Units:' + bankAdjustedUnits);

    if (billingType == 'normal') {
        console.log('Check 4: Billing Type is Normal');
        if (bankAdjustedUnits <= 250) {
            console.log('Check 6');
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
            console.log('Check 7');
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
        console.log('Check 5: Billing Type is ToD');
        //TOD BILLING TYPE - common to if connected load below 20kw - Normal charge, else TOD
        console.log('TOD: bankAdjustedUnits: '+bankAdjustedUnits);
        console.log('TOD: todBillingAbove20kW: '+todBillingAbove20kW);
        {   //ORIGINAL TOD BILL CALCULATION HERE
            console.log('Check 9');
            if(todBillingAbove20kW > 0) {
                console.log('Check 10');
                console.log('CONNECTED LOAD IS ABOVE 20KW');
                // Normal Usage calculation
                if(exportPlusBank > importNormal){
                    NormalConsumptionAdjusted = exportPlusBank - importNormal;
                    NormalConsumptionAdjusted_energy_charge = 0;
                    console.log('I NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                }
                else if(exportPlusBank == importNormal) {
                    NormalConsumptionAdjusted_energy_charge = 0;
                    NormalConsumptionAdjusted = 0;
                    console.log('II NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                } else {
                    Normal_NoOfUnitsFor_energy_calculation = importNormal - exportPlusBank;
                    NormalConsumptionAdjusted = 0;
                    console.log('III Normal_NoOfUnitsFor_energy_calculation is : ' + Normal_NoOfUnitsFor_energy_calculation);
                    console.log('III NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                }

                //Peak Usage calculation for connected Load above 20kW
                PeakConsumptionAdjusted_80_percent = NormalConsumptionAdjusted * 0.8;
                //PeakConsumptionAdjusted_to_Bank = NormalConsumptionAdjusted - PeakConsumptionAdjusted_80_percent;
                PeakConsumptionAdjusted_to_Bank = 0; // TODO: keeps it here if any calculation mistakes.
                console.log('2 PeakConsumptionAdjusted_80_percent is : ' + PeakConsumptionAdjusted_80_percent);
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
                console.log('4 PeakConsumptionAdjusted before : ' + PeakConsumptionAdjusted);
                // Re adding the reduced percentage of 80% back to the off peak adjustment.
                PeakConsumptionAdjusted /= 0.8;
                console.log('4 PeakConsumptionAdjusted after : ' + PeakConsumptionAdjusted);
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
                

                console.log('Check 13');
                billType = "Non-Telescopic-ToD"
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
            }
            else 
            {
                console.log('Check 11');
                console.log('CONNECTED LOAD IS BELOW 20KW');
                // Connected load below 20KW
                //TOD BILLING TYPE - common to if connected load is below 20kw
                console.log('bankAdjustedUnits : ' + bankAdjustedUnits);
                if (bankAdjustedUnits <= 250) {
                    console.log('Check 40');
                    billType = "Telescopic-ToD";
                    todType = "normal";
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
                        breakdown += `<p>Total Energy Charge: <b><strong class="red-text">₹${energyCharge.toFixed(2)}</strong></b></p>`;
                        breakdown += `<p>Unit Rate: ₹${unitRate.toFixed(2)} per unit (Avg.)</p>`;
                    } else {
                        unitRate = 0;
                    }
                }
                else{
                    console.log('Check 41');
                    //Above 250 units consumption - Do the ToD calcuations here and find out
                    //the total consumptions and charge accordingly to the ToD Tarrif
                    // Normal Usage calculation
                    if(exportPlusBank > importNormal){
                        NormalConsumptionAdjusted = exportPlusBank - importNormal;
                        NormalConsumptionAdjusted_energy_charge = 0;
                        console.log('I NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                    }
                    else if(exportPlusBank == importNormal) {
                        NormalConsumptionAdjusted_energy_charge = 0;
                        NormalConsumptionAdjusted = 0;
                        console.log('II NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                    } else {
                        Normal_NoOfUnitsFor_energy_calculation = importNormal - exportPlusBank;
                        NormalConsumptionAdjusted = 0;
                        console.log('III Normal_NoOfUnitsFor_energy_calculation is : ' + Normal_NoOfUnitsFor_energy_calculation);
                        console.log('III NormalConsumptionAdjusted is : ' + NormalConsumptionAdjusted);
                    }

                    //Peak Usage calculation for connected Load below 20kW 
                    NormalConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted;
                    if(NormalConsumptionAdjusted_Below20kW > importPeak){
                        PeakConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted_Below20kW - importPeak;
                        PeakConsumptionAdjusted_energy_charge_Below20kW = 0;
                        console.log('--------IV PeakConsumptionAdjusted_Below20kW is : ' + PeakConsumptionAdjusted_Below20kW);
                    }else if(NormalConsumptionAdjusted_Below20kW == importPeak) {
                        PeakConsumptionAdjusted_energy_charge_Below20kW = 0;
                        PeakConsumptionAdjusted_Below20kW = 0;
                        console.log('V PeakConsumptionAdjusted_Below20kW is : ' + PeakConsumptionAdjusted_Below20kW);
                    } else {
                        Peak_NoOfUnitsFor_energy_calculation_Below20kW = importPeak - NormalConsumptionAdjusted_Below20kW;
                        PeakConsumptionAdjusted_Below20kW = 0;
                        console.log('VI Peak_NoOfUnitsFor_energy_calculation_Below20kW is : ' + Peak_NoOfUnitsFor_energy_calculation_Below20kW);
                        console.log('VI PeakConsumptionAdjusted_Below20kW is : ' + PeakConsumptionAdjusted_Below20kW);
                    }
                    
                    //OffPeak Usage calculation for connected Load below 20kW 
                    console.log('4 PeakConsumptionAdjusted_Below20kW is : ' + PeakConsumptionAdjusted_Below20kW);
                    console.log('5 PeakConsumptionAdjusted_Below20kW is : ' + PeakConsumptionAdjusted_Below20kW);
                    if(PeakConsumptionAdjusted_Below20kW > importOffPeak){
                        OffPeakConsumptionAdjusted_Below20kW = PeakConsumptionAdjusted_Below20kW - importOffPeak;
                        OffPeakConsumptionAdjusted_energy_charge_Below20kW = 0;
                        console.log('VII OffPeakConsumptionAdjusted_Below20kW is : ' + OffPeakConsumptionAdjusted_Below20kW);
                        
                    }else if(PeakConsumptionAdjusted_Below20kW == importPeak) {
                        OffPeakConsumptionAdjusted_energy_charge_Below20kW = 0;
                        OffPeakConsumptionAdjusted_Below20kW = 0;
                        console.log('VIII OffPeakConsumptionAdjusted_Below20kW is : ' + OffPeakConsumptionAdjusted_Below20kW);
                    } else {
                        OffPeak_NoOfUnitsFor_energy_calculation_Below20kW = importOffPeak - PeakConsumptionAdjusted_Below20kW;
                        OffPeakConsumptionAdjusted_Below20kW = 0;
                        console.log('IX OffPeak_NoOfUnitsFor_energy_calculation_Below20kW is : ' + OffPeak_NoOfUnitsFor_energy_calculation_Below20kW);
                        console.log('IX OffPeakConsumptionAdjusted_Below20kW is : ' + OffPeakConsumptionAdjusted_Below20kW);
                    }
                    
                    bankAdjustedUnits_Below20kW = Normal_NoOfUnitsFor_energy_calculation + Peak_NoOfUnitsFor_energy_calculation_Below20kW + OffPeak_NoOfUnitsFor_energy_calculation_Below20kW;
                    console.log('bankAdjustedUnits_Below20kW is : ' + bankAdjustedUnits_Below20kW);

                    billType = "Non-Telescopic-ToD";
                    if (bankAdjustedUnits_Below20kW <= 300) {
                        unitRate_Below20kW = 6.55;
                    } else if (bankAdjustedUnits_Below20kW <= 350) {
                        unitRate_Below20kW = 7.40;
                    } else if (bankAdjustedUnits_Below20kW <= 400) {
                        unitRate_Below20kW = 7.75; 
                    } else if (bankAdjustedUnits_Below20kW <= 500) {
                        unitRate_Below20kW = 8.05;
                    } else {
                        unitRate_Below20kW = 9.00;
                    }

                    NormalConsumptionAdjusted_energy_charge = Normal_NoOfUnitsFor_energy_calculation * unitRate_Below20kW * 0.9;
                    PeakConsumptionAdjusted_energy_charge_Below20kW = Peak_NoOfUnitsFor_energy_calculation_Below20kW * unitRate_Below20kW * 1.25;
                    OffPeakConsumptionAdjusted_energy_charge_Below20kW = OffPeak_NoOfUnitsFor_energy_calculation_Below20kW * unitRate_Below20kW * 1;
                    energyCharge_Below20kW = NormalConsumptionAdjusted_energy_charge + PeakConsumptionAdjusted_energy_charge_Below20kW + OffPeakConsumptionAdjusted_energy_charge_Below20kW;

                    // Update Global variable here
                    energyCharge = energyCharge_Below20kW;
                    bankAdjustedUnits=bankAdjustedUnits_Below20kW;    
                    unitRate = unitRate_Below20kW;
                    
                    //Debug statements
                    console.log('1 unitRate_Below20kW is : ' + unitRate_Below20kW);  
                    console.log('XI energyCharge_Below20kW is : ' + energyCharge_Below20kW);
                    console.log('X NormalConsumptionAdjusted_energy_charge is : ' + NormalConsumptionAdjusted_energy_charge);
                    console.log('X PeakConsumptionAdjusted_energy_charge_Below20kW is : ' + PeakConsumptionAdjusted_energy_charge_Below20kW);
                    console.log('X OffPeakConsumptionAdjusted_energy_charge_Below20kW is : ' + OffPeakConsumptionAdjusted_energy_charge_Below20kW);
                }
            }
        } // Original TOD Billing
    } //Tod billing close
} //function brace close
    console.log('Check 16 Start');
    applyNewTariffRules();
    console.log('Check 17 End');

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

const getHeaderMessage = () => {
    return `<u><strong>ToD Billing Based on T1, T2, T3 w.e.f 01-02-2025</strong></u>
                    <hr><p>Normal hours Import  [<i>6am to 6pm </i>] =  <strong class="green-text">${importNormal} Unit</strong></p>
                    <p>Peak hours Import  [<i>6pm to 10pm </i>] =  <strong class="green-text">${importPeak} Unit</strong></p>
                    <p>Off-Peak Import [<i>10pm to 6am </i>] =  <strong class="green-text">${importOffPeak} Unit</strong></p>
                    <p> Normal hour Export =  <strong class="green-text">${exportNormal} Unit</strong></p>
                    <p> Banked Units =  <strong class="green-text">${myBankDepositAtKseb} Unit</strong></p> <hr>
            `;
};


const getExportNormalAdjustmentMessage = (exportPlusBank, importNormal, unitRate, NormalConsumptionAdjusted, PeakConsumptionAdjusted_80_percent,Normal_NoOfUnitsFor_energy_calculation) => {
    if (exportPlusBank > importNormal) {
      return `<p>ഇവിടെ Export+Bank (<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) പൂർണമായും Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Normal TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
              <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong></p><hr>
              <p>Normal hours Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy <strong class="green-text">${NormalConsumptionAdjusted.toFixed(2)} Unit </strong> (${exportPlusBank.toFixed(2)}-${importNormal.toFixed(2)}) ആകുന്നു. ഇതിൻ്റെ 80% (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>) Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ് (for connected Load above 20kW).</p>
              <p> Peak TimeZone Energy Adjustment = <strong class="green-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit </strong>(${exportPlusBank}-${importNormal}) </p>
              <p> Effective Energy to transfer=  <strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit </strong> (${NormalConsumptionAdjusted.toFixed(2)} x 80%) </p> 
              
              <hr>`;
    } else if (exportPlusBank == importNormal) {
      return `<p>Export+Bank (${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)}) ഉം പകൽ സമയ ഉപയോഗവും (${importNormal.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text"> അതിനാൽ Normal TimeZone എനർജി ഇല്ല.👍</strong>  No other Peak TimeZone Adjustment possible further. </p>
              <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
    } else{
      return `<p>താങ്കളുടെ പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) ആകുന്നു. Export+Bank: ${(exportReading + myBankDepositAtKseb).toFixed(2)}(<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit  </strong>) 
              കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit</strong>) 
              Normal Rate ൻ്റെ 90%, (അതായത്  ₹${unitRate.toFixed(2)} x 0.9 = ₹${(unitRate * 0.9).toFixed(2)}) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്. </p>
              <p>Normal TimeZone Energy Consumption: <strong class="red-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p>  </strong>
              <hr>`;
    }
};

const getExportNormalAdjustmentMessage_below20kW = (exportPlusBank, importNormal, unitRate_Below20kW, NormalConsumptionAdjusted, NormalConsumptionAdjusted_Below20kW,Normal_NoOfUnitsFor_energy_calculation) => {
    if (exportPlusBank > importNormal) {
      return `<p>ഇവിടെ Export+Bank (<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) പൂർണമായും Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Normal TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
              <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong></p> <hr>
              <p>Normal hours Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy <strong class="green-text">${NormalConsumptionAdjusted.toFixed(2)} Unit </strong> (${exportPlusBank.toFixed(2)}-${importNormal.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ് (for connected Load below 20kW).
              <p> Peak TimeZone Energy Adjustment = <strong class="green-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit </strong>(${exportPlusBank}-${importNormal}) </p>
              <p> Effective Energy =  <strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit </strong></p> 
              <hr>`;
    } else if (exportPlusBank == importNormal) {
      return `<p>Export+Bank (${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)}) ഉം പകൽ സമയ ഉപയോഗവും (${importNormal.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text"> അതിനാൽ Normal TimeZone എനർജി ഇല്ല.👍</strong>  No other Peak TimeZone Adjustment possible further. </p>
              <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
    } else{
      return `<p>താങ്കളുടെ പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) ആകുന്നു. Export+Bank: ${(exportReading + myBankDepositAtKseb).toFixed(2)} (<strong class="green-text">${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>)
              കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit</strong>) 
              Normal Rate ൻ്റെ 90%, (അതായത്  ₹${unitRate_Below20kW.toFixed(2)} x 0.9 = ₹${(unitRate_Below20kW * 0.9).toFixed(2)}) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്. </p>
              <p>Normal TimeZone Energy Consumption: <strong class="red-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units⚡</p>  </strong>
              <hr>`;
    }
};

const getExportPeakAdjustmentMessage = (PeakConsumptionAdjusted_80_percent, importPeak, PeakConsumptionAdjusted,Peak_NoOfUnitsFor_energy_calculation) => {
    if (PeakConsumptionAdjusted_80_percent > importPeak) {
      return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
              <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong> </p> 
              <p>Left-over Energy : ${(PeakConsumptionAdjusted_80_percent-importPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted_80_percent.toFixed(2)}-${importPeak.toFixed(2)})</p>
              <p>Effective Energy to transfer : ${PeakConsumptionAdjusted.toFixed(2)} Unit. (${(PeakConsumptionAdjusted*0.8).toFixed(2)}/0.8) <p> ഇത് പൂർണമായും (${PeakConsumptionAdjusted.toFixed(2)} Unit) Off-Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
              </p><hr>`;
    } else if (PeakConsumptionAdjusted_80_percent == importPeak) {
      return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit) ഉം Peak TimeZone (6pm to 10pm) ഉപയോഗവും (${importPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍 </strong>. No other Peak TimeZone Adjustment possible further.</p>
              <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
    } else{
      return `<p>താങ്കളുടെ Peak hours (6pm to 10pm) ഉപയോഗം (<strong class="red-text">${importPeak.toFixed(2)} Unit </strong>) ആകുന്നു. Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>) 
              കുറവാണ്. അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(importPeak - PeakConsumptionAdjusted_80_percent).toFixed(2)} Unit</strong>) 
              Normal Rate ൻ്റെ 125%, (അതായത്  ₹${unitRate.toFixed(2)} x 1.25 = <strong class="red-text">₹${(unitRate * 1.25).toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ് ⚡.</p>
              <p>Peak TimeZone Energy Consumption: <strong class="red-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p> </strong><hr>`;
    }

};

const getExportPeakAdjustmentMessage_below20kW = (NormalConsumptionAdjusted_Below20kW, importPeak,Peak_NoOfUnitsFor_energy_calculation_Below20kW,unitRate_Below20kW) => {
    console.log('&&&&& NormalConsumptionAdjusted_Below20kW : ' + NormalConsumptionAdjusted_Below20kW);
    console.log('&&&&& importPeak : ' + importPeak);
    console.log('&&&&& Peak_NoOfUnitsFor_energy_calculation : ' + Peak_NoOfUnitsFor_energy_calculation_Below20kW);
    if (NormalConsumptionAdjusted_Below20kW > importPeak) {
      return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
              <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌 </strong></p><hr>
              <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit (${NormalConsumptionAdjusted_Below20kW.toFixed(2)}-${importPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും Off-Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
              <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak).toFixed(2)} Unit (${NormalConsumptionAdjusted_Below20kW.toFixed(2)}-${importPeak})</p> <hr>
              
              `;
    } else if (NormalConsumptionAdjusted_Below20kW == importPeak) {
      return `<p>ബാക്കിയുള്ള Export Energy (${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit) ഉം Peak TimeZone (6pm to 10pm) ഉപയോഗവും (${importPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍 </strong>. No other Peak TimeZone Adjustment possible further.</p>
              <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>`;
    } else{
      return `<p>താങ്കളുടെ Peak hours (6pm to 10pm) ഉപയോഗം (<strong class="red-text">${importPeak.toFixed(2)} Unit </strong>) ആകുന്നു. Peak Adjusted Energy (<strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) 
              കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak).toFixed(2)} Unit</strong>) 
              Normal Rate ൻ്റെ 125%, (അതായത്  ₹${unitRate_Below20kW.toFixed(2)} x 1.25 = <strong class="red-text">₹${(unitRate_Below20kW * 1.25).toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ് ⚡.</p>
              <p>Peak TimeZone Energy Consumption: <strong class="red-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units⚡</p> </strong><hr>`;
    }

};

const getExportOffPeakAdjustmentMessage = (importOffPeak, PeakConsumptionAdjusted) => {
    if (PeakConsumptionAdjusted > importOffPeak) {
        return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല.</strong></p>
                <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${OffPeakConsumptionAdjusted.toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും (${OffPeakConsumptionAdjusted.toFixed(2)} Unit) Final Bank Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
                <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(PeakConsumptionAdjusted - importOffPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak})</p>
                <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>
                `;
    } else if (PeakConsumptionAdjusted == importOffPeak) {
        return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted.toFixed(2)} Unit) ഉം Off-Peak TimeZone (10pm to 6am) ഉപയോഗവും (${importOffPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല </strong>. No other Peak TimeZone Adjustment possible further.</p>
               <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
    } else{
        return `<p>താങ്കളുടെ Off-Peak hours (10pm to 6am) ഉപയോഗം (<strong class="red-text">${importOffPeak.toFixed(1)} Unit </strong>) ആകുന്നു. Off-Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted.toFixed(2)} Unit</strong>) 
                കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(PeakConsumptionAdjusted - importOffPeak).toFixed(2)} Unit</strong>) 
                Normal Rate ൽ , (അതായത്  <strong class="red-text">₹${unitRate.toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്.</p>
                <p>Off-Peak TimeZone Energy Consumption: <strong class="red-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p> </strong> <hr>`;
    }
};

const getExportOffPeakAdjustmentMessage_below20kW = (importOffPeak, PeakConsumptionAdjusted_Below20kW, OffPeakConsumptionAdjusted_Below20kW,unitRate_Below20kW) => {
    if (PeakConsumptionAdjusted_Below20kW > importOffPeak) {
        return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല.</strong></p>
                <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${OffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും (${OffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit) Final Bank Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
                <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted_Below20kW.toFixed(2)}-${importOffPeak})</p>
                <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>
                `;
    } else if (PeakConsumptionAdjusted_Below20kW == importOffPeak) {
        return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit) ഉം Off-Peak TimeZone (10pm to 6am) ഉപയോഗവും (${importOffPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല </strong>. No other Peak TimeZone Adjustment possible further.</p>
               <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>`;
    } else{
        return `<p>താങ്കളുടെ Off-Peak hours (10pm to 6am) ഉപയോഗം (<strong class="red-text">${importOffPeak.toFixed(1)} Unit </strong>) ആകുന്നു. Off-Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) 
                കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak).toFixed(2)} Unit</strong>) 
                Normal Rate ൽ , (അതായത്  <strong class="red-text">₹${unitRate_Below20kW.toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്.</p>
                <p>Off-Peak TimeZone Energy Consumption: <strong class="red-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡</p> </strong> <hr>`;
    }
};

const getEnergyCaluculationMessage = (
    bankAdjustedUnits,
    Normal_NoOfUnitsFor_energy_calculation,
    Peak_NoOfUnitsFor_energy_calculation,
    OffPeak_NoOfUnitsFor_energy_calculation,
    unitRate,
    NormalConsumptionAdjusted_energy_charge,
    PeakConsumptionAdjusted_energy_charge,
    OffPeakConsumptionAdjusted_energy_charge,
    energyCharge
  ) => {
        // Generate energy calculation details
        return `
            <hr>
            <p><u>ENERGY CALCULATION DETAILS</u></p>
            <p>Total Energy Consumption: ${bankAdjustedUnits.toFixed(2)} Unit (${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} + ${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} + ${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)}) ⚡ </p>
            <p>Energy Charge for ${bankAdjustedUnits.toFixed(2)} Unit is: <strong>₹${unitRate.toFixed(2)}</strong></p>
            <p>Normal TimeZone Energy Charge: <strong class="red-text">₹${NormalConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)} x 90%)</p>
            <p>Peak TimeZone Energy Charge: <strong class="red-text">₹${PeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)} x 125%)</p>
            <p>Off-Peak TimeZone Energy Charge: <strong class="red-text">₹${OffPeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong> (${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} x ${unitRate.toFixed(2)})</p>
            <hr>
            <p>Total Energy Charge: <strong class="red-text">₹${energyCharge.toFixed(2)}</strong> (${NormalConsumptionAdjusted_energy_charge.toFixed(2)} (T1) + ${PeakConsumptionAdjusted_energy_charge.toFixed(2)} (T2) + ${OffPeakConsumptionAdjusted_energy_charge.toFixed(2)} (T3))</p>
        `;
};

    var duty = 0;
    const fuelSurcharge = bankAdjustedUnits * 0.09;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.10;
    var totalBillAmount = 0;
    duty = energyCharge * 0.10;
    totalBillAmount = fixedCharge + meterRent + energyCharge + duty + fuelSurcharge + monthlyFuelSurcharge;
    let billInfo = '';

    if(bankAdjustedUnits > 0){

        const energyChargeToUse = energyCharge;
        const bankAdjustedUnitsToUse = bankAdjustedUnits;

        billInfo = `
        <tr><td>Bill Type</td><td><b>${billType}</b></td></tr>
        <tr><td>Fixed Charge</td><td><b>₹${fixedCharge}</b></td></tr>
        <tr><td>Meter Rent</td><td><b>₹${meterRent}</b></td></tr>
        <tr><td>No: of Units Consumed (for Energy calculation)</td><td>${bankAdjustedUnitsToUse.toFixed(2)}</td></tr>
        <tr><td>Unit Charge</td><td>₹${unitRate.toFixed(2)}/Unit</td></tr>
        <tr><td>Energy Charge</td><td><b>₹${energyChargeToUse.toFixed(2)}</b></td></tr>
        <tr><td>Duty</td><td><b>₹${duty.toFixed(2)}</b> (10% of the Energy Charge)</td></tr>
        <tr><td>Fuel Surcharge</td><td><b>₹${fuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnitsToUse.toFixed(2)} Unit x 9ps)</td></tr>
        <tr><td>Monthly Fuel Surcharge</td><td><b>₹${monthlyFuelSurcharge.toFixed(2)}</b> (Consumption: ${bankAdjustedUnitsToUse.toFixed(2)}Unit x 10ps)</td></tr>
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
          
    if(billingType == 'normal' ||  todType == "normal" ){
        console.log('Check 18');
        //NORMAL BILLING HERE
        document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
                                                    <p>Previous Month Total Import = ${importReading} Unit</p>
                                                    <p>Previous Month Total Export = ${exportReading} Unit</p>
                                                    <p>Banked Units = ${myBankDepositAtKseb} Unit</p><hr>
                                                    <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് (Direct usage from Solar) = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
                                                    <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> 
                                                    
                                                    <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം. (Based on this Fixed Charge is calculated)</p>
                                                    Fixed charge for ${unitsConsumed} Unit (${phase}) = <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)<hr>`;
        document.getElementById('result1').innerHTML = ` ${importReading > exportPlusBank ? `<p>Energy Consumption for the month is <strong class="red-text">${Math.abs(importReading - exportPlusBank).toFixed(2)} Unit </strong>(${importReading}-${exportPlusBank}) - (Energy charge is calculated based on this consumption)</p>` : 
                                                    'Energy consumption for the month is zero as the consumption is adjusted from the export+bank'}`;


        if (importReading > exportPlusBank) {
            console.log('Check 20');
            document.getElementById('result2').innerHTML = `<hr><p>Previous Month Total Import = ${importReading} Unit</p>
                                                            <p>Previous Month Total Export = ${exportReading} Unit</p> 
                                                            <p>Banking Units = ${myBankDepositAtKseb} Unit</p><hr>
                                                            <p>വ്യത്യാസം വരുന്ന <strong class="red-text">${bankAdjustedUnits} Unit </strong> (${importReading}-${exportPlusBank}) ചാർജ് ചെയ്യപ്പെടുന്നതാണ്.</p>`;
            if (billType === 'Telescopic' || billType === 'Telescopic-ToD')
            {
                console.log('Check 222');
                document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. <hr><p>Energy Charge Calculation (For ${bankAdjustedUnits} Unit):</p>
                ${breakdown} `;
            }else{
                document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. നിലവിലെ താരിഫ് അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം. 
                                                                <p>Total Engergy Charge: ${bankAdjustedUnits} x ₹${unitRate.toFixed(2)} = <b>₹${energyCharge.toFixed(2)} </b></p> `; 
            }

            document.getElementById('result4').innerHTML = `Total Bill Amount ഏകദേശം  <strong class="red-text">₹${totalBillAmount.toFixed(2)} </strong> 
                                                            <br><i>(Changes with the GST, Security Deposit interest, Tariff changes, Advance calculation)</i>`;
        } else {
            console.log('Check 21');
            if (importReading == exportPlusBank) {
                document.getElementById('result2').innerHTML = `<br>Previous Month Total Import = ${importReading} Unit
                                                                <br>Previous Month Total Export = ${exportReading} Unit 
                                                                <br>Banked Unit = ${myBankDepositAtKseb} Unit <hr>
                                                                <p><span class="green-text">ഇവിടെ Total Export ഉം Import ഉം തുല്ല്യമാണ്. എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല</span> </p>`;
            } else {
                document.getElementById('result2').innerHTML = `<br>Previous Month Total Import = ${importReading} Unit
                                                                <br>Previous Month Total Export = ${exportReading} Unit 
                                                                <br>Banked Unit = ${myBankDepositAtKseb} Unit<hr>
                                                                <p><span class="green-text"><b>Export കൂടുതലായതു കൊണ്ട് എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല.</b></span> </p> `;
            }
            document.getElementById('result3').innerHTML = `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                            <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;
            console.log('Account Balance ' + accountBalance);                                                        
            document.getElementById('result4').innerHTML = (accountBalance > 0) ? `Extra Energy Generation = <strong class="green-text">${accountBalance} Unit</strong> will be added to bank 
            <br>(Export+Bank(${exportPlusBank})-Import(${importReading}))`:`No Energy units to be added to bank 👎`;
        }
    } 
    else
    {
        console.log('Check 19');
        //TOD Billing - From 2nd Feb 2025 onwards

        //ORIGINAL TOD BILL CALCULATION HERE
        document.getElementById('result').innerHTML = `<hr><p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
        <p>Previous Month Total Import = ${importReading} Unit (T1 (${importNormal.toFixed(2)}) + T2 (${importPeak.toFixed(2)}) + T3 (${importOffPeak.toFixed(2)}))</p>
        <p>Previous Month Total Export = ${exportReading} Unit (T1 (${exportNormal.toFixed(2)}) + T2 (${exportPeak}) + T3 (${exportOffPeak}) )</p>
        <p>Banked Units = ${myBankDepositAtKseb} Unit </p><hr>
        <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
        <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
        <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;
        document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)`;
        
        if(todBillingAbove20kW > 0) 
        {
            // Connected Load Above 20kW
            document.getElementById('result2').innerHTML  = getHeaderMessage();
            document.getElementById('result2').innerHTML += `<u><strong>T1 - Normal TimeZone (6am to 6pm) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportNormalAdjustmentMessage(exportPlusBank,importNormal,unitRate, NormalConsumptionAdjusted, PeakConsumptionAdjusted_80_percent,Normal_NoOfUnitsFor_energy_calculation);
            document.getElementById('result2').innerHTML += `<u><strong>T2 - Peak TimeZone (6pm to 10pm) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportPeakAdjustmentMessage(PeakConsumptionAdjusted_80_percent,importPeak,PeakConsumptionAdjusted,Peak_NoOfUnitsFor_energy_calculation);
            document.getElementById('result2').innerHTML += `<u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportOffPeakAdjustmentMessage(importOffPeak,PeakConsumptionAdjusted,OffPeak_NoOfUnitsFor_energy_calculation);
            document.getElementById('result3').innerHTML = getEnergyCaluculationMessage(bankAdjustedUnits, Normal_NoOfUnitsFor_energy_calculation, Peak_NoOfUnitsFor_energy_calculation, OffPeak_NoOfUnitsFor_energy_calculation, unitRate, NormalConsumptionAdjusted_energy_charge, PeakConsumptionAdjusted_energy_charge, OffPeakConsumptionAdjusted_energy_charge,energyCharge);
            document.getElementById('result3').innerHTML += `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                            <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;        
        }
        else
        {
            console.log('Check 25');
            // Connected load below 20kW

            document.getElementById('result2').innerHTML  = getHeaderMessage();
            document.getElementById('result2').innerHTML += `<u><strong>T1 - Normal TimeZone (6am to 6pm) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportNormalAdjustmentMessage_below20kW(exportPlusBank,importNormal,unitRate_Below20kW, NormalConsumptionAdjusted_Below20kW, NormalConsumptionAdjusted_Below20kW,Normal_NoOfUnitsFor_energy_calculation);

            document.getElementById('result3').innerHTML += `<b><u><strong>T2 - Peak TimeZone (6pm to 10pm) (Connected Load < 20kW)</strong></u></b>`;
            document.getElementById('result3').innerHTML += getExportPeakAdjustmentMessage_below20kW(NormalConsumptionAdjusted_Below20kW,importPeak,Peak_NoOfUnitsFor_energy_calculation_Below20kW,unitRate_Below20kW);

            document.getElementById('result3').innerHTML += `<b><u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u></b>`;
            document.getElementById('result3').innerHTML += getExportOffPeakAdjustmentMessage_below20kW(importOffPeak,PeakConsumptionAdjusted_Below20kW,OffPeak_NoOfUnitsFor_energy_calculation_Below20kW,unitRate_Below20kW);

            document.getElementById('result3').innerHTML += getEnergyCaluculationMessage(bankAdjustedUnits_Below20kW, Normal_NoOfUnitsFor_energy_calculation, Peak_NoOfUnitsFor_energy_calculation_Below20kW, OffPeak_NoOfUnitsFor_energy_calculation_Below20kW, unitRate_Below20kW, NormalConsumptionAdjusted_energy_charge, PeakConsumptionAdjusted_energy_charge_Below20kW, OffPeakConsumptionAdjusted_energy_charge_Below20kW,energyCharge_Below20kW);
            document.getElementById('result3').innerHTML += `<b>Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                            <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i></b>`;
        }
    }
    console.log('Check 26');
    //Ending Note - Section End
    document.getElementById('result5').innerHTML = `Tariff (w.e.f 5/12/2024) changes from time to time so check actual tariff from KSEB`;
    document.getElementById('result6').innerHTML = `Should you encounter any discrepancies in the calculations above, require additional options, or need updates due to tariff changes, 
                                                    please reach out to us at <span class="green-text"><b><i>calculatoronline2024@gmail.com</i></b></span> . Kindly note that the information provided here is intended for reference 
                                                    purposes only. For precise and authoritative details, we always recommend consulting official sources. (Version 1.0.16)`;
//

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

    // Get the connected load container
    const connectedLoadContainer = document.getElementById('connectedLoadContainer'); 

    if (billingType === 'normal') {
        normalBillingSection.style.display = 'block';
        normalNetMeterReadingSection.style.display = 'block';
        todBillingSection.style.display = 'none';
        todNetMeterReadingSection.style.display = 'none';
        connectedLoadContainer.style.display = 'none'; // Hide otherwise
    } else if (billingType === 'tod') {
        normalBillingSection.style.display = 'none';
        normalNetMeterReadingSection.style.display = 'none';
        todBillingSection.style.display = 'block';
        todNetMeterReadingSection.style.display = 'block';
        connectedLoadContainer.style.display = 'block'; // Show if ToD is selected
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

// Add an event listener to the Banked Unit dropdown
document.getElementById('mybank').addEventListener('change', function () {
    const bankedUnitSection = document.getElementById('bankedUnitSection');
    // Show or hide the banked unit input based on the selected value
    if (this.value === 'Yes') {
        bankedUnitSection.style.display = 'block';
    } else {
        bankedUnitSection.style.display = 'none';
    }
});

// Trigger the change event on page load to set the initial state
document.getElementById('mybank').dispatchEvent(new Event('change'));

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
    
    document.getElementById('bankedUnitSection').style.display = 
        document.getElementById('mybank').value === 'Yes' ? 'block' : 'none';
    document.getElementById('connectedLoadContainer').style.display = 
        document.getElementById('billingType').value === 'tod' ? 'block' : 'none';

    var billingType = document.getElementById('billingType').value;
    var normalBillingSection = document.getElementById('normalBillingSection');
    var todBillingSection = document.getElementById('todBillingSection');
    var normalNetMeterReadingSection = document.getElementById('normalNetMeterReadingSection');
    var todNetMeterReadingSection = document.getElementById('todNetMeterReadingSection');

    // Get the connected load container
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
});

document.getElementById('printButton').addEventListener('click', function() {
    window.print();
});
