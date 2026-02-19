[**CardCast API Reference**](../../../../../README.md)

***

[CardCast API Reference](../../../../../README.md) / [server/trpc/routers/og](../README.md) / ogRouter

# Variable: ogRouter

> `const` **ogRouter**: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `fetch`: `QueryProcedure`\<\{ `input`: \{ `url`: `string`; \}; `output`: \{ `title`: `string`; `description`: `string`; `imageUrl`: `string`; \}; `meta`: `object`; \}\>; \}\>\>

Defined in: [server/trpc/routers/og.ts:114](https://github.com/chejholloway/CardCast/blob/9b5c2d8940a6bd300a7c82f22545888a260b1c47/server/trpc/routers/og.ts#L114)

Open Graph Metadata Router

Provides procedures for fetching and parsing OG metadata from whitelisted domains.
All procedures require the x-extension-secret header (protectedProcedure).
