/**
 * All configurable constants for the Delphi First Message script.
 * Edit this file to adapt the script to your specific setup.
 */

// ── URL parameters ──────────────────────────────────────────────────────────

/** Name of the query param that carries the first message. Default: ?q= */
export const PARAM_FM = 'q';

/** Name of the query param that sets the embed starting page. Default: ?page= */
export const PARAM_PAGE = 'page';

// ── Embed targeting ─────────────────────────────────────────────────────────

/**
 * ID of the container element where the Delphi loader injects the iframe.
 * Must match the `container.selector` value in window.delphi.page config.
 *
 * Example on your page:
 *   <div id="delphi-container"></div>
 *   window.delphi.page.container.selector = "#delphi-container"
 */
export const CONTAINER_ID = 'delphi-container';

/**
 * CSS selector(s) used to locate the Delphi embed iframe.
 * Priority order:
 *  1. Loader-injected iframe inside the known container
 *  2. Direct iframe whose src contains "delphi.ai"
 *  3. Any iframe with a data-delphi attribute
 */
export const IFRAME_SELECTOR = [
    `#${CONTAINER_ID} iframe`,
    'iframe[src*="delphi.ai"]',
    'iframe[data-delphi]',
].join(', ');

/**
 * CSS selectors for the chat input inside the Delphi embed (tried in order).
 * Covers both the chat page (textarea) and the overview page (input[type="text"]).
 * The script only sends the message when this element is found AND visible.
 */
export const TEXTAREA_SELECTOR = [
    // Chat page — full textarea
    'textarea#message',
    'textarea[name="message"]',
    // Overview page — single-line text input
    'input#message',
    'input[name="message"]',
    // Fallback by placeholder
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="type" i]',
    'input[type="text"][placeholder*="question" i]',
    'input[type="text"][placeholder*="ask" i]',
].join(', ');

// ── Native embed URL parameters ─────────────────────────────────────────────

/**
 * Query param on the embed iframe URL that carries the first message.
 * The Delphi embed app reads this natively and treats it as the entry-intent
 * initial prompt, which also forces the CHAT view.
 */
export const EMBED_PARAM_FM = 'q';

/** Query param on the embed iframe URL that sets the starting page. */
export const EMBED_PARAM_PAGE = 'landingPage';

// ── Timing ───────────────────────────────────────────────────────────────────

/** Maximum number of attempts while waiting for the chat textarea to appear. */
export const MAX_ATTEMPTS = 20;

/** Milliseconds between retry attempts. */
export const RETRY_DELAY_MS = 500;

/** Milliseconds to wait between filling the textarea and clicking the submit button. */
export const SEND_DELAY_MS = 300;

/**
 * Milliseconds to wait before the very first attempt.
 * Gives the Delphi loader time to inject the iframe and render the chat page.
 */
export const INITIAL_WAIT_MS = 1500;

/**
 * Milliseconds to keep watching the DOM for the embed iframe before giving up.
 * The embed script injects its iframe asynchronously, so the iframe is usually
 * absent when this script first runs.
 */
export const OBSERVE_TIMEOUT_MS = 15000;
