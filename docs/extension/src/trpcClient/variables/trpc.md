[**CardCast API Reference**](../../../../README.md)

---

[CardCast API Reference](../../../../README.md) / [extension/src/trpcClient](../README.md) / trpc

# Variable: trpc

> `const` **trpc**: `"The property 'useContext' in your router collides with a built-in method, rename this router or procedure on your backend."` \| `"The property 'useUtils' in your router collides with a built-in method, rename this router or procedure on your backend."` \| `"The property 'Provider' in your router collides with a built-in method, rename this router or procedure on your backend."` \| `"The property 'createClient' in your router collides with a built-in method, rename this router or procedure on your backend."` \| `"The property 'useQueries' in your router collides with a built-in method, rename this router or procedure on your backend."` \| `"The property 'useSuspenseQueries' in your router collides with a built-in method, rename this router or procedure on your backend."`

Defined in: [extension/src/trpcClient.ts:31](https://github.com/chejholloway/CardCast/blob/dde7118ed315bdcdfbf6e6c7994fba4829e3634a/extension/src/trpcClient.ts#L31)

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
