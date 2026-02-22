# How to Create a Project Website with GitHub Pages

This guide explains how to create a free project website using GitHub Pages to host your API documentation.

### 1. Generate the Documentation

First, make sure your API documentation is up-to-date by running the following command:

```bash
npm run docs
```

This will generate a static website in the `docs/api` directory.

### 2. Push to GitHub

Make sure your latest code, including the `docs/api` directory, is pushed to your GitHub repository.

### 3. Configure GitHub Pages

1.  Navigate to your repository on GitHub.
2.  Click on the **Settings** tab.
3.  In the left sidebar, click on **Pages**.
4.  Under **Build and deployment**, for the **Source**, select **Deploy from a branch**.
5.  Under **Branch**, select your main branch (e.g., `main` or `master`) and the `/docs` folder, then click **Save**.

### 4. Access Your Site

GitHub will build and deploy your site. After a few minutes, you'll see a message with the URL of your new project website. It will look something like `https://<your-username>.github.io/<your-repository-name>/api/`.
