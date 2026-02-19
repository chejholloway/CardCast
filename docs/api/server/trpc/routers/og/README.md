[**CardCast API Reference**](../../../../README.md)

***

[CardCast API Reference](../../../../README.md) / server/trpc/routers/og

# server/trpc/routers/og

## Fileoverview

Open Graph metadata fetching router.

This router fetches and parses Open Graph (OG) metadata from allowed domains.
It includes:
- Domain whitelist validation (thehill.com, theroot.com, usanews.com)
- Rate limiting (10 requests per minute per IP)
- 5-second timeout for all fetch operations
- Cheerio-based HTML parsing for OG tags

## Type Aliases

- [OgFetchInput](type-aliases/OgFetchInput.md)
- [OgFetchOutput](type-aliases/OgFetchOutput.md)

## Variables

- [ogRouter](variables/ogRouter.md)
