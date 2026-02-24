/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Popup } from './popup';
import { useSession } from './popup/hooks/useSession';
import { vi } from 'vitest';

// Mock the useSession hook
vi.mock('./popup/hooks/useSession', () => ({
  useSession: vi.fn(),
}));

// Mock components to simplify testing
vi.mock('./popup/components/Composer', () => ({
  Composer: () => <div>Composer</div>,
}));
vi.mock('./popup/components/SignInPrompt', () => ({
  SignInPrompt: () => <div>SignInPrompt</div>,
}));
vi.mock('./popup/components/SettingsPanel', () => ({
  SettingsPanel: ({ onClose }) => <button onClick={onClose}>Back</button>,
}));

describe('Popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render a loading spinner when loading', () => {
    (useSession as vi.Mock).mockReturnValue({ loading: true });
    render(<Popup />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render SignInPrompt when not authenticated', () => {
    (useSession as vi.Mock).mockReturnValue({ loading: false, session: null });
    render(<Popup />);
    expect(screen.getByText('SignInPrompt')).toBeInTheDocument();
  });

  it('should render Composer when authenticated', () => {
    (useSession as vi.Mock).mockReturnValue({
      loading: false,
      session: { did: '123' },
    });
    render(<Popup />);
    expect(screen.getByText('Composer')).toBeInTheDocument();
  });

  it('should switch to SettingsPanel and back', async () => {
    (useSession as vi.Mock).mockReturnValue({
      loading: false,
      session: { did: '123' },
    });
    render(<Popup />);

    const settingsButton = screen.getByTitle('Settings');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(screen.getByText('Composer')).toBeInTheDocument();
    });
  });
});
