/**
 * Part 1 — URL parameter reading.
 * Reads the two supported query params from the current page URL.
 */

import { PARAM_FM, PARAM_PAGE } from '../config';
import type { DelphiParams } from '../types';

/**
 * Read ?q (first message) and ?page (starting embed page) from the current URL.
 * Both are optional; absent params return null.
 */
export function readParams(): DelphiParams {
    try {
        const params = new URLSearchParams(window.location.search);
        const fm = params.get(PARAM_FM);
        const page = params.get(PARAM_PAGE);
        return {
            firstMessage: fm ? decodeURIComponent(fm).trim() : null,
            startPage: page ? page.toUpperCase().trim() : null,
        };
    } catch {
        return { firstMessage: null, startPage: null };
    }
}
