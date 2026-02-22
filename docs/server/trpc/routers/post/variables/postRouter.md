[**CardCast API Reference**](../../../../../README.md)

---

[CardCast API Reference](../../../../../README.md) / [server/trpc/routers/post](../README.md) / postRouter

# Variable: postRouter

> `const` **postRouter**: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `create`: `MutationProcedure`\<\{ `input`: \{ `text`: `string`; `url`: `string`; `title`: `string`; `description`: `string`; `imageUrl`: `string`; `accessJwt`: `string`; `did`: `string`; `handle`: `string`; `refreshJwt`: `string`; \}; `output`: \{ `success`: `true`; `uri`: `string`; `thumbUploaded`: `boolean`; \}; `meta`: `object`; \}\>; \}\>\>

Defined in: [server/trpc/routers/post.ts:97](https://github.com/chejholloway/CardCast/blob/dde7118ed315bdcdfbf6e6c7994fba4829e3634a/server/trpc/routers/post.ts#L97)

Bluesky Post Creation Router

Provides procedures for creating posts with link embeds.
All procedures require the x-extension-secret header (protectedProcedure).
