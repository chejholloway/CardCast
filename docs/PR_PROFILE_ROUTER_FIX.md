PR Title: Fix MSW profile option path; expose profile router in JS build 🚀

Summary:

- Exposed the TRPC profile router on the JS runtime by updating the JS router to include profileRouter. This fixes the test error: "No procedure found on path 'profile,getProfile'".

What changed:

- server/trpc/router.js: imported profileRouter and added profile: profileRouter to appRouter
- Ensured TS source already includes profileRouter in appRouter (router.ts) for consistency

Validation:

- Local typecheck passes: npm run typecheck
- Tests run with correct route available; previous failure due to missing route at runtime

How to verify locally:

- Run typecheck: npm run typecheck
- Run tests: npm test
- Or filter tests: npm test -t profile.getProfile

Impact:

- No runtime feature changes; fixes test wiring and router exposure. 🌟

Note:

- This PR is for CI visibility and documentation; the actual code fix is in the router.js patch.
