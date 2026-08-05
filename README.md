# delphi-first-message

Framework-agnostic drop-in script that auto-sends a first message to any page containing a **Delphi AI embed**.

Works with plain HTML, React, Vue, Next.js, Nuxt, Angular — any stack.
One `<script>` tag, no runtime dependencies.

Add `?q=Your%20question` to your page URL and the embed opens with that message already asked.

---

## Which embed are you using?

Delphi has shipped two embed generations, and they need opposite techniques. Check your page's script tag:

| Your script tag | Generation | How this script sends the message |
| --------------- | ---------- | --------------------------------- |
| `www.delphi.ai/embed.js` | **Current** | Forwards `q` onto the embed's iframe URL. The embed sends the message itself. |
| `embed.delphi.ai/loader.js` | Legacy | Types into the chat input inside the iframe document. |

The script detects which one you have at runtime by checking for `window.delphi.page`, so you don't configure anything. If you're on the current embed, read [Quick start (vanilla HTML)](#quick-start-vanilla-html). If you're on the legacy loader, skip to [Legacy loader embed](#legacy-loader-embed).

### Why the two paths differ

The current `embed.js` injects an iframe pointing at `https://www.delphi.ai/embed/{channelId}`. That iframe is genuinely cross-origin, so `iframe.contentDocument` is permanently `null` and no amount of retrying will reach the chat input. Typing into the embed from the host page is impossible by design.

Fortunately it's also unnecessary. The embed app reads the message from **its own URL** and treats it as an entry-intent initial prompt. So the script rewrites the iframe's `src` to carry the message, and the embed does the sending. This is more reliable than DOM injection ever was: no selector guessing, no submit-button heuristics, and an `initialPrompt` also forces the CHAT view automatically.

---

## Requirements

- Serve the page over **HTTP/HTTPS**. Opening it as `file://` blocks the Delphi embed entirely.
- No container element is required for the current embed — the script finds the iframe by its `delphi.ai` src.

---

## Quick start (vanilla HTML)

### 1. Get the dist file

Copy `dist/delphi-first-message.js` next to your HTML page (or keep the repo layout and point at it with a relative path).

```
your-site/
├── index.html
└── delphi-first-message.js   ← copy of dist/delphi-first-message.js
```

### 2. Paste this into your page

Replace `YOUR_CHANNEL_ID` with your Delphi channel UUID. That is the only value you need to change.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Delphi Chat</title>
  </head>
  <body>
    <!-- Delphi embed -->
    <div id="embed">
      <script
        src="https://www.delphi.ai/embed.js"
        data-channel="YOUR_CHANNEL_ID"
        data-mode="inline"
        data-width="100%"
        data-height="600"
        async
      ></script>
    </div>

    <!-- First-message helper — path must resolve to the dist file -->
    <script src="delphi-first-message.js"></script>
  </body>
</html>
```

If you keep this repo's folder layout instead of copying the file, use:

```html
<script src="dist/delphi-first-message.js"></script>
```

### 3. Serve over HTTP and open with `?q=`

```bash
npx serve -l 8080 .
# → http://localhost:8080/example.html?q=Hello
```

Or on your own site:

```
https://yoursite.com/chat?q=What%20can%20you%20help%20me%20with%3F
```

The embed loads with the question already asked and answered.

### Ready-made examples

| File | Local `dist/` needed? | What to change |
| ---- | --------------------- | -------------- |
| [`example.html`](example.html) | Yes (`dist/delphi-first-message.js`) | `YOUR_CHANNEL_ID` |
| [`example-inline.html`](example-inline.html) | **No** — helper is pasted inline | `YOUR_CHANNEL_ID` |

Both: serve over HTTP, open with `?q=Hello`.

---

## URL parameters

These are the params **this script** reads from your host page URL:

| Param | Required | Description | Example |
| ----- | -------- | ----------- | ------- |
| `?q=` | optional | URL-encoded message to auto-send | `?q=Tell%20me%20more` |
| `?page=` | optional | Starting embed page: `CHAT`, `VOICE`, or `OVERVIEW` | `?page=CHAT` |

Both names are configurable in `src/config.ts`. If neither param is present the script does nothing at all — it never touches the embed on a normal page load.

`?page=` is usually redundant on the current embed, since supplying `?q=` already forces the CHAT view.

### Examples

```
?q=Hello
?q=Hello&page=CHAT
?page=VOICE
?q=What%20can%20you%20help%20me%20with%3F
```

---

## What the current embed supports natively

Useful whether or not you use this script. All of the following were read from `embed.js` and the embed app's own bundles.

### Script tag attributes

| Attribute | Values | Notes |
| --------- | ------ | ----- |
| `data-channel` | channel UUID | Required. |
| `data-mode` | `inline`, `bubble` | Defaults to `bubble`. |
| `data-width` | CSS width | `inline` only. Bare numbers get `px`. |
| `data-height` | CSS height | `inline` only. Defaults to `600`. |
| `data-position` | `bottom-right`, `bottom-left` | `bubble` only. |
| `data-landing-page` | `CHAT`, `VOICE`, `OVERVIEW` | Sets the starting view. |
| `data-reset-disclaimer` | `1` | Re-shows the disclaimer. |

**There is no `data-` attribute for a first message.** That's the gap this script fills.

### Iframe URL parameters

`embed.js` builds the iframe URL from the attributes above, and the embed app reads these params from it:

| Param | Set by | Notes |
| ----- | ------ | ----- |
| `q` / `message` | this script | The initial prompt. Also forces the CHAT view. |
| `landingPage` | `data-landing-page` | Starting view. |
| `theme` | `embed.js` | Always `light` currently. |
| `parentOrigin`, `userOrigin` | `embed.js` | Host page identification. |
| `primaryColor`, `secondaryColor` | `window.delphi` overrides | Must match `#rrggbb`. |
| `overrideHeadline` | `window.delphi` overrides | Truncated to 120 chars. |
| `resetEmbedDisclaimer`, `resetEmbedSession` | `window.delphi` overrides | Set to `1`. |
| `question_source`, `autoLoadRecent` | — | Observed in the app bundle, undocumented. |

The app strips `q`, `message`, `question_source`, and `autoLoadRecent` from its own URL via `history.replaceState` once consumed, so the prompt fires exactly once.

### JavaScript API

`embed.js` exposes `window.Delphi`:

```js
window.Delphi.open();       // bubble only — logs a warning in inline mode
window.Delphi.close();      // bubble only — logs a warning in inline mode
window.Delphi.destroy();    // removes the iframe (and bubble button)
window.Delphi.login(token); // forwards an SSO token into the embed
window.Delphi.logout();
```

### postMessage

The bridge is **SSO-only**. Messages posted to the host window are forwarded into the iframe only when they parse as `platform_sso_login` / `sso_login` / `sso_logout` / `platform_sso_logout`. Anything else is dropped, so you cannot send a chat message over `postMessage`.

The embed posts outward: `delphi_expand` (bubble fullscreen toggle), `delphi:new-message` (unread dot), and `delphi:text-exhausted`.

---

## Known trade-off: the embed loads twice

`embed.js` sets the iframe's `src` and inserts it in one synchronous pass, so the first load has already begun by the time any `MutationObserver` can react. Rewriting `src` to add `q` therefore triggers a second load.

It works and it's fast, but if a single load matters to you, the only clean fix is a first-class `data-first-message` attribute in `embed.js` — worth requesting from Delphi.

Loading this script **before** `embed.js` makes the rewrite happen as early as possible.

---

## File structure

```
delphi-first-message/
│
├── src/                           TypeScript source
│   ├── config.ts                  All configurable constants (edit here)
│   ├── types.ts                   Interfaces
│   ├── helpers/
│   │   ├── logger.ts              log() / warn() with [DelphiFirstMessage] prefix
│   │   ├── params.ts              readParams() reads ?q and ?page
│   │   ├── embed-params.ts        Current embed — rewrites the iframe src
│   │   ├── dom.ts                 Legacy loader — isVisible(), fillAndSubmit()
│   │   └── page.ts                Legacy loader — applyStartPage()
│   ├── inject.ts                  Legacy loader — sendFirstMessage()
│   └── index.ts                   Entry point — strategy selection + re-exports
│
├── dist/
│   └── delphi-first-message.js    Compiled IIFE bundle — the only file you ship
│
├── example.html                   Vanilla install — set YOUR_CHANNEL_ID and run
├── example-inline.html            Same, with dist pasted inline (no local JS file)
│
├── demo/
│   ├── simple.html                Minimal test page, current embed
│   └── index.html                 Interactive demo, legacy loader
│
└── README.md
```

---

## Build

`dist/` is a build artifact. **Never hand-edit it** — edit `src/` and rebuild:

```bash
npm install
npm run build     # esbuild → dist/delphi-first-message.js
npm run dev       # same, in watch mode
```

Verify the output parses before shipping. A corrupt bundle throws `SyntaxError: Unexpected end of input` and the script silently never runs:

```bash
node --check dist/delphi-first-message.js
```

---

## How it works

### `readParams()` — `src/helpers/params.ts`

Reads `?q` and `?page` from `window.location.search` synchronously at script load. Returns `{ firstMessage, startPage }`, both `string | null`.

### Strategy selection — `src/index.ts`

If `window.delphi.page` exists the page is using the legacy loader, so `init()` runs the DOM-injection path. Otherwise it runs the URL-param path.

### `watchAndApplyEmbedParams()` — `src/helpers/embed-params.ts`

The current-embed path:

1. Look for the iframe using `IFRAME_SELECTOR`.
2. If it isn't in the DOM yet, watch for it — `embed.js` injects asynchronously.
3. Once found, set `q` and `landingPage` on its URL and assign `src` **once**.
4. Skip the write if the params are already present, so the observer can't loop.
5. Stop observing after `OBSERVE_TIMEOUT_MS` and warn if the iframe never appeared.

### `sendFirstMessage()` — `src/inject.ts`

The legacy-loader path. Finds the iframe, waits for `contentDocument` and a visible chat input, sets the value through the native `HTMLTextAreaElement` / `HTMLInputElement` setter so React/Vue/Angular reactivity fires, dispatches `input` and `change`, then submits (form submit → icon button → Enter key). Only acts on a **visible** input, so it never fires on the voice page.

---

## Configuration

All constants live in `src/config.ts`:

```ts
PARAM_FM = 'q';                    // host page param → ?q=
PARAM_PAGE = 'page';               // host page param → ?page=
EMBED_PARAM_FM = 'q';              // param written onto the iframe URL ('message' also works)
EMBED_PARAM_PAGE = 'landingPage';  // param written onto the iframe URL
CONTAINER_ID = 'delphi-container'; // legacy loader container id
IFRAME_SELECTOR = '#delphi-container iframe, iframe[src*="delphi.ai"], iframe[data-delphi]';
TEXTAREA_SELECTOR = 'textarea#message, input#message, …';  // legacy only
MAX_ATTEMPTS = 20;                 // legacy retry limit
RETRY_DELAY_MS = 500;
SEND_DELAY_MS = 300;
INITIAL_WAIT_MS = 1500;
OBSERVE_TIMEOUT_MS = 15000;        // how long to watch for the iframe
```

Rebuild after editing. To read `?message=` instead of `?q=`, set `PARAM_FM = 'message'`. To target one specific iframe, add `data-delphi` to it and set `IFRAME_SELECTOR = 'iframe[data-delphi]'`.

---

## Integration examples

### Plain HTML

```html
<!DOCTYPE html>
<html>
    <body>
        <div id="embed">
            <script
                src="https://www.delphi.ai/embed.js"
                data-channel="YOUR_CHANNEL_ID"
                data-mode="inline"
                data-width="100%"
                data-height="600"
                async
            ></script>
        </div>
        <script src="delphi-first-message.js"></script>
    </body>
</html>
```

URL: `index.html?q=Hello`

### Next.js

```tsx
// app/chat/page.tsx
import Script from 'next/script';

export default function ChatPage() {
    return (
        <>
            <div id='embed' />
            <Script
                src='https://www.delphi.ai/embed.js'
                data-channel={process.env.NEXT_PUBLIC_DELPHI_CHANNEL_ID}
                data-mode='inline'
                data-width='100%'
                data-height='600'
                strategy='afterInteractive'
            />
            <Script
                src='/delphi-first-message.js'
                strategy='afterInteractive'
            />
        </>
    );
}
```

The embed script must render inside the element you want the iframe to appear in — `embed.js` inserts the iframe as its own previous sibling.

### React (no framework script component)

```tsx
import { useEffect, useRef } from 'react';

export default function DelphiEmbed({ channelId }: { channelId: string }) {
    const host = useRef<HTMLDivElement>(null);
    const injected = useRef(false);

    useEffect(() => {
        if (injected.current || !host.current) return;
        injected.current = true;

        const embed = document.createElement('script');
        embed.src = 'https://www.delphi.ai/embed.js';
        embed.async = true;
        embed.dataset.channel = channelId;
        embed.dataset.mode = 'inline';
        embed.dataset.width = '100%';
        embed.dataset.height = '600';
        host.current.appendChild(embed);

        const plugin = document.createElement('script');
        plugin.src = '/delphi-first-message.js';
        host.current.appendChild(plugin);
    }, [channelId]);

    return <div ref={host} />;
}
```

Use `useRef` for the guard rather than `useState` — a state change re-runs the effect and StrictMode's cleanup can tear down the embed mid-initialisation.

### Vue 3 / Nuxt

```vue
<template>
    <div id="embed" />
</template>

<script setup>
const config = useRuntimeConfig();
useHead({
    script: [
        {
            src: 'https://www.delphi.ai/embed.js',
            async: true,
            'data-channel': config.public.delphiChannelId,
            'data-mode': 'inline',
            'data-width': '100%',
            'data-height': '600',
            tagPosition: 'bodyClose',
        },
        { src: '/delphi-first-message.js', tagPosition: 'bodyClose' },
    ],
});
</script>
```

### WebViews (React Native, Expo, Flutter, Capacitor)

Point the WebView at a real HTTPS URL that hosts the embed page, and put the message in that URL:

```
https://yourapp.com/chat?q=<url-encoded message>
```

This is the most reliable mobile approach because the script reads `window.location.search` normally. Avoid `source={{ html }}` / `initialData`: those leave `location.search` empty, so the script has nothing to read. If you must inline the HTML, skip this script and put `q` directly on the embed iframe URL yourself.

---

## Legacy loader embed

Only relevant if your page uses `embed.delphi.ai/loader.js`. New integrations should use `embed.js` instead.

The config `<script>` tag **must** have `id="delphi-page-script"` — the loader calls `document.getElementById('delphi-page-script')` and throws _"Script tag with id 'delphi-page-script' not found"_ without it.

```html
<div id="delphi-container"></div>

<script id="delphi-page-script">
    window.delphi = {
        page: {
            config: 'YOUR_DELPHI_CONFIG_ID',
            overrides: { landingPage: 'OVERVIEW' },
            container: {
                selector: '#delphi-container',
                width: '100%',
                height: '700px',
            },
        },
    };
</script>
<script src="https://embed.delphi.ai/loader.js" async></script>
<script src="dist/delphi-first-message.js"></script>
```

`applyStartPage()` sets the landing page two ways, in order:

| Strategy | When it works |
| -------- | ------------- |
| `window.delphi.page.overrides.landingPage` | Script runs before `loader.js` initialises |
| Append `?landingPage=` to the iframe src | After the loader has injected the iframe |

In React, don't `delete window.delphi` in an effect cleanup — the async loader may still be reading it.

If your app has a Delphi garbage collector, SSO layer, or plugin that removes `#delphi-page-script` / `#delphi-page-bootstrap`, injecting from a component will fight that infrastructure. Wrapping `demo/index.html` in a full-screen iframe sidesteps it entirely; the demo accepts `?config=`, `?q=`, and `?page=`.

---

## Demo pages

```bash
npx serve -l 8080 .
```

| Page | Embed | URL |
| ---- | ----- | --- |
| Vanilla example | current `embed.js` | `http://localhost:8080/example.html?q=Hello` |
| Inline example (no local JS) | current `embed.js` | `http://localhost:8080/example-inline.html?q=Hello` |
| Minimal test | current `embed.js` | `http://localhost:8080/demo/simple?q=Hello` |
| Interactive demo | legacy loader | `http://localhost:8080/demo/?q=Hello&page=CHAT` |

Set `data-channel` in [`example.html`](example.html) or [`example-inline.html`](example-inline.html) before opening. The interactive demo has a URL builder, example buttons, a config ID input persisted in `sessionStorage`, a live `[DelphiFirstMessage]` log panel, and a `file://` warning.

---

## Console logs

Current embed, success:

```
[DelphiFirstMessage] Initializing — fm: "Hello", page: "null"
[DelphiFirstMessage] Watching for the embed iframe to apply params
[DelphiFirstMessage] Applied embed params via iframe src: ?theme=light&…&q=Hello
```

Legacy loader, success:

```
[DelphiFirstMessage] Initializing — fm: "Hello", page: "CHAT"
[DelphiFirstMessage] Set landing page via window.delphi.page.overrides: CHAT
[DelphiFirstMessage] Found visible chat textarea — filling message...
[DelphiFirstMessage] Clicking submit — message sent!
```

---

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `SyntaxError: Unexpected end of input` and no other logs | Corrupt `dist/` bundle — the script never executed | `npm install && npm run build`, then confirm with `node --check dist/delphi-first-message.js` |
| `Iframe document not ready (1/20…20/20)` then gives up | DOM-injection path running against the current cross-origin embed | Remove `window.delphi.page` so the URL-param path is selected |
| Nothing happens at all, no logs | No `?q=` or `?page=` in the URL, or the page is on `file://` | Add the param; serve over HTTP |
| `Embed iframe never appeared` | `embed.js` missing or blocked, or `IFRAME_SELECTOR` doesn't match | Confirm the embed renders, then check `IFRAME_SELECTOR` |
| Embed loads, message never sends | `q` didn't reach the iframe URL | Inspect the iframe's `src` for `&q=` — see [loads twice](#known-trade-off-the-embed-loads-twice) |
| Embed visibly loads twice | Expected — `src` is rewritten after the first load starts | See [loads twice](#known-trade-off-the-embed-loads-twice) |
| `Script tag with id 'delphi-page-script' not found` | Legacy loader config tag missing the ID | Add `id="delphi-page-script"` |
| `Invalid or missing Delphi object` | `window.delphi` deleted before the loader ran (React StrictMode) | Use a `useRef` guard; don't delete `window.delphi` in cleanup |
| `chat input not found after 20 attempts` | Legacy embed not on the chat page | Add `?page=CHAT` |

A `favicon.ico` 404 in the console is unrelated to the embed.

---

## Known issues

`src/helpers/dom.ts` has five pre-existing TypeScript errors (`Property 'HTMLTextAreaElement' does not exist on type 'Window'` and similar) from accessing constructors off the iframe's `Window`. They don't block the esbuild build and only affect the legacy path.
