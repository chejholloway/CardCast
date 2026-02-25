/// <reference types="chrome" />

import { renderHook, act } from '@testing-library/react';
import { useOgFetch } from './useOgFetch';
import { vi } from 'vitest';

const mockOgData = {
  ogTitle: 'Test Title',
  ogDescription: 'Test Description',
  ogImage: 'https://example.com/image.png',
  ogUrl: 'https://example.com',
};

describe('useOgFetch', () => {
  beforeEach(() => {
    (vi as any).clearAllMocks();
  });

  it('handlePaste should call sendMessage with FETCH_OG payload', async () => {
    const { result } = renderHook(() => useOgFetch());
    const clipboardEvent = {
      clipboardData: {
        getData: vi.fn().mockReturnValue('https://example.com'),
      },
    } as any;

    (chrome.runtime.sendMessage as any).mockImplementation(
      (_message: any, callback: (response: any) => void) => {
        callback({ data: mockOgData });
      }
    );

    await act(async () => {
      await result.current.handlePaste(clipboardEvent);
    });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'FETCH_OG', url: 'https://example.com' },
      expect.any(Function)
    );
  });

  it('should set isLoading to true during fetch and false afterward', async () => {
    const { result } = renderHook(() => useOgFetch());
    const clipboardEvent = {
      clipboardData: {
        getData: vi.fn().mockReturnValue('https://example.com'),
      },
    } as any;

    (chrome.runtime.sendMessage as any).mockImplementation(
      (_message: any, callback: (response: any) => void) => {
        setTimeout(() => callback({ data: mockOgData }), 100);
      }
    );

    const promise = act(async () => {
      await result.current.handlePaste(clipboardEvent);
    });

    expect(result.current.isLoading).toBe(true);
    await promise;
    expect(result.current.isLoading).toBe(false);
  });

  it('should populate ogData on successful response', async () => {
    const { result } = renderHook(() => useOgFetch());
    const clipboardEvent = {
      clipboardData: {
        getData: vi.fn().mockReturnValue('https://example.com'),
      },
    } as any;

    (chrome.runtime.sendMessage as any).mockImplementation(
      (_message: any, callback: (response: any) => void) => {
        callback({ data: mockOgData });
      }
    );

    await act(async () => {
      await result.current.handlePaste(clipboardEvent);
    });

    expect(result.current.ogData).toEqual(mockOgData);
  });

  it('should populate error on failed response', async () => {
    const { result } = renderHook(() => useOgFetch());
    const clipboardEvent = {
      clipboardData: {
        getData: vi.fn().mockReturnValue('https://example.com'),
      },
    } as any;

    (chrome.runtime.sendMessage as any).mockImplementation(
      (_message: any, callback: (response: any) => void) => {
        callback({ error: 'Failed to fetch' });
      }
    );

    await act(async () => {
      await result.current.handlePaste(clipboardEvent);
    });

    expect(result.current.error).toBe('Failed to fetch');
  });
});
