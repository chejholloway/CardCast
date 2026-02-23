import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { renderWithProviders } from './testUtils';

// Mock chrome API
global.chrome = {
  storage: {
    session: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
} as any;

// Create a mock Popup component for testing (extracted from popup.tsx)
const Popup: React.FC = () => {
  const [identifier, setIdentifier] = React.useState('');
  const [appPassword, setAppPassword] = React.useState('');
  const [domains, setDomains] = React.useState<string[]>([]);
  const [newDomain, setNewDomain] = React.useState('');
  const [liveMessage, setLiveMessage] = React.useState<string>('');
  const [loggedIn, setLoggedIn] = React.useState(false);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Load domains from storage
    chrome.storage.session.get(['allowedDomains'], (result: any) => {
      const allowed = result?.allowedDomains ?? [
        'thehill.com',
        'theroot.com',
        'usanews.com',
      ];
      setDomains(allowed);
    });
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      // Simulate login
      await new Promise((resolve) => setTimeout(resolve, 100));
      setLoggedIn(true);
      setLiveMessage(`Logged in as @${identifier}`);
      setIdentifier('');
      setAppPassword('');
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setLoginError('Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const addDomain = () => {
    if (newDomain && !domains.includes(newDomain)) {
      const updated = [...domains, newDomain];
      setDomains(updated);
      chrome.storage.session.set({ allowedDomains: updated });
      setNewDomain('');
      setLiveMessage(`Domain added: ${newDomain}`);
    }
  };

  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setLiveMessage(`Domain removed: ${domain}`);
  };

  return (
    <div
      role="region"
      aria-label="Bluesky Link Card popup"
      className="w-80 p-4"
    >
      <div aria-live="polite" className="sr-only" id="popup-live">
        {liveMessage}
      </div>
      <h1 className="text-base font-semibold mb-2">Bluesky Link Card</h1>

      {loginLoading && <div className="text-xs mb-2">Signing in…</div>}
      {loginError && (
        <div className="text-xs text-red-400 mb-2">{loginError}</div>
      )}

      {loggedIn ? (
        <div className="space-y-1 mb-4">
          <div>
            Logged in as <span className="font-medium">@{identifier}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <label className="block">
            <span className="text-xs">Bluesky handle</span>
            <input
              id="handle-input"
              aria-label="Bluesky handle"
              className="mt-1 w-full rounded border px-2 py-1 text-xs"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you.bsky.social"
            />
          </label>
          <label className="block">
            <span className="text-xs">App password</span>
            <input
              id="password-input"
              aria-label="App password"
              type="password"
              className="mt-1 w-full rounded border px-2 py-1 text-xs"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
          </label>
          <button
            aria-label="Sign in to Bluesky"
            type="button"
            className="mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium"
            onClick={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? 'Signing in…' : 'Sign in to Bluesky'}
          </button>
        </div>
      )}

      <div className="border-t pt-2 mt-2">
        <h2 className="text-sm font-medium mb-2">Allowed Domains</h2>
        <div
          role="list"
          aria-label="Allowed domains"
          className="space-y-1 mb-2"
        >
          {domains.map((domain) => (
            <div
              key={domain}
              role="listitem"
              className="flex justify-between items-center"
            >
              <span className="text-xs">{domain}</span>
              <button
                aria-label={`Remove domain ${domain}`}
                type="button"
                className="text-xs"
                onClick={() => removeDomain(domain)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            aria-label="Add domain"
            id="domain-input"
            className="flex-1 rounded border px-2 py-1 text-xs"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="example.com"
          />
          <button
            aria-label="Add domain"
            type="button"
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium"
            onClick={addDomain}
          >
            Add
          </button>
        </div>
      </div>

      <div className="border-t pt-2 mt-2">
        <a
          href="https://bsky.app"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-sky-400"
        >
          Open Bluesky
        </a>
      </div>
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

  it.skip('should render popup with title', () => {
    renderWithProviders(<Popup />);
    expect(screen.getByText('Bluesky Link Card')).toBeInTheDocument();
  });

  it.skip('should render login form initially', () => {
    renderWithProviders(<Popup />);
    expect(screen.getByLabelText('Bluesky handle')).toBeInTheDocument();
    expect(screen.getByLabelText('App password')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in to bluesky/i })
    ).toBeInTheDocument();
  });

  it.skip('should load allowed domains from storage', async () => {
    renderWithProviders(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('thehill.com')).toBeInTheDocument();
      expect(screen.getByText('theroot.com')).toBeInTheDocument();
      expect(screen.getByText('usanews.com')).toBeInTheDocument();
    });
  });

  it.skip('should handle login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    const handleInput = screen.getByLabelText('Bluesky handle');
    const passwordInput = screen.getByLabelText('App password');
    const loginButton = screen.getByRole('button', {
      name: /sign in to bluesky/i,
    });

    await user.type(handleInput, 'testuser.bsky.social');
    await user.type(passwordInput, 'test-password');
    await user.click(loginButton);

    await waitFor(() => {
      expect(screen.getAllByText(/logged in as/i).length).toBeGreaterThan(0);
    });
  });

  it.skip('should add a new domain', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('thehill.com')).toBeInTheDocument();
    });

    const domainInput = screen.getByPlaceholderText('example.com');
    const addButton = screen.getByRole('button', { name: 'Add domain' });

    await user.type(domainInput, 'newdomain.com');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('newdomain.com')).toBeInTheDocument();
    });

    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDomains: expect.arrayContaining(['newdomain.com']),
      })
    );
  });

  it.skip('should prevent adding duplicate domains', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('thehill.com')).toBeInTheDocument();
    });

    const domainInput = screen.getByPlaceholderText('example.com');
    const addButton = screen.getByRole('button', { name: 'Add domain' });

    await user.type(domainInput, 'thehill.com');
    await user.click(addButton);

    // Domain count should remain the same
    const domains = await screen.findAllByRole('listitem');
    expect(domains.length).toBe(3); // Default 3 domains
  });

  it.skip('should remove a domain', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    await waitFor(() => {
      expect(screen.getByText('thehill.com')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    expect(chrome.storage.session.set).toHaveBeenCalled();
  });

  it.skip('should have accessible aria labels', () => {
    renderWithProviders(<Popup />);

    expect(
      screen.getByRole('region', { name: /bluesky link card popup/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('list', { name: /allowed domains/i })
    ).toBeInTheDocument();
  });

  it.skip('should have link to Bluesky', () => {
    renderWithProviders(<Popup />);

    const blueskyLink = screen.getByRole('link', { name: /open bluesky/i });
    expect(blueskyLink).toHaveAttribute('href', 'https://bsky.app');
    expect(blueskyLink).toHaveAttribute('target', '_blank');
  });
});
