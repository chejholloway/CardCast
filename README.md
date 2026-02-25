# CardCast - Bluesky Link Card Extension

CardCast is a browser extension that enhances the [Bluesky](https://bsky.app) web client by allowing you to create and post rich "link cards" from URLs. It's built with a modern tech stack designed for security, performance, and type-safety.

The project consists of two main parts:

1.  **A Manifest V3 Browser Extension**: Built with React, TypeScript, and Vite. It injects the card composer UI into the Bluesky website.
2.  **A Next.js Backend**: A server-side application deployed to Vercel that handles fetching Open Graph metadata, processing images, and interacting with the Bluesky API.

## Tech Stack

- **Frameworks**: Next.js 14 (App Router), React
- **Languages**: TypeScript
- **API**: tRPC v11
- **Styling**: Tailwind CSS
- **Testing**: Vitest, React Testing Library, MSW
- **Bundler**: Vite
- **CI/CD**: GitLab CI
- **Deployment**: Vercel

## Features

- **Rich Link Previews**: Automatically fetches Open Graph data (title, description, image) from a URL to generate a card preview.
- **Secure & Isolated**: The extension communicates with a dedicated backend via a shared secret, ensuring that API calls are authenticated.
- **Type-Safe**: End-to-end type safety between the extension and the backend is guaranteed by tRPC.
- **Rate Limiting**: The backend uses Vercel KV to enforce rate limiting and prevent abuse.
- **Image Handling**: Fetches, validates, and compresses images before uploading them to Bluesky.
- **CI/CD Pipeline**: A complete GitLab CI pipeline that runs tests, performs security scans (`npm audit`, Trivy), and deploys the backend to Vercel.

## Getting Started

### Prerequisites

- Node.js v20.11.0 or later
- npm

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd CardCast
npm install
```

### 2. Environment Setup

Create a `.env` file in the root of the project by copying the example file. This file is required to run the backend.

```bash
cp .env.example .env
```

You will need to fill in the `EXTENSION_SHARED_SECRET` with a secure, random string.

### 3. Running the Backend

Start the Next.js development server:

```bash
npm run dev
```

The backend will be available at `http://localhost:3000`.

### 4. Building and Loading the Extension

In a separate terminal, run the build command for the extension:

```bash
npm run build:ext
```

This will compile the extension source code into the `extension/dist` directory.

To load the extension in your browser (Chrome, Edge, etc.):

1.  Navigate to `chrome://extensions`.
2.  Enable "Developer mode".
3.  Click "Load unpacked".
4.  Select the `extension/dist` directory.

## Testing

Run the full test suite, including unit and integration tests:

```bash
npm test
```

To run the type checker:

```bash
npm run typecheck
```
