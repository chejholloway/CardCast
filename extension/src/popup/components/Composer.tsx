import React, { useState } from 'react';
import { useOgFetch } from '../hooks/useOgFetch';
import { CardPreview } from './CardPreview';

interface ComposerProps {
  session: { did: string; accessJwt: string; handle: string };
}

export const Composer: React.FC<ComposerProps> = ({ session }) => {
  const [text, setText] = useState('');
  const { ogData, isLoading, handlePaste } = useOgFetch();
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePost = () => {
    if (!text && !ogData) return;

    setIsPosting(true);
    chrome.runtime.sendMessage(
      {
        type: 'CREATE_POST',
        payload: {
          text,
          url: ogData?.url,
          title: ogData?.title,
          description: ogData?.description,
          imageUrl: ogData?.imageUrl,
          accessJwt: session.accessJwt,
          did: session.did,
        },
      },
      (response) => {
        setIsPosting(false);
        if (response.ok) {
          setPosted(true);
          setTimeout(() => {
            setPosted(false);
            setText('');
            // Resetting ogData would require a function from the hook.
            // For now, we'll just clear the text.
          }, 1500);
        } else {
          // Handle error
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <textarea
        placeholder="What's happening?"
        onPaste={handlePaste}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent resize-none text-[15px] outline-none text-[#e7e9ea] placeholder-[#6e7d8f] min-h-[80px]"
      />

      {ogData && <CardPreview {...ogData} />}

      {isLoading && (
        <div className="h-16 rounded-lg bg-[#1a2433] animate-pulse" />
      )}

      <div className="flex justify-end items-center pt-2 border-t border-[#2a3441]">
        <button
          onClick={handlePost}
          disabled={isPosting || (!text && !ogData)}
          className="px-4 py-1.5 rounded-full bg-[#0085ff] text-white text-sm font-semibold disabled:opacity-40"
        >
          {isPosting ? 'Posting...' : 'Post ↗'}
        </button>
      </div>

      {posted && <p className="text-center text-sm text-green-400">Posted ✓</p>}
    </div>
  );
};
