/**
 * DOM helpers for interacting with the Delphi embed's chat input.
 * Handles both the chat page (textarea) and the overview page (input[type="text"]).
 */

import { TEXTAREA_SELECTOR, SEND_DELAY_MS } from '../config'
import { log, warn } from './logger'

type ChatInput = HTMLTextAreaElement | HTMLInputElement

/**
 * Check whether an element is not explicitly hidden.
 *
 * We intentionally avoid checking offsetWidth/offsetHeight here because:
 *  - Inputs inside flex containers inside iframes can report 0 before the
 *    layout is fully computed, causing false negatives.
 *  - Our selectors are already specific enough to confirm we're on the right
 *    embed page, so the only cases we need to guard against are explicit
 *    CSS hide states (display:none, visibility:hidden, opacity:0).
 */
export function isVisible(el: HTMLElement, view: Window): boolean {
  const style = view.getComputedStyle(el)
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  )
}

/**
 * Locate the chat input (textarea or text input), fill it with the message, and submit.
 *
 * Uses the native HTMLTextAreaElement / HTMLInputElement value setter so
 * React / Vue / Angular reactivity watchers detect the change correctly.
 *
 * Works on both embed pages:
 *   - Chat page  → <textarea id="message">
 *   - Overview   → <input type="text" id="message">
 *
 * @returns true when the send was initiated, false when no visible input was
 *          found (caller should retry).
 */
export function fillAndSubmit(
  iframeDoc: Document,
  iframeView: Window,
  message: string,
): boolean {
  const el = iframeDoc.querySelector(TEXTAREA_SELECTOR) as ChatInput | null

  // Log what we found so failures are debuggable
  if (!el) {
    log(`No element matched selector in iframe (readyState: ${iframeDoc.readyState})`)
    return false
  }

  // Only block on an explicit display:none — do not check opacity/visibility/size.
  // Cross-frame layout measurements (offsetWidth/Height) are unreliable for flex
  // inputs inside iframes before the layout pass completes.  Opacity can be 0
  // mid-animation.  Our selectors are specific enough that finding the element
  // means we are on the right page.
  let display = ''
  try {
    display = iframeView.getComputedStyle(el).display
  } catch {
    // getComputedStyle can throw if the iframe navigated cross-origin between checks
    log('getComputedStyle unavailable — proceeding anyway')
  }

  if (display === 'none') {
    log('Input has display:none — still loading, retrying...')
    return false
  }

  log(`Found chat input (<${el.tagName.toLowerCase()} id="${el.id}">) — filling message...`)

  // Pick the correct prototype based on element type so we get the right
  // native setter and correctly trigger React / Vue / Angular reactivity.
  const proto =
    el.tagName.toLowerCase() === 'textarea'
      ? iframeView.HTMLTextAreaElement.prototype
      : iframeView.HTMLInputElement.prototype

  const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set

  if (nativeSetter) {
    nativeSetter.call(el, message)
  } else {
    el.value = message
  }

  el.dispatchEvent(new iframeView.Event('input', { bubbles: true }))
  el.dispatchEvent(new iframeView.Event('change', { bubbles: true }))

  setTimeout(() => clickSubmit(el, iframeView), SEND_DELAY_MS)

  return true
}

/**
 * Find and activate the submit button closest to the input element.
 * Falls back to an Enter keypress when no button can be found.
 */
function clickSubmit(el: ChatInput, iframeView: Window): void {
  let submitBtn: HTMLButtonElement | null = null

  // Strategy 1: explicit type="submit" button in the parent form
  const form = el.closest('form')
  if (form) submitBtn = form.querySelector('button[type="submit"]')

  // Strategy 2: visible button with SVG send icon in the same container
  // (Delphi uses an SVG arrow/paper-plane on its send button)
  if (!submitBtn) {
    const container = el.parentElement?.parentElement ?? el.parentElement
    if (container) {
      submitBtn =
        Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
          (btn) =>
            btn.offsetParent !== null &&
            btn.querySelector('svg') !== null &&
            !btn.disabled &&
            btn.closest('header') === null,
        ) ?? null
    }
  }

  if (submitBtn) {
    log('Clicking submit — message sent!')
    submitBtn.click()
  } else {
    warn('Submit button not found — simulating Enter key')
    el.dispatchEvent(
      new iframeView.KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
      }),
    )
  }
}
