/// <reference types="chrome" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Popup } from './popup';
import { useSession } from './popup/hooks/useSession';
import { vi, type MockedFunction } from 'vitest';
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
  SettingsPanel: ({ onClose }: { onClose: () => void }) => (
    <button onClick={onClose}>Back</button>
  ),
}));

const mockUseSession = useSession as MockedFunction<typeof useSession>;

describe('Popup', () => {
  beforeEach(() => {
    (vi as any).clearAllMocks();
  });

  it('should render a loading spinner when loading', () => {
    mockUseSession.mockReturnValue({
      loading: true,
      session: null,
      theme: 'dark',
    });
    render(<Popup />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render SignInPrompt when not authenticated', () => {
    mockUseSession.mockReturnValue({
      loading: false,
      session: null,
      theme: 'dark',
    });
    render(<Popup />);
    expect(screen.getByText('SignInPrompt')).toBeInTheDocument();
  });

  it('should render Composer when authenticated', () => {
    mockUseSession.mockReturnValue({
      loading: false,
      session: { did: '123', accessJwt: 'token', handle: 'user.bsky.social' },
      theme: 'dark',
    });
    render(<Popup />);
    expect(screen.getByText('Composer')).toBeInTheDocument();
  });

  it('should switch to SettingsPanel and back', async () => {
    mockUseSession.mockReturnValue({
      loading: false,
      session: { did: '123', accessJwt: 'token', handle: 'user.bsky.social' },
      theme: 'dark',
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
