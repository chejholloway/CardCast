# Git Hooks & CI/CD Setup

This project uses **Husky** for Git hooks and **GitHub Actions** for continuous integration and deployment.

## Git Hooks

All hooks are configured in `.husky/` and run automatically on Git events.

### Pre-Commit Hook (`.husky/pre-commit`)

**Trigger**: Runs before committing code  
**Actions**:

- Formats staged files with Prettier
- Lints with Oxlint (with auto-fix)
- Type checks with TypeScript

**What it does**:

```bash
npm run lint:staged
```

**Configuration** in `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx,js,jsx}": [
    "prettier --write",
    "oxlint --fix"
  ],
  "*.{json,md,css}": "prettier --write",
  "*.ts": "tsc --noEmit"
}
```

**Skip the hook** (not recommended):

```bash
git commit --no-verify
```

### Commit Message Hook (`.husky/commit-msg`)

**Trigger**: Validates commit message format  
**Actions**:

- Enforces Conventional Commits format
- Allows merge and revert commits

**Valid commit message format**:

```
type(scope): description
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`

**Examples**:

```bash
git commit -m "feat(extension): add domain management"
git commit -m "fix(backend): resolve OG fetch timeout"
git commit -m "docs: update API reference"
git commit -m "refactor(trpc): simplify error handling"
```

**Skip the hook** (not recommended):

```bash
git commit --no-verify
```

### Pre-Push Hook (`.husky/pre-push`)

**Trigger**: Runs before pushing to remote  
**Actions**:

1. Type check entire codebase with TypeScript
2. Run full test suite

**What it does**:

```bash
npm run typecheck
npm test -- --run
```

**Skip the hook** (not recommended):

```bash
git push --no-verify
```

## Setup Instructions

### For New Developers

After cloning the repo, run:

```bash
npm install
```

This automatically runs the `prepare` script which installs Husky:

```json
"scripts": {
  "prepare": "husky install"
}
```

### Manual Installation (if needed)

```bash
npm install husky lint-staged --save-dev
npx husky install
```

## GitHub Actions Workflows

All workflows are defined in `.github/workflows/`. They provide automated quality checks and deployment automation.

### 1. CI Workflow (`ci.yml`)

**Trigger**: On `push` and `pull_request` to `main` or `dev` branches

**Jobs**:

- ✅ **Quality**: Oxlint, TypeScript, ESLint, builds
- ✅ **Tests**: Vitest unit and integration tests with coverage
- ✅ **Build**: Next.js production build verification

**On Failure**:

- PR blocks merge until all checks pass
- Developers are notified of failures

### 2. Documentation Workflow (`docs.yml`)

**Trigger**: On `push` to `main` when source files change

**Actions**:

- Generates API documentation with TypeDoc
- Auto-commits and pushes updated docs to `docs/api/`

**No manual action needed** - docs stay in sync automatically!

### 3. Release Workflow (`release.yml`)

**Trigger**: On `push` with tag matching `v*` (e.g., `v1.0.0`)

**Jobs**:

- Quality checks (same as CI)
- Creates GitHub Release with changelog
- (Optional) Deploy to Vercel

**To create a release**:

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 4. Security Workflow (`security.yml`)

**Trigger**:

- Daily at 2 AM UTC
- On changes to `package.json`

**Actions**:

- Runs `npm audit` for vulnerable dependencies
- CodeQL static analysis

## Local Development Workflow

### Daily Development

```bash
# 1. Make changes
git add .

# 2. Commit (pre-commit hook runs automatically)
git commit -m "feat(extension): add new feature"
# ✅ Prettier formats files
# ✅ Oxlint checks code
# ✅ TypeScript type-checks

# 3. Push (pre-push hook runs automatically)
git push
# ✅ Type checking
# ✅ Tests run
# ✅ If all pass, pushed to remote

# 4. PR opens on GitHub
# GitHub Actions CI runs automatically
```

### Troubleshooting

#### Hooks not running?

Reinstall Husky:

```bash
npm install
npm run prepare
```

#### Oxlint errors blocking commit?

Either fix them or auto-fix:

```bash
npm run lint -- --fix
npx lint-staged --allow-empty
```

#### Tests failing before push?

See test output and fix:

```bash
npm test
```

#### Commit message rejected?

Use conventional format:

```bash
git commit -m "feat(scope): description"
```

#### Git hook permissions issue? (Linux/Mac)

Make hooks executable:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

## Configuration Files

- **`.husky/`** - Git hook scripts
- **`.github/workflows/`** - GitHub Actions workflows
- **`package.json`** - lint-staged config and npm scripts
- **`.prettierrc`** - Prettier formatting rules
- **`.oxlintrc.json`** - Oxlint configuration
- **`tsconfig.json`** - TypeScript configuration

## NPM Scripts Reference

```bash
npm run lint                # Run Oxlint
npm run lint:staged         # Run lint-staged (pre-commit hook)
npm run typecheck           # TypeScript type checking
npm run test                # Run all tests
npm run test:coverage       # Generate coverage report
npm run build:ext           # Build extension
npm run build:css           # Build Tailwind CSS
npm run docs                # Generate API documentation
npm run docs:watch          # Watch mode for docs generation
```

## Best Practices

1. ✅ **Let hooks do their work** - Don't use `--no-verify` unless absolutely necessary
2. ✅ **Keep commits focused** - One feature or fix per commit
3. ✅ **Use conventional commits** - Helps with automated changelog generation
4. ✅ **Run tests locally** - `npm test` before pushing
5. ✅ **Keep branches updated** - `git pull --rebase` before pushing
6. ✅ **Write meaningful commit messages** - Helps future developers understand changes

## Continuous Integration Status

Once merged to `main`, all commits are automatically:

- ✅ Linted with Oxlint
- ✅ Type-checked with TypeScript
- ✅ Tested with Vitest
- ✅ Built for both backend and extension

Check [GitHub Actions](../../actions) for workflow status and logs.

---

For questions or issues with Git hooks or CI/CD, please file an issue or contact the maintainers.
