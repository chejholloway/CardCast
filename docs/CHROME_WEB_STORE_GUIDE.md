# How to Submit Your Extension to the Chrome Web Store

This guide explains how to package and submit your extension to the Chrome Web Store.

### 1. Package Your Extension

First, you need to create a distributable `.zip` file of your extension. The `vite-plugin-crx-mv3` plugin you installed earlier should handle this for you when you run the production build command.

```bash
npm run build:ext
```

This will create a `.zip` file in the `extension/dist` directory.

### 2. Create a Developer Account

1.  Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2.  You'll need to pay a one-time $5 registration fee to create a developer account.

### 3. Create a New Item

1.  In the developer dashboard, click on the **New Item** button.
2.  Accept the developer agreement.

### 4. Upload Your Extension

You will be prompted to upload the `.zip` file you created in step 1.

### 5. Fill in Store Listing Details

This is a crucial step to make your extension appealing to users. You'll need to provide:

*   **Description**: A clear and concise description of what your extension does.
*   **Icons**: You'll need to provide icons in various sizes (128x128, 48x48, 16x16).
*   **Screenshots**: At least one screenshot of your extension in action.
*   **Category**: Choose the most appropriate category for your extension.
*   **Privacy Policy**: You must provide a privacy policy. You can host a simple one on your GitHub Pages site.

### 6. Submit for Review

1.  Once you've filled in all the required information, you can submit your extension for review.
2.  The review process can take anywhere from a few hours to a few weeks, depending on the complexity of your extension and the current review queue.
