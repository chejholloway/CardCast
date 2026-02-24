# Codebase Structure

This document provides a high-level overview of the project's architecture, which is composed of a Next.js web application and a browser extension.

## Root Level

Key files and directories at the root of the project:

- `app/`: The core of the **Next.js 16 application**, using the App Router.
- `server/`: Contains the **tRPC API backend**, including routers, procedures, and business logic.
- `extension/`: The source code for the **browser extension**, built with Vite.
- `docs/`: Project documentation, including this file.
- `styles/`: Global CSS styles.
- `public/`: Static assets for the Next.js application.
- `proxy.ts`: A critical middleware file that manages CORS and acts as a network boundary, allowing the extension to communicate with the backend.
- `Dockerfile`: A multi-stage Dockerfile for building an optimized, production-ready image of the Next.js application.
- `.gitlab-ci.yml`: The CI/CD pipeline configuration for GitLab, which handles testing, building, and deploying the application.
- `package.json`: Defines project scripts, dependencies, and metadata.
- `next.config.mjs`: The configuration file for Next.js, enabling features like `output: 'standalone'` for Docker optimization.

## Application Breakdown

### 1. Next.js Web Application

- **Framework**: Next.js 16 (App Router)
- **Location**: `app/`
- **Description**: The primary web interface. Its main purpose is to serve the API that the browser extension consumes.
- **API**: The backend API is built with tRPC and is located in the `server/` directory.
  - `server/trpc/base.ts`: Initializes tRPC and defines reusable procedures (public, protected).
  - `server/trpc/router.ts`: The main `appRouter` that merges all sub-routers.
  - `server/trpc/routers/`: Individual routers for different parts of the API (e.g., `auth`, `post`).

### 2. Browser Extension

- **Framework**: React + Vite
- **Location**: `extension/`
- **Description**: A Manifest V3 browser extension that interacts with the Bluesky web application.
- **Build Process**: The extension is built using Vite via the `npm run build:ext` command. The configuration is in `extension/vite.config.ts`.
- **Communication**: The extension communicates with the Next.js backend via the tRPC client, making authenticated API calls. The `proxy.ts` file on the backend is essential for allowing this cross-origin communication.

### 3. Deployment and Operations

- **Containerization**: The `Dockerfile` is configured for a highly optimized and secure build. It uses a multi-stage process and runs the application as a non-root user.
- **CI/CD**: The `.gitlab-ci.yml` file automates the entire process of testing, building, and deploying the application. It includes stages for security scanning, linting, type checking, building a Docker image, and deploying to Vercel.
