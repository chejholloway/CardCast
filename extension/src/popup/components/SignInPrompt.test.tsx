/// <reference types="chrome" />

import { render, screen, fireEvent } from '@testing-library/react';
import { SignInPrompt } from './SignInPrompt';
import { vi } from 'vitest';

describe('SignInPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the heading and body text', () => {
    render(<SignInPrompt />);
    expect(
      screen.getByRole('heading', { name: /Sign in to Bluesky/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/to start sharing content/i)).toBeInTheDocument();
  });

  it('should call chrome.tabs.create when the button is clicked', () => {
    render(<SignInPrompt />);
    const button = screen.getByRole('button', { name: /Open Bluesky/i });
    fireEvent.click(button);
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://bsky.app',
    });
  });
});
