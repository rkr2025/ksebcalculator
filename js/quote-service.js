// Live "Daily Thought" quote fetching (js/quote-service.js). Tries a public
// motivational-quotes API first; on any failure (network error, CORS
// block, timeout, bad status, or a response we can't make sense of) this
// resolves to null rather than throwing, so main.js can just fall back to
// the bundled static list (quotes.js) with no special-casing. No DOM
// access here -- this only fetches and validates data.

const QUOTE_API_URL = 'https://zenquotes.io/api/random';
const FETCH_TIMEOUT_MS = 4000;
const MAX_QUOTE_LENGTH = 300;

function isUsableQuoteText(text) {
    return typeof text === 'string' && text.trim().length > 0 && text.trim().length <= MAX_QUOTE_LENGTH;
}

// Returns a "Daily Thought: "..." -- Author" string, or null if no usable
// online quote could be fetched in time.
export async function fetchOnlineQuote() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch(QUOTE_API_URL, { signal: controller.signal });
        if (!response.ok) return null;

        const data = await response.json();
        const entry = Array.isArray(data) ? data[0] : data;
        if (!entry) return null;

        const text = entry.q || entry.quote || entry.content;
        const author = entry.a || entry.author;
        if (!isUsableQuoteText(text)) return null;

        const trimmedText = text.trim();
        const suffix = isUsableQuoteText(author) ? ` -- ${author.trim()}` : '';
        return `Daily Thoughts: "${trimmedText}"${suffix}`;
    } catch {
        // Network failure, CORS block, timeout (AbortError), or malformed
        // JSON all land here -- treated the same as "no online quote".
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}
