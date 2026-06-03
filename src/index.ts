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
export { fillAndSubmit, isVisible } from './helpers/dom';
export { sendFirstMessage } from './inject';
export { log, warn } from './helpers/logger';
export * from './config';
export * from './types';

import { readParams } from './helpers/params';
import { applyStartPage } from './helpers/page';
import { sendFirstMessage } from './inject';
import { log } from './helpers/logger';

function init(): void {
    const { firstMessage, startPage } = readParams();
    if (!firstMessage && !startPage) return;

    log(`Initializing — fm: "${firstMessage}", page: "${startPage}"`);

    // Apply starting page first so it's set before the loader runs
    if (startPage) applyStartPage(startPage);

    if (firstMessage) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () =>
                sendFirstMessage(firstMessage),
            );
        } else {
            sendFirstMessage(firstMessage);
        }
    }
}

init();
