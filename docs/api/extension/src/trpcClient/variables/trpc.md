[**CardCast API Reference**](../../../../README.md)

***

[CardCast API Reference](../../../../README.md) / [extension/src/trpcClient](../README.md) / trpc

# Variable: trpc

> `const` **trpc**: `CreateTRPCReactBase`\<`BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `og`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `fetch`: `QueryProcedure`\<\{ `input`: \{ `url`: ...; \}; `output`: \{ `title`: ...; `description`: ...; `imageUrl`: ...; \}; `meta`: `object`; \}\>; \}\>\>; `post`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `create`: `MutationProcedure`\<\{ `input`: \{ `text`: ...; `url`: ...; `title`: ...; `description`: ...; `imageUrl`: ...; `accessJwt`: ...; `did`: ...; \}; `output`: \{ `success`: ...; `uri`: ...; `thumbUploaded`: ...; \}; `meta`: `object`; \}\>; \}\>\>; `auth`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `login`: `MutationProcedure`\<\{ `input`: \{ `identifier`: ...; `appPassword`: ...; \}; `output`: \{ `did`: ...; `accessJwt`: ...; `handle`: ...; \}; `meta`: `object`; \}\>; `status`: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `loggedIn`: ...; `session`: ...; \}; `meta`: `object`; \}\>; \}\>\>; \}\>\>, `unknown`\> & `DecorateRouterRecord`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `og`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `fetch`: `QueryProcedure`\<\{ `input`: \{ `url`: `string`; \}; `output`: \{ `title`: `string`; `description`: `string`; `imageUrl`: `string`; \}; `meta`: `object`; \}\>; \}\>\>; `post`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `create`: `MutationProcedure`\<\{ `input`: \{ `text`: `string`; `url`: `string`; `title`: `string`; `description`: `string`; `imageUrl`: `string`; `accessJwt`: `string`; `did`: `string`; \}; `output`: \{ `success`: `true`; `uri`: `string`; `thumbUploaded`: `boolean`; \}; `meta`: `object`; \}\>; \}\>\>; `auth`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `login`: `MutationProcedure`\<\{ `input`: \{ `identifier`: `string`; `appPassword`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; \}; `meta`: `object`; \}\>; `status`: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `loggedIn`: `boolean`; `session`: ... \| ...; \}; `meta`: `object`; \}\>; \}\>\>; \}\>\>

Defined in: [extension/src/trpcClient.ts:38](https://github.com/chejholloway/CardCast/blob/9b5c2d8940a6bd300a7c82f22545888a260b1c47/extension/src/trpcClient.ts#L38)

tRPC React client instance

Provides hooks for:
- Queries: useQuery
- Mutations: useMutation
- Utilities: useContext, useUtils

## Example

```ts
const { data } = trpc.auth.status.useQuery();
const loginMutation = trpc.auth.login.useMutation();
```
