[**CardCast API Reference**](../README.md)

---

[CardCast API Reference](../README.md) / background

# background

Service worker for the Bluesky Link Card extension

Handles message routing from content scripts and popup, manages tRPC calls,
and persists authentication state in chrome.storage.session.

Message types handled:

- `FETCH_OG`: Fetch Open Graph metadata for a URL
- `CREATE_POST`: Create a Bluesky post with metadata embed
- `AUTH_LOGIN`: Authenticate with Bluesky handle and app password
- `AUTH_STATUS`: Get current authentication status

All responses are sent via callback with `{ ok: boolean, data?, error? }` shape.
