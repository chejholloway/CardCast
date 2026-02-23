# CardCast Style Guide

This document outlines the coding conventions and best practices for the CardCast project. Adhering to these guidelines will help us maintain a high level of code quality, consistency, and maintainability.

## File and Folder Structure

The project is a monorepo with the following structure:

- **/app**: The Next.js application.
- **/extension**: The browser extension.
- **/server**: The tRPC backend server.

### General Guidelines

- **Feature-based organization**: Group files by feature rather than by type. For example, everything related to user authentication should be in a single `auth` folder.
- **Colocation**: Keep related files together. For example, a React component and its styles and tests should be in the same folder.
- **Single responsibility**: Each file should have a single, clear purpose. Avoid creating large, monolithic files.

## Naming Conventions

- **Components**: Use PascalCase for React components (e.g., `PostCreationModal`).
- **Functions**: Use camelCase for functions (e.g., `createPost`).
- **Variables**: Use camelCase for variables (e.g., `userProfile`).
- **Interfaces and Types**: Use PascalCase for interfaces and type aliases (e.g., `UserProfile`).
- **Files**: Use camelCase for files (e.g., `postCreationModal.tsx`).
- **Folders**: Use kebab-case for folders (e.g., `user-authentication`).

## TypeScript Usage and Best Practices

- **Strict mode**: Always enable `strict` mode in `tsconfig.json`.
- **Type inference**: Leverage TypeScript's type inference as much as possible.
- **Explicit types**: Be explicit with types for function arguments and return values.
- **`any` type**: Avoid using the `any` type. Use `unknown` instead and perform type checking.
- **Zod for validation**: Use Zod for runtime validation of data, especially for API responses and user input.
- **Discriminated unions**: Use discriminated unions to model mutually exclusive states.
- **Enums**: Avoid using `enum`. Use string literal unions instead.

## React Component Patterns

- **Functional components**: Use functional components with hooks.
- **Container/Presentational pattern**: Separate components into container components (for logic) and presentational components (for UI).
- **Custom hooks**: Extract reusable logic into custom hooks.
- **Props**:
  - Use destructuring to access props.
  - Provide default values for optional props.
- **State**:
  - Use the `useState` hook for simple component state.
  - Use the `useReducer` hook for complex state logic.

## State Management Guidelines

- **React Query**: Use React Query for managing server state.
- **Zustand**: For complex client-side state that needs to be shared across multiple components, use Zustand.
- **Component state**: For state that is local to a single component, use React's built-in state management features (`useState`, `useReducer`).

## Testing Conventions

- **Vitest**: Use Vitest as the testing framework.
- **React Testing Library**: Use React Testing Library for testing React components.
- **MSW (Mock Service Worker)**: Use MSW to mock API requests in tests.
- **Test file location**: Test files should be located next to the file they are testing (e.g., `MyComponent.test.tsx`).
- **Test coverage**: Aim for high test coverage for all critical parts of the application.
- **E2E tests**: Use Puppeteer for end-to-end tests.

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. Each commit message consists of a **header**, a **body**, and a **footer**.

```
<type>[optional scope]: <description>

[optional body]

[optional footer]
```

- **type**: Must be one of the following:
  - `feat`: A new feature
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **scope**: The scope should be the name of the npm package affected (as perceived by the person reading the changelog generated from the commit messages).
- **description**: The description contains a succinct description of the change.
