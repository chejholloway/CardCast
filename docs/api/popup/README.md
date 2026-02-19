[**CardCast API Reference**](../README.md)

***

[CardCast API Reference](../README.md) / popup

# popup

Extension popup UI for managing authentication and allowed domains

Provides a user-friendly interface for:
- Bluesky login/logout with handle and app passwords
- Managing whitelist of allowed domains for card creation
- Current authentication status display

Persists authentication state in chrome.storage.session and domain list
in chrome.storage.session.

## Requires

React, react-dom, QueryClient, tRPC
