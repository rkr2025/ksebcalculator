// One-time page-load flourish: the h1 title's letters fly in from random
// spots on the page and settle into place. Purely cosmetic -- runs once on
// load, touches nothing outside the #mainTitle element, and is skipped
// entirely under prefers-reduced-motion.
(function () {
    var h1 = document.getElementById('mainTitle');
    if (!h1) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    var text = h1.textContent;
    if (!text) return;

    h1.setAttribute('aria-label', text);
    h1.textContent = '';

    var wrapper = document.createElement('span');
    wrapper.className = 'title-letters';
    wrapper.setAttribute('aria-hidden', 'true');

    var chars = Array.from(text);
    var maxDelayMs = 0;
    var letterEls = [];

    chars.forEach(function (char, i) {
        var span = document.createElement('span');
        span.className = 'title-letter';
        span.textContent = char === ' ' ? ' ' : char;

        var sx = (Math.random() * 2 - 1) * 45; // vw
        var sy = (Math.random() * 2 - 1) * 40; // vh
        var rot = (Math.random() * 2 - 1) * 150; // deg
        var delayMs = i * 55;
        maxDelayMs = Math.max(maxDelayMs, delayMs);

        span.style.setProperty('--sx', sx.toFixed(2) + 'vw');
        span.style.setProperty('--sy', sy.toFixed(2) + 'vh');
        span.style.setProperty('--sr', rot.toFixed(1) + 'deg');
        span.style.animationDelay = delayMs + 'ms';

        wrapper.appendChild(span);
        letterEls.push(span);
    });

    h1.appendChild(wrapper);

    // h1's own gradient-text trick (background-clip:text + color:transparent)
    // only paints through direct text runs -- it does NOT show through
    // descendant inline-block boxes like our letter spans, which would
    // otherwise render fully invisible (transparent text on nothing). So
    // each letter gets its own slice of the same gradient instead, sized
    // and positioned using offsetLeft/offsetWidth -- which, unlike
    // getBoundingClientRect, ignore the fly-in transform -- so the slices
    // line up into one continuous gradient across the whole title.
    var wrapperLeft = wrapper.offsetLeft;
    var totalWidth = wrapper.offsetWidth || 1;
    var gradientImage = 'linear-gradient(135deg, var(--primary) 0%, var(--bank) 100%)';

    letterEls.forEach(function (span) {
        var offsetX = span.offsetLeft - wrapperLeft;
        span.style.backgroundImage = gradientImage;
        span.style.backgroundSize = totalWidth + 'px 100%';
        span.style.backgroundPosition = (-offsetX) + 'px 0';
        span.style.webkitBackgroundClip = 'text';
        span.style.backgroundClip = 'text';
        span.style.color = 'transparent';
    });

    // Suppress the transient horizontal scrollbar the flying letters can
    // cause while off-screen, without touching overflow behavior elsewhere.
    document.body.classList.add('title-animating');
    var animationDurationMs = 1400;
    window.setTimeout(function () {
        document.body.classList.remove('title-animating');
    }, maxDelayMs + animationDurationMs + 50);
})();
