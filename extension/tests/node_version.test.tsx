import { test, expect } from 'vitest';

test('node version is printed for CI visibility', () => {
  // CI visibility: print node version during test run
  // eslint-disable-next-line no-console
  console.log('Node version during CI:', process.version);
  expect(typeof process.version).toBe('string');
  // Pass trivially
  expect(true).toBe(true);
});
