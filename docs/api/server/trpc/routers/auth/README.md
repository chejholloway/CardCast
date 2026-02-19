[**CardCast API Reference**](../../../../README.md)

***

[CardCast API Reference](../../../../README.md) / server/trpc/routers/auth

# server/trpc/routers/auth

## Fileoverview

Authentication router for Bluesky login and session management.

This router handles user authentication via Bluesky credentials (handle + app password).
The backend is stateless—sessions are stored client-side in the extension's chrome.storage.session.

## Type Aliases

- [AuthLoginInput](type-aliases/AuthLoginInput.md)
- [AuthSession](type-aliases/AuthSession.md)

## Variables

- [authRouter](variables/authRouter.md)
