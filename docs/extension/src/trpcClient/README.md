[**CardCast API Reference**](../../../README.md)

---

[CardCast API Reference](../../../README.md) / extension/src/trpcClient

# extension/src/trpcClient

## Fileoverview

tRPC client configuration for the browser extension.

Sets up a tRPC React client with httpBatchLink that:

- Points to the backend via NEXT_PUBLIC_BACKEND_URL
- Includes the x-extension-secret header on all requests
- Uses React Query for caching, retries, and state management

This module is used by extension React components to call the backend API.

## Variables

- [trpc](variables/trpc.md)
- [trpcClient](variables/trpcClient.md)
