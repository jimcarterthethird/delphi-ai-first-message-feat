# delphi-first-message

Framework-agnostic drop-in script that auto-fills and sends a first message to any page containing a **Delphi AI embed**.

Works with plain HTML, React, Vue, Next.js, Nuxt, Angular — any stack.  
No build step. No dependencies. Copy the folder, include one `<script>` tag.

---

## Requirements

- Page must be **served over HTTP/HTTPS** — `file://` blocks the Delphi embed entirely
- Use the **Delphi loader script** (`embed.delphi.ai/loader.js`) to create the embed.  
  A direct `<iframe src="https://delphi.ai/...">` creates a cross-origin iframe whose `contentDocument` is inaccessible — the loader approach creates an initially-accessible iframe document, matching how `jim-carter-ai` works.

---

## Quick Start

### 1. Set up the Delphi embed using the loader

> **Important:** the config `<script>` tag **must** have `id="delphi-page-script"`.  
> The Delphi loader calls `document.getElementById('delphi-page-script')` to read the  
> configuration — setting `window.delphi` without this ID will throw  
> *"Script tag with id 'delphi-page-script' not found"* and the embed will not load.

```html
<!-- Container where the loader will inject the iframe -->
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
<script
    src="https://embed.delphi.ai/loader.js"
    async
></script>
```

### 2. Include the script

```html
<script src="dist/delphi-first-message.js"></script>
```

### 3. Navigate with URL params

```
https://yoursite.com/chat?q=Hello%20World&page=CHAT
```

Done. The script reads the URL, finds the embed's chat textarea, and sends the message.

---

## URL Parameters

| Param    | Required | Description                                          | Example               |
| -------- | -------- | ---------------------------------------------------- | --------------------- |
| `?q=`    | —        | URL-encoded message to auto-send                     | `?q=Tell%20me%20more` |
| `?page=` | optional | Starting embed page: `CHAT` \| `VOICE` \| `OVERVIEW` | `?page=CHAT`          |

Parameter names are configurable — see [Configuration](#configuration).

### Examples

```
?q=Hello
?q=Hello&page=CHAT
?page=VOICE
?q=What%20can%20you%20help%20me%20with%3F&page=CHAT
```

---

## File Structure

```
delphi-first-message/
│
├── src/                          TypeScript source modules
│   ├── config.ts                 All configurable constants (edit here)
│   ├── types.ts                  TypeScript interfaces
│   ├── helpers/
│   │   ├── logger.ts             log() / warn() with [DelphiFirstMessage] prefix
│   │   ├── params.ts             Part 1 — readParams() reads ?q and ?page
│   │   ├── dom.ts                isVisible(), fillAndSubmit(), clickSubmit()
│   │   └── page.ts               applyStartPage() sets the embed's starting page
│   ├── inject.ts                 Part 2 — sendFirstMessage() orchestrates the send
│   └── index.ts                  Entry point — init() + re-exports
│
├── dist/
│   └── delphi-first-message.js   Compiled IIFE bundle — the only file you need
│
├── demo/
│   └── index.html                Interactive demo (requires HTTP server)
│
└── README.md
```

**For production: only `dist/delphi-first-message.js` is needed.**  
The `src/` modules are the readable source — edit them, then manually update `dist/`.

---

## How It Works

### Part 1 — `readParams()` (`src/helpers/params.ts`)

Reads `?q` and `?page` from `window.location.search` synchronously at script load.  
Returns `{ firstMessage: string|null, startPage: string|null }`.

### Part 2 — `sendFirstMessage()` (`src/inject.ts`)

Finds the Delphi iframe and injects the message via a retry loop:

1. Locates the iframe using `IFRAME_SELECTOR` (container-first, then src-based)
2. Accesses `iframe.contentDocument` — works with the loader approach
3. Finds the chat input (`<textarea>` or `<input type="text">`) using `TEXTAREA_SELECTOR`
4. **Only acts when the chat input is visible** — supports both the chat page and overview page, but keeps retrying if neither is found (e.g., on the voice page)
5. Sets the value via the **native `HTMLTextAreaElement` or `HTMLInputElement` setter** so React/Vue/Angular reactivity fires
6. Dispatches `input` + `change` events
7. Clicks the submit button (form submit → SVG-icon button → Enter key fallback)

### `applyStartPage()` (`src/helpers/page.ts`)

Two strategies, tried in order:

| Strategy                                   | When it works                                  |
| ------------------------------------------ | ---------------------------------------------- |
| `window.delphi.page.overrides.landingPage` | Loader approach — set before `loader.js` runs  |
| Append `?landingPage=` to iframe src       | Direct iframe fallback or after loader injects |

---

## Configuration

Edit constants in `src/config.ts` or at the top of `dist/delphi-first-message.js`:

```js
var PARAM_FM = 'q'; // URL param name  → ?q=
var PARAM_PAGE = 'page'; // URL param name  → ?page=
var CONTAINER_ID = 'delphi-container'; // id of the div where the loader injects the iframe
var IFRAME_SELECTOR =
    '#delphi-container iframe, iframe[src*="delphi.ai"], iframe[data-delphi]';
var TEXTAREA_SELECTOR = 'textarea#message, input#message, …';
var MAX_ATTEMPTS = 20; // retry limit
var RETRY_DELAY_MS = 500; // ms between retries
var SEND_DELAY_MS = 300; // ms between fill and submit
var INITIAL_WAIT_MS = 1500; // ms before first attempt
```

### Change the `?q=` param name

```js
var PARAM_FM = 'message'; // now reads ?message=
```

### Target a specific iframe

Add `data-delphi` to your iframe and set:

```js
var IFRAME_SELECTOR = 'iframe[data-delphi]';
```

---

## Integration Examples

### Plain HTML (loader approach)

```html
<!DOCTYPE html>
<html>
    <body>
        <div id="delphi-container"></div>

        <!-- id="delphi-page-script" is required — the loader reads config from this tag -->
        <script id="delphi-page-script">
            window.delphi = {
                page: {
                    config: 'YOUR_CONFIG_ID',
                    overrides: { landingPage: 'OVERVIEW' },
                    container: {
                        selector: '#delphi-container',
                        width: '100%',
                        height: '700px',
                    },
                },
            };
        </script>
        <script
            src="https://embed.delphi.ai/loader.js"
            async
        ></script>
        <script src="delphi-first-message.js"></script>
    </body>
</html>
```

URL: `index.html?q=Hello&page=CHAT`

---

### Plain React (hooks / `useEffect`)

For React apps **without** Next.js (no `<Script>` component available), inject the
scripts dynamically in a `useEffect`. Key rules:

- Use `useRef` for the injection guard, **not** `useState` — state changes re-trigger
  the effect, which causes React StrictMode's cleanup to delete `window.delphi` before
  the async loader finishes executing.
- Create a `<script id="delphi-page-script">` element (required by the loader).
- Inject the first-message plugin **inline** (via a `?raw` / bundled string import) to
  avoid a separate HTTP request that can return the SPA's HTML catch-all in production.

```tsx
// DelphiEmbed.tsx
import { useEffect, useRef } from 'react';
// Bundle the plugin at build time so no runtime HTTP request is needed.
// With Vite: import delphiScript from './delphi-first-message.js?raw';
// With webpack/CRA: require the file as a raw string (e.g. via raw-loader).
import delphiScript from './delphi-first-message.js?raw'; // Vite example

interface Props {
    configId: string;
    landingPage?: string;
    search?: string; // window.location.search passed from the parent route
}

export default function DelphiEmbed({ configId, landingPage = 'OVERVIEW', search = '' }: Props) {
    const injected = useRef(false);

    useEffect(() => {
        if (injected.current) return;
        injected.current = true;

        // 1. Config script tag — the loader requires id="delphi-page-script"
        const configScript = document.createElement('script');
        configScript.id = 'delphi-page-script';
        configScript.type = 'text/javascript';
        configScript.text = [
            'window.delphi = {',
            '  page: {',
            `    config: ${JSON.stringify(configId)},`,
            `    overrides: { landingPage: ${JSON.stringify(landingPage)} },`,
            '    container: { selector: "#delphi-container", width: "100%", height: "100vh" }',
            '  }',
            '};',
        ].join('\n');
        document.body.appendChild(configScript);

        // 2. Delphi loader (reads delphi-page-script, injects the iframe)
        const loader = document.createElement('script');
        loader.id = 'delphi-page-bootstrap';
        loader.src = 'https://embed.delphi.ai/loader.js';
        loader.async = true;
        document.body.appendChild(loader);

        // 3. First-message plugin — inline so there is no network request
        const plugin = document.createElement('script');
        plugin.textContent = delphiScript;
        document.body.appendChild(plugin);

        return () => {
            injected.current = false;
            ['delphi-page-script', 'delphi-page-bootstrap'].forEach((id) => {
                document.getElementById(id)?.remove();
            });
            // Do NOT delete window.delphi here — the async loader may still be reading it.
        };
    }, [search]); // re-run when the URL search string changes

    return (
        <div
            id='delphi-container'
            style={{ display: 'block', width: '100vw', height: '100vh' }}
        />
    );
}
```

---

### React / Next.js

```tsx
// app/chat/page.tsx
export default function ChatPage() {
    return (
        <>
            <div id='delphi-container' />
            <Script
                id='delphi-page-script'
                strategy='beforeInteractive'
            >{`
        window.delphi = { page: {
          config: "${process.env.NEXT_PUBLIC_DELPHI_CONFIG_ID}",
          overrides: { landingPage: "OVERVIEW" },
          container: { selector: "#delphi-container", width: "100%", height: "700px" }
        }};
      `}</Script>
            <Script
                src='https://embed.delphi.ai/loader.js'
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

---

### Vue 3 / Nuxt

```vue
<template>
    <div id="delphi-container" />
</template>

<script setup>
const runtimeConfig = useRuntimeConfig();
useHead({
    script: [
        {
            id: 'delphi-page-script',
            innerHTML: `window.delphi = { page: {
        config: "${runtimeConfig.public.delphiConfigId}",
        overrides: { landingPage: "OVERVIEW" },
        container: { selector: "#delphi-container", width: "100%", height: "700px" }
      }};`,
        },
        { src: 'https://embed.delphi.ai/loader.js', async: true },
        { src: '/delphi-first-message.js' },
    ],
});
</script>
```

#### Nuxt apps that already manage Delphi scripts

If your Nuxt app has a Delphi garbage collector, SSO layer, or any plugin that
watches for and removes `#delphi-page-script` / `#delphi-page-bootstrap`, injecting
scripts directly from a page component will conflict with that infrastructure.

**Solution: wrap the standalone demo in a full-screen `<iframe>`.**

The demo page accepts a `?config=` param, so the host page can pass the Delphi config
ID without any hardcoding in the demo HTML.

```vue
<!-- pages/delphi-demo.vue -->
<template>
    <iframe
        :src="demoUrl"
        class="demo-frame"
        allowfullscreen
        allow="microphone; camera; autoplay"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';

definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig();

const demoUrl = computed(() => {
    const p = new URLSearchParams();
    if (config.public.delphiConfigId)
        p.set('config', String(config.public.delphiConfigId));
    if (route.query.q) p.set('q', String(route.query.q));
    if (route.query.page) p.set('page', String(route.query.page));
    return `/delphi-first-message/demo/?${p}`;
});
</script>

<style>
html,
body {
    margin: 0;
    height: 100%;
    overflow: hidden;
}
</style>
<style scoped>
.demo-frame {
    display: block;
    width: 100vw;
    height: 100vh;
    border: none;
}
</style>
```

Copy `dist/delphi-first-message.js` and `demo/` to your `public/` folder so Nuxt
serves them as static assets:

```text
public/
└── delphi-first-message/
    ├── dist/delphi-first-message.js
    └── demo/index.html
```

The iframe runs entirely outside the Nuxt component tree — no GC, no SSO, no plugins
interfere with it.

---

### React Native (react-native-webview)

The script runs inside the WebView's browser context via `injectedJavaScript`.
Pass the first message and starting page through the URL you load.

```tsx
// ChatScreen.tsx
import { useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { readFileSync } from 'fs'; // or bundle the script as a string

// Bundle the compiled script as a JS string at build time
// Option A: inline string (paste the contents of dist/delphi-first-message.js)
// Option B: import via metro bundler (see below)
import FIRST_MESSAGE_SCRIPT from '../../delphi-first-message/dist/delphi-first-message.js';

const DELPHI_CONFIG_ID = process.env.EXPO_PUBLIC_DELPHI_CONFIG_ID ?? '';

export default function ChatScreen() {
    const { params } = useRoute<any>();
    const fm = params?.firstMessage ?? '';
    const page = params?.startPage ?? 'OVERVIEW';

    // Embed URL carries the query params — the injected script reads them
    const url = `https://yourapp.com/chat-shell?q=${encodeURIComponent(fm)}&page=${page}`;

    // Delphi loader config injected before the page runs
    const loaderSetup = `
    window.delphi = { page: {
      config: "${DELPHI_CONFIG_ID}",
      overrides: { landingPage: "${page}" },
      container: { selector: "#delphi-container", width: "100%", height: "100%" }
    }};
    true;
  `;

    return (
        <WebView
            source={{ uri: url }}
            // Inject setup first, then the first-message script
            injectedJavaScriptBeforeContentLoaded={loaderSetup}
            injectedJavaScript={FIRST_MESSAGE_SCRIPT + '\ntrue;'}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
        />
    );
}
```

**Metro bundler — import the JS file as a raw string:**

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('js'); // treat .js in /dist as a raw asset
module.exports = config;
```

```tsx
// import as raw text
const FIRST_MESSAGE_SCRIPT = require('../../delphi-first-message/dist/delphi-first-message.js');
```

Or inline the script directly as a template string to skip the asset pipeline entirely.

---

### Expo (Expo Go / EAS)

Same as React Native WebView — Expo ships `react-native-webview` via `expo-web-browser`
or directly:

```bash
npx expo install react-native-webview
```

```tsx
// app/chat.tsx  (Expo Router)
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

// Paste the contents of dist/delphi-first-message.js here
const FIRST_MESSAGE_SCRIPT = `/* ... paste dist/delphi-first-message.js ... */`;

export default function ChatScreen() {
    const { q: fm = '', page = 'OVERVIEW' } = useLocalSearchParams<{
        q?: string;
        page?: string;
    }>();

    const embedHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
    <body style="margin:0;padding:0;height:100vh">
      <div id="delphi-container" style="height:100vh"></div>
      <script id="delphi-page-script">
        window.delphi = { page: {
          config: "${process.env.EXPO_PUBLIC_DELPHI_CONFIG_ID}",
          overrides: { landingPage: "${page}" },
          container: { selector: "#delphi-container", width: "100%", height: "100vh" }
        }};
      <\/script>
      <script src="https://embed.delphi.ai/loader.js"><\/script>
    </body>
    </html>
  `;

    // Build a data URL with the q/page params so the script can read them
    const dataUrl = `data:text/html,${encodeURIComponent(embedHtml)}?q=${encodeURIComponent(fm)}&page=${page}`;

    return (
        <WebView
            source={{ html: embedHtml, baseUrl: 'https://yourapp.com' }}
            injectedJavaScript={FIRST_MESSAGE_SCRIPT + '\ntrue;'}
            style={StyleSheet.absoluteFillObject}
            javaScriptEnabled
            allowsInlineMediaPlayback
        />
    );
}
```

> **Note:** When using `source={{ html }}`, `window.location.search` is empty.  
> Either pass the message via `injectedJavaScriptBeforeContentLoaded` or call  
> `sendFirstMessage` and `applyStartPage` directly from a custom injected snippet.

**Calling the helpers directly (recommended for Expo):**

```tsx
const inject = `
  (function() {
    var fm   = ${JSON.stringify(fm)};
    var page = ${JSON.stringify(page)};
    if (page) {
      var d = window.delphi;
      if (d && d.page) d.page.overrides = { landingPage: page };
    }
    if (fm) {
      ${FIRST_MESSAGE_SCRIPT}
      sendFirstMessage(fm);   // call the exported helper directly
    }
  })();
  true;
`;
```

---

### Ionic / Capacitor

Capacitor runs your web app inside a native WebView — the script works exactly like
a regular browser page.

```ts
// src/app/chat/chat.page.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-chat',
    template: `
        <ion-content>
            <div
                id="delphi-container"
                style="height: 100vh"
            ></div>
        </ion-content>
    `,
})
export class ChatPage implements OnInit {
    constructor(private route: ActivatedRoute) {}

    ngOnInit() {
        const fm = this.route.snapshot.queryParams['q'] ?? '';
        const page = this.route.snapshot.queryParams['page'] ?? 'OVERVIEW';

        // Delphi loader config
        const cfg = document.createElement('script');
        cfg.id = 'delphi-page-script';
        cfg.textContent = `window.delphi = { page: {
      config: "${environment.delphiConfigId}",
      overrides: { landingPage: "${page}" },
      container: { selector: "#delphi-container", width: "100%", height: "100vh" }
    }};`;
        document.body.appendChild(cfg);

        const loader = document.createElement('script');
        loader.src = 'https://embed.delphi.ai/loader.js';
        loader.async = true;
        document.body.appendChild(loader);

        // The delphi-first-message.js script reads ?q and ?page from the URL
        // automatically — just ensure the route has them as query params.
    }
}
```

Include the script in `src/index.html`:

```html
<script src="assets/delphi-first-message.js"></script>
```

Copy `dist/delphi-first-message.js` to `src/assets/`.

---

### Flutter (webview_flutter / flutter_inappwebview)

```dart
// chat_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

class ChatScreen extends StatefulWidget {
  final String firstMessage;
  final String startPage;
  const ChatScreen({super.key, this.firstMessage = '', this.startPage = 'OVERVIEW'});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  InAppWebViewController? _controller;

  // Paste the contents of dist/delphi-first-message.js here
  static const String _firstMessageScript = r'''
    /* paste dist/delphi-first-message.js contents here */
  ''';

  @override
  Widget build(BuildContext context) {
    final fm   = Uri.encodeComponent(widget.firstMessage);
    final page = widget.startPage;

    // Shell page that sets up the Delphi loader
    final html = '''
      <!DOCTYPE html><html>
      <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;height:100vh">
        <div id="delphi-container" style="height:100vh"></div>
        <script id="delphi-page-script">
          window.delphi = { page: {
            config: "YOUR_DELPHI_CONFIG_ID",
            overrides: { landingPage: "$page" },
            container: { selector: "#delphi-container", width:"100%", height:"100vh" }
          }};
        <\/script>
        <script src="https://embed.delphi.ai/loader.js"><\/script>
      </body></html>
    ''';

    return Scaffold(
      body: InAppWebView(
        initialData: InAppWebViewInitialData(
          data: html,
          baseUrl: WebUri('https://yourapp.com'),  // needed for same-origin loader
        ),
        onWebViewCreated: (c) => _controller = c,
        onLoadStop: (c, url) async {
          // Inject the first-message script after the page is ready
          await c.evaluateJavascript(source: _firstMessageScript);
          // Manually trigger with the message since location.search is empty
          if (widget.firstMessage.isNotEmpty) {
            await c.evaluateJavascript(source: '''
              (function(){
                var fm = ${jsonEncode(widget.firstMessage)};
                // Script is already injected above — call sendFirstMessage directly
                // if you expose it, or re-run init with a patched location
                Object.defineProperty(window, 'location', {
                  value: Object.assign({}, window.location, {
                    search: '?q=' + encodeURIComponent(fm) + '&page=$page'
                  })
                });
              })();
            ''');
          }
        },
        initialSettings: InAppWebViewSettings(
          javaScriptEnabled: true,
          mediaPlaybackRequiresUserGesture: false,
          allowsInlineMediaPlayback: true,
        ),
      ),
    );
  }
}
```

> For Flutter, the simplest integration is to call the helper functions directly  
> rather than relying on `window.location.search`, since `initialData` doesn't  
> populate `location.search`. See the React Native pattern above for reference.

---

## Demo Page

```bash
# From the delphi-first-message/ folder:
npx http-server . -p 8080

# Open:
http://localhost:8080/demo/?q=Hello&page=CHAT
```

The demo has:

- A live URL builder
- Quick example buttons
- Config ID input (persisted in sessionStorage across reloads)
- A script log panel showing exactly what `[DelphiFirstMessage]` is doing
- A `file://` warning if you open it without a server

---

## Console Logs

```
[DelphiFirstMessage] Initializing — q: "Hello", page: "CHAT"
[DelphiFirstMessage] Set landing page via window.delphi.page.overrides: CHAT
[DelphiFirstMessage] Waiting for Delphi iframe (1/20)...
[DelphiFirstMessage] Iframe document not ready (2/20)...
[DelphiFirstMessage] Found visible chat textarea — filling message...
[DelphiFirstMessage] Clicking submit — message sent!
```

---

## Troubleshooting

| Symptom                                                   | Cause                                                          | Fix                                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Nothing happens                                           | Page opened as `file://`                                       | Serve from localhost                                                             |
| `cross-origin` warning                                    | Direct `<iframe src>` from different domain                    | Switch to the loader script approach                                             |
| `Script tag with id 'delphi-page-script' not found`       | Config `<script>` tag is missing `id="delphi-page-script"`     | Add the ID — see Quick Start                                                     |
| `Invalid or missing Delphi object`                        | `window.delphi` deleted before loader ran (React StrictMode)   | Use `useRef` guard and don't `delete window.delphi` in cleanup — see React hooks |
| `iframe not found`                                        | `CONTAINER_ID` mismatch                                        | Check `window.delphi.page.container.selector` matches `CONTAINER_ID`             |
| `chat input not found after 20 attempts`                  | Embed not on chat page                                         | Add `?page=CHAT` to the URL                                                      |
| Message fills but doesn't submit                          | Submit button selector changed                                 | Increase `SEND_DELAY_MS` or inspect the button's classes                         |

---
