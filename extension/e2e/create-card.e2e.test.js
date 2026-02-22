import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer';
import path from 'path';

const EXTENSION_PATH = path.resolve(__dirname, '..', '..', 'dist');

describe('CardCast Extension E2E', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Show the browser for debugging
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should create a link card and post it', async () => {
    // NOTE: Replace with a valid session cookie
    const sessionCookie = {
      name: 'session',
      value: 'your-session-cookie-value',
      domain: '.bsky.app',
      path: '/',
      httpOnly: true,
      secure: true,
    };

    await page.setCookie(sessionCookie);

    // Navigate to bsky.app
    await page.goto('https://bsky.app');

    // Find the composer and type a URL
    const composer = await page.waitForSelector(
      'textarea[data-testid="composer-text-area"]'
    );
    await composer.type('https://example.com');

    // Verify the link card preview appears
    const linkCardPreview = await page.waitForSelector(
      '[data-testid="link-card-preview"]'
    );
    expect(linkCardPreview).toBeDefined();

    // Click the "Post" button
    const postButton = await page.waitForSelector(
      'button[data-testid="post-button"]'
    );
    await postButton.click();

    // Confirm the post was successful
    // This is a simplified confirmation. In a real test, you would
    // wait for a specific success message or element.
    await page.waitForTimeout(3000);
  });
});
