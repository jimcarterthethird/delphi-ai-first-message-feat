/**
 * Delphi AI — First Message
 *
 * Drop-in script that auto-sends a first message to any page with a Delphi embed.
 * Include dist/delphi-first-message.js on your page — no other setup needed.
 *
 * URL params (names configurable in config.ts):
 *   ?q=Hello          → message to auto-send when the chat input appears
 *   ?page=CHAT        → optional starting embed page: CHAT | VOICE | OVERVIEW
 */

export { readParams } from './helpers/params';
export { applyStartPage } from './helpers/page';
export { applyEmbedParams, watchAndApplyEmbedParams } from './helpers/embed-params';
export { fillAndSubmit, isVisible } from './helpers/dom';
export { sendFirstMessage } from './inject';
export { log, warn } from './helpers/logger';
export * from './config';
export * from './types';

import { readParams } from './helpers/params';
import { applyStartPage } from './helpers/page';
import { watchAndApplyEmbedParams } from './helpers/embed-params';
import { sendFirstMessage } from './inject';
import { log } from './helpers/logger';
import type { DelphiGlobal } from './types';

/**
 * Send the message by driving the DOM inside the embed iframe.
 * Only viable for the legacy loader, whose iframe document is same-origin.
 */
function runLegacyLoaderStrategy(
    firstMessage: string | null,
    startPage: string | null,
): void {
    if (startPage) applyStartPage(startPage);
    if (!firstMessage) return;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () =>
            sendFirstMessage(firstMessage),
        );
    } else {
        sendFirstMessage(firstMessage);
    }
}

function init(): void {
    const { firstMessage, startPage } = readParams();
    if (!firstMessage && !startPage) return;

    log(`Initializing — fm: "${firstMessage}", page: "${startPage}"`);

    // window.delphi.page is only set for the legacy embed.delphi.ai/loader.js setup.
    const usesLegacyLoader = Boolean(
        (window as Window & { delphi?: DelphiGlobal }).delphi?.page,
    );

    if (usesLegacyLoader) {
        runLegacyLoaderStrategy(firstMessage, startPage);
        return;
    }

    watchAndApplyEmbedParams({ firstMessage, startPage });
}

init();
