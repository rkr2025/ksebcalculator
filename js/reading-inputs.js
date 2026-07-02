// Initial/Final meter-reading toggle for the ToD Solar Generation and KSEB
// Net Meter Consumption field groups (js/reading-inputs.js). DOM-only --
// no bill math here. When a group's toggle is on, this keeps the real
// input (e.g. #solarNormal, the one readFormInputs() in main.js reads) in
// sync with Final - Initial, so the rest of the app never has to know
// which entry mode the user picked.

function clampNonNegative(n) {
    return n > 0 ? n : 0;
}

function setupReadingGroup(toggleId, directContainerId, readingContainerId, fieldIds) {
    const toggle = document.getElementById(toggleId);
    const directContainer = document.getElementById(directContainerId);
    const readingContainer = document.getElementById(readingContainerId);
    if (!toggle || !directContainer || !readingContainer) return () => {};

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
        if (useReadings) {
            fieldIds.forEach(updateComputed);
        }
    }

    toggle.addEventListener('change', applyMode);
    applyMode();

    return function resetGroup() {
        toggle.checked = false;
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
        ['solarNormal', 'solarOffPeak', 'solarPeak']);
    const resetImport = setupReadingGroup('importReadingModeToggle', 'importDirectFields', 'importReadingFields',
        ['importNormal', 'importOffPeak', 'importPeak']);
    const resetExport = setupReadingGroup('exportReadingModeToggle', 'exportDirectFields', 'exportReadingFields',
        ['exportNormal', 'exportOffPeak', 'exportPeak']);

    return function resetAllReadingGroups() {
        resetSolar();
        resetImport();
        resetExport();
    };
}
