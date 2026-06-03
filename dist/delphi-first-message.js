'use strict';
(() => {
    var E = 'q',
        y = 'page',
        A = 'delphi-container',
        m = [
            `#${A} iframe`,
            'iframe[src*="delphi.ai"]',
            'iframe[data-delphi]',
        ].join(', '),
        h = [
            'textarea#message',
            'textarea[name="message"]',
            'input#message',
            'input[name="message"]',
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="type" i]',
            'input[type="text"][placeholder*="question" i]',
            'input[type="text"][placeholder*="ask" i]',
        ].join(', '),
        l = 20,
        p = 500,
        T = 300,
        S = 1500;
    function d() {
        try {
            let e = new URLSearchParams(window.location.search),
                t = e.get(E),
                o = e.get(y);
            return {
                firstMessage: t ? decodeURIComponent(t).trim() : null,
                startPage: o ? o.toUpperCase().trim() : null,
            };
        } catch {
            return { firstMessage: null, startPage: null };
        }
    }
    var b = '[DelphiFirstMessage]';
    function r(e) {
        console.log(`${b} ${e}`);
    }
    function s(e) {
        console.warn(`${b} ${e}`);
    }
    function f(e) {
        let t = window.delphi;
        if (t?.page) {
            ((t.page.overrides = { ...t.page.overrides, landingPage: e }),
                r(`Set landing page via window.delphi.page.overrides: ${e}`));
            return;
        }
        let o = () => {
            let n = document.querySelector(m);
            if (!n?.src) return !1;
            try {
                let a = new URL(n.src);
                return (
                    a.searchParams.set('landingPage', e),
                    (n.src = a.toString()),
                    r(`Set landing page via iframe src param: ${e}`),
                    !0
                );
            } catch {
                return (
                    s('Could not modify iframe src to set starting page'),
                    !1
                );
            }
        };
        if (!o()) {
            let n = new MutationObserver(() => {
                o() && n.disconnect();
            });
            (n.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
            }),
                r(`Watching for iframe to apply landing page: ${e}`));
        }
    }
    function M(e, t) {
        let o = t.getComputedStyle(e);
        return (
            o.display !== 'none' &&
            o.visibility !== 'hidden' &&
            o.opacity !== '0'
        );
    }
    function g(e, t, o) {
        let n = e.querySelector(h);
        if (!n)
            return (
                r(
                    `No element matched selector in iframe (readyState: ${e.readyState})`,
                ),
                !1
            );
        let a = '';
        try {
            a = t.getComputedStyle(n).display;
        } catch {
            r('getComputedStyle unavailable \u2014 proceeding anyway');
        }
        if (a === 'none')
            return (
                r('Input has display:none \u2014 still loading, retrying...'),
                !1
            );
        r(
            `Found chat input (<${n.tagName.toLowerCase()} id="${n.id}">) \u2014 filling message...`,
        );
        let i =
                n.tagName.toLowerCase() === 'textarea'
                    ? t.HTMLTextAreaElement.prototype
                    : t.HTMLInputElement.prototype,
            u = Object.getOwnPropertyDescriptor(i, 'value')?.set;
        return (
            u ? u.call(n, o) : (n.value = o),
            n.dispatchEvent(new t.Event('input', { bubbles: !0 })),
            n.dispatchEvent(new t.Event('change', { bubbles: !0 })),
            setTimeout(() => x(n, t), T),
            !0
        );
    }
    function x(e, t) {
        let o = null,
            n = e.closest('form');
        if ((n && (o = n.querySelector('button[type="submit"]')), !o)) {
            let a = e.parentElement?.parentElement ?? e.parentElement;
            a &&
                (o =
                    Array.from(a.querySelectorAll('button')).find(
                        (i) =>
                            i.offsetParent !== null &&
                            i.querySelector('svg') !== null &&
                            !i.disabled &&
                            i.closest('header') === null,
                    ) ?? null);
        }
        o
            ? (r('Clicking submit \u2014 message sent!'), o.click())
            : (s('Submit button not found \u2014 simulating Enter key'),
              e.dispatchEvent(
                  new t.KeyboardEvent('keydown', {
                      bubbles: !0,
                      cancelable: !0,
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                  }),
              ));
    }
    function c(e) {
        let t = 0,
            o = () => {
                t++;
                let n = document.querySelector(m);
                if (!n) {
                    t < l
                        ? (r(`Waiting for Delphi iframe (${t}/${l})...`),
                          setTimeout(o, p))
                        : s(
                              'Delphi iframe not found after max attempts. Check CONTAINER_ID / IFRAME_SELECTOR in src/config.ts.',
                          );
                    return;
                }
                let a = null,
                    i = null;
                try {
                    ((a = n.contentDocument), (i = n.contentWindow));
                } catch {
                    s(
                        'Cannot access iframe document (cross-origin restriction). Use the Delphi loader script \u2014 direct <iframe src> blocks document access.',
                    );
                    return;
                }
                if (!a || !i || a.readyState === 'loading') {
                    t < l
                        ? (r(`Iframe document not ready (${t}/${l})...`),
                          setTimeout(o, p))
                        : s('Iframe document never became ready.');
                    return;
                }
                g(a, i, e) ||
                    (t < l
                        ? (r(
                              `Chat input not visible (${t}/${l}) \u2014 embed may not be on chat page`,
                          ),
                          setTimeout(o, p))
                        : s(
                              `Chat input not found after ${l} attempts. The embed may not be on the chat page. Try adding ?page=CHAT to the URL.`,
                          ));
            };
        setTimeout(o, S);
    }
    function I() {
        let { firstMessage: e, startPage: t } = d();
        (!e && !t) ||
            (r(`Initializing \u2014 fm: "${e}", page: "${t}"`),
            t && f(t),
            e &&
                (document.readyState === 'loading'
                    ? document.addEventListener('DOMContentLoaded', () => c(e))
                    : c(e)));
    }
    I();

(() => {
    var E = 'q',
        y = 'page',
        A = 'delphi-container',
        m = [
            `#${A} iframe`,
            'iframe[src*="delphi.ai"]',
            'iframe[data-delphi]',
        ].join(', '),
        h = [
            'textarea#message',
            'textarea[name="message"]',
            'input#message',
            'input[name="message"]',
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="type" i]',
            'input[type="text"][placeholder*="question" i]',
            'input[type="text"][placeholder*="ask" i]',
        ].join(', '),
        l = 20,
        p = 500,
        T = 300,
        S = 1500;
    function d() {
        try {
            let e = new URLSearchParams(window.location.search),
                t = e.get(E),
                o = e.get(y);
            return {
                firstMessage: t ? decodeURIComponent(t).trim() : null,
                startPage: o ? o.toUpperCase().trim() : null,
            };
        } catch {
            return { firstMessage: null, startPage: null };
        }
    }
    var b = '[DelphiFirstMessage]';
    function r(e) {
        console.log(`${b} ${e}`);
    }
    function s(e) {
        console.warn(`${b} ${e}`);
    }
    function f(e) {
        let t = window.delphi;
        if (t?.page) {
            ((t.page.overrides = { ...t.page.overrides, landingPage: e }),
                r(`Set landing page via window.delphi.page.overrides: ${e}`));
            return;
        }
        let o = () => {
            let n = document.querySelector(m);
            if (!n?.src) return !1;
            try {
                let a = new URL(n.src);
                return (
                    a.searchParams.set('landingPage', e),
                    (n.src = a.toString()),
                    r(`Set landing page via iframe src param: ${e}`),
                    !0
                );
            } catch {
                return (
                    s('Could not modify iframe src to set starting page'),
                    !1
                );
            }
        };
        if (!o()) {
            let n = new MutationObserver(() => {
                o() && n.disconnect();
            });
            (n.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
            }),
                r(`Watching for iframe to apply landing page: ${e}`));
        }
    }
    function M(e, t) {
        let o = t.getComputedStyle(e);
        return (
            o.display !== 'none' &&
            o.visibility !== 'hidden' &&
            o.opacity !== '0'
        );
    }
    function g(e, t, o) {
        let n = e.querySelector(h);
        if (!n)
            return (
                r(
                    `No element matched selector in iframe (readyState: ${e.readyState})`,
                ),
                !1
            );
        let a = '';
        try {
            a = t.getComputedStyle(n).display;
        } catch {
            r('getComputedStyle unavailable \u2014 proceeding anyway');
        }
        if (a === 'none')
            return (
                r('Input has display:none \u2014 still loading, retrying...'),
                !1
            );
        r(
            `Found chat input (<${n.tagName.toLowerCase()} id="${n.id}">) \u2014 filling message...`,
        );
        let i =
                n.tagName.toLowerCase() === 'textarea'
                    ? t.HTMLTextAreaElement.prototype
                    : t.HTMLInputElement.prototype,
            u = Object.getOwnPropertyDescriptor(i, 'value')?.set;
        return (
            u ? u.call(n, o) : (n.value = o),
            n.dispatchEvent(new t.Event('input', { bubbles: !0 })),
            n.dispatchEvent(new t.Event('change', { bubbles: !0 })),
            setTimeout(() => x(n, t), T),
            !0
        );
    }
    function x(e, t) {
        let o = null,
            n = e.closest('form');
        if ((n && (o = n.querySelector('button[type="submit"]')), !o)) {
            let a = e.parentElement?.parentElement ?? e.parentElement;
            a &&
                (o =
                    Array.from(a.querySelectorAll('button')).find(
                        (i) =>
                            i.offsetParent !== null &&
                            i.querySelector('svg') !== null &&
                            !i.disabled &&
                            i.closest('header') === null,
                    ) ?? null);
        }
        o
            ? (r('Clicking submit \u2014 message sent!'), o.click())
            : (s('Submit button not found \u2014 simulating Enter key'),
              e.dispatchEvent(
                  new t.KeyboardEvent('keydown', {
                      bubbles: !0,
                      cancelable: !0,
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                  }),
              ));
    }
    function c(e) {
        let t = 0,
            o = () => {
                t++;
                let n = document.querySelector(m);
                if (!n) {
                    t < l
                        ? (r(`Waiting for Delphi iframe (${t}/${l})...`),
                          setTimeout(o, p))
                        : s(
                              'Delphi iframe not found after max attempts. Check CONTAINER_ID / IFRAME_SELECTOR in src/config.ts.',
                          );
                    return;
                }
                let a = null,
                    i = null;
                try {
                    ((a = n.contentDocument), (i = n.contentWindow));
                } catch {
                    s(
                        'Cannot access iframe document (cross-origin restriction). Use the Delphi loader script \u2014 direct <iframe src> blocks document access.',
                    );
                    return;
                }
                if (!a || !i || a.readyState === 'loading') {
                    t < l
                        ? (r(`Iframe document not ready (${t}/${l})...`),
                          setTimeout(o, p))
                        : s('Iframe document never became ready.');
                    return;
                }
                g(a, i, e) ||
                    (t < l
                        ? (r(
                              `Chat input not visible (${t}/${l}) \u2014 embed may not be on chat page`,
                          ),
                          setTimeout(o, p))
                        : s(
                              `Chat input not found after ${l} attempts. The embed may not be on the chat page. Try adding ?page=CHAT to the URL.`,
                          ));
            };
        setTimeout(o, S);
    }
    function I() {
        let { firstMessage: e, startPage: t } = d();
        (!e && !t) ||
            (r(`Initializing \u2014 fm: "${e}", page: "${t}"`),
            t && f(t),
            e &&
                (document.readyState === 'loading'
                    ? document.addEventListener('DOMContentLoaded', () => c(e))
                    : c(e)));
    }
    I();

(() => {
    var E = 'q',
        y = 'page',
        A = 'delphi-container',
        m = [
            `#${A} iframe`,
            'iframe[src*="delphi.ai"]',
            'iframe[data-delphi]',
        ].join(', '),
        h = [
            'textarea#message',
            'textarea[name="message"]',
            'input#message',
            'input[name="message"]',
            'textarea[placeholder*="message" i]',
            'textarea[placeholder*="type" i]',
            'input[type="text"][placeholder*="question" i]',
            'input[type="text"][placeholder*="ask" i]',
        ].join(', '),
        l = 20,
        p = 500,
        T = 300,
        S = 1500;
    function d() {
        try {
            let e = new URLSearchParams(window.location.search),
                t = e.get(E),
                o = e.get(y);
            return {
                firstMessage: t ? decodeURIComponent(t).trim() : null,
                startPage: o ? o.toUpperCase().trim() : null,
            };
        } catch {
            return { firstMessage: null, startPage: null };
        }
    }
    var b = '[DelphiFirstMessage]';
    function r(e) {
        console.log(`${b} ${e}`);
    }
    function s(e) {
        console.warn(`${b} ${e}`);
    }
    function f(e) {
        let t = window.delphi;
        if (t?.page) {
            ((t.page.overrides = { ...t.page.overrides, landingPage: e }),
                r(`Set landing page via window.delphi.page.overrides: ${e}`));
            return;
        }
        let o = () => {
            let n = document.querySelector(m);
            if (!n?.src) return !1;
            try {
                let a = new URL(n.src);
                return (
                    a.searchParams.set('landingPage', e),
                    (n.src = a.toString()),
                    r(`Set landing page via iframe src param: ${e}`),
                    !0
                );
            } catch {
                return (
                    s('Could not modify iframe src to set starting page'),
                    !1
                );
            }
        };
        if (!o()) {
            let n = new MutationObserver(() => {
                o() && n.disconnect();
            });
            (n.observe(document.documentElement, {
                childList: !0,
                subtree: !0,
            }),
                r(`Watching for iframe to apply landing page: ${e}`));
        }
    }
    function M(e, t) {
        let o = t.getComputedStyle(e);
        return (
            o.display !== 'none' &&
            o.visibility !== 'hidden' &&
            o.opacity !== '0'
        );
    }
    function g(e, t, o) {
        let n = e.querySelector(h);
        if (!n)
            return (
                r(
                    `No element matched selector in iframe (readyState: ${e.readyState})`,
                ),
                !1
            );
        let a = '';
        try {
            a = t.getComputedStyle(n).display;
        } catch {
            r('getComputedStyle unavailable \u2014 proceeding anyway');
        }
        if (a === 'none')
            return (
                r('Input has display:none \u2014 still loading, retrying...'),
                !1
            );
        r(
            `Found chat input (<${n.tagName.toLowerCase()} id="${n.id}">) \u2014 filling message...`,
        );
        let i =
                n.tagName.toLowerCase() === 'textarea'
                    ? t.HTMLTextAreaElement.prototype
                    : t.HTMLInputElement.prototype,
            u = Object.getOwnPropertyDescriptor(i, 'value')?.set;
        return (
            u ? u.call(n, o) : (n.value = o),
            n.dispatchEvent(new t.Event('input', { bubbles: !0 })),
            n.dispatchEvent(new t.Event('change', { bubbles: !0 })),
            setTimeout(() => x(n, t), T),
            !0
        );
    }
    function x(e, t) {
        let o = null,
            n = e.closest('form');
        if ((n && (o = n.querySelector('button[type="submit"]')), !o)) {
            let a = e.parentElement?.parentElement ?? e.parentElement;
            a &&
                (o =
                    Array.from(a.querySelectorAll('button')).find(
                        (i) =>
                            i.offsetParent !== null &&
                            i.querySelector('svg') !== null &&
                            !i.disabled &&
                            i.closest('header') === null,
                    ) ?? null);
        }
        o
            ? (r('Clicking submit \u2014 message sent!'), o.click())
            : (s('Submit button not found \u2014 simulating Enter key'),
              e.dispatchEvent(
                  new t.KeyboardEvent('keydown', {
                      bubbles: !0,
                      cancelable: !0,
                      key: 'Enter',
                      code: 'Enter',
                      keyCode: 13,
                  }),
              ));
    }
    function c(e) {
        let t = 0,
            o = () => {
                t++;
                let n = document.querySelector(m);
                if (!n) {
                    t < l
                        ? (r(`Waiting for Delphi iframe (${t}/${l})...`),
                          setTimeout(o, p))
                        : s(
                              'Delphi iframe not found after max attempts. Check CONTAINER_ID / IFRAME_SELECTOR in src/config.ts.',
                          );
                    return;
                }
                let a = null,
                    i = null;
                try {
                    ((a = n.contentDocument), (i = n.contentWindow));
                } catch {
                    s(
                        'Cannot access iframe document (cross-origin restriction). Use the Delphi loader script \u2014 direct <iframe src> blocks document access.',
                    );
                    return;
                }
                if (!a || !i || a.readyState === 'loading') {
                    t < l
                        ? (r(`Iframe document not ready (${t}/${l})...`),
                          setTimeout(o, p))
                        : s('Iframe document never became ready.');
                    return;
                }
                g(a, i, e) ||
                    (t < l
                        ? (r(
                              `Chat input not visible (${t}/${l}) \u2014 embed may not be on chat page`,
                          ),
                          setTimeout(o, p))
                        : s(
                              `Chat input not found after ${l} attempts. The embed may not be on the chat page. Try adding ?page=CHAT to the URL.`,
                          ));
            };
        setTimeout(o, S);
    }
    function I() {
        let { firstMessage: e, startPage: t } = d();
        (!e && !t) ||
            (r(`Initializing \u2014 fm: "${e}", page: "${t}"`),
            t && f(t),
            e &&
                (document.readyState === 'loading'
                    ? document.addEventListener('DOMContentLoaded', () => c(e))
                    : c(e)));
    }
    I();
})();
