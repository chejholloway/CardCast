import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
}

const isValidDomain = (domain: string): boolean => {
  try {
    const url = new URL(`http://${domain}`);
    return url.hostname === domain && !domain.includes('/');
  } catch {
    return false;
  }
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [liveMessage, setLiveMessage] = useState<string>('');

  useEffect(() => {
    chrome.storage.session.get(['allowedDomains'], (result) => {
      let allowed: string[] = ['thehill.com', 'theroot.com', 'usnews.com'];
      if (result && Array.isArray(result.allowedDomains)) {
        allowed = result.allowedDomains;
      }
      setDomains(allowed);
    });
  }, []);

  const addDomain = () => {
    if (!newDomain) {
      setLiveMessage('Domain cannot be empty.');
      return;
    }
    if (!isValidDomain(newDomain)) {
      setLiveMessage('Invalid domain format.');
      return;
    }
    if (domains.includes(newDomain)) {
      setLiveMessage(`Domain ${newDomain} already exists.`);
      return;
    }
    const updated = [...domains, newDomain];
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setNewDomain('');
    setLiveMessage(`Domain added: ${newDomain}`);
  };

  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setLiveMessage(`Domain removed: ${domain}`);
  };

  return (
    <div className="p-4">
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <button
        onClick={onClose}
        className="text-sm text-[#8a9aa9] hover:text-white mb-4"
      >
        ← Back
      </button>
      <h2 className="text-sm font-medium mb-2">Allowed Domains</h2>
      <div role="list" aria-label="Allowed domains" className="space-y-1 mb-2">
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
              className="text-xs text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
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
          className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="example.com"
        />
        <button
          aria-label="Add domain"
          type="button"
          className="rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
          onClick={addDomain}
        >
          Add
        </button>
      </div>
    </div>
  );
};
