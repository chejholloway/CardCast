/**
 * Minimal popup for testing React initialization
 */

import React from 'react';
import { createRoot } from 'react-dom/client';

const MinimalPopup: React.FC = () => {
  return (
    <div className="w-80 p-4 bg-slate-900 text-white">
      <h1 className="text-lg font-semibold mb-4">Minimal Test Popup</h1>
      <p className="text-sm text-slate-300">
        If you see this, React is working!
      </p>
      <button
        type="button"
        className="mt-4 rounded bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
        onClick={() => alert('Button clicked!')}
      >
        Test Button
      </button>
    </div>
  );
};

const init = () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<MinimalPopup />);
  }
};

init();
