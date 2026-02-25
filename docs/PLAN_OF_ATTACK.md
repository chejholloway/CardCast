# CardCast UX Rework — Plan of Attack

## The Problem

The current popup asks users for an "application ID" to log in. Normal people don't know what that is, and they shouldn't have to. The popup also doubles as a settings panel, which means first-time users hit a wall before they see the core feature. The goal of this rework is to eliminate all that friction.

**New experience:** install → click icon → composer appears. That's it.

---

## What's Changing (and What Isn't)

| Area                | Current                              | After                                               |
| ------------------- | ------------------------------------ | --------------------------------------------------- |
| Auth                | User enters application ID manually  | Silently borrowed from existing bsky.app session    |
| Popup default view  | Login form + settings                | Composer (Bluesky RichText editor clone)            |
| Domain management   | Front and center                     | Hidden behind a gear icon                           |
| Content script role | Injects UI into bsky.app compose box | Also extracts + relays session to background worker |
| Backend (`server/`) | Unchanged                            | Unchanged                                           |
| tRPC routers        | Unchanged                            | Unchanged                                           |
| `proxy.ts`          | Unchanged                            | Unchanged                                           |

---

## Phase 1 — Silent Auth

### Strategy: Borrow the existing bsky.app session

The user is already logged into Bluesky in their browser. The content script (which already runs on `https://bsky.app/*`) can read the active session from `localStorage` and pass it to the background service worker. No credentials entered, no OAuth dance — just reuse what's already there.

**How bsky.app stores its session:**

```ts
// Key in localStorage
const raw = localStorage.getItem('bsky-storage');
const parsed = JSON.parse(raw);

// Relevant shape (may vary slightly across Bluesky versions)
// parsed.accounts = [{ did, accessJwt, refreshJwt, handle, ... }]
// parsed.currentAccount = did string
```

The content script finds the account matching `currentAccount`, extracts `{ did, accessJwt, handle }`, and sends it to the background worker via `chrome.runtime.sendMessage`. The worker stores it in `chrome.storage.session` under the key `bskySession`.

**Why this works:** It doesn't require the user to do anything, it doesn't store credentials, and `chrome.storage.session` clears automatically when the browser closes — same behavior as Bluesky's own session.

**The one risk:** If Bluesky changes the `bsky-storage` localStorage key, this breaks silently. Mitigation: add a version check and surface a clear "reconnect" prompt in the popup if the session is missing or stale.

### Files touched in Phase 1

```
extension/src/content/index.ts        ← add session extraction + sendMessage on load
extension/src/background/index.ts     ← add message listener, store session in chrome.storage.session
extension/src/popup/Popup.tsx         ← remove all login form UI; replace with session status check
```

### Session extraction flow

```
bsky.app tab loads
  → content script runs
  → reads localStorage('bsky-storage')
  → sends { type: 'BSKY_SESSION', session: { did, accessJwt, handle } } to background
  → background stores in chrome.storage.session['bskySession']
  → popup reads chrome.storage.session['bskySession'] on open
  → if present: show composer
  → if missing: show "Open Bluesky to connect" prompt
```

---

## Phase 2 — Rebuild the Popup as a Composer

The popup becomes one focused thing: a post composer that feels native to Bluesky.

### Visual target

```
┌─────────────────────────────── 420px ───┐
│                                    ⚙️   │
│  ┌─────────────────────────────────┐   │
│  │  What's happening?              │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🖼  [thumbnail]                 │   │  ← animates in on URL paste
│  │  Title of the article           │   │
│  │  Brief description text here    │   │
│  │  site.com                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│                          [ Post ↗ ]    │
└─────────────────────────────────────────┘
```

### Composer behavior, step by step

1. Popup opens → check `chrome.storage.session['bskySession']`
2. **No session:** render `<SignInPrompt />` — a single message: "Open [bsky.app](https://bsky.app) in a tab to connect CardCast." No form, no fields.
3. **Session present:** render `<Composer />` immediately
4. User types or pastes into the textarea
5. Paste event fires → regex checks for URL pattern → if match, fire `trpc.og.fetch(url)`
6. While fetching: show a subtle skeleton/shimmer below the textarea
7. On success: `<CardPreview />` animates in with Framer Motion (already in the project)
8. User edits post text above the card if they want
9. Clicks "Post" → `trpc.post.create` called with text + OG data + session tokens
10. On success: brief ✓ confirmation, composer resets after 1.5s

### Bluesky design tokens to match

These are pulled from bsky.app's actual CSS. Match these and the composer will feel native.

| Property          | Dark mode                              | Light mode          |
| ----------------- | -------------------------------------- | ------------------- |
| Background        | `#0c1016`                              | `#ffffff`           |
| Textarea bg       | `transparent`                          | `transparent`       |
| Border            | `1px solid #2a3441`                    | `1px solid #e1e8ed` |
| Border radius     | `8px`                                  | `8px`               |
| Font              | `system-ui, -apple-system, sans-serif` | same                |
| Font size         | `15px`                                 | `15px`              |
| Accent (Post btn) | `#0085ff`                              | `#0085ff`           |
| Post btn text     | `#ffffff`                              | `#ffffff`           |
| Post btn radius   | `999px`                                | `999px`             |
| Card border       | `1px solid #2a3441`                    | `1px solid #e1e8ed` |
| Card radius       | `8px`                                  | `8px`               |

Theme detection: the content script reads `document.documentElement.classList` on bsky.app (Bluesky toggles a `theme--dark` class), sends it alongside the session, and stores it in `chrome.storage.session['bskyTheme']`. The popup reads this and applies the correct Tailwind `dark` class.

### New files to create

```
extension/src/popup/components/Composer.tsx       ← main composer shell
extension/src/popup/components/CardPreview.tsx    ← OG card with Framer Motion
extension/src/popup/components/SignInPrompt.tsx   ← "open bsky.app to connect"
extension/src/popup/components/SettingsPanel.tsx  ← domain management (moved here)
extension/src/popup/hooks/useSession.ts           ← reads chrome.storage.session
extension/src/popup/hooks/useOgFetch.ts           ← wraps trpc.og.fetch + paste detection
```

### Rewritten file

```
extension/src/popup/Popup.tsx   ← stripped to a router: composer | settings views
```

---

## Phase 3 — Settings Panel

Domain management doesn't disappear — it moves. A small gear icon (⚙️) in the top-right corner of the popup toggles between the composer view and a settings view. This is a local state switch (`view: 'composer' | 'settings'`), not a new page or route.

The settings panel keeps everything it has today: add/remove allowed domains, stored in `chrome.storage.session`.

---

## Phase 4 — Manifest & Permissions Audit

The `extension/manifest.json` needs one small addition to support session extraction from bsky.app:

```json
"host_permissions": [
  "https://bsky.app/*"
],
"content_scripts": [
  {
    "matches": ["https://bsky.app/*"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }
]
```

This is likely already present given the existing content script architecture. Verify it covers the session extraction use case.

---

## What Stays the Same

- `server/` — no changes at all. The tRPC routers, auth procedures, OG fetcher, and post creator are all fine as-is.
- `proxy.ts` — unchanged
- `app/` — unchanged
- `extension/src/background/index.ts` message routing for `FETCH_OG` and `CREATE_POST` — unchanged, just add the `BSKY_SESSION` handler

---

## Delivery Order

1. Phase 1 (silent auth) — unblocks everything else
2. Phase 4 (manifest audit) — quick, do it alongside Phase 1
3. Phase 2 (composer UI) — the bulk of the work
4. Phase 3 (settings panel) — last, since it's just a move not a rewrite

Total estimated scope: **2–3 focused coding sessions.**
