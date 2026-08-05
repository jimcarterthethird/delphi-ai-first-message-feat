/**
 * Forward the first message to a cross-origin Delphi embed via its iframe URL.
 *
 * The current embed script (www.delphi.ai/embed.js) injects an iframe pointing at
 * https://www.delphi.ai/embed/{channelId}. That iframe is genuinely cross-origin,
 * so contentDocument is unreachable and DOM injection cannot work.
 *
 * The embed app instead reads the message from its own URL and treats it as the
 * entry-intent initial prompt, which also forces the CHAT view. Rewriting the
 * iframe src is therefore the only supported path — and the more reliable one,
 * since the embed sends the message itself.
 */

import {
    EMBED_PARAM_FM,
    EMBED_PARAM_PAGE,
    IFRAME_SELECTOR,
    OBSERVE_TIMEOUT_MS,
} from '../config';
import { log, warn } from './logger';
import type { DelphiParams } from '../types';

/**
 * Rewrite the embed iframe src to carry the requested params.
 *
 * @param params - First message and starting page read from the host page URL.
 * @returns `true` when the iframe was found and its src already carries the
 *   params or was successfully rewritten; `false` when the iframe is absent.
 */
export function applyEmbedParams({
    firstMessage,
    startPage,
}: DelphiParams): boolean {
    const iframe = document.querySelector(
        IFRAME_SELECTOR,
    ) as HTMLIFrameElement | null;
    if (!iframe?.src) return false;

    try {
        const url = new URL(iframe.src);

        // Already applied — avoid reloading the iframe in a MutationObserver loop.
        const fmApplied =
            !firstMessage || url.searchParams.get(EMBED_PARAM_FM) === firstMessage;
        const pageApplied =
            !startPage || url.searchParams.get(EMBED_PARAM_PAGE) === startPage;
        if (fmApplied && pageApplied) return true;

        if (firstMessage) url.searchParams.set(EMBED_PARAM_FM, firstMessage);
        if (startPage) url.searchParams.set(EMBED_PARAM_PAGE, startPage);

        iframe.src = url.toString();
        log(`Applied embed params via iframe src: ${url.search}`);
        return true;
    } catch {
        warn('Could not rewrite the embed iframe src.');
        return false;
    }
}

/**
 * Apply the embed params now, or as soon as the embed script injects its iframe.
 *
 * @param params - First message and starting page read from the host page URL.
 */
export function watchAndApplyEmbedParams(params: DelphiParams): void {
    if (applyEmbedParams(params)) return;

    const observer = new MutationObserver(() => {
        if (applyEmbedParams(params)) observer.disconnect();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
    log('Watching for the embed iframe to apply params');

    setTimeout(() => {
        observer.disconnect();
        if (!document.querySelector(IFRAME_SELECTOR)) {
            warn(
                'Embed iframe never appeared. Check that the Delphi embed script ' +
                    'is on the page and that IFRAME_SELECTOR in src/config.ts matches it.',
            );
        }
    }, OBSERVE_TIMEOUT_MS);
}
