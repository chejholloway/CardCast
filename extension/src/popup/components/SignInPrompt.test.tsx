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
      screen.getByRole('heading', { name: /CardCast isn't connected yet/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Open bsky\.app in any tab and log in/i)
    ).toBeInTheDocument();
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
