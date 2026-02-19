[**CardCast API Reference**](../README.md)

***

[CardCast API Reference](../README.md) / contentScript

# contentScript

Content script injected into bsky.app DOM

Detects URLs in the Bluesky composer and injects a link card preview component.
Uses mutation observers to watch for URL changes and mounts the LinkCardComposer
when a supported domain URL is detected.

Features:
- Real-time theme detection (dark/light mode)
- Metadata fetching with loading/error states
- Post creation with rich link embeds
- Domain whitelisting with configurable allowed list

## Requires

React, react-dom, QueryClient, tRPC, framer-motion
