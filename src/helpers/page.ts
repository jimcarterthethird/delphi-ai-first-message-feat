/**
 * Apply the starting page to the Delphi embed.
 *
 * Two strategies are tried in order:
 *
 * A) window.delphi.page.overrides.landingPage
 *    Works when this code runs BEFORE embed.delphi.ai/loader.js initialises.
 *    This is the recommended approach — set window.delphi.page first, then load the script.
 *
 * B) Append ?landingPage=PAGE to the iframe src
 *    Fallback for a direct <iframe src="https://delphi.ai/..."> embed.
 *    Applied immediately if the iframe is already in the DOM, otherwise via
 *    MutationObserver once it appears.
 */

import { IFRAME_SELECTOR } from '../config';
import type { DelphiGlobal } from '../types';
import { log, warn } from './logger';

export function applyStartPage(page: string): void {
    // Strategy A: Delphi loader config object
    const delphi = (window as Window & { delphi?: DelphiGlobal }).delphi;
    if (delphi?.page) {
        delphi.page.overrides = {
            ...delphi.page.overrides,
            landingPage: page as 'CHAT' | 'VOICE' | 'OVERVIEW',
        };
        log(`Set landing page via window.delphi.page.overrides: ${page}`);
        return;
    }

    // Strategy B: modify iframe src attribute
    const tryModify = (): boolean => {
        const iframe = document.querySelector(
            IFRAME_SELECTOR,
        ) as HTMLIFrameElement | null;
        if (!iframe?.src) return false;
        try {
            const url = new URL(iframe.src);
            url.searchParams.set('landingPage', page);
            iframe.src = url.toString();
            log(`Set landing page via iframe src param: ${page}`);
            return true;
        } catch {
            warn('Could not modify iframe src to set starting page');
            return false;
        }
    };

    if (!tryModify()) {
        // Iframe not in the DOM yet — watch for it
        const observer = new MutationObserver(() => {
            if (tryModify()) observer.disconnect();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });
        log(`Watching for iframe to apply landing page: ${page}`);
    }
}
