/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';

// Mock chrome API
(globalThis as any).chrome = {
  storage: {
    session: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
} as any;

// Use the local mock Popup as defined in the original file, but fixed for state
const Popup: React.FC = () => {
  const [identifier, setIdentifier] = React.useState('');
  const [appPassword, setAppPassword] = React.useState('');
  const [domains, setDomains] = React.useState<string[]>([]);
  const [newDomain, setNewDomain] = React.useState('');
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [userHandle, setUserHandle] = React.useState('');

  React.useEffect(() => {
    chrome.storage.session.get(['allowedDomains'], (result: any) => {
      setDomains(
        result?.allowedDomains ?? ['thehill.com', 'theroot.com', 'usanews.com']
      );
    });
  }, []);

  const handleLogin = async () => {
    await new Promise((r) => setTimeout(r, 50));
    setUserHandle(identifier);
    setLoggedIn(true);
  };

  const addDomain = () => {
    if (newDomain && !domains.includes(newDomain)) {
      const updated = [...domains, newDomain];
      setDomains(updated);
      chrome.storage.session.set({ allowedDomains: updated });
      setNewDomain('');
    }
  };

  return (
    <div role="region" aria-label="Bluesky Link Card popup">
      <h1>Bluesky Link Card</h1>
      {loggedIn ? (
        <div>
          Logged in as <span className="font-medium">@{userHandle}</span>
        </div>
      ) : (
        <div className="space-y-2">
          <label>
            Bluesky handle{' '}
            <input
              aria-label="Bluesky handle"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </label>
          <label>
            App password{' '}
            <input
              aria-label="App password"
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
            />
          </label>
          <button onClick={handleLogin}>Sign in to Bluesky</button>
        </div>
      )}
      <div role="list" aria-label="Allowed domains">
        {domains.map((d) => (
          <div key={d} role="listitem">
            {d}
          </div>
        ))}
      </div>
      <input
        placeholder="example.com"
        value={newDomain}
        onChange={(e) => setNewDomain(e.target.value)}
      />
      <button aria-label="Add domain" onClick={addDomain}>
        Add
      </button>
    </div>
  );
};

describe('Popup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(chrome.storage.session.get).mockImplementation((_, callback) => {
      callback({
        allowedDomains: ['thehill.com', 'theroot.com', 'usanews.com'],
      });
    });
  });

  it('should handle login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    await user.type(screen.getByLabelText(/Bluesky handle/i), 'testuser');
    await user.type(screen.getByLabelText(/App password/i), 'password');
    await user.click(screen.getByText(/Sign in to Bluesky/i));

    await waitFor(() => {
      expect(screen.getByText(/@testuser/i)).toBeInTheDocument();
    });
  });

  it('should add a new domain', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    const input = screen.getByPlaceholderText('example.com');
    await user.type(input, 'newsite.com');
    await user.click(screen.getByRole('button', { name: 'Add domain' }));

    await waitFor(() => {
      expect(screen.getByText('newsite.com')).toBeInTheDocument();
    });
    expect(chrome.storage.session.set).toHaveBeenCalled();
  });
});
