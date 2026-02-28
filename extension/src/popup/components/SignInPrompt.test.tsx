/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignInPrompt } from './SignInPrompt';
import { vi } from 'vitest';

describe('SignInPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the heading and login form fields', () => {
    render(<SignInPrompt />);
    expect(
      screen.getByRole('heading', { name: /Connect CardCast/i })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/yourhandle\.bsky\.social/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/App password/i)).toBeInTheDocument();
  });

  it('should disable the sign in button when fields are empty', () => {
    render(<SignInPrompt />);
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeDisabled();
  });

  it('should enable the sign in button when both fields are filled', () => {
    render(<SignInPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/yourhandle\.bsky\.social/i), {
      target: { value: 'user.bsky.social' },
    });
    fireEvent.change(screen.getByPlaceholderText(/App password/i), {
      target: { value: 'xxxx-xxxx-xxxx-xxxx' },
    });
    expect(screen.getByRole('button', { name: /Sign in/i })).not.toBeDisabled();
  });

  it('should send AUTH_LOGIN with identifier and appPassword (not handle/password)', () => {
    // Field names must match background.ts AUTH_LOGIN handler exactly.
    // Sending { payload: { handle, password } } instead would silently fail.
    const mockSendMessage = vi.fn((_msg, callback) => callback({ ok: true }));
    chrome.runtime.sendMessage = mockSendMessage;

    render(<SignInPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/yourhandle\.bsky\.social/i), {
      target: { value: 'user.bsky.social' },
    });
    fireEvent.change(screen.getByPlaceholderText(/App password/i), {
      target: { value: 'xxxx-xxxx-xxxx-xxxx' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(mockSendMessage).toHaveBeenCalledWith(
      {
        type: 'AUTH_LOGIN',
        identifier: 'user.bsky.social',
        appPassword: 'xxxx-xxxx-xxxx-xxxx',
      },
      expect.any(Function)
    );
  });

  it('should show an error message on failed login', async () => {
    const mockSendMessage = vi.fn((_msg, callback) =>
      callback({ ok: false, error: 'Invalid credentials' })
    );
    chrome.runtime.sendMessage = mockSendMessage;

    render(<SignInPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/yourhandle\.bsky\.social/i), {
      target: { value: 'user.bsky.social' },
    });
    fireEvent.change(screen.getByPlaceholderText(/App password/i), {
      target: { value: 'wrong-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should submit on Enter key in the password field', () => {
    const mockSendMessage = vi.fn((_msg, callback) => callback({ ok: true }));
    chrome.runtime.sendMessage = mockSendMessage;

    render(<SignInPrompt />);
    fireEvent.change(screen.getByPlaceholderText(/yourhandle\.bsky\.social/i), {
      target: { value: 'user.bsky.social' },
    });
    fireEvent.change(screen.getByPlaceholderText(/App password/i), {
      target: { value: 'xxxx-xxxx-xxxx-xxxx' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText(/App password/i), {
      key: 'Enter',
    });

    expect(mockSendMessage).toHaveBeenCalled();
  });
});
