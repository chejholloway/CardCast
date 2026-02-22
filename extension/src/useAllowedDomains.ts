import { useState, useEffect } from 'react';

export const useAllowedDomains = () => {
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.session.get(['allowedDomains'], (result) => {
      let allowed: string[] = ['thehill.com', 'theroot.com', 'usanews.com'];
      if (result && Array.isArray(result.allowedDomains)) {
        allowed = result.allowedDomains;
      }
      setDomains(allowed);
      setLoading(false);
    });
  }, []);

  return { domains, loading };
};
