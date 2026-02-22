import { useState, useEffect } from 'react';
import type { AuthSession } from './types';

export const useSession = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.session.get(
      'session',
      (result: { session?: AuthSession }) => {
        if (result.session) {
          setSession(result.session);
        }
        setLoading(false);
      }
    );
  }, []);

  return { session, loading };
};
