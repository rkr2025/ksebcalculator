// Initial/Final meter-reading toggle for the ToD Solar Generation and KSEB
// Net Meter Consumption field groups (js/reading-inputs.js). DOM-only --
// no bill math here. When a group's toggle is on, this keeps the real
// input (e.g. #solarNormal, the one readFormInputs() in main.js reads) in
// sync with Final - Initial, so the rest of the app never has to know
// which entry mode the user picked.

function clampNonNegative(n) {
    return n > 0 ? n : 0;
}

// Exported so wheeling-ui.js can wire up the same Initial/Final toggle for
// dynamically-created wheeling-site TOD field groups, which don't exist at
// page load and so can't go through initReadingGroups() below.
//
// `orderToggleId` is optional (wheeling-ui.js's per-site groups don't pass
// one) -- when given, it's a per-GROUP "Enter Present Reading first"
// switch, defaulting on, shown only while this group's own reading mode is
// enabled (found via its closest .reading-order-toggle row). Purely visual:
// flips a class on readingContainer that styles.css uses to reverse the
// .reading-pair boxes -- the Previous/Present field IDs underneath never
// change, so nothing else in the app needs to know this happened.
export function setupReadingGroup(toggleId, directContainerId, readingContainerId, fieldIds, orderToggleId) {
    const toggle = document.getElementById(toggleId);
    const directContainer = document.getElementById(directContainerId);
    const readingContainer = document.getElementById(readingContainerId);
    if (!toggle || !directContainer || !readingContainer) return () => {};

    const orderToggle = orderToggleId ? document.getElementById(orderToggleId) : null;
    const orderRow = orderToggle ? orderToggle.closest('.reading-order-toggle') : null;
    const orderLabel = orderRow ? orderRow.querySelector(':scope > span') : null;

    function applyOrder() {
        if (!orderToggle) return;
        readingContainer.classList.toggle('reading-order-swapped', orderToggle.checked);
        if (orderLabel) {
            orderLabel.innerHTML = orderToggle.checked
                ? 'Enter <strong>Present</strong> Reading first'
                : 'Enter <strong>Previous</strong> Reading first';
        }
    }
    if (orderToggle) {
        orderToggle.addEventListener('change', applyOrder);
        applyOrder();
    }

    function updateComputed(fieldId) {
        const initialInput = document.getElementById(`${fieldId}_initial`);
        const finalInput = document.getElementById(`${fieldId}_final`);
        const computedEl = document.getElementById(`${fieldId}_computed`);
        const warnEl = document.getElementById(`${fieldId}_warn`);

        const initial = parseFloat(initialInput.value) || 0;
        const final = parseFloat(finalInput.value) || 0;
        const diff = clampNonNegative(final - initial);

        document.getElementById(fieldId).value = diff.toFixed(2);
        if (computedEl) computedEl.textContent = `= ${diff.toFixed(2)} kWh`;
        if (warnEl) warnEl.style.display = finalInput.value !== '' && final < initial ? 'block' : 'none';
    }

    fieldIds.forEach((fieldId) => {
        document.getElementById(`${fieldId}_initial`).addEventListener('input', () => updateComputed(fieldId));
        document.getElementById(`${fieldId}_final`).addEventListener('input', () => updateComputed(fieldId));
    });

    function applyMode() {
        const useReadings = toggle.checked;
        directContainer.style.display = useReadings ? 'none' : 'grid';
        readingContainer.style.display = useReadings ? 'grid' : 'none';
        if (orderRow) orderRow.style.display = useReadings ? 'flex' : 'none';
        if (useReadings) {
            fieldIds.forEach(updateComputed);
        }
    }

    toggle.addEventListener('change', applyMode);
    applyMode();

    return function resetGroup() {
        toggle.checked = false;
        if (orderToggle) {
            orderToggle.checked = true; // back to the default: Present Reading first
            applyOrder();
        }
        fieldIds.forEach((fieldId) => {
            document.getElementById(`${fieldId}_initial`).value = '';
            document.getElementById(`${fieldId}_final`).value = '';
            const warnEl = document.getElementById(`${fieldId}_warn`);
            if (warnEl) warnEl.style.display = 'none';
        });
        applyMode();
    };
}

export function initReadingGroups() {
    const resetSolar = setupReadingGroup('solarReadingModeToggle', 'solarDirectFields', 'solarReadingFields',
        ['solarNormal', 'solarOffPeak', 'solarPeak'], 'solarReadingOrderToggle');
    const resetImport = setupReadingGroup('importReadingModeToggle', 'importDirectFields', 'importReadingFields',
        ['importNormal', 'importOffPeak', 'importPeak'], 'importReadingOrderToggle');
    const resetExport = setupReadingGroup('exportReadingModeToggle', 'exportDirectFields', 'exportReadingFields',
        ['exportNormal', 'exportOffPeak', 'exportPeak'], 'exportReadingOrderToggle');
    const resetSolarGen = setupReadingGroup('solarGenReadingModeToggle', 'solarGenDirectFields', 'solarGenReadingFields',
        ['solarGeneration'], 'solarGenReadingOrderToggle');
    const resetNetMeter = setupReadingGroup('netMeterReadingModeToggle', 'netMeterDirectFields', 'netMeterReadingFields',
        ['import', 'export'], 'netMeterReadingOrderToggle');

    // ToD Import and Export are read off the same net meter at the same
    // time, so there's rarely a reason to enter one from Previous/Present
    // readings and the other as a plain total -- turning Import's reading
    // mode on also turns Export's on (one-directional: this only follows
    // Import -> Export, so a user who wants Export back in direct-entry
    // mode can still switch it off again independently afterward).
    const importModeToggle = document.getElementById('importReadingModeToggle');
    const exportModeToggle = document.getElementById('exportReadingModeToggle');
    if (importModeToggle && exportModeToggle) {
        importModeToggle.addEventListener('change', () => {
            if (importModeToggle.checked && !exportModeToggle.checked) {
                exportModeToggle.checked = true;
                exportModeToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    // Solar Generation's reading-mode switch drives KSEB NetMeter Info's the
    // same way in both directions -- turning Solar's ON also turns NetMeter
    // Info's ON (which for the ToD pair then cascades on to Export via the
    // rule above), and turning Solar's OFF also turns NetMeter Info's OFF
    // (Import and Export both explicitly, since the on-cascade above has no
    // matching off-cascade of its own). One-directional from Solar outward
    // only: changing NetMeter Info's toggles directly afterward doesn't
    // reach back and change Solar's. Wired for both the non-ToD pair
    // (solarGenReadingModeToggle -> netMeterReadingModeToggle) and the ToD
    // pair (solarReadingModeToggle -> importReadingModeToggle + exportReadingModeToggle).
    const solarGenModeToggle = document.getElementById('solarGenReadingModeToggle');
    const netMeterModeToggle = document.getElementById('netMeterReadingModeToggle');
    if (solarGenModeToggle && netMeterModeToggle) {
        solarGenModeToggle.addEventListener('change', () => {
            if (solarGenModeToggle.checked !== netMeterModeToggle.checked) {
                netMeterModeToggle.checked = solarGenModeToggle.checked;
                netMeterModeToggle.dispatchEvent(new Event('change'));
            }
        });
    }
    const solarModeToggle = document.getElementById('solarReadingModeToggle');
    if (solarModeToggle && importModeToggle) {
        solarModeToggle.addEventListener('change', () => {
            if (solarModeToggle.checked !== importModeToggle.checked) {
                importModeToggle.checked = solarModeToggle.checked;
                importModeToggle.dispatchEvent(new Event('change'));
            }
            if (!solarModeToggle.checked && exportModeToggle && exportModeToggle.checked) {
                exportModeToggle.checked = false;
                exportModeToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    // Solar Generation's "Enter Present Reading first" order switch drives
    // KSEB NetMeter Info's the same way too, fully both directions -- unlike
    // the mode toggle above, there's no asymmetry here (it's just a display
    // preference, not something that hides/reveals fields), so ON and OFF
    // are handled identically. One-directional from Solar outward only,
    // same as the mode toggle. Wired for both the non-ToD pair
    // (solarGenReadingOrderToggle -> netMeterReadingOrderToggle) and the ToD
    // pair (solarReadingOrderToggle -> importReadingOrderToggle + exportReadingOrderToggle).
    const solarGenOrderToggle = document.getElementById('solarGenReadingOrderToggle');
    const netMeterOrderToggle = document.getElementById('netMeterReadingOrderToggle');
    if (solarGenOrderToggle && netMeterOrderToggle) {
        solarGenOrderToggle.addEventListener('change', () => {
            if (solarGenOrderToggle.checked !== netMeterOrderToggle.checked) {
                netMeterOrderToggle.checked = solarGenOrderToggle.checked;
                netMeterOrderToggle.dispatchEvent(new Event('change'));
            }
        });
    }
    const solarOrderToggle = document.getElementById('solarReadingOrderToggle');
    const importOrderToggle = document.getElementById('importReadingOrderToggle');
    const exportOrderToggle = document.getElementById('exportReadingOrderToggle');
    if (solarOrderToggle && importOrderToggle && exportOrderToggle) {
        solarOrderToggle.addEventListener('change', () => {
            if (solarOrderToggle.checked !== importOrderToggle.checked) {
                importOrderToggle.checked = solarOrderToggle.checked;
                importOrderToggle.dispatchEvent(new Event('change'));
            }
            if (solarOrderToggle.checked !== exportOrderToggle.checked) {
                exportOrderToggle.checked = solarOrderToggle.checked;
                exportOrderToggle.dispatchEvent(new Event('change'));
            }
        });
    }

    return function resetAllReadingGroups() {
        resetSolar();
        resetImport();
        resetExport();
        resetSolarGen();
        resetNetMeter();
    };
}
