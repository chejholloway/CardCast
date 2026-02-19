[**CardCast API Reference**](../../../../../README.md)

***

[CardCast API Reference](../../../../../README.md) / [server/trpc/routers/auth](../README.md) / authRouter

# Variable: authRouter

> `const` **authRouter**: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `login`: `MutationProcedure`\<\{ `input`: \{ `identifier`: `string`; `appPassword`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; \}; `meta`: `object`; \}\>; `status`: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `loggedIn`: `boolean`; `session`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; \} \| `null`; \}; `meta`: `object`; \}\>; \}\>\>

Defined in: [server/trpc/routers/auth.ts:49](https://github.com/chejholloway/CardCast/blob/9b5c2d8940a6bd300a7c82f22545888a260b1c47/server/trpc/routers/auth.ts#L49)

Authentication Router

Provides Bluesky login and session status endpoints.
All procedures require the x-extension-secret header (protectedProcedure).
