// Wiring for the "how to use this section" info buttons/panels on the
// Billing Setup / Solar Generation / KSEB Net Meter Consumption / Wheeling
// cards (js/card-info.js). Content is static bilingual HTML already in
// index.html -- unlike render-explanation.js's panels, none of this depends
// on a computed bill, so it's plain markup instead of generated per
// calculation, and this module is just DOM event wiring.

export function initCardInfoPanels() {
    document.querySelectorAll('.card-info-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            // The Wheeling card's button lives inside a <summary> (the
            // card itself is a collapsible <details>) -- without this, the
            // click would also toggle the whole card open/closed.
            e.preventDefault();
            e.stopPropagation();

            const panel = document.getElementById(btn.dataset.infoTarget);
            if (!panel) return;

            // If the panel lives inside a collapsed <details> (Wheeling),
            // force it open first -- otherwise "show instructions" would
            // silently do nothing, since the panel is still hidden by the
            // browser's own collapse behavior regardless of our toggle.
            const details = panel.closest('details');
            if (details && !details.open) details.open = true;

            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            panel.hidden = expanded;
        });
    });

    document.querySelectorAll('.card-info-panel').forEach((panel) => {
        panel.addEventListener('click', (e) => {
            const btn = e.target.closest('.card-info-lang-btn');
            if (!btn) return;
            const lang = btn.dataset.lang;
            panel.querySelectorAll('.card-info-lang-btn').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
            panel.querySelectorAll('[data-info-lang]').forEach((el) => { el.hidden = el.dataset.infoLang !== lang; });
        });
    });
}
