// DOM-only widget for the Wheeling card (js/wheeling-ui.js): the enable
// toggle plus dynamic add/remove site blocks. Not part of the
// tariff-rates -> calculator -> render pipeline -- this only reads/writes
// form fields and hands main.js a plain array of site objects shaped for
// wheeling-calculator.js's computeWheelingResult().
//
// Each site's TOD Normal/Off Peak/Peak trio reuses the same Initial/Final
// meter-reading toggle as the main form's Solar/Import/Export groups (see
// reading-inputs.js) -- wired up per-site here since these field IDs don't
// exist until a site block is added at runtime.

import { setupReadingGroup } from './reading-inputs.js';

// Reads the Admin Option loss-percentage fields (index.html) so a newly
// added site's dropdown labels show whatever's actually configured, not the
// hardcoded 4.99%/7.14% KSEB defaults -- falls back to those defaults if the
// fields are missing or hold something unparseable.
function currentLossPct(id, fallback) {
    const el = document.getElementById(id);
    const val = el ? parseFloat(el.value) : NaN;
    return Number.isFinite(val) ? val : fallback;
}

function siteTemplate(n, sameLossLabel, diffLossLabel) {
    return `
        <div class="wheeling-site" data-site-index="${n}">
            <div class="wheeling-site-header">
                <span class="sub-row-badge">🔌 Site ${n}</span>
                <button type="button" class="wheeling-remove-btn" data-remove="${n}">Remove</button>
            </div>
            <div class="field-grid field-grid--2">
                <div class="field">
                    <label for="wheelSiteName-${n}">Site Name (optional)</label>
                    <input type="text" id="wheelSiteName-${n}" placeholder="e.g. Shop, Relative's home">
                </div>
                <div class="field">
                    <label for="wheelSiteCategory-${n}">Connection Type</label>
                    <select id="wheelSiteCategory-${n}">
                        <option value="LT1">LT1 (Domestic)</option>
                        <option value="LT7A">LT7A (Commercial)</option>
                        <option value="LT7B">LT7B (Commercial)</option>
                    </select>
                </div>
            </div>
            <div class="field-grid field-grid--2" style="margin-top: 10px;">
                <div class="field">
                    <label for="wheelSiteTransformer-${n}">Same Transformer as Generation Site?</label>
                    <select id="wheelSiteTransformer-${n}" class="wheel-site-transformer-select">
                        <option value="Yes" class="wheel-loss-option-same">Yes (${sameLossLabel}% loss)</option>
                        <option value="No" class="wheel-loss-option-diff">No (${diffLossLabel}% loss)</option>
                    </select>
                </div>
                <div class="field">
                    <label for="wheelSiteTod-${n}">Has ToD Meter?</label>
                    <select id="wheelSiteTod-${n}">
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                    </select>
                </div>
            </div>
            <div class="field-grid" id="wheelSiteDirect-${n}" style="margin-top: 10px;">
                <div class="field">
                    <label for="wheelSiteUnits-${n}">Consumed Units (kWh)</label>
                    <input type="number" id="wheelSiteUnits-${n}" value="0" min="0">
                </div>
            </div>
            <div id="wheelSiteTodFields-${n}" style="display: none; margin-top: 10px;">
                <div class="reading-mode-toggle">
                    <label class="switch">
                        <input type="checkbox" id="wheelSiteTodModeToggle-${n}">
                        <span class="switch-slider"></span>
                    </label>
                    <span>Calculate from Initial &amp; Final meter readings</span>
                </div>

                <div class="field-grid" id="wheelSiteTodDirect-${n}">
                    <div class="field">
                        <label>Normal <span class="field-tag">6am–6pm</span></label>
                        <input type="number" id="wheelSiteNormal-${n}" value="0" min="0">
                    </div>
                    <div class="field">
                        <label>Off Peak <span class="field-tag">10pm–6am</span></label>
                        <input type="number" id="wheelSiteOffPeak-${n}" value="0" min="0">
                    </div>
                    <div class="field">
                        <label>Peak <span class="field-tag">6pm–10pm</span></label>
                        <input type="number" id="wheelSitePeak-${n}" value="0" min="0">
                    </div>
                </div>

                <div class="field-grid" id="wheelSiteTodReading-${n}" style="display: none;">
                    <div class="field">
                        <label>Normal <span class="field-tag">6am–6pm</span></label>
                        <div class="reading-pair">
                            <input type="number" id="wheelSiteNormal-${n}_initial" placeholder="Initial" min="0">
                            <input type="number" id="wheelSiteNormal-${n}_final" placeholder="Final" min="0">
                        </div>
                        <div class="reading-computed" id="wheelSiteNormal-${n}_computed">= 0.00 kWh</div>
                        <div class="reading-warn" id="wheelSiteNormal-${n}_warn">Final should be ≥ Initial</div>
                    </div>
                    <div class="field">
                        <label>Off Peak <span class="field-tag">10pm–6am</span></label>
                        <div class="reading-pair">
                            <input type="number" id="wheelSiteOffPeak-${n}_initial" placeholder="Initial" min="0">
                            <input type="number" id="wheelSiteOffPeak-${n}_final" placeholder="Final" min="0">
                        </div>
                        <div class="reading-computed" id="wheelSiteOffPeak-${n}_computed">= 0.00 kWh</div>
                        <div class="reading-warn" id="wheelSiteOffPeak-${n}_warn">Final should be ≥ Initial</div>
                    </div>
                    <div class="field">
                        <label>Peak <span class="field-tag">6pm–10pm</span></label>
                        <div class="reading-pair">
                            <input type="number" id="wheelSitePeak-${n}_initial" placeholder="Initial" min="0">
                            <input type="number" id="wheelSitePeak-${n}_final" placeholder="Final" min="0">
                        </div>
                        <div class="reading-computed" id="wheelSitePeak-${n}_computed">= 0.00 kWh</div>
                        <div class="reading-warn" id="wheelSitePeak-${n}_warn">Final should be ≥ Initial</div>
                    </div>
                </div>
            </div>
        </div>`;
}

export function initWheelingUI() {
    const isWheelingSelect = document.getElementById('isWheeling');
    const wrapper = document.getElementById('wheelingSitesWrapper');
    const container = document.getElementById('wheelingSitesContainer');
    const addButton = document.getElementById('addWheelingSiteButton');
    if (!isWheelingSelect || !wrapper || !container || !addButton) {
        return { isEnabled: () => false, getSites: () => [], reset: () => {} };
    }

    let siteCounter = 0;

    function addSite() {
        siteCounter += 1;
        const n = siteCounter;
        const sameLossLabel = currentLossPct('wheelSameTransformerLoss', 4.99);
        const diffLossLabel = currentLossPct('wheelDiffTransformerLoss', 7.14);
        const wrapperEl = document.createElement('div');
        wrapperEl.innerHTML = siteTemplate(n, sameLossLabel, diffLossLabel).trim();
        const siteEl = wrapperEl.firstElementChild;
        container.appendChild(siteEl);

        const todSelect = document.getElementById(`wheelSiteTod-${n}`);
        const directFields = document.getElementById(`wheelSiteDirect-${n}`);
        const todFields = document.getElementById(`wheelSiteTodFields-${n}`);
        todSelect.addEventListener('change', () => {
            const isTod = todSelect.value === 'Yes';
            directFields.style.display = isTod ? 'none' : 'grid';
            todFields.style.display = isTod ? 'block' : 'none';
        });

        setupReadingGroup(`wheelSiteTodModeToggle-${n}`, `wheelSiteTodDirect-${n}`, `wheelSiteTodReading-${n}`,
            [`wheelSiteNormal-${n}`, `wheelSiteOffPeak-${n}`, `wheelSitePeak-${n}`]);

        siteEl.querySelector('.wheeling-remove-btn').addEventListener('click', () => {
            siteEl.remove();
        });
    }

    function toggleWheelingVisibility() {
        const enabled = isWheelingSelect.value === 'Yes';
        wrapper.style.display = enabled ? 'block' : 'none';
        if (enabled && container.children.length === 0) {
            addSite();
        }
    }

    isWheelingSelect.addEventListener('change', toggleWheelingVisibility);
    addButton.addEventListener('click', addSite);

    // Keep already-added sites' dropdown labels honest if the Admin Option
    // loss percentages are edited after those sites were created.
    function syncLossLabels() {
        const sameLossLabel = currentLossPct('wheelSameTransformerLoss', 4.99);
        const diffLossLabel = currentLossPct('wheelDiffTransformerLoss', 7.14);
        container.querySelectorAll('.wheel-loss-option-same').forEach((opt) => {
            opt.textContent = `Yes (${sameLossLabel}% loss)`;
        });
        container.querySelectorAll('.wheel-loss-option-diff').forEach((opt) => {
            opt.textContent = `No (${diffLossLabel}% loss)`;
        });
    }
    const sameLossInput = document.getElementById('wheelSameTransformerLoss');
    const diffLossInput = document.getElementById('wheelDiffTransformerLoss');
    if (sameLossInput) sameLossInput.addEventListener('input', syncLossLabels);
    if (diffLossInput) diffLossInput.addEventListener('input', syncLossLabels);

    function num(id) {
        const el = document.getElementById(id);
        return el ? Math.max(parseFloat(el.value) || 0, 0) : 0;
    }

    function isEnabled() {
        return isWheelingSelect.value === 'Yes' && container.children.length > 0;
    }

    function getSites() {
        return Array.from(container.children).map((siteEl) => {
            const n = siteEl.dataset.siteIndex;
            const todAvailable = document.getElementById(`wheelSiteTod-${n}`).value === 'Yes';
            return {
                name: document.getElementById(`wheelSiteName-${n}`).value.trim(),
                category: document.getElementById(`wheelSiteCategory-${n}`).value,
                sameTransformer: document.getElementById(`wheelSiteTransformer-${n}`).value === 'Yes',
                todAvailable,
                units: num(`wheelSiteUnits-${n}`),
                todNormal: num(`wheelSiteNormal-${n}`),
                todPeak: num(`wheelSitePeak-${n}`),
                todOffPeak: num(`wheelSiteOffPeak-${n}`),
            };
        });
    }

    function reset() {
        isWheelingSelect.value = 'No';
        container.innerHTML = '';
        siteCounter = 0;
        wrapper.style.display = 'none';
    }

    return { isEnabled, getSites, reset };
}
