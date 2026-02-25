/// <reference types="chrome" />

import { renderHook, waitFor } from '@testing-library/react';
import { useSession } from './useSession';
import { vi } from 'vitest';

// Mock the chrome API
const mockSessionData = {
  session: { did: 'did:plc:123', handle: 'test.bsky.social' },
  theme: 'dark',
};

describe('useSession', () => {
  beforeEach(() => {
    (vi as any).clearAllMocks();
  });

  it('should return loading: true on initial render', () => {
    (chrome.storage.session.get as any).mockImplementation(
      (_keys: string[], _callback: (items: { [key: string]: any }) => void) => {
        // Do not resolve the promise to keep it in a loading state
      }
    );
    const { result } = renderHook(() => useSession());
    expect(result.current.loading).toBe(true);
  });

  it('should return session and theme data on successful fetch', async () => {
    (chrome.storage.session.get as any).mockImplementation(
      (_keys: string[], callback: (items: { [key: string]: any }) => void) => {
        callback(mockSessionData);
      }
    );

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session).toEqual(mockSessionData.session);
      expect(result.current.theme).toEqual(mockSessionData.theme);
    });
  });

  it('should return null session and default theme if data is missing', async () => {
    (chrome.storage.session.get as any).mockImplementation(
      (_keys: string[], callback: (items: { [key: string]: any }) => void) => {
        callback({});
      }
    );

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.theme).toBe('light'); // Assuming 'light' is the default
    });
  });

  it('should return null session and default theme if data is invalid', async () => {
    (chrome.storage.session.get as any).mockImplementation(
      (_keys: string[], callback: (items: { [key: string]: any }) => void) => {
        callback({ session: 'invalid' });
      }
    );

    const { result } = renderHook(() => useSession());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.theme).toBe('light');
    });
  });
});
