[**CardCast API Reference**](../../../../../README.md)

---

[CardCast API Reference](../../../../../README.md) / [server/trpc/routers/og](../README.md) / ogRouter

# Variable: ogRouter

> `const` **ogRouter**: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `fetch`: `QueryProcedure`\<\{ `input`: \{ `url`: `string`; \}; `output`: \{ `title`: `string`; `description`: `string`; `imageUrl`: `string`; \}; `meta`: `object`; \}\>; \}\>\>

Defined in: [server/trpc/routers/og.ts:88](https://github.com/chejholloway/CardCast/blob/dde7118ed315bdcdfbf6e6c7994fba4829e3634a/server/trpc/routers/og.ts#L88)

Open Graph Metadata Router

Provides procedures for fetching and parsing OG metadata from whitelisted domains.
All procedures require the x-extension-secret header (protectedProcedure).
