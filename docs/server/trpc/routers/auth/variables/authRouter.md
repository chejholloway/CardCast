[**CardCast API Reference**](../../../../../README.md)

---

[CardCast API Reference](../../../../../README.md) / [server/trpc/routers/auth](../README.md) / authRouter

# Variable: authRouter

> `const` **authRouter**: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `login`: `MutationProcedure`\<\{ `input`: \{ `identifier`: `string`; `appPassword`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; `refreshJwt`: `string`; \}; `meta`: `object`; \}\>; `refresh`: `MutationProcedure`\<\{ `input`: \{ `refreshJwt`: `string`; `did`: `string`; `handle`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; `refreshJwt`: `string`; \}; `meta`: `object`; \}\>; `status`: `QueryProcedure`\<\{ `input`: \{ `did?`: `string`; \}; `output`: \{ `loggedIn`: `boolean`; `session`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; `refreshJwt`: `string`; \} \| `null`; \}; `meta`: `object`; \}\>; `resumeSession`: `MutationProcedure`\<\{ `input`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; `refreshJwt`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; `refreshJwt`: `string`; \}; `meta`: `object`; \}\>; `logout`: `MutationProcedure`\<\{ `input`: \{ `did`: `string`; \}; `output`: \{ `success`: `boolean`; \}; `meta`: `object`; \}\>; \}\>\>

Defined in: [server/trpc/routers/auth.ts:52](https://github.com/chejholloway/CardCast/blob/dde7118ed315bdcdfbf6e6c7994fba4829e3634a/server/trpc/routers/auth.ts#L52)

Authentication Router

Provides Bluesky login, session refresh, and session status endpoints.
All procedures require the x-extension-secret header (protectedProcedure).
