[**CardCast API Reference**](../../../../README.md)

***

[CardCast API Reference](../../../../README.md) / [extension/src/trpcClient](../README.md) / trpcClient

# Variable: trpcClient

> `const` **trpcClient**: `TRPCClient`\<`BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `og`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `fetch`: `QueryProcedure`\<\{ `input`: \{ `url`: `string`; \}; `output`: \{ `title`: `string`; `description`: `string`; `imageUrl`: `string`; \}; `meta`: `object`; \}\>; \}\>\>; `post`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `create`: `MutationProcedure`\<\{ `input`: \{ `text`: `string`; `url`: `string`; `title`: `string`; `description`: `string`; `imageUrl`: `string`; `accessJwt`: `string`; `did`: `string`; \}; `output`: \{ `success`: `true`; `uri`: `string`; `thumbUploaded`: `boolean`; \}; `meta`: `object`; \}\>; \}\>\>; `auth`: `BuiltRouter`\<\{ `ctx`: `TRPCContext`; `meta`: `object`; `errorShape`: `DefaultErrorShape`; `transformer`: `false`; \}, `DecorateCreateRouterOptions`\<\{ `login`: `MutationProcedure`\<\{ `input`: \{ `identifier`: `string`; `appPassword`: `string`; \}; `output`: \{ `did`: `string`; `accessJwt`: `string`; `handle`: `string`; \}; `meta`: `object`; \}\>; `status`: `QueryProcedure`\<\{ `input`: `void`; `output`: \{ `loggedIn`: `boolean`; `session`: ... \| ...; \}; `meta`: `object`; \}\>; \}\>\>; \}\>\>\>

Defined in: [extension/src/trpcClient.ts:54](https://github.com/chejholloway/CardCast/blob/9b5c2d8940a6bd300a7c82f22545888a260b1c47/extension/src/trpcClient.ts#L54)

Configured tRPC client with httpBatchLink

Features:
- Batches multiple requests into single HTTP call for efficiency
- Includes x-extension-secret header for authentication
- Uses NEXT_PUBLIC_BACKEND_URL as API endpoint

## Example

```ts
const client = new QueryClient();
<trpc.Provider client={trpcClient} queryClient={client}>
  <App />
</trpc.Provider>
```
