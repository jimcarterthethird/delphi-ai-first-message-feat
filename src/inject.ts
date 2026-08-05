/**
 * Legacy loader strategy — type the message into the embed's chat input.
 *
 * Finds the embed iframe, waits for its document to be accessible and the
 * chat textarea to be visible, then fills and submits the message.
 *
 * Only fires when the chat textarea is found AND visible, so it never
 * accidentally acts on the voice or overview pages of the embed.
 *
 * ⚠️ Requires same-origin access to iframe.contentDocument, which only the
 * legacy loader (embed.delphi.ai/loader.js) provides. The current embed
 * (www.delphi.ai/embed.js) creates a genuinely cross-origin iframe where
 * contentDocument is permanently unreachable — that setup is handled by
 * helpers/embed-params.ts instead, and index.ts picks the strategy.
 */

import {
    IFRAME_SELECTOR,
    MAX_ATTEMPTS,
    RETRY_DELAY_MS,
    INITIAL_WAIT_MS,
} from './config';
import { fillAndSubmit } from './helpers/dom';
import { log, warn } from './helpers/logger';

export function sendFirstMessage(message: string): void {
    let attempts = 0;

    const attempt = (): void => {
        attempts++;

        // ── Step 1: Find the iframe ────────────────────────────────────────────
        const iframe = document.querySelector(
            IFRAME_SELECTOR,
        ) as HTMLIFrameElement | null;
        if (!iframe) {
            if (attempts < MAX_ATTEMPTS) {
                log(
                    `Waiting for Delphi iframe (${attempts}/${MAX_ATTEMPTS})...`,
                );
                setTimeout(attempt, RETRY_DELAY_MS);
            } else {
                warn(
                    'Delphi iframe not found after max attempts. ' +
                        'Check CONTAINER_ID / IFRAME_SELECTOR in src/config.ts.',
                );
            }
            return;
        }

        // ── Step 2: Access the iframe document ────────────────────────────────
        let iframeDoc: Document | null = null;
        let iframeView: Window | null = null;
        try {
            iframeDoc = iframe.contentDocument;
            iframeView = iframe.contentWindow;
        } catch {
            warn(
                'Cannot access iframe document (cross-origin restriction). ' +
                    'Use the Delphi loader script — direct <iframe src> blocks document access.',
            );
            return;
        }

        if (!iframeDoc || !iframeView || iframeDoc.readyState === 'loading') {
            if (attempts < MAX_ATTEMPTS) {
                log(
                    `Iframe document not ready (${attempts}/${MAX_ATTEMPTS})...`,
                );
                setTimeout(attempt, RETRY_DELAY_MS);
            } else {
                warn('Iframe document never became ready.');
            }
            return;
        }

        // ── Step 3: Fill and submit ────────────────────────────────────────────
        // fillAndSubmit returns false when the textarea is absent or hidden,
        // meaning the embed is not on the chat page yet — retry.
        const sent = fillAndSubmit(iframeDoc, iframeView, message);
        if (!sent) {
            if (attempts < MAX_ATTEMPTS) {
                log(
                    `Chat input not visible (${attempts}/${MAX_ATTEMPTS}) — embed may not be on chat page`,
                );
                setTimeout(attempt, RETRY_DELAY_MS);
            } else {
                warn(
                    `Chat input not found after ${MAX_ATTEMPTS} attempts. ` +
                        'The embed may not be on the chat page. Try adding ?page=CHAT to the URL.',
                );
            }
        }
    };

    setTimeout(attempt, INITIAL_WAIT_MS);
}
