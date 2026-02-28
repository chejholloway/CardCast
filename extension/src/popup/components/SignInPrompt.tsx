import React, { useState } from 'react';

export const SignInPrompt: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!identifier || !appPassword) return;
    setLoading(true);
    setError('');

    // Field names must match background.ts AUTH_LOGIN handler:
    // message.identifier and message.appPassword (not payload.handle/password)
    chrome.runtime.sendMessage(
      { type: 'AUTH_LOGIN', identifier, appPassword },
      (response) => {
        setLoading(false);
        if (response?.ok) {
          // useSession's onChanged listener will pick up the new session
          // and re-render the popup with <Composer /> automatically.
        } else {
          setError(
            response?.error ??
              'Login failed. Check your handle and app password.'
          );
        }
      }
    );
  };

  return (
    <div className="bg-[#0c1016] text-[#e7e9ea] p-6 flex flex-col gap-4">
      <div className="text-center">
        <span className="text-4xl">☁️</span>
        <h2 className="text-lg font-bold mt-2">Connect CardCast</h2>
        <p className="text-sm text-[#8a9aa9] mt-1">
          Sign in with your Bluesky handle and an{' '}
          <a
            href="https://bsky.app/settings/app-passwords"
            target="_blank"
            rel="noreferrer"
            className="text-[#0085ff] underline"
          >
            app password
          </a>
          .
        </p>
      </div>

      <input
        type="text"
        placeholder="yourhandle.bsky.social"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        className="w-full bg-[#1a2433] border border-[#2a3441] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0085ff]"
      />
      <input
        type="password"
        placeholder="App password (not your main password)"
        value={appPassword}
        onChange={(e) => setAppPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        className="w-full bg-[#1a2433] border border-[#2a3441] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0085ff]"
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading || !identifier || !appPassword}
        className="w-full py-2 rounded-full bg-[#0085ff] text-white text-sm font-semibold disabled:opacity-40"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </div>
  );
};
