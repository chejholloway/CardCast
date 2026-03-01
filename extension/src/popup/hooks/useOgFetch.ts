import { useState } from 'react';

export const useOgFetch = () => {
  const [ogData, setOgData] = useState<{
    title: string;
    description: string;
    imageUrl: string;
    url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    const urlMatch = text.match(/https?:\/\/[^\s]+/);

    if (urlMatch) {
      const url = urlMatch[0];
      setIsLoading(true);
      setError(null);
      setOgData(null);

      chrome.runtime.sendMessage({ type: 'FETCH_OG', url }, (response) => {
        setIsLoading(false);
        if (response.ok) {
          setOgData({ ...response.data, url });
        } else {
          setError(response.error);
        }
      });
    }
  };

  const reset = () => {
    setOgData(null);
    setError(null);
    setIsLoading(false);
  };

  return { ogData, isLoading, error, handlePaste, reset };
};
