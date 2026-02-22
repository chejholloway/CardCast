[**CardCast API Reference**](../../../README.md)

---

[CardCast API Reference](../../../README.md) / server/trpc/base

# server/trpc/base

## Fileoverview

tRPC base setup and middleware for CardCast.

This module sets up:

- tRPC router and procedures
- Authentication middleware for shared-secret verification
- CORS origin validation (optional)

All protected procedures require the x-extension-secret header.

## Variables

- [t](variables/t.md)
- [router](variables/router.md)
- [publicProcedure](variables/publicProcedure.md)
- [protectedProcedure](variables/protectedProcedure.md)
