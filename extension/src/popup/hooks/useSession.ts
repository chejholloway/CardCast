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
    chrome.storage.session.get(['bskySession', 'bskyTheme'], (result) => {
      const { bskySession, bskyTheme } = result;

      if (isBskySession(bskySession)) {
        setSession(bskySession);
      } else {
        setSession(null);
      }

      if (bskyTheme === 'dark' || bskyTheme === 'light') {
        setTheme(bskyTheme);
      } else {
        setTheme('dark');
      }

      setLoading(false);
    });
  }, []);

  return { session, theme, loading };
};
