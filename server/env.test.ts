import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv } from './env';

describe('getEnv', () => {
  const originalEnv = process.env;
  const originalGlobalEnv = global.__bsext_env;

  beforeEach(() => {
    // Clear the global cache before each test
    global.__bsext_env = undefined;
    // Reset process.env to original state
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original global state
    global.__bsext_env = originalGlobalEnv;
    process.env = originalEnv;
  });

  it('should return fallback secret when NODE_ENV=test and EXTENSION_SHARED_SECRET is missing', () => {
    // Set NODE_ENV to test and remove EXTENSION_SHARED_SECRET to trigger fallback
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
    };
    delete process.env.EXTENSION_SHARED_SECRET;
    // Clear any cached env
    global.__bsext_env = undefined;

    const env = getEnv();

    expect(env.EXTENSION_SHARED_SECRET).toBe('test-secret-key-0000');
    expect(env.NODE_ENV).toBe('test');
  });

  it('should use provided EXTENSION_SHARED_SECRET when valid and NODE_ENV=test', () => {
    // Set NODE_ENV to test and a valid EXTENSION_SHARED_SECRET (at least 16 chars)
    process.env = {
      ...process.env,
      NODE_ENV: 'test',
      EXTENSION_SHARED_SECRET: 'valid-secret-key-12345',
    };
    // Clear any cached env
    global.__bsext_env = undefined;

    const env = getEnv();

    expect(env.EXTENSION_SHARED_SECRET).toBe('valid-secret-key-12345');
    expect(env.NODE_ENV).toBe('test');
  });
});
