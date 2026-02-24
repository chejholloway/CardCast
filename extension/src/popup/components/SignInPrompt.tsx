import React from 'react';

export const SignInPrompt: React.FC = () => {
  const openBluesky = () => {
    chrome.tabs.create({ url: 'https://bsky.app' });
  };

  return (
    <div className="bg-[#0c1016] text-[#e7e9ea] p-8 text-center flex flex-col items-center justify-center h-full">
      <span className="text-4xl mb-4">☁️</span>
      <h2 className="text-lg font-bold mb-2">CardCast isn't connected yet</h2>
      <p className="text-sm text-[#8a9aa9] mb-6 max-w-xs">
        Open bsky.app in any tab and log in. CardCast will connect
        automatically.
      </p>
      <button
        onClick={openBluesky}
        className="px-4 py-2 rounded-full bg-[#0085ff] text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
      >
        Open Bluesky ↗
      </button>
    </div>
  );
};
