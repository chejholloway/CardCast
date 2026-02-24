import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useSession } from './popup/hooks/useSession';
import { Composer } from './popup/components/Composer';
import { SignInPrompt } from './popup/components/SignInPrompt';
import { SettingsPanel } from './popup/components/SettingsPanel';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';

export const Popup: React.FC = () => {
  const { session, theme, loading } = useSession();
  const [view, setView] = useState<'composer' | 'settings'>('composer');

  if (loading) {
    return (
      <div className="w-[420px] h-[200px] bg-[#0c1016] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#0085ff] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`w-[420px] bg-[#0c1016] text-[#e7e9ea] ${theme === 'dark' ? 'dark' : ''}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a3441]">
        <span className="text-sm font-semibold text-[#e7e9ea]">CardCast</span>
        {session && (
          <button
            onClick={() =>
              setView((v) => (v === 'settings' ? 'composer' : 'settings'))
            }
            className="text-[#6e7d8f] hover:text-[#e7e9ea] transition-colors text-base"
            title="Settings"
          >
            ⚙️
          </button>
        )}
      </div>

      {view === 'settings' ? (
        <SettingsPanel onClose={() => setView('composer')} />
      ) : session ? (
        <Composer session={session} />
      ) : (
        <SignInPrompt />
      )}
    </div>
  );
};

const mountPopup = () => {
  const container = document.getElementById('root');
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <Popup />
    </ErrorBoundary>
  );
};

mountPopup();
