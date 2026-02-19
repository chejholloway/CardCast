[**CardCast API Reference**](../../../../README.md)

***

[CardCast API Reference](../../../../README.md) / server/trpc/routers/post

# server/trpc/routers/post

## Fileoverview

Bluesky post creation router.

This router handles creating Bluesky posts with Open Graph link cards.
It:
- Accepts post text, URL, and OG metadata
- Downloads and uploads the OG image as a blob to Bluesky
- Creates an app.bsky.feed.post record with app.bsky.embed.external embed
- Falls back to text-only posts if image upload fails
- Includes 10-second timeouts for image fetch and post creation

## Type Aliases

- [PostCreateInput](type-aliases/PostCreateInput.md)
- [PostCreateOutput](type-aliases/PostCreateOutput.md)

## Variables

- [postRouter](variables/postRouter.md)
