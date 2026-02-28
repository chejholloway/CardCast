import { useState, useEffect } from 'react';

type BskySession = {
  did: string;
  accessJwt: string;
  handle: string;
};

function isBskySession(value: any): value is BskySession {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.did === 'string' &&
    typeof value.accessJwt === 'string' &&
    typeof value.handle === 'string'
  );
}

export const useSession = () => {
  const [session, setSession] = useState<BskySession | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial read
    chrome.storage.session.get(['bskySession', 'bskyTheme'], (result) => {
      const { bskySession, bskyTheme } = result;

      setSession(isBskySession(bskySession) ? bskySession : null);
      setTheme(bskyTheme === 'light' ? 'light' : 'dark');
      setLoading(false);
    });

    // Keep in sync if the content script writes the session after the popup opens.
    // Without this listener, the popup stays on <SignInPrompt> even after a
    // successful session relay from bsky.app.
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area !== 'session') return;

      if ('bskySession' in changes) {
        const { newValue } = changes.bskySession;
        setSession(isBskySession(newValue) ? newValue : null);
      }

      if ('bskyTheme' in changes) {
        const { newValue } = changes.bskyTheme;
        setTheme(newValue === 'light' ? 'light' : 'dark');
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return { session, theme, loading };
};
