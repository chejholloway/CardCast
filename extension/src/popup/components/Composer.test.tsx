/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Composer } from './Composer';
import { useOgFetch } from '../hooks/useOgFetch';
import { vi, type MockedFunction } from 'vitest';
import React from 'react';

// Mocking framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      /*       initial,
      animate,
      transition, */
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

// Mocking useOgFetch hook
vi.mock('../hooks/useOgFetch', () => ({
  useOgFetch: vi.fn(),
}));

const mockUseOgFetch = useOgFetch as MockedFunction<typeof useOgFetch>; // Using Vitest MockedFunction for type safety

const mockSession = {
  did: 'did:plc:123',
  accessJwt: 'test-jwt',
  handle: 'test.bsky.social',
};

describe('Composer', () => {
  beforeEach(() => {
    (vi as any).clearAllMocks();
    mockUseOgFetch.mockReturnValue({
      ogData: null,
      isLoading: false,
      handlePaste: vi.fn(),
      error: null, // Ensure error property is included
      reset: vi.fn(),
    });
  });

  it('should disable the Post button when there is no text or card data', () => {
    render(<Composer session={mockSession} />);
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeDisabled();
  });

  it('should enable the Post button when there is text', () => {
    render(<Composer session={mockSession} />);
    const textarea = screen.getByPlaceholderText(
      "What's happening? Paste a link to attach a card."
    );
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeEnabled();
  });

  it('should enable the Post button when there is card data', () => {
    mockUseOgFetch.mockReturnValue({
      ogData: {
        title: 'Test Title',
        description: 'Test Description',
        imageUrl: 'https://example.com/image.png',
        url: 'https://example.com/article',
      },
      isLoading: false,
      handlePaste: vi.fn(),
      error: null, // Include error property
      reset: vi.fn(),
    });

    render(<Composer session={mockSession} />);
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeEnabled();
  });

  it('should call sendMessage with CREATE_POST on successful post', async () => {
    render(<Composer session={mockSession} />);
    const textarea = screen.getByPlaceholderText(
      "What's happening? Paste a link to attach a card."
    );
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    const postButton = screen.getByRole('button', { name: /Post/i });

    (chrome.runtime.sendMessage as any).mockImplementation(
      (_message: unknown, callback: unknown) => {
        (callback as (response: unknown) => void)({ ok: true });
      }
    );

    fireEvent.click(postButton);

    await waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'CREATE_POST' }),
        expect.any(Function)
      );
      expect(screen.getByText('Posted ✓')).toBeInTheDocument();
    });
  });

  it('should render CardPreview when ogData is present', () => {
    mockUseOgFetch.mockReturnValue({
      ogData: {
        title: 'Test Title',
        description: 'Test Description',
        imageUrl: 'https://example.com/image.png',
        url: 'https://example.com/article',
      },
      isLoading: false,
      handlePaste: vi.fn(),
      error: null, // Include error property
      reset: vi.fn(),
    });

    render(<Composer session={mockSession} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
