/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Composer } from './Composer';
import { useOgFetch } from '../hooks/useOgFetch';
import { vi } from 'vitest';

// Mock the useOgFetch hook
vi.mock('../hooks/useOgFetch', () => ({
  useOgFetch: vi.fn(),
}));

const mockSession = {
  did: 'did:plc:123',
  accessJwt: 'test-jwt',
  handle: 'test.bsky.social',
};

describe('Composer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useOgFetch as vi.Mock).mockReturnValue({
      ogData: null,
      isLoading: false,
      handlePaste: vi.fn(),
    });
  });

  it('should disable the Post button when there is no text or card data', () => {
    render(<Composer session={mockSession} />);
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeDisabled();
  });

  it('should enable the Post button when there is text', () => {
    render(<Composer session={mockSession} />);
    const textarea = screen.getByPlaceholderText("What's happening?");
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeEnabled();
  });

  it('should enable the Post button when there is card data', () => {
    (useOgFetch as vi.Mock).mockReturnValue({
      ogData: { url: 'https://example.com' },
      isLoading: false,
      handlePaste: vi.fn(),
    });
    render(<Composer session={mockSession} />);
    const postButton = screen.getByRole('button', { name: /Post/i });
    expect(postButton).toBeEnabled();
  });

  it('should call sendMessage with CREATE_POST on successful post', async () => {
    render(<Composer session={mockSession} />);
    const textarea = screen.getByPlaceholderText("What's happening?");
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    const postButton = screen.getByRole('button', { name: /Post/i });

    (chrome.runtime.sendMessage as vi.Mock).mockImplementation(
      (_message: any, callback: (response: any) => void) => {
        callback({ ok: true });
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
    (useOgFetch as vi.Mock).mockReturnValue({
      ogData: {
        title: 'Test Title',
        description: 'Test Description',
        imageUrl: 'https://example.com/image.png',
        url: 'https://example.com/article',
      },
      isLoading: false,
      handlePaste: vi.fn(),
    });
    render(<Composer session={mockSession} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
