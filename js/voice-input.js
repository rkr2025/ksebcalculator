// Voice-to-Number Input Assistant (js/voice-input.js) -- lets the user speak
// a number aloud, in English or Malayalam, using the browser's built-in Web
// Speech API, and have it typed into whichever numeric input field they
// last focused on the form. This is purely a convenience layer on top of
// ordinary <input type="number"> fields: it only ever sets .value and
// dispatches the same 'input'/'change' events a real keystroke would, so
// every existing calculation/validation listener elsewhere in the app
// reacts exactly as if the user had typed the number themselves -- no
// numeric field anywhere in the app needs to know this feature exists.
//
// Entirely optional and self-hiding: if the browser has no SpeechRecognition
// support (e.g. Firefox, or Safari on some versions), initVoiceInput()
// simply leaves the widget's `display: none` alone and returns -- nothing
// else in the app is affected either way.

const LANG_STORAGE_KEY = 'voiceInputLang';
const ENABLED_STORAGE_KEY = 'voiceAssistantEnabled';
const DEFAULT_LANG = 'en-IN';

// English spoken-number words -> value, used only as a fallback for when
// the recognizer returns a spelled-out number instead of digits (this
// varies by browser/OS speech-recognition backend). Malayalam intentionally
// has no equivalent word-parser here: Chrome's speech-to-text already
// normalizes spoken numerals to digit form in the transcript for Malayalam
// (and most other supported languages) in practice, so the digit-regex path
// in extractNumber() below covers it -- hand-rolling a full Malayalam
// number-word grammar would be a large surface area to get right without
// any way to test it against real speech in this environment.
const ONES = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

// Parses a spelled-out English number phrase like "one hundred fifty point
// five" -> 150.5, or "minus twelve" -> -12. Returns null if the phrase
// doesn't parse as a number at all (the caller then treats it as "no number
// found" rather than guessing).
export function wordsToNumber(text) {
    const words = text.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (!words.length) return null;

    let negative = false;
    let i = 0;
    if (words[i] === 'minus' || words[i] === 'negative') { negative = true; i++; }

    let total = 0;
    let current = 0;
    let matchedAny = false;

    for (; i < words.length; i++) {
        const w = words[i];
        if (w === 'point' || w === 'decimal') break; // fractional part handled below
        if (w === 'and') continue;
        if (w in ONES) { current += ONES[w]; matchedAny = true; continue; }
        if (w in TENS) { current += TENS[w]; matchedAny = true; continue; }
        if (w === 'hundred') { current = (current || 1) * 100; matchedAny = true; continue; }
        if (w === 'thousand') { total += (current || 1) * 1000; current = 0; matchedAny = true; continue; }
        return null; // an unrecognized word anywhere means this isn't a clean spelled-out number
    }
    if (!matchedAny) return null;
    total += current;

    const pointIdx = words.includes('point') ? words.indexOf('point') : words.indexOf('decimal');
    if (pointIdx !== -1) {
        let fracDigits = '';
        for (const fw of words.slice(pointIdx + 1)) {
            if (fw in ONES && ONES[fw] <= 9) fracDigits += String(ONES[fw]);
            else break; // stop at the first word that isn't a single digit; keep the whole part found so far
        }
        if (fracDigits) total = parseFloat(`${total}.${fracDigits}`);
    }

    return negative ? -total : total;
}

// Pulls a single numeric value out of a raw speech transcript. Tries a
// plain digit match first (covers both languages in practice, and also
// sentences like "it's one fifty" transcribed as "it's 150"), then falls
// back to the English word-parser above. Returns null if no number could
// be found at all.
export function extractNumber(transcript) {
    if (!transcript) return null;
    const text = transcript.trim().toLowerCase();

    const digitMatch = text.match(/-?\d+(?:\.\d+)?/);
    if (digitMatch) return parseFloat(digitMatch[0]);

    return wordsToNumber(text);
}

function getSpeechRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function initVoiceInput() {
    const widget = document.getElementById('voiceInputWidget');
    if (!widget) return;

    const enableToggle = document.getElementById('voiceAssistantEnableToggle');

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
        // Not supported by this browser at all -- the widget stays hidden
        // regardless of the stored preference (see the file-level comment
        // above), and the Admin Option toggle is disabled rather than
        // removed, so it's still clear *why* voice input isn't available
        // here instead of the option just silently vanishing.
        if (enableToggle) {
            enableToggle.disabled = true;
            enableToggle.closest('.reading-mode-toggle').title = 'Voice input is not supported in this browser (try Chrome or Edge).';
        }
        return;
    }

    const micBtn = document.getElementById('voiceMicBtn');
    const statusEl = document.getElementById('voiceInputStatus');
    const langButtons = Array.from(document.querySelectorAll('.voice-lang-btn'));

    // Opt-in and off by default -- most users never need this, so it stays
    // out of the way until deliberately turned on via Admin Options.
    let enabled = localStorage.getItem(ENABLED_STORAGE_KEY) === 'true';
    if (enableToggle) enableToggle.checked = enabled;

    // Defined here (used by the toggle's change listener below) but not
    // invoked until the very end of this function, once stopListening() has
    // actually been declared -- see the closing applyEnabledState() call.
    function applyEnabledState() {
        widget.style.display = enabled ? '' : 'none';
        if (!enabled) stopListening();
    }

    if (enableToggle) {
        enableToggle.addEventListener('change', () => {
            enabled = enableToggle.checked;
            localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
            applyEnabledState();
        });
    }

    let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || DEFAULT_LANG;
    if (!langButtons.some((b) => b.dataset.lang === currentLang)) currentLang = DEFAULT_LANG;

    function applyLangButtons() {
        langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === currentLang)));
    }
    applyLangButtons();

    langButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            currentLang = btn.dataset.lang;
            localStorage.setItem(LANG_STORAGE_KEY, currentLang);
            applyLangButtons();
        });
    });

    // Tracks the most recently focused numeric field anywhere on the page --
    // delegated on document (rather than bound per-field at setup time) so
    // it also picks up fields inside dynamically-added Wheeling site cards
    // that don't exist yet when this runs. This is what "last selected
    // field" means for this feature.
    let targetField = null;
    document.addEventListener('focusin', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
            targetField = e.target;
        }
    });

    let statusHideTimer = null;
    function showStatus(message, autoHideMs) {
        statusEl.textContent = message;
        statusEl.classList.add('is-visible');
        if (statusHideTimer) clearTimeout(statusHideTimer);
        statusHideTimer = autoHideMs ? setTimeout(() => statusEl.classList.remove('is-visible'), autoHideMs) : null;
    }

    function flashTarget(el) {
        el.classList.remove('voice-target-flash');
        void el.offsetWidth; // force reflow so the animation restarts if the same field is filled twice in a row
        el.classList.add('voice-target-flash');
    }

    let recognition = null;
    let listening = false;

    function stopListening() {
        if (recognition && listening) recognition.stop();
    }

    function startListening() {
        if (!targetField || !document.body.contains(targetField)) {
            showStatus('Tap a number field first, then tap 🎤 to speak a value.', 3200);
            return;
        }

        recognition = new SpeechRecognitionCtor();
        recognition.lang = currentLang;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            listening = true;
            micBtn.classList.add('is-listening');
            showStatus(currentLang === 'ml-IN' ? 'കേൾക്കുന്നു...' : 'Listening…');
        };

        recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            if (!result.isFinal) {
                showStatus(`"${transcript}"`);
                return;
            }
            const value = extractNumber(transcript);
            if (value == null || !Number.isFinite(value)) {
                showStatus(`Didn't catch a number in "${transcript}" — try again.`, 3200);
                return;
            }
            if (!document.body.contains(targetField)) {
                showStatus('That field is no longer on the page — tap another field and try again.', 3200);
                return;
            }
            targetField.value = value;
            targetField.dispatchEvent(new Event('input', { bubbles: true }));
            targetField.dispatchEvent(new Event('change', { bubbles: true }));
            flashTarget(targetField);
            showStatus(`✓ Set to ${value}`, 2200);
        };

        recognition.onerror = (event) => {
            const messages = {
                'not-allowed': 'Microphone access was denied — allow it in your browser settings to use voice input.',
                'no-speech': "Didn't hear anything — try again.",
                'audio-capture': 'No microphone found.',
                network: 'Voice recognition needs an internet connection.',
            };
            showStatus(messages[event.error] || 'Voice input error — please try again.', 3200);
        };

        recognition.onend = () => {
            listening = false;
            micBtn.classList.remove('is-listening');
        };

        recognition.start();
    }

    micBtn.addEventListener('click', () => {
        if (listening) stopListening();
        else startListening();
    });

    applyEnabledState();
}
