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
// Single-digit words only, used by parseDigitSequence() below -- a meter
// reading read out digit-by-digit ("one five zero") needs each word treated
// as one character of the result ("150"), which is a completely different
// interpretation from the magnitude-word grammar in wordsToNumber() (which
// would read the same three words as 1 + 5 + 0 = 6).
const DIGIT_WORDS = { zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9' };

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

// Meter readings are very often read out digit-by-digit ("one five zero",
// or literally "1 5 0" when the recognizer hears a pause between each
// digit) rather than as one fluent number -- both languages exhibit this,
// since it's simply a more careful/deliberate way to read out a long
// number aloud. That pattern needs its own parser: a plain digit-run regex
// only ever grabs the *first* space-separated chunk and silently drops the
// rest (so "1 5 0" would come out as just "1"), and the magnitude-word
// grammar in wordsToNumber() would (wrongly) sum "one five zero" as
// 1 + 5 + 0 = 6 instead of reading it as the digit sequence "150". This
// walks the whole transcript and, as long as *every* token is a single
// digit/digit-word (with at most one decimal-point marker and an optional
// leading minus), concatenates them into one number; it bails out (returns
// null) the moment it sees anything else, so it never misfires on an
// ordinary sentence or a spelled-out compound number -- those are left to
// the other two strategies in extractNumber() below.
function parseDigitSequence(text) {
    const tokens = text.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    if (tokens.length < 2) return null; // a lone token is handled by the plain digit-run/word-number paths instead

    let negative = false;
    let i = 0;
    if (tokens[i] === 'minus' || tokens[i] === 'negative' || tokens[i] === '-') { negative = true; i++; }

    let intPart = '';
    let fracPart = '';
    let sawPoint = false;
    let sawAnyDigit = false;

    for (; i < tokens.length; i++) {
        const t = tokens[i];
        if (t === 'point' || t === 'decimal' || t === '.') {
            if (sawPoint) return null; // a second decimal marker doesn't make sense as a plain digit sequence
            sawPoint = true;
            continue;
        }
        let digits;
        if (/^\d+$/.test(t)) digits = t; // the recognizer grouped a few consecutive digits into one chunk, e.g. "12"
        else if (t in DIGIT_WORDS) digits = DIGIT_WORDS[t];
        else return null; // a tens/hundred/thousand word or unrelated speech -- not a plain digit sequence

        if (sawPoint) fracPart += digits; else intPart += digits;
        sawAnyDigit = true;
    }
    if (!sawAnyDigit || !intPart) return null;

    const value = parseFloat(fracPart ? `${intPart}.${fracPart}` : intPart);
    return negative ? -value : value;
}

// Pulls a single numeric value out of a raw speech transcript, trying three
// strategies in order: a digit-by-digit reading (see parseDigitSequence()
// above), then a single coherent digit run (covers both languages in
// practice, and sentences like "it's 150 units" where only part of the
// transcript is the number), then spelled-out English magnitude words
// ("one hundred fifty"). Returns null if none of them find a number.
export function extractNumber(transcript) {
    if (!transcript) return null;
    const text = transcript.trim().toLowerCase();
    if (!text) return null;

    const digitSequence = parseDigitSequence(text);
    if (digitSequence != null) return digitSequence;

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
    const offBtn = document.getElementById('voiceOffBtn');
    const statusEl = document.getElementById('voiceInputStatus');
    const langButtons = Array.from(document.querySelectorAll('.voice-lang-btn'));

    // Off by default on *every* page load -- deliberately not remembered
    // across reloads (no localStorage read/write for this flag at all), so
    // the user has to explicitly turn it on again each time they load the
    // page, rather than it silently staying on forever once enabled once.
    let enabled = false;
    if (enableToggle) enableToggle.checked = false;

    // Admin Options is deliberately the *only* place that turns the feature
    // on/off for the rest of this page load: the ✕ button on the popover
    // itself just dismisses that one popup (so the user can type the value
    // into the field by hand instead, without the popover sitting there) --
    // it does NOT flip this setting. A user who dismisses the popup on one
    // field still sees it on the next number field they tap, exactly as if
    // they'd never touched the ✕ at all.
    function setEnabled(next) {
        enabled = next;
        if (enableToggle) enableToggle.checked = enabled;
        applyEnabledState();
    }

    // Defined here (used below) but not invoked until the very end of this
    // function, once stopListening()/hideWidget() have actually been
    // declared -- see the closing applyEnabledState() call.
    function applyEnabledState() {
        if (!enabled) {
            stopListening();
            hideWidget();
        } else if (document.activeElement instanceof HTMLInputElement && document.activeElement.type === 'number') {
            // Flipping the setting on while a number field already has
            // focus should show the popover immediately, not require an
            // extra blur+refocus.
            showWidgetFor(document.activeElement);
        }
    }

    if (enableToggle) {
        enableToggle.addEventListener('change', () => setEnabled(enableToggle.checked));
    }
    if (offBtn) {
        // Pressing a button normally steals focus away from whatever was
        // focused before (here, the number field) the instant the pointer
        // goes down -- before the click handler even runs. Blocking that
        // default action keeps the field focused (and its virtual keyboard
        // open on mobile) through the whole interaction, so the field is
        // immediately ready to type into with no visible focus-loss flicker
        // and no need to explicitly refocus it afterward.
        offBtn.addEventListener('pointerdown', (e) => e.preventDefault());

        // Dismiss-only: stop any in-progress listening and hide this one
        // popup, but leave the `enabled` flag (and the Admin Options
        // checkbox) untouched -- see the comment above `enabled` for why.
        // Since the field never lost focus (see above), there's nothing
        // left to hand back to it -- it was ready to type into the whole
        // time and stays that way.
        offBtn.addEventListener('click', () => {
            stopListening();
            hideWidget();
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

    // ---- Positioning: the popover follows whichever numeric field is
    // currently focused, rather than sitting fixed in a page corner (which
    // on a long form is often far from the field actually being edited, and
    // needs constant scrolling back and forth to reach). Delegated focus
    // tracking on document (rather than bound per-field at setup time) also
    // picks up fields inside dynamically-added Wheeling site cards that
    // don't exist yet when this runs.
    let targetField = null;
    let hideTimer = null;
    let pointerInsideWidget = false;

    function positionWidgetNear(field) {
        const rect = field.getBoundingClientRect();
        const margin = 8;
        const approxWidth = 190; // wide enough for status bubble + controls row
        const approxHeight = 50;
        const narrow = window.innerWidth < 480;

        let left;
        let top;
        if (narrow) {
            // Little horizontal room on phones -- sit below the field,
            // left-aligned with it, rather than beside it.
            left = rect.left;
            top = rect.bottom + margin;
        } else {
            left = rect.right + margin;
            top = rect.top + rect.height / 2 - 21;
            if (left + approxWidth > window.innerWidth - margin) {
                left = rect.left - approxWidth - margin; // not enough room to the right -- flip to the left of the field
            }
        }
        left = Math.min(Math.max(left, margin), window.innerWidth - approxWidth - margin);
        top = Math.min(Math.max(top, margin), window.innerHeight - approxHeight - margin);

        widget.style.left = `${left}px`;
        widget.style.top = `${top}px`;
    }

    function showWidgetFor(field) {
        if (!enabled) return;
        targetField = field;
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        positionWidgetNear(field);
        widget.style.display = '';
    }

    function hideWidget() {
        widget.style.display = 'none';
    }

    document.addEventListener('focusin', (e) => {
        if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
            showWidgetFor(e.target);
        }
    });

    document.addEventListener('focusout', (e) => {
        if (!(e.target instanceof HTMLInputElement) || e.target.type !== 'number') return;
        // Delay the hide: if the user is moving focus onto the popover
        // itself (e.g. tapping the mic button, which blurs the field
        // first), pointerInsideWidget will already be true by the time this
        // timer fires, and it backs off instead of hiding under the user's
        // finger.
        hideTimer = setTimeout(() => {
            if (!pointerInsideWidget) hideWidget();
        }, 180);
    });

    widget.addEventListener('pointerdown', () => { pointerInsideWidget = true; });
    document.addEventListener('pointerup', () => { pointerInsideWidget = false; });

    // The field being edited can itself move on screen (page scroll, or a
    // resize/orientation change) while the popover is open -- keep it
    // glued to the field rather than left floating over the wrong spot.
    window.addEventListener('scroll', () => {
        if (widget.style.display !== 'none' && targetField && document.body.contains(targetField)) {
            positionWidgetNear(targetField);
        }
    }, { passive: true, capture: true });
    window.addEventListener('resize', () => {
        if (widget.style.display !== 'none' && targetField && document.body.contains(targetField)) {
            positionWidgetNear(targetField);
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
