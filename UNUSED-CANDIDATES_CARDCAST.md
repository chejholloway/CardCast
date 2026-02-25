# Unused Files & Packages — CardCast

This is a first-pass inventory of likely-unused assets. Please verify before removal.

## Unused Files (candidates)

- `extension/src/contentScript.js`
  - Why: Appears to be a generated artifact or legacy build; there is a TSX source at `extension/src/contentScript.tsx`. Check manifest.json for script paths. If not used, remove the generated file or adjust build to not emit it.
  - Verification:
    - Confirm the `content_scripts` (or equivalent) entry in `extension/manifest.json` references `contentScript.js`.
    - Check that `extension/src/contentScript.tsx` exists and is the intended source.
    - Run the extension build and verify whether `contentScript.js` is produced; if not, this is a strong signal to remove.
  - Removal: Delete `extension/src/contentScript.js` after confirming no runtime reference.

- `tools/test_getProfiles.js`
  - Why: Likely a helper script no longer used by npm scripts or CI.
  - Verification:
    - grep for references to `test_getProfiles` in repo: `grep -R "test_getProfiles" -n .`
    - Check `package.json` scripts for any call to this file.
  - Removal: If no references, delete.

- Documentation files under docs
  - `docs/TESTING_GUIDE.md`
  - `docs/TESTING_QUICK_REFERENCE.md`
  - `docs/MARKED_FOR_DELETION.md`
  - Why: Docs-only assets. Keep if they’re referenced by a docs site or CI, otherwise archive/relocate.

- Git hooks
  - `.git/hooks/pre-rebase.sample`
  - Why: Sample hook, not part of normal development flow.
  - Removal: Safe to delete unless you actively reuse this pattern.

- End-to-end tests
  - `extension/e2e.test.js`
  - `e2e.test.js`
  - Why: E2E tests may not be part of local dev/CI in your setup. Verify CI config before removing.

## Unused npm packages (candidates)

- `dompurify`
- `lodash-es`
- `node-fetch`
- Why: These are listed in package.json but may not be imported/used in code. Docs in repo also flag these as candidates for removal.
  Verification:
- Search codebase for direct imports:
  - `grep -R "from 'dompurify'" -n .
- Check for any runtime references:
  - `grep -R "dompurify" -n .`
- Check usage of these packages in build/tests:
  - `npm ls dompurify lodash-es node-fetch` (while in a clean node_modules state)
- Removal: If no imports/references are found, run:
  - `npm uninstall dompurify lodash-es node-fetch`

## Notes

- This is a heuristic pass. Do not delete anything that CI, tests, or the build rely on.
- After removing, run install/build/tests to verify nothing breaks.
- If you’d like, I can tailor this list to exclude items you absolutely rely on (e.g., E2E tests or certain docs).
