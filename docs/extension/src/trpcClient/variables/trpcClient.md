[**CardCast API Reference**](../../../../README.md)

---

[CardCast API Reference](../../../../README.md) / [extension/src/trpcClient](../README.md) / trpcClient

# Variable: trpcClient

> `const` **trpcClient**: `any`

Defined in: [extension/src/trpcClient.ts:51](https://github.com/chejholloway/CardCast/blob/dde7118ed315bdcdfbf6e6c7994fba4829e3634a/extension/src/trpcClient.ts#L51)

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
