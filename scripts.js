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
        alert("Export units cannot be greater than Solar Generation units.");
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
            fixedCharge = (phase === 'phase1') ? 50 : 130;
        } else if (unitsConsumed <= 100) {
            fixedCharge = (phase === 'phase1') ? 85 : 175;
        } else if (unitsConsumed <= 150) {
            fixedCharge = (phase === 'phase1') ? 105 : 205;
        } else if (unitsConsumed <= 200) {
            fixedCharge = (phase === 'phase1') ? 140 : 215;
        } else {
            fixedCharge = (phase === 'phase1') ? 160 : 235;
        }
    } else {
        console.log('Check 3');
        if (unitsConsumed <= 300) {
            fixedCharge = (phase === 'phase1') ? 220 : 240;
        } else if (unitsConsumed <= 350) {
            fixedCharge = (phase === 'phase1') ? 240 : 250;
        } else if (unitsConsumed <= 400) {
            fixedCharge = (phase === 'phase1') ? 260 : 260;
        } else if (unitsConsumed <= 500) {
            fixedCharge = (phase === 'phase1') ? 285 : 285;
        } else {
            fixedCharge = (phase === 'phase1') ? 310 : 310;
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
                energyCharge = bankAdjustedUnits * 3.35;
                breakdown = `<p class="calc-step">${bankAdjustedUnits} units * ₹3.35 = ₹${energyCharge.toFixed(2)}</p>`;
            } else if (bankAdjustedUnits <= 100) {
                energyCharge = 50 * 3.35 + (bankAdjustedUnits - 50) * 4.25;
                breakdown = `
                <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                <p class="calc-step">${bankAdjustedUnits - 50} units * ₹4.25 = ₹${((bankAdjustedUnits - 50) * 4.25).toFixed(2)}</p>
            `;
            } else if (bankAdjustedUnits <= 150) {
                energyCharge = 50 * 3.35 + 50 * 4.25 + (bankAdjustedUnits - 100) * 5.35;
                breakdown = `
                <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                <p class="calc-step">${bankAdjustedUnits - 100} units * ₹5.35 = ₹${((bankAdjustedUnits - 100) * 5.35).toFixed(2)}</p>
            `;
            } else if (bankAdjustedUnits <= 200) {
                energyCharge = 50 * 3.35 + 50 * 4.25 + 50 * 5.35 + (bankAdjustedUnits - 150) * 7.20;
                breakdown = `
                <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹5.35 = ₹${(50 * 5.35).toFixed(2)}</p>
                <p class="calc-step">${bankAdjustedUnits - 150} units * ₹7.20 = ₹${((bankAdjustedUnits - 150) * 7.20).toFixed(2)}</p>
            `;
            } else if (bankAdjustedUnits <= 250) {
                energyCharge = 50 * 3.35 + 50 * 4.25 + 50 * 5.35 + 50 * 7.20 + (bankAdjustedUnits - 200) * 8.50;
                breakdown = `
                <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹5.35 = ₹${(50 * 5.35).toFixed(2)}</p>
                <p class="calc-step">50 units * ₹7.20 = ₹${(50 * 7.20).toFixed(2)}</p>
                <p class="calc-step">${bankAdjustedUnits - 200} units * ₹8.50 = ₹${((bankAdjustedUnits - 200) * 8.50).toFixed(2)}</p>
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
                energyCharge = bankAdjustedUnits * 6.75;
                unitRate = 6.75;
            } else if (bankAdjustedUnits <= 350) {
                energyCharge = bankAdjustedUnits * 7.60;
                unitRate = 7.60;
            } else if (bankAdjustedUnits <= 400) {
                energyCharge = bankAdjustedUnits * 7.95;
                unitRate = 7.95;
            } else if (bankAdjustedUnits <= 500) {
                energyCharge = bankAdjustedUnits * 8.25;
                unitRate = 8.25;
            } else {
                energyCharge = bankAdjustedUnits * 9.20;
                unitRate = 9.20;
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

                }else if(PeakConsumptionAdjusted == importOffPeak) {
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
                    unitRate = 6.75;
                } else if (bankAdjustedUnits <= 350) {
                    unitRate = 7.60;
                } else if (bankAdjustedUnits <= 400) {
                    unitRate = 7.95;
                } else if (bankAdjustedUnits <= 500) {
                    unitRate = 8.25;
                } else {
                    unitRate = 9.20;
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
                        energyCharge = bankAdjustedUnits * 3.35;
                        breakdown = `<p class="calc-step">${bankAdjustedUnits} units * ₹3.35 = ₹${energyCharge.toFixed(2)}</p>`;
                    } else if (bankAdjustedUnits <= 100) {
                        energyCharge = 50 * 3.35 + (bankAdjustedUnits - 50) * 4.25;
                        breakdown = `
                        <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                        <p class="calc-step">${bankAdjustedUnits - 50} units * ₹4.25 = ₹${((bankAdjustedUnits - 50) * 4.25).toFixed(2)}</p>
                    `;
                    } else if (bankAdjustedUnits <= 150) {
                        energyCharge = 50 * 3.35 + 50 * 4.25 + (bankAdjustedUnits - 100) * 5.35;
                        breakdown = `
                        <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                        <p class="calc-step">${bankAdjustedUnits - 100} units * ₹5.35 = ₹${((bankAdjustedUnits - 100) * 5.35).toFixed(2)}</p>
                    `;
                    } else if (bankAdjustedUnits <= 200) {
                        energyCharge = 50 * 3.35 + 50 * 4.25 + 50 * 5.35 + (bankAdjustedUnits - 150) * 7.20;
                        breakdown = `
                        <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹5.35 = ₹${(50 * 5.35).toFixed(2)}</p>
                        <p class="calc-step">${bankAdjustedUnits - 150} units * ₹7.20 = ₹${((bankAdjustedUnits - 150) * 7.20).toFixed(2)}</p>
                    `;
                    } else if (bankAdjustedUnits <= 250) {
                        energyCharge = 50 * 3.35 + 50 * 4.25 + 50 * 5.35 + 50 * 7.20 + (bankAdjustedUnits - 200) * 8.50;
                        breakdown = `
                        <p class="calc-step">50 units * ₹3.35 = ₹${(50 * 3.35).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹4.25 = ₹${(50 * 4.25).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹5.35 = ₹${(50 * 5.35).toFixed(2)}</p>
                        <p class="calc-step">50 units * ₹7.20 = ₹${(50 * 7.20).toFixed(2)}</p>
                        <p class="calc-step">${bankAdjustedUnits - 200} units * ₹8.50 = ₹${((bankAdjustedUnits - 200) * 8.50).toFixed(2)}</p>
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
                    if(PeakConsumptionAdjusted_Below20kW > importOffPeak){
                        OffPeakConsumptionAdjusted_Below20kW = PeakConsumptionAdjusted_Below20kW - importOffPeak;
                        OffPeakConsumptionAdjusted_energy_charge_Below20kW = 0;
                        console.log('VII OffPeakConsumptionAdjusted_Below20kW is : ' + OffPeakConsumptionAdjusted_Below20kW);

                    }else if(PeakConsumptionAdjusted_Below20kW == importOffPeak) {
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
                        unitRate_Below20kW = 6.75;
                    } else if (bankAdjustedUnits_Below20kW <= 350) {
                        unitRate_Below20kW = 7.60;
                    } else if (bankAdjustedUnits_Below20kW <= 400) {
                        unitRate_Below20kW = 7.95;
                    } else if (bankAdjustedUnits_Below20kW <= 500) {
                        unitRate_Below20kW = 8.25;
                    } else {
                        unitRate_Below20kW = 9.20;
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

// const getHeaderMessage = () => {
//     return `<u><strong>ToD Billing Based on T1, T2, T3 w.e.f 01-02-2025</strong></u>
//                     <hr><p>Normal hours Import  [<i>6am to 6pm </i>] =  <strong class="green-text">${importNormal} Unit</strong></p>
//                     <p>Peak hours Import  [<i>6pm to 10pm </i>] =  <strong class="green-text">${importPeak} Unit</strong></p>
//                     <p>Off-Peak Import [<i>10pm to 6am </i>] =  <strong class="green-text">${importOffPeak} Unit</strong></p>
//                     <p> Normal hour Export =  <strong class="green-text">${exportNormal} Unit</strong></p>
//                     <p> Banked Units =  <strong class="green-text">${myBankDepositAtKseb} Unit</strong></p> <hr>
//             `;
// };


const getHeaderMessage = () => {
    // Default to 0 if any value is undefined or null
    const safeImportNormal = importNormal !== undefined && importNormal !== null ? importNormal : 0;
    const safeImportPeak = importPeak !== undefined && importPeak !== null ? importPeak : 0;
    const safeImportOffPeak = importOffPeak !== undefined && importOffPeak !== null ? importOffPeak : 0;
    const safeExportNormal = exportNormal !== undefined && exportNormal !== null ? exportNormal : 0;
    const safeMyBankDepositAtKseb = myBankDepositAtKseb !== undefined && myBankDepositAtKseb !== null ? myBankDepositAtKseb : 0;

    return `
        <hr>
        <h5 style="text-align: center; color: #333;"><u><strong>ToD Billing Based on T1, T2, T3 (w.e.f 01-02-2025)</strong></u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background-color: #f2f2f2; color: #333;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; width: 60%;">Description</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right; width: 40%;">Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background-color: #e6ffe6;">
                        <td style="border: 1px solid #ddd; padding: 8px;">Normal Hours Import <span style="font-style: italic; color: #666;">(6am to 6pm)</span></td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #008000;"><strong>${safeImportNormal.toFixed(2)} Unit</strong></td>
                    </tr>
                    <tr style="background-color: #fff0e6;">
                        <td style="border: 1px solid #ddd; padding: 8px;">Peak Hours Import <span style="font-style: italic; color: #666;">(6pm to 10pm)</span></td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #ff4500;"><strong>${safeImportPeak.toFixed(2)} Unit</strong></td>
                    </tr>
                    <tr style="background-color: #e6f2ff;">
                        <td style="border: 1px solid #ddd; padding: 8px;">Off-Peak Import <span style="font-style: italic; color: #666;">(10pm to 6am)</span></td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #1e90ff;"><strong>${safeImportOffPeak.toFixed(2)} Unit</strong></td>
                    </tr>
                    <tr style="background-color: #f0f0ff;">
                        <td style="border: 1px solid #ddd; padding: 8px;">Normal Hour Export</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #0000cd;"><strong>${safeExportNormal.toFixed(2)} Unit</strong></td>
                    </tr>
                    <tr style="background-color: #f2e6ff;">
                        <td style="border: 1px solid #ddd; padding: 8px;">Banked Units</td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: #800080;"><strong>${safeMyBankDepositAtKseb.toFixed(2)} Unit</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <style>
            @media (max-width: 600px) {
                table { font-size: 12px; }
                th, td { padding: 6px; }
            }
        </style>
        <hr>
    `;
};


// const getExportNormalAdjustmentMessage = (exportPlusBank, importNormal, unitRate, NormalConsumptionAdjusted, PeakConsumptionAdjusted_80_percent,Normal_NoOfUnitsFor_energy_calculation) => {
//     if (exportPlusBank > importNormal) {
//       return `<p>ഇവിടെ Export+Bank (<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) പൂർണമായും Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Normal TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
//               <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong></p><hr>
//               <p>Normal hours Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy <strong class="green-text">${NormalConsumptionAdjusted.toFixed(2)} Unit </strong> (${exportPlusBank.toFixed(2)}-${importNormal.toFixed(2)}) ആകുന്നു. ഇതിൻ്റെ 80% (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>) Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ് (for connected Load above 20kW).</p>
//               <p> Peak TimeZone Energy Adjustment = <strong class="green-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit </strong>(${exportPlusBank}-${importNormal}) </p>
//               <p> Effective Energy to transfer=  <strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit </strong> (${NormalConsumptionAdjusted.toFixed(2)} x 80%) </p>

//               <hr>`;
//     } else if (exportPlusBank == importNormal) {
//       return `<p>Export+Bank (${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)}) ഉം പകൽ സമയ ഉപയോഗവും (${importNormal.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text"> അതിനാൽ Normal TimeZone എനർജി ഇല്ല.👍</strong>  No other Peak TimeZone Adjustment possible further. </p>
//               <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//       return `<p>താങ്കളുടെ പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) ആകുന്നു. Export+Bank: ${(exportReading + myBankDepositAtKseb).toFixed(2)}(<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit  </strong>)
//               കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit</strong>)
//               Normal Rate ൻ്റെ 90%, (അതായത്  ₹${unitRate.toFixed(2)} x 0.9 = ₹${(unitRate * 0.9).toFixed(2)}) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്. </p>
//               <p>Normal TimeZone Energy Consumption: <strong class="red-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p>  </strong>
//               <hr>`;
//     }
// };

const getExportNormalAdjustmentMessage = (
    exportPlusBank,
    importNormal,
    unitRate,
    NormalConsumptionAdjusted,
    PeakConsumptionAdjusted_80_percent,
    Normal_NoOfUnitsFor_energy_calculation,
    exportReading,
    myBankDepositAtKseb
  ) => {
    if (exportPlusBank > importNormal) {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} = ${exportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${importNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Energy After Normal Adjustment<br>(${exportPlusBank.toFixed(2)} - ${importNormal.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${NormalConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Adjustment (80% of Remaining)<br>(${NormalConsumptionAdjusted.toFixed(2)} x 80%)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (exportPlusBank == importNormal) {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} = ${exportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${importNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} = ${exportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${importNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${importNormal.toFixed(2)} - ${exportPlusBank.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (90% of Normal Rate)<br>(₹${unitRate.toFixed(2)} x 0.9)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">₹${(unitRate * 0.9).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    }
  };


// const getExportNormalAdjustmentMessage_below20kW = (exportPlusBank, importNormal, unitRate_Below20kW, NormalConsumptionAdjusted, NormalConsumptionAdjusted_Below20kW,Normal_NoOfUnitsFor_energy_calculation) => {
//     if (exportPlusBank > importNormal) {
//       return `<p>ഇവിടെ Export+Bank (<strong class="green-text"> ${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) പൂർണമായും Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Normal TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
//               <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong></p> <hr>
//               <p>Normal hours Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy <strong class="green-text">${NormalConsumptionAdjusted.toFixed(2)} Unit </strong> (${exportPlusBank.toFixed(2)}-${importNormal.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ് (for connected Load below 20kW).
//               <p> Peak TimeZone Energy Adjustment = <strong class="green-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit </strong>(${exportPlusBank}-${importNormal}) </p>
//               <p> Effective Energy =  <strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit </strong></p>
//               <hr>`;
//     } else if (exportPlusBank == importNormal) {
//       return `<p>Export+Bank (${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)}) ഉം പകൽ സമയ ഉപയോഗവും (${importNormal.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text"> അതിനാൽ Normal TimeZone എനർജി ഇല്ല.👍</strong>  No other Peak TimeZone Adjustment possible further. </p>
//               <p>Normal TimeZone Energy Consumption: <strong class="green-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//       return `<p>താങ്കളുടെ പകൽ സമയ ഉപയോഗം (<strong class="red-text">${importNormal.toFixed(2)} Unit </strong>) ആകുന്നു. Export+Bank: ${(exportReading + myBankDepositAtKseb).toFixed(2)} (<strong class="green-text">${exportReading.toFixed(2)} + ${myBankDepositAtKseb.toFixed(2)} Unit</strong>)
//               കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(exportPlusBank - importNormal).toFixed(2)} Unit</strong>)
//               Normal Rate ൻ്റെ 90%, (അതായത്  ₹${unitRate_Below20kW.toFixed(2)} x 0.9 = ₹${(unitRate_Below20kW * 0.9).toFixed(2)}) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്. </p>
//               <p>Normal TimeZone Energy Consumption: <strong class="red-text">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units⚡</p>  </strong>
//               <hr>`;
//     }
// };

const getExportNormalAdjustmentMessage_below20kW = (
    exportPlusBank,
    importNormal,
    unitRate_Below20kW,
    NormalConsumptionAdjusted,
    NormalConsumptionAdjusted_Below20kW,
    Normal_NoOfUnitsFor_energy_calculation,
    exportReading,
    myBankDepositAtKseb
  ) => {
    // Default to 0 if any value is undefined or null
    const safeExportPlusBank = exportPlusBank !== undefined && exportPlusBank !== null ? exportPlusBank : 0;
    const safeImportNormal = importNormal !== undefined && importNormal !== null ? importNormal : 0;
    const safeUnitRate_Below20kW = unitRate_Below20kW !== undefined && unitRate_Below20kW !== null ? unitRate_Below20kW : 0;
    const safeNormalConsumptionAdjusted = NormalConsumptionAdjusted !== undefined && NormalConsumptionAdjusted !== null ? NormalConsumptionAdjusted : 0;
    const safeNormalConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted_Below20kW !== undefined && NormalConsumptionAdjusted_Below20kW !== null ? NormalConsumptionAdjusted_Below20kW : 0;
    const safeNormal_NoOfUnitsFor_energy_calculation = Normal_NoOfUnitsFor_energy_calculation !== undefined && Normal_NoOfUnitsFor_energy_calculation !== null ? Normal_NoOfUnitsFor_energy_calculation : 0;
    const safeExportReading = exportReading !== undefined && exportReading !== null ? exportReading : 0;
    const safeMyBankDepositAtKseb = myBankDepositAtKseb !== undefined && myBankDepositAtKseb !== null ? myBankDepositAtKseb : 0;

    if (safeExportPlusBank > safeImportNormal) {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeExportReading.toFixed(2)} + ${safeMyBankDepositAtKseb.toFixed(2)} = ${safeExportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Energy After Normal Adjustment<br>(${safeExportPlusBank.toFixed(2)} - ${safeImportNormal.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormalConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Adjustment<br>(${safeExportPlusBank.toFixed(2)} - ${safeImportNormal.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Math.abs(safeExportPlusBank - safeImportNormal).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Effective Energy (Below 20kW)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (safeExportPlusBank == safeImportNormal) {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeExportReading.toFixed(2)} + ${safeMyBankDepositAtKseb.toFixed(2)} = ${safeExportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Normal TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Export + Bank</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeExportReading.toFixed(2)} + ${safeMyBankDepositAtKseb.toFixed(2)} = ${safeExportPlusBank.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">പകൽ സമയ ഉപയോഗം (Normal Time Usage)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportNormal.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${safeImportNormal.toFixed(2)} - ${safeExportPlusBank.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(safeExportPlusBank - safeImportNormal).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeNormal_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (90% of Normal Rate)<br>(₹${safeUnitRate_Below20kW.toFixed(2)} x 0.9)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">₹${(safeUnitRate_Below20kW * 0.9).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    }
  };

// const getExportPeakAdjustmentMessage = (PeakConsumptionAdjusted_80_percent, importPeak, PeakConsumptionAdjusted,Peak_NoOfUnitsFor_energy_calculation) => {
//     if (PeakConsumptionAdjusted_80_percent > importPeak) {
//       return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
//               <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌 </strong> </p>
//               <p>Left-over Energy : ${(PeakConsumptionAdjusted_80_percent-importPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted_80_percent.toFixed(2)}-${importPeak.toFixed(2)})</p>
//               <p>Effective Energy to transfer : ${PeakConsumptionAdjusted.toFixed(2)} Unit. (${(PeakConsumptionAdjusted*0.8).toFixed(2)}/0.8) <p> ഇത് പൂർണമായും (${PeakConsumptionAdjusted.toFixed(2)} Unit) Off-Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
//               </p><hr>`;
//     } else if (PeakConsumptionAdjusted_80_percent == importPeak) {
//       return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit) ഉം Peak TimeZone (6pm to 10pm) ഉപയോഗവും (${importPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍 </strong>. No other Peak TimeZone Adjustment possible further.</p>
//               <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//       return `<p>താങ്കളുടെ Peak hours (6pm to 10pm) ഉപയോഗം (<strong class="red-text">${importPeak.toFixed(2)} Unit </strong>) ആകുന്നു. Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong>)
//               കുറവാണ്. അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(importPeak - PeakConsumptionAdjusted_80_percent).toFixed(2)} Unit</strong>)
//               Normal Rate ൻ്റെ 125%, (അതായത്  ₹${unitRate.toFixed(2)} x 1.25 = <strong class="red-text">₹${(unitRate * 1.25).toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ് ⚡.</p>
//               <p>Peak TimeZone Energy Consumption: <strong class="red-text">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p> </strong><hr>`;
//     }

// };

const getExportPeakAdjustmentMessage = (
    PeakConsumptionAdjusted_80_percent,
    importPeak,
    PeakConsumptionAdjusted,
    Peak_NoOfUnitsFor_energy_calculation,
    unitRate // Added missing parameter
  ) => {
    // Default to 0 if any value is undefined or null
    const safePeakConsumptionAdjusted_80_percent = PeakConsumptionAdjusted_80_percent !== undefined && PeakConsumptionAdjusted_80_percent !== null ? PeakConsumptionAdjusted_80_percent : 0;
    const safeImportPeak = importPeak !== undefined && importPeak !== null ? importPeak : 0;
    const safePeakConsumptionAdjusted = PeakConsumptionAdjusted !== undefined && PeakConsumptionAdjusted !== null ? PeakConsumptionAdjusted : 0;
    const safePeak_NoOfUnitsFor_energy_calculation = Peak_NoOfUnitsFor_energy_calculation !== undefined && Peak_NoOfUnitsFor_energy_calculation !== null ? Peak_NoOfUnitsFor_energy_calculation : 0;
    const safeUnitRate = unitRate !== undefined && unitRate !== null ? unitRate : 0;

    if (safePeakConsumptionAdjusted_80_percent > safeImportPeak) {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Left-over Energy<br>(${safePeakConsumptionAdjusted_80_percent.toFixed(2)} - ${safeImportPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${(safePeakConsumptionAdjusted_80_percent - safeImportPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Effective Energy to Transfer<br>(${(safePeakConsumptionAdjusted * 0.8).toFixed(2)} / 0.8)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (safePeakConsumptionAdjusted_80_percent == safeImportPeak) {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Export Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Further Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_80_percent.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${safeImportPeak.toFixed(2)} - ${safePeakConsumptionAdjusted_80_percent.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(safeImportPeak - safePeakConsumptionAdjusted_80_percent).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safePeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (125% of Normal Rate)<br>(₹${safeUnitRate.toFixed(2)} x 1.25)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">₹${(safeUnitRate * 1.25).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    }
  };

// const getExportPeakAdjustmentMessage_below20kW = (NormalConsumptionAdjusted_Below20kW, importPeak,Peak_NoOfUnitsFor_energy_calculation_Below20kW,unitRate_Below20kW) => {
//     console.log('&&&&& NormalConsumptionAdjusted_Below20kW : ' + NormalConsumptionAdjusted_Below20kW);
//     console.log('&&&&& importPeak : ' + importPeak);
//     console.log('&&&&& Peak_NoOfUnitsFor_energy_calculation : ' + Peak_NoOfUnitsFor_energy_calculation_Below20kW);
//     if (NormalConsumptionAdjusted_Below20kW > importPeak) {
//       return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍</strong></p>
//               <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌 </strong></p><hr>
//               <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit (${NormalConsumptionAdjusted_Below20kW.toFixed(2)}-${importPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും Off-Peak TimeZone Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
//               <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak).toFixed(2)} Unit (${NormalConsumptionAdjusted_Below20kW.toFixed(2)}-${importPeak})</p> <hr>

//               `;
//     } else if (NormalConsumptionAdjusted_Below20kW == importPeak) {
//       return `<p>ബാക്കിയുള്ള Export Energy (${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit) ഉം Peak TimeZone (6pm to 10pm) ഉപയോഗവും (${importPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Peak TimeZone എനർജി ചാർജ് ഇല്ല 👍 </strong>. No other Peak TimeZone Adjustment possible further.</p>
//               <p>Peak TimeZone Energy Consumption: <strong class="green-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//       return `<p>താങ്കളുടെ Peak hours (6pm to 10pm) ഉപയോഗം (<strong class="red-text">${importPeak.toFixed(2)} Unit </strong>) ആകുന്നു. Peak Adjusted Energy (<strong class="green-text">${NormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>)
//               കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(NormalConsumptionAdjusted_Below20kW - importPeak).toFixed(2)} Unit</strong>)
//               Normal Rate ൻ്റെ 125%, (അതായത്  ₹${unitRate_Below20kW.toFixed(2)} x 1.25 = <strong class="red-text">₹${(unitRate_Below20kW * 1.25).toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ് ⚡.</p>
//               <p>Peak TimeZone Energy Consumption: <strong class="red-text">${Peak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units⚡</p> </strong><hr>`;
//     }

// };

const getExportPeakAdjustmentMessage_below20kW = (
    NormalConsumptionAdjusted_Below20kW,
    importPeak,
    Peak_NoOfUnitsFor_energy_calculation_Below20kW,
    unitRate_Below20kW
  ) => {
    // Default to 0 if any value is undefined or null
    const safeNormalConsumptionAdjusted_Below20kW = NormalConsumptionAdjusted_Below20kW !== undefined && NormalConsumptionAdjusted_Below20kW !== null ? NormalConsumptionAdjusted_Below20kW : 0;
    const safeImportPeak = importPeak !== undefined && importPeak !== null ? importPeak : 0;
    const safePeak_NoOfUnitsFor_energy_calculation_Below20kW = Peak_NoOfUnitsFor_energy_calculation_Below20kW !== undefined && Peak_NoOfUnitsFor_energy_calculation_Below20kW !== null ? Peak_NoOfUnitsFor_energy_calculation_Below20kW : 0;
    const safeUnitRate_Below20kW = unitRate_Below20kW !== undefined && unitRate_Below20kW !== null ? unitRate_Below20kW : 0;

    // Calculate leftover energy for the first case
    const safePeakConsumptionAdjusted_Below20kW = safeNormalConsumptionAdjusted_Below20kW - safeImportPeak;

    if (safeNormalConsumptionAdjusted_Below20kW > safeImportPeak) {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Energy After Adjustment<br>(${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} - ${safeImportPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Adjustment<br>(${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} - ${safeImportPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Math.abs(safeNormalConsumptionAdjusted_Below20kW - safeImportPeak).toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (safeNormalConsumptionAdjusted_Below20kW == safeImportPeak) {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Export Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted 👍</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Further Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Usage (6pm to 10pm)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${safeImportPeak.toFixed(2)} - ${safeNormalConsumptionAdjusted_Below20kW.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(safeNormalConsumptionAdjusted_Below20kW - safeImportPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safePeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (125% of Normal Rate)<br>(₹${safeUnitRate_Below20kW.toFixed(2)} x 1.25)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">₹${(safeUnitRate_Below20kW * 1.25).toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    }
  };

// const getExportOffPeakAdjustmentMessage = (importOffPeak, PeakConsumptionAdjusted) => {
//     if (PeakConsumptionAdjusted > importOffPeak) {
//         return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importOffPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല.</strong></p>
//                 <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${OffPeakConsumptionAdjusted.toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും (${OffPeakConsumptionAdjusted.toFixed(2)} Unit) Final Bank Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
//                 <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(PeakConsumptionAdjusted - importOffPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak})</p>
//                 <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>
//                 `;
//     } else if (PeakConsumptionAdjusted == importOffPeak) {
//         return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted.toFixed(2)} Unit) ഉം Off-Peak TimeZone (10pm to 6am) ഉപയോഗവും (${importOffPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല </strong>. No other Peak TimeZone Adjustment possible further.</p>
//                <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//         return `<p>താങ്കളുടെ Off-Peak hours (10pm to 6am) ഉപയോഗം (<strong class="red-text">${importOffPeak.toFixed(1)} Unit </strong>) ആകുന്നു. Off-Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted.toFixed(2)} Unit</strong>)
//                 കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(PeakConsumptionAdjusted - importOffPeak).toFixed(2)} Unit</strong>)
//                 Normal Rate ൽ , (അതായത്  <strong class="red-text">₹${unitRate.toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്.</p>
//                 <p>Off-Peak TimeZone Energy Consumption: <strong class="red-text">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</p> </strong> <hr>`;
//     }
// };

const getExportOffPeakAdjustmentMessage = (
    importOffPeak,
    PeakConsumptionAdjusted,
    OffPeakConsumptionAdjusted, // Added missing parameter
    OffPeak_NoOfUnitsFor_energy_calculation, // Added missing parameter
    unitRate // Added missing parameter
  ) => {
    // Default to 0 if any value is undefined or null
    const safeImportOffPeak = importOffPeak !== undefined && importOffPeak !== null ? importOffPeak : 0;
    const safePeakConsumptionAdjusted = PeakConsumptionAdjusted !== undefined && PeakConsumptionAdjusted !== null ? PeakConsumptionAdjusted : 0;
    const safeOffPeakConsumptionAdjusted = OffPeakConsumptionAdjusted !== undefined && OffPeakConsumptionAdjusted !== null ? OffPeakConsumptionAdjusted : 0;
    const safeOffPeak_NoOfUnitsFor_energy_calculation = OffPeak_NoOfUnitsFor_energy_calculation !== undefined && OffPeak_NoOfUnitsFor_energy_calculation !== null ? OffPeak_NoOfUnitsFor_energy_calculation : 0;
    const safeUnitRate = unitRate !== undefined && unitRate !== null ? unitRate : 0;

    if (safePeakConsumptionAdjusted > safeImportOffPeak) {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Energy After Adjustment<br>(${safePeakConsumptionAdjusted.toFixed(2)} - ${safeImportOffPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Adjustment<br>(${safePeakConsumptionAdjusted.toFixed(2)} - ${safeImportOffPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Math.abs(safePeakConsumptionAdjusted - safeImportOffPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Final Bank Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (safePeakConsumptionAdjusted == safeImportOffPeak) {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Export Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Further Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${safeImportOffPeak.toFixed(2)} - ${safePeakConsumptionAdjusted.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(safePeakConsumptionAdjusted - safeImportOffPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeOffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (Normal Rate)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">₹${safeUnitRate.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    }
  };

// const getExportOffPeakAdjustmentMessage_below20kW = (importOffPeak, PeakConsumptionAdjusted_Below20kW, OffPeakConsumptionAdjusted_Below20kW,unitRate_Below20kW) => {
//     if (PeakConsumptionAdjusted_Below20kW > importOffPeak) {
//         return `<p>ഇവിടെ Peak Hours Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>) കൂടുതൽ ആയതുകൊണ്ട് Peak TimeZone (6pm to 10pm) ഉപയോഗം (${importOffPeak.toFixed(2)}) പൂർണമായും Adjust ചെയ്യാം. <strong class="green-text"> അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല.</strong></p>
//                 <p>Adjust ചെയ്തതിനു ശേഷം ഉള്ള Energy ${OffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit (${PeakConsumptionAdjusted.toFixed(2)}-${importOffPeak.toFixed(2)}) ആകുന്നു. ഇത് പൂർണമായും (${OffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit) Final Bank Adjustment ലേക്ക് എടുക്കുന്നതാണ്.</p>
//                 <p> Off-Peak TimeZone Energy Adjustment = ${Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak).toFixed(2)} Unit (${PeakConsumptionAdjusted_Below20kW.toFixed(2)}-${importOffPeak})</p>
//                 <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>
//                 `;
//     } else if (PeakConsumptionAdjusted_Below20kW == importOffPeak) {
//         return `<p>ബാക്കിയുള്ള Export Energy (${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit) ഉം Off-Peak TimeZone (10pm to 6am) ഉപയോഗവും (${importOffPeak.toFixed(2)}) തുല്യമായത് കൊണ്ട് പൂർണമായും അതിൽ Adjust ചെയ്യാൻ കഴിയുന്നതാണ്. <strong class="green-text">അതിനാൽ Off-Peak TimeZone എനർജി ഇല്ല </strong>. No other Peak TimeZone Adjustment possible further.</p>
//                <p>Off-Peak TimeZone Energy Consumption: <strong class="green-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</p> </strong>`;
//     } else{
//         return `<p>താങ്കളുടെ Off-Peak hours (10pm to 6am) ഉപയോഗം (<strong class="red-text">${importOffPeak.toFixed(1)} Unit </strong>) ആകുന്നു. Off-Peak Adjusted Energy (<strong class="green-text">${PeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong>)
//                 കുറവാണ് . അതുകൊണ്ട് Adjust ചെയ്യുമ്പോൾ വരുന്ന (<strong class="red-text">${Math.abs(PeakConsumptionAdjusted_Below20kW - importOffPeak).toFixed(2)} Unit</strong>)
//                 Normal Rate ൽ , (അതായത്  <strong class="red-text">₹${unitRate_Below20kW.toFixed(2)}</strong>) നിരക്കിൽ ചാർജ് ചെയ്യുന്നതാണ്.</p>
//                 <p>Off-Peak TimeZone Energy Consumption: <strong class="red-text">${OffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡</p> </strong> <hr>`;
//     }
// };

const getExportOffPeakAdjustmentMessage_below20kW = (
    importOffPeak,
    PeakConsumptionAdjusted_Below20kW,
    OffPeakConsumptionAdjusted_Below20kW,
    unitRate_Below20kW,
    OffPeak_NoOfUnitsFor_energy_calculation_Below20kW // Added missing parameter
  ) => {
    // Default to 0 if any value is undefined or null
    const safeImportOffPeak = importOffPeak !== undefined && importOffPeak !== null ? importOffPeak : 0;
    const safePeakConsumptionAdjusted_Below20kW = PeakConsumptionAdjusted_Below20kW !== undefined && PeakConsumptionAdjusted_Below20kW !== null ? PeakConsumptionAdjusted_Below20kW : 0;
    const safeOffPeakConsumptionAdjusted_Below20kW = OffPeakConsumptionAdjusted_Below20kW !== undefined && OffPeakConsumptionAdjusted_Below20kW !== null ? OffPeakConsumptionAdjusted_Below20kW : 0;
    const safeUnitRate_Below20kW = unitRate_Below20kW !== undefined && unitRate_Below20kW !== null ? unitRate_Below20kW : 0;
    const safeOffPeak_NoOfUnitsFor_energy_calculation_Below20kW = OffPeak_NoOfUnitsFor_energy_calculation_Below20kW !== undefined && OffPeak_NoOfUnitsFor_energy_calculation_Below20kW !== null ? OffPeak_NoOfUnitsFor_energy_calculation_Below20kW : 0;

    if (safePeakConsumptionAdjusted_Below20kW > safeImportOffPeak) {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Peak Hours Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Energy After Adjustment<br>(${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} - ${safeImportOffPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Adjustment<br>(${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} - ${safeImportOffPeak.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${Math.abs(safePeakConsumptionAdjusted_Below20kW - safeImportOffPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Final Bank Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else if (safePeakConsumptionAdjusted_Below20kW == safeImportOffPeak) {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Export Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Fully Adjusted</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safeOffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units 😌</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Further Adjustment</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">No further adjustment possible</td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
    } else {
      return `
        <hr>
        <h5><u>Off-Peak TimeZone Adjustment Details (Below 20kW)</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
          <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak Adjusted Energy</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${safePeakConsumptionAdjusted_Below20kW.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Usage (10pm to 6am)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeImportOffPeak.toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Remaining Units to Charge<br>(${safeImportOffPeak.toFixed(2)} - ${safePeakConsumptionAdjusted_Below20kW.toFixed(2)})</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${Math.abs(safePeakConsumptionAdjusted_Below20kW - safeImportOffPeak).toFixed(2)} Unit</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone Energy Consumption</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${safeOffPeak_NoOfUnitsFor_energy_calculation_Below20kW.toFixed(2)} Units ⚡</strong></td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 6px;">Charge Rate (Normal Rate)</td>
                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">₹${safeUnitRate_Below20kW.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <style>
          @media (max-width: 600px) {
            table { font-size: 12px; }
            th, td { padding: 4px; }
          }
        </style>
        <hr>
      `;
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
    return `
        <hr>
        <h5><u>Energy Calculation Details</u></h5>
        <div style="overflow-x: auto; margin: 20px 0;">
            <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 40%;">Description</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Units</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Rate</th>
                        <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 20%;">Charge (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Normal TimeZone (90%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${Normal_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${(unitRate * 0.9).toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${NormalConsumptionAdjusted_energy_charge.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Peak TimeZone (125%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${Peak_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${(unitRate * 1.25).toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${PeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong></td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 6px;">Off-Peak TimeZone (100%)</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${OffPeak_NoOfUnitsFor_energy_calculation.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${unitRate.toFixed(2)}</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${OffPeakConsumptionAdjusted_energy_charge.toFixed(2)}</strong></td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="border: 1px solid #ddd; padding: 6px;"><strong>Total Energy Consumption</strong></td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong>${bankAdjustedUnits.toFixed(2)}</strong></td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">-</td>
                        <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${energyCharge.toFixed(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p style="font-size: 0.9em;">Base Unit Rate: ₹${unitRate.toFixed(2)} | Total Energy Charge = Normal (T1) + Peak (T2) + Off-Peak (T3)</p>
        <style>
            @media (max-width: 600px) {
                table {
                    font-size: 12px;
                }
                th, td {
                    padding: 4px;
                }
            }
        </style>
        <hr>
    `;
};

    var duty = 0;
    const monthlyFuelSurcharge = bankAdjustedUnits * 0.06;
    var totalBillAmount = 0;
    duty = energyCharge * 0.10;
    totalBillAmount = fixedCharge + meterRent + energyCharge + duty + monthlyFuelSurcharge;

    // Round off based on decimal part
    totalBillAmount = Math.round(totalBillAmount);

    let billInfo = '';

    if (bankAdjustedUnits > 0) {
        const energyChargeToUse = energyCharge !== undefined && energyCharge !== null ? energyCharge : 0;
        const bankAdjustedUnitsToUse = bankAdjustedUnits !== undefined && bankAdjustedUnits !== null ? bankAdjustedUnits : 0;

        billInfo = `
             <h4 style="position: absolute; left: 50%; transform: translateX(-50%); color: #2c3e50; margin-bottom: 10px; text-align: center;"><u>Bill Summary</u></h4>
            <div style="overflow-x: auto; margin: 20px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px; background: linear-gradient(135deg, #ffffff, #f9f9f9); box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px;">

                    <thead>
                        <tr style="background: linear-gradient(90deg, #3498db, #2980b9); color: white;">
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: left; width: 60%; border-top-left-radius: 8px;">Description</th>
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: right; width: 40%; border-top-right-radius: 8px;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Bill Type</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>${billType || 'N/A'}</strong></td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Fixed Charge</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(fixedCharge || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Meter Rent</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(meterRent || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="border: 1px solid #ddd; padding: 10px;">No: of Units Consumed<br>(for Energy Calculation)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #2ecc71;">${bankAdjustedUnitsToUse.toFixed(2)} Unit</td>
                        </tr>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Unit Charge</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #3498db;">₹${(unitRate || 0).toFixed(2)}/Unit</td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Energy Charge</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e74c3c;"><strong>₹${energyChargeToUse.toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Duty<br>(10% of Energy Charge)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(duty || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Monthly Fuel Surcharge<br>(Consumption: ${bankAdjustedUnitsToUse.toFixed(2)} Unit x 6ps)</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(monthlyFuelSurcharge || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white;">
                            <td style="border: 1px solid #27ae60; padding: 10px; font-weight: bold; border-bottom-left-radius: 8px;">Total Bill Amount</td>
                            <td style="border: 1px solid #27ae60; padding: 10px; text-align: right; font-weight: bold; border-bottom-right-radius: 8px;">₹${(totalBillAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table { font-size: 12px; }
                    td, th { padding: 8px; }
                }
            </style>
        `;
    } else {
        billInfo = `
            <h4 style="position: absolute; left: 50%; transform: translateX(-50%); color: #2c3e50; margin-bottom: 10px; text-align: center;"><u>Bill Summary</u></h4>
            <div style="overflow-x: auto; margin: 20px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px; background: linear-gradient(135deg, #ffffff, #f9f9f9); box-shadow: 0 4px 8px rgba(0,0,0,0.1); border-radius: 8px;">

                    <thead>
                        <tr style="background: linear-gradient(90deg, #3498db, #2980b9); color: white;">
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: left; width: 60%; border-top-left-radius: 8px;">Description</th>
                            <th style="border: 1px solid #2980b9; padding: 10px; text-align: right; width: 40%; border-top-right-radius: 8px;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Bill Type</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${billType || 'N/A'}</td>
                        </tr>
                        <tr style="background-color: #ffffff;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Fixed Charge</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(fixedCharge || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background-color: #ecf0f1;">
                            <td style="border: 1px solid #ddd; padding: 10px;">Meter Rent</td>
                            <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #e67e22;"><strong>₹${(meterRent || 0).toFixed(2)}</strong></td>
                        </tr>
                        <tr style="background: linear-gradient(90deg, #2ecc71, #27ae60); color: white;">
                            <td style="border: 1px solid #27ae60; padding: 10px; font-weight: bold; border-bottom-left-radius: 8px;">Total Bill Amount</td>
                            <td style="border: 1px solid #27ae60; padding: 10px; text-align: right; font-weight: bold; border-bottom-right-radius: 8px;">₹${(totalBillAmount || 0).toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table { font-size: 12px; }
                    td, th { padding: 8px; }
                }
            </style>
        `;
    }

    if(billingType == 'normal' ||  todType == "normal" ){
        console.log('Check 18');
        //NORMAL BILLING HERE
        // document.getElementById('result').innerHTML = `<p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
        //                                             <p>  Total Import = ${importReading} Unit</p>
        //                                             <p>  Total Export = ${exportReading} Unit</p>
        //                                             <p>Banked Units = ${myBankDepositAtKseb} Unit</p><hr>
        //                                             <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് (Direct usage from Solar) = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
        //                                             <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p>

        //                                             <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം. (Based on this Fixed Charge is calculated)</p>
        //                                             Fixed charge for ${unitsConsumed} Unit (${phase}) = <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 5/12/2024)<hr>`;
        document.getElementById('result').innerHTML = `
            <hr>
            <h5><u>Energy Usage and Charges</u></h5>
            <div style="overflow-x: auto; margin: 16px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Total Solar Generation</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${solarGeneration} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">  Total Import</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${importReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">  Total Export</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${exportReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Banked Units</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${myBankDepositAtKseb} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Direct energy usage from Solar<br>(SolarGeneration(${solarGeneration}) - Export(${exportReading}))</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${generationUsage} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Energy Usage from KSEB</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${importReading} Unit</strong></td>
                        </tr>
                        <tr style="background-color: #f9f9f9;">
                            <td style="border: 1px solid #ddd; padding: 6px;">Total Consumption<br>(${generationUsage} + ${importReading})</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${unitsConsumed} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Fixed Charge for ${unitsConsumed} Unit (${phase})<br>(w.e.f 1/4/2025)</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">₹${fixedCharge}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table {
                        font-size: 12px;
                    }
                    th, td {
                        padding: 4px;
                    }
                }
            </style>
            <hr>
        `;

        document.getElementById('result1').innerHTML = ` ${importReading > exportPlusBank ? `<p>Energy Consumption for the month is <strong class="red-text">${Math.abs(importReading - exportPlusBank).toFixed(2)} Unit </strong>(${importReading}-${exportPlusBank}) - (Energy charge is calculated based on this consumption)</p>` :
                                                    'Energy consumption for the month is zero as the consumption is adjusted from the export+bank'}`;


        // if (importReading > exportPlusBank) {
        //     console.log('Check 20');
        //     document.getElementById('result2').innerHTML = `<hr><p>  Total Import = ${importReading} Unit</p>
        //                                                     <p>  Total Export = ${exportReading} Unit</p>
        //                                                     <p>Banking Units = ${myBankDepositAtKseb} Unit</p><hr>
        //                                                     <p>വ്യത്യാസം വരുന്ന <strong class="red-text">${bankAdjustedUnits} Unit </strong> (${importReading}-${exportPlusBank}) ചാർജ് ചെയ്യപ്പെടുന്നതാണ്.</p>`;
        //     if (billType === 'Telescopic' || billType === 'Telescopic-ToD')
        //     {
        //         console.log('Check 222');
        //         document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. <hr><p>Energy Charge Calculation (For ${bankAdjustedUnits} Unit):</p>
        //         ${breakdown} `;
        //     }else{
        //         document.getElementById('result3').innerHTML = `താങ്കളുടെ ബില്ലിംഗ് ടൈപ്പ്: ${billType} ആകുന്നു. നിലവിലെ താരിഫ് അനുസരിച്ചു താങ്കൾ ഒരു യൂണിറ്റിന് ₹${unitRate.toFixed(2)} നൽകണം.
        //                                                         <p>Total Engergy Charge: ${bankAdjustedUnits} x ₹${unitRate.toFixed(2)} = <b>₹${energyCharge.toFixed(2)} </b></p> `;
        //     }

        //     document.getElementById('result4').innerHTML = `Total Bill Amount ഏകദേശം  <strong class="red-text">₹${totalBillAmount.toFixed(2)} </strong>
        //                                                     <br><i>(Changes with the GST, Security Deposit interest, Tariff changes, Advance calculation)</i>`;
        // } else {
        //     console.log('Check 21');
        //     if (importReading == exportPlusBank) {
        //         document.getElementById('result2').innerHTML = `<br>  Total Import = ${importReading} Unit
        //                                                         <br>  Total Export = ${exportReading} Unit
        //                                                         <br>Banked Unit = ${myBankDepositAtKseb} Unit <hr>
        //                                                         <p><span class="green-text">ഇവിടെ Total Export ഉം Import ഉം തുല്ല്യമാണ്. എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല</span> </p>`;
        //     } else {
        //         document.getElementById('result2').innerHTML = `<br>  Total Import = ${importReading} Unit
        //                                                         <br>  Total Export = ${exportReading} Unit
        //                                                         <br>Banked Unit = ${myBankDepositAtKseb} Unit<hr>
        //                                                         <p><span class="green-text"><b>Export കൂടുതലായതു കൊണ്ട് എനർജി ചാർജ് കൊടുക്കേണ്ടതില്ല.</b></span> </p> `;
        //     }
        //     document.getElementById('result3').innerHTML = `Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
        //                                                     <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i>`;
        //     console.log('Account Balance ' + accountBalance);
        //     document.getElementById('result4').innerHTML = (accountBalance > 0) ? `Extra Energy Generation = <strong class="green-text">${accountBalance} Unit</strong> will be added to bank
        //     <br>(Export+Bank(${exportPlusBank})-Import(${importReading}))`:`No Energy units to be added to bank 👎`;
        // }
        if (importReading > exportPlusBank) {
            console.log('Check 20');
            document.getElementById('result2').innerHTML = `
                <hr>
                <h5><u>Energy Usage Summary</u></h5>
                <div style="overflow-x: auto; margin: 20px 0;">
                    <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                                <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">  Total Import</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${importReading || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">  Total Export</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${exportReading || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">Banking Units</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${myBankDepositAtKseb || 0} Unit</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 6px;">Difference to be Charged<br>(${importReading || 0} - ${exportPlusBank || 0})</td>
                                <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${bankAdjustedUnits || 0} Unit</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <style>
                    @media (max-width: 600px) {
                        table { font-size: 12px; }
                        th, td { padding: 4px; }
                    }
                </style>
                <hr>
            `;

            if (billType === 'Telescopic' || billType === 'Telescopic-ToD') {
                console.log('Check 222');
                document.getElementById('result3').innerHTML = `
                    <p>Your Billing Type: ${billType || 'Unknown'}</p>
                    <hr>
                    <h5><u>Energy Charge Calculation</u></h5>
                    <p>For ${bankAdjustedUnits || 0} Unit:</p>
                    ${breakdown || 'No breakdown available'}
                `;
            } else {
                document.getElementById('result3').innerHTML = `
                    <p>Your Billing Type: ${billType || 'Unknown'}</p>
                    <p>As per the existing tariff Unit rate:  ₹${(unitRate || 0).toFixed(2)}.</p>
                    <div style="overflow-x: auto; margin: 20px 0;">
                        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">Total Energy Charge<br>(${bankAdjustedUnits || 0} x ₹${(unitRate || 0).toFixed(2)})</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong>₹${(energyCharge || 0).toFixed(2)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <style>
                        @media (max-width: 600px) {
                            table { font-size: 12px; }
                            th, td { padding: 4px; }
                        }
                    </style>
                `;
            }

            document.getElementById('result4').innerHTML = `
                <h5><u>Total Bill Amount</u></h5>
                <p>ഏകദേശം <strong class="red-text">₹${(totalBillAmount || 0).toFixed(2)}</strong></p>
                <p style="font-size: 0.9em; font-style: italic;">(GST, Security Deposit interest, Tariff changes, Advance calculation എന്നിവയിൽ മാറ്റങ്ങൾ വരാം)</p>
            `;
        } else {
            console.log('Check 21');
            if (importReading == exportPlusBank) {
                document.getElementById('result2').innerHTML = `
                    <hr>
                    <h5><u>Energy Usage Summary</u></h5>
                    <div style="overflow-x: auto; margin: 20px 0;">
                        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">  Total Import</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${importReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">  Total Export</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${exportReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">Banked Unit</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${myBankDepositAtKseb || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Import = Export, No Energy Charge</strong>😌</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <style>
                        @media (max-width: 600px) {
                            table { font-size: 12px; }
                            th, td { padding: 4px; }
                        }
                    </style>
                    <hr>
                `;
            } else {
                document.getElementById('result2').innerHTML = `
                    <hr>
                    <h5><u>Energy Usage Summary</u></h5>
                    <div style="overflow-x: auto; margin: 20px 0;">
                        <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f2f2f2;">
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                                    <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">  Total Import</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${importReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">  Total Export</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${exportReading || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">Banked Unit</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${myBankDepositAtKseb || 0} Unit</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 6px;">Adjustment Status</td>
                                    <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">Export > Import, No Energy Charge</strong>😌</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <style>
                        @media (max-width: 600px) {
                            table { font-size: 12px; }
                            th, td { padding: 4px; }
                        }
                    </style>
                    <hr>
                `;
            }

            document.getElementById('result3').innerHTML = `
                <h5><u>Total Bill Amount</u></h5>
                <p>ഏകദേശം <strong class="red-text">₹${(totalBillAmount || 0).toFixed(2)}</strong></p>
                <p style="font-size: 0.9em; font-style: italic;">(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</p>
            `;

            console.log('Account Balance ' + accountBalance);
            document.getElementById('result4').innerHTML = `
                <h5><u>Bank Adjustment</u></h5>
                ${(accountBalance || 0) > 0 ? `
                    <p>Final Bank Closing = <strong class="green-text">${accountBalance || 0} Unit</strong></p>
                    <p style="font-size: 0.9em;">(Export+Bank(${exportPlusBank || 0}) - Import(${importReading || 0}))</p>
                ` : `
                    <p>No Energy units to be added to bank 👎</p>
                `}
            `;
        }
    }
    else
    {
        console.log('Check 19');
        //TOD Billing - From 2nd Feb 2025 onwards

        //ORIGINAL TOD BILL CALCULATION HERE
        // document.getElementById('result').innerHTML = `<hr><p>Total Solar Generation      = <strong class="green-text">${solarGeneration} Unit</strong></p>
        // <p>  Total Import = ${importReading} Unit (T1 (${importNormal.toFixed(2)}) + T2 (${importPeak.toFixed(2)}) + T3 (${importOffPeak.toFixed(2)}))</p>
        // <p>  Total Export = ${exportReading} Unit (T1 (${exportNormal.toFixed(2)}) + T2 (${exportPeak}) + T3 (${exportOffPeak}) )</p>
        // <p>Banked Units = ${myBankDepositAtKseb} Unit </p><hr>
        // <p>താങ്കൾ നേരിട്ട് ഉപയോഗിച്ചത് = <strong class="red-text">${generationUsage} Unit</strong> <br>(SolarGeneration(${solarGeneration}) - Export(${exportReading})). </p>
        // <p>KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് = <strong class="red-text">${importReading} Unit</strong></p> <hr>
        // <p>അങ്ങനെ <strong class="red-text">${unitsConsumed}</strong> (${generationUsage}+${importReading}) യൂണിറ്റാണ് താങ്കളുടെ ആകെ വൈദ്യുതി ഉപയോഗം.</p>`;

//*** */
        document.getElementById('result').innerHTML = `
            <hr>
            <h5><u>Energy Usage Details</u></h5>
            <div style="overflow-x: auto; margin: 20px 0;">
                <table style="width: 100%; max-width: 600px; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: left; width: 60%;">Description</th>
                            <th style="border: 1px solid #ddd; padding: 6px; text-align: right; width: 40%;">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Total Solar Generation</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="green-text">${solarGeneration} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">  Total Import<br>(T1 (${importNormal.toFixed(2)}) + T2 (${importPeak.toFixed(2)}) + T3 (${importOffPeak.toFixed(2)}))</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${importReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">  Total Export<br>(T1 (${exportNormal.toFixed(2)}) + T2 (${exportPeak}) + T3 (${exportOffPeak}))</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${exportReading} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Banked Units</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${myBankDepositAtKseb} Unit</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">Direct energy Usage from solar<br>(SolarGeneration(${solarGeneration}) - Export(${exportReading}))</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${generationUsage} Unit</strong></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 6px;">KSEB യിൽ നിന്നും ഉപയോഗിച്ചത് (From KSEB)</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${importReading} Unit</strong></td>
                        </tr>
                        <tr style="background-color: #f9f9f9;">
                            <td style="border: 1px solid #ddd; padding: 6px;">ആകെ വൈദ്യുതി ഉപയോഗം (Total Consumption)<br>(${generationUsage} + ${importReading})</td>
                            <td style="border: 1px solid #ddd; padding: 6px; text-align: right;"><strong class="red-text">${unitsConsumed} Unit</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <style>
                @media (max-width: 600px) {
                    table {
                        font-size: 12px;
                    }
                    th, td {
                        padding: 4px;
                    }
                }
            </style>
            <hr>
        `;
//*////
        document.getElementById('result1').innerHTML = `Fixed charge for ${unitsConsumed} Unit (${phase}) =   <strong class="red-text">₹${fixedCharge}</strong> (w.e.f 1/4/2025)`;

        if(todBillingAbove20kW > 0)
        {
            // Connected Load Above 20kW
            document.getElementById('result2').innerHTML  = getHeaderMessage();
            document.getElementById('result2').innerHTML += `<u><strong>T1 - Normal TimeZone (6am to 6pm) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportNormalAdjustmentMessage(exportPlusBank,importNormal,unitRate, NormalConsumptionAdjusted, PeakConsumptionAdjusted_80_percent,Normal_NoOfUnitsFor_energy_calculation,exportReading, myBankDepositAtKseb);
            document.getElementById('result2').innerHTML += `<u><strong>T2 - Peak TimeZone (6pm to 10pm) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportPeakAdjustmentMessage(PeakConsumptionAdjusted_80_percent,importPeak,PeakConsumptionAdjusted,Peak_NoOfUnitsFor_energy_calculation,unitRate);
            document.getElementById('result2').innerHTML += `<u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u>`;
            document.getElementById('result2').innerHTML += getExportOffPeakAdjustmentMessage(importOffPeak,PeakConsumptionAdjusted,OffPeakConsumptionAdjusted, OffPeak_NoOfUnitsFor_energy_calculation, unitRate);
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
            document.getElementById('result2').innerHTML += getExportNormalAdjustmentMessage_below20kW(exportPlusBank,importNormal,unitRate_Below20kW, NormalConsumptionAdjusted_Below20kW, NormalConsumptionAdjusted_Below20kW,Normal_NoOfUnitsFor_energy_calculation,exportReading,myBankDepositAtKseb);

            document.getElementById('result3').innerHTML += `<b><u><strong>T2 - Peak TimeZone (6pm to 10pm) (Connected Load < 20kW)</strong></u></b>`;
            document.getElementById('result3').innerHTML += getExportPeakAdjustmentMessage_below20kW(NormalConsumptionAdjusted_Below20kW,importPeak,Peak_NoOfUnitsFor_energy_calculation_Below20kW,unitRate_Below20kW);

            document.getElementById('result3').innerHTML += `<b><u><strong>T3 - Off-Peak TimeZone (10pm to 6am) Calculations </strong></u></b>`;
            document.getElementById('result3').innerHTML += getExportOffPeakAdjustmentMessage_below20kW(importOffPeak,PeakConsumptionAdjusted_Below20kW,OffPeakConsumptionAdjusted_Below20kW,unitRate_Below20kW, OffPeak_NoOfUnitsFor_energy_calculation_Below20kW);

            document.getElementById('result3').innerHTML += getEnergyCaluculationMessage(bankAdjustedUnits_Below20kW, Normal_NoOfUnitsFor_energy_calculation, Peak_NoOfUnitsFor_energy_calculation_Below20kW, OffPeak_NoOfUnitsFor_energy_calculation_Below20kW, unitRate_Below20kW, NormalConsumptionAdjusted_energy_charge, PeakConsumptionAdjusted_energy_charge_Below20kW, OffPeakConsumptionAdjusted_energy_charge_Below20kW,energyCharge_Below20kW);
            document.getElementById('result3').innerHTML += `<b>Total Bill Amount ഏകദേശം <strong class="red-text"> ₹${totalBillAmount.toFixed(2)} </strong>
                                                            <br><i>(Security Deposit interest, Tariff changes, Advance അനുസരിച്ച് മാറ്റം വരാം)</i></b>`;
        }
    }
    console.log('Check 26');
    //Ending Note - Section End
    document.getElementById('result6').innerHTML = `
    <div style="background: linear-gradient(135deg, #ffffff, #f2f4f8); padding: 20px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); margin: 20px auto; max-width: 90%; font-family: 'Georgia', serif; border-left: 4px solid #2ecc71;">
        <p style="font-size: 14px; color: #2c3e50; line-height: 1.6; margin: 0;">
            <strong style="color: #e67e22;">Tariff Notice:</strong> Tariffs (effective from <span style="font-style: italic;">1/04/2025</span>) are subject to change. For the latest rates, please refer to <span style="color: #3498db; font-weight: bold;">KSEB official sources</span>.
        </p>
        <p style="font-size: 14px; color: #333; line-height: 1.8; margin: 15px 0 0;">
            <strong style="color: #27ae60;">Need Assistance?</strong> If you notice any discrepancies in the calculations, require additional options, or need updates due to calculation mistakes, feel free to contact us at
            <a href="mailto:calculatoronline2024@gmail.com" style="color: #2ecc71; font-style: italic; text-decoration: none; transition: color 0.3s ease;">calculatoronline2024@gmail.com</a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 10px; line-height: 1.6;">
            <em>Note:</em> This information is provided for reference only. For accurate and official details, consult <span style="color: #3498db;">KSEB</span> or other authoritative sources.
            <span style="display: block; margin-top: 5px; font-size: 12px; color: #888;">(Version 2.0.02: Last updated: 27-Jun-2025) </span>
        </p>
    </div>
`;
//

    document.getElementById('result').style.display = 'block';
    document.getElementById('result1').style.display = 'block';
    document.getElementById('result2').style.display = 'block';
    document.getElementById('result3').style.display = 'block';
    document.getElementById('result4').style.display = 'block';
    document.getElementById('result6').style.display = 'block';
    document.getElementById('billInfo').innerHTML = billInfo;
    document.getElementById('billDetails').style.display = 'block';
    document.getElementById('printButton').style.display = 'block';
    document.getElementById('moveToTop').style.display = 'block';

    // Scroll to the 'Description' table
    document.getElementById('billDetails').scrollIntoView({ behavior: 'smooth' });
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

// Function to update the current date and time
function updateCurrentDateTime() {
    const currentDateTimeElement = document.getElementById('current-date-time');
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const formattedDateTime = currentDate.toLocaleString('en-US', options);
    currentDateTimeElement.textContent = formattedDateTime;
}

// Update the current date and time every second
setInterval(updateCurrentDateTime, 1000);

// Update the current date and time every second
document.addEventListener('DOMContentLoaded', function() {
    setInterval(updateCurrentDateTime, 1000);
    updateCurrentDateTime();
});


// Array of inspirational quotes
const quotes = [
    "Believe you can and you're halfway there.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Success is not final, failure is not fatal: It is the courage to continue that counts.",
    "Don't watch the clock; do what it does. Keep going.",
    "You miss 100% of the shots you don't take.",
    "The only way to do great work is to love what you do.",
    "Keep your eyes on the stars, and your feet on the ground.",
    "Do something today that your future self will thank you for.",
    "You are never too old to set another goal or to dream a new dream.",
    "The best way to predict your future is to create it.",
    "You don't have to be great to start, but you have to start to be great.",
    "The biggest risk is not taking any risk.",
    "Don't be afraid to take the road less traveled.",
    "You are stronger than you seem, braver than you believe, and smarter than you think.",
    "Happiness is not something ready made. It comes from your own actions.",
    "The best revenge is massive success.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to be great to start, but you have to start to be great.",
    "The biggest risk is not taking any risk.",
    "Don't be afraid to take the road less traveled.",
    "You are stronger than you seem, braver than you believe, and smarter than you think.",
    "Happiness is not something ready made. It comes from your own actions.",
    "The best revenge is massive success.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you seem, braver than you believe, and smarter than you think.",
    "Happiness is not something ready made. It comes from your own actions.",
    "The best revenge is massive success.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",
    "You are never too old to become younger.",
    "The most powerful weapon on earth is the human soul on fire.",
    "The greatest discovery of all time is that a person can change their future by merely changing their attitude.",
    "You don't have to be defined or confined by your environment, by your family, by your circumstances.",
    "The best way to make your dreams come true is to wake up.",
    "You are not a victim, you are a volunteer.",
    "The most important thing in life is your inner peace.",
    "You can't pour from an empty cup. Take care of yourself first.",
    "The best time to make a change is when you're feeling stuck.",
    "You are the architect of your own destiny.",
    "Happiness is not something you find, it's something you create.",
    "The biggest adventure you can take is to live the life of your dreams.",
    "You are stronger than you think, braver than you feel, and smarter than you know.",
    "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    "You don't have to control your thoughts. You just have to stop letting them control you.",
    "The best revenge is to be unlike him who performed the injury.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "Do something wonderful, people may imitate it.",
    "You are the master of your destiny, the captain of your soul.",
    "The greatest wealth is to live content with little.",
    "You can't build a reputation on what you're going to do.",
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "You are not a product of your circumstances. You are a product of your decisions.",
    "The most important thing in life is to learn how to give out love, and let it come in.",
    "You can't start the next chapter of your life if you keep re-reading the last one.",
    "The biggest mistake you can make is fearing that you'll make one.",
    "Do something today that will make your future self proud.",
    "You can't go back and change the beginning, but you can start where you are and change the ending.",
    "The best way to find yourself is to lose yourself in the service of others.",

];

// const quotes = [
//     "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
//     "Believe you can and you're halfway there. - Theodore Roosevelt",
//     "Your limitation—it's only your imagination. -  ",
//     "Push yourself, because no one else is going to do it for you. -  ",
//     "Great things never come from comfort zones. - Roy T. Bennett",
//     "Success doesn’t just find you. You have to go out and get it. -  ",
//     "Dream it. Wish it. Do it. -  ",
//     "The harder you work for something, the greater you’ll feel when you achieve it. -  ",
//     "Don’t stop when you’re tired. Stop when you’re done. - Marilyn Monroe",
//     "Wake up with determination. Go to bed with satisfaction. - George Lorimer",
//     "Do something today that your future self will thank you for. - Sean Patrick Flanery",
//     "Little things make big days. - John Wooden",
//     "It’s going to be hard, but hard does not mean impossible. -  ",
// ];


// Function to get a random quote
function getRandomQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return "Daily Thought: \"" + quotes[randomIndex] + "\"";
}

// Display a random quote on page load
document.addEventListener('DOMContentLoaded', function() {
    const quoteElement = document.getElementById('quote');
    quoteElement.textContent = getRandomQuote();
});

// Function to fetch a random quote from Quotable API
// Function to fetch a random motivational/inspirational quote from ZenQuotes API
// Function to fetch a random quote from ZenQuotes via CORS proxy with headers
// const fetchRandomQuote = async () => {
//     try {
//         const response = await fetch('https://cors-anywhere.herokuapp.com/https://zenquotes.io/api/random', {
//             headers: {
//                 'Origin': 'https://rkr2025.github.io', // Your GitHub Pages origin
//                 'X-Requested-With': 'XMLHttpRequest' // Optional, but satisfies proxy requirement
//             }
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         const [data] = await response.json(); // ZenQuotes returns an array with one quote
//         return `Daily Thought: "${data.q}" — ${data.a || 'Unknown'}`;
//     } catch (error) {
//         console.error('Failed to fetch quote:', error.message);
//         return getRandomQuote(); // Fallback to local quotes
//     }
// };

// // Display a random quote on page load
// document.addEventListener('DOMContentLoaded', async () => {
//     const quoteElement = document.getElementById('quote');
//     if (quoteElement) {
//         quoteElement.textContent = await fetchRandomQuote();
//     } else {
//         console.warn('Element with ID "quote" not found.');
//     }
// });

// // Optional: Refresh quote every 30 seconds
// setInterval(async () => {
//     const quoteElement = document.getElementById('quote');
//     if (quoteElement) {
//         quoteElement.textContent = await fetchRandomQuote();
//     }
// }, 30000);
