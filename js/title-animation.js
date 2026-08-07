// One-time page-load flourish: the h1 title's words fly in from nearby
// random spots and settle into place. Purely cosmetic -- runs once on load,
// touches nothing outside the #mainTitle element, is skipped entirely under
// prefers-reduced-motion, and is fully swapped out for plain text before
// printing so print is unaffected.
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
    // h1's own background-clip:text/gradient/drop-shadow rule (styles.css)
    // is meant for a single direct text run. Once its content is nested
    // spans (below), that same rule can still partially apply to the merged
    // descendant text using h1's own unsliced gradient position --
    // producing a faint, misaligned "ghost" of the title layered behind the
    // correctly per-word-sliced gradient. This class (styles.css) turns
    // that rule off, leaving only the per-word gradients to actually render
    // the text.
    h1.classList.add('title-js-active');

    var wrapper = document.createElement('span');
    wrapper.className = 'title-words';
    wrapper.setAttribute('aria-hidden', 'true');

    var words = text.split(' ');
    var textEls = [];
    var flyEls = [];

    // Each word is two nested spans: an inner .title-word that carries the
    // gradient-clipped text (static, never transformed) and an outer
    // .title-word-fly that carries only the transform/opacity animation.
    // Keeping the transformed element free of background-clip:text avoids a
    // browser rendering quirk where animating a transform on a
    // background-clip:text element forces the text mask to be re-rasterized
    // every frame -- which was showing up as a stray flickering sliver of
    // letters on mobile. Splitting the two into separate layers lets the
    // outer span animate as a plain GPU-composited box while the inner
    // span's already-rasterized text just rides along with it.
    words.forEach(function (word, i) {
        var textSpan = document.createElement('span');
        textSpan.className = 'title-word';
        textSpan.textContent = word;

        var flySpan = document.createElement('span');
        flySpan.className = 'title-word-fly';
        flySpan.appendChild(textSpan);

        wrapper.appendChild(flySpan);
        textEls.push(textSpan);
        flyEls.push(flySpan);

        if (i < words.length - 1) {
            wrapper.appendChild(document.createTextNode(' '));
        }
    });

    h1.appendChild(wrapper);

    // h1's own gradient-text trick (background-clip:text + color:transparent)
    // only paints through direct text runs -- it does NOT show through
    // descendant inline-block boxes like our word spans, which would
    // otherwise render fully invisible (transparent text on nothing). So
    // each word gets its own slice of the same gradient instead, sized and
    // positioned in both axes using offsetLeft/offsetTop so the slices line
    // up into one continuous gradient across the title -- including when it
    // wraps onto a second line on narrow screens.
    var wrapperLeft = wrapper.offsetLeft;
    var wrapperTop = wrapper.offsetTop;
    var totalWidth = wrapper.offsetWidth || 1;
    var totalHeight = wrapper.offsetHeight || 1;
    var gradientImage = 'linear-gradient(135deg, var(--primary) 0%, var(--bank) 100%)';

    textEls.forEach(function (span) {
        var offsetX = span.offsetLeft - wrapperLeft;
        var offsetY = span.offsetTop - wrapperTop;
        span.style.backgroundImage = gradientImage;
        span.style.backgroundSize = totalWidth + 'px ' + totalHeight + 'px';
        span.style.backgroundPosition = (-offsetX) + 'px ' + (-offsetY) + 'px';
        span.style.webkitBackgroundClip = 'text';
        span.style.backgroundClip = 'text';
        span.style.color = 'transparent';
    });

    // For each word, clamp its random start offset to the actual safe space
    // around its real on-screen position (measured now, before any
    // transform is applied) so a word can never fly to a spot that's partly
    // off-screen -- the header has very little room above/beside the title,
    // and a flat vw/vh-based offset could easily overshoot the viewport
    // edge.
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var HORIZ_CAP = 220;
    var VERT_CAP = 90;
    var EDGE_MARGIN = 6;
    var maxDelayMs = 0;

    flyEls.forEach(function (flySpan, i) {
        var rect = flySpan.getBoundingClientRect();

        var safeLeft = Math.min(Math.max(rect.left - EDGE_MARGIN, 4), HORIZ_CAP);
        var safeRight = Math.min(Math.max(viewportWidth - rect.right - EDGE_MARGIN, 4), HORIZ_CAP);
        var safeUp = Math.min(Math.max(rect.top - EDGE_MARGIN, 4), VERT_CAP);
        var safeDown = Math.min(Math.max(viewportHeight - rect.bottom - EDGE_MARGIN, 4), VERT_CAP);

        var sx = Math.random() * (safeLeft + safeRight) - safeLeft;
        var sy = Math.random() * (safeUp + safeDown) - safeUp;
        // Kept modest on purpose: at steep rotation angles a word's
        // bounding box balloons (width*sin + height*cos), which visually
        // compresses the word into an unreadable diagonal sliver for part
        // of the flight -- that's what read as a "stray line of letters"
        // during testing, even though the word was correctly positioned.
        var rot = (Math.random() * 2 - 1) * 14; // deg
        var delayMs = i * 380;
        maxDelayMs = Math.max(maxDelayMs, delayMs);

        flySpan.style.setProperty('--sx', sx.toFixed(1) + 'px');
        flySpan.style.setProperty('--sy', sy.toFixed(1) + 'px');
        flySpan.style.setProperty('--sr', rot.toFixed(1) + 'deg');
        flySpan.style.animationDelay = delayMs + 'ms';
        flySpan.classList.add('title-word-fly--go');
    });

    // Belt-and-suspenders clipping for the brief flight window: suppresses
    // any transient scrollbar from the (now tightly clamped) start
    // positions, without touching overflow behavior elsewhere or at any
    // other time.
    document.documentElement.classList.add('title-animating');
    document.body.classList.add('title-animating');
    var animationDurationMs = 1400;
    window.setTimeout(function () {
        document.documentElement.classList.remove('title-animating');
        document.body.classList.remove('title-animating');
    }, maxDelayMs + animationDurationMs + 50);

    // Guarantee printing is never slowed down by, or shows any trace of,
    // this animation: swap the animated word spans out for plain static
    // text (restoring h1's own gradient rule too) right before the print
    // dialog opens, and restore both after.
    window.addEventListener('beforeprint', function () {
        h1.classList.remove('title-js-active');
        h1.textContent = text;
    });
    window.addEventListener('afterprint', function () {
        h1.textContent = '';
        h1.classList.add('title-js-active');
        h1.appendChild(wrapper);
    });
})();
