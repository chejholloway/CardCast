import React, { useState } from 'react';
import { useOgFetch } from '../hooks/useOgFetch';
import { CardPreview } from './CardPreview';

interface ComposerProps {
  session: { did: string; accessJwt: string; handle: string };
}

interface ManualOgData {
  url: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const Composer: React.FC<ComposerProps> = ({ session }) => {
  console.info('session: ', session);

  const [text, setText] = useState('');
  const { ogData, isLoading, error, handlePaste, reset } = useOgFetch();
  const [isPosting, setIsPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [postError, setPostError] = useState('');

  // Manual fallback form state — shown when og.fetch fails
  const [manualUrl, setManualUrl] = useState('');
  const [manualData, setManualData] = useState<ManualOgData | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  // Use auto-fetched data if available, otherwise use manually entered data
  const activeOgData = ogData ?? manualData;

  // Show the manual form when the fetch errored and we don't have data yet
  const shouldShowManualForm = Boolean(error && !ogData && !manualData);

  const handleCancel = () => {
    setText('');
    setPostError('');
    setManualData(null);
    setManualUrl('');
    setShowManualForm(false);
    reset();
  };

  const handleManualSubmit = () => {
    if (!manualUrl || !manualData?.title) return;
    setShowManualForm(false);
  };

  const handlePost = () => {
    if (!text && !activeOgData) return;
    setIsPosting(true);
    setPostError('');

    chrome.runtime.sendMessage(
      {
        type: 'CREATE_POST',
        payload: {
          text,
          url: activeOgData?.url,
          title: activeOgData?.title,
          description: activeOgData?.description,
          imageUrl: activeOgData?.imageUrl,
        },
      },
      (response) => {
        setIsPosting(false);
        if (response.ok) {
          setPosted(true);
          setTimeout(() => {
            setPosted(false);
            handleCancel();
          }, 1500);
        } else {
          setPostError(response.error ?? 'Post failed. Please try again.');
        }
      }
    );
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <textarea
        placeholder="What's happening? Paste a link to attach a card."
        onPaste={handlePaste}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full bg-transparent resize-none text-[15px] outline-none text-[#e7e9ea] placeholder-[#6e7d8f] min-h-[80px]"
      />

      {isLoading && (
        <div className="h-16 rounded-lg bg-[#1a2433] animate-pulse" />
      )}

      {activeOgData && <CardPreview {...activeOgData} />}

      {/* Manual fallback form — shown when og.fetch can't extract tags */}
      {(shouldShowManualForm || showManualForm) && !activeOgData && (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-[#2a3441] bg-[#1a2433]">
          <p className="text-xs text-[#8a9aa9]">
            Couldn't fetch card automatically. Enter the details manually:
          </p>
          <input
            type="url"
            placeholder="URL"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="w-full bg-[#0c1016] border border-[#2a3441] rounded px-2 py-1.5 text-xs text-[#e7e9ea] outline-none focus:border-[#0085ff]"
          />
          <input
            type="text"
            placeholder="Title"
            value={manualData?.title ?? ''}
            onChange={(e) =>
              setManualData((d) => ({
                url: manualUrl,
                title: e.target.value,
                description: d?.description ?? '',
                imageUrl: d?.imageUrl ?? '',
              }))
            }
            className="w-full bg-[#0c1016] border border-[#2a3441] rounded px-2 py-1.5 text-xs text-[#e7e9ea] outline-none focus:border-[#0085ff]"
          />
          <input
            type="text"
            placeholder="Description"
            value={manualData?.description ?? ''}
            onChange={(e) =>
              setManualData((d) => ({
                url: manualUrl,
                title: d?.title ?? '',
                description: e.target.value,
                imageUrl: d?.imageUrl ?? '',
              }))
            }
            className="w-full bg-[#0c1016] border border-[#2a3441] rounded px-2 py-1.5 text-xs text-[#e7e9ea] outline-none focus:border-[#0085ff]"
          />
          <input
            type="url"
            placeholder="Image URL (optional)"
            value={manualData?.imageUrl ?? ''}
            onChange={(e) =>
              setManualData((d) => ({
                url: manualUrl,
                title: d?.title ?? '',
                description: d?.description ?? '',
                imageUrl: e.target.value,
              }))
            }
            className="w-full bg-[#0c1016] border border-[#2a3441] rounded px-2 py-1.5 text-xs text-[#e7e9ea] outline-none focus:border-[#0085ff]"
          />
          <button
            onClick={handleManualSubmit}
            disabled={
              !manualUrl || !manualData?.title || !manualData?.description
            }
            className="self-end px-3 py-1 rounded-full bg-[#0085ff] text-white text-xs font-semibold disabled:opacity-40"
          >
            Use this card
          </button>
        </div>
      )}

      {error && !shouldShowManualForm && !activeOgData && !showManualForm && (
        <div className="flex items-center justify-between text-xs text-[#8a9aa9]">
          <span>Couldn't fetch card for this URL.</span>
          <button
            onClick={() => setShowManualForm(true)}
            className="text-[#0085ff] underline ml-2"
          >
            Enter manually
          </button>
        </div>
      )}

      {postError && <p className="text-red-400 text-xs">{postError}</p>}

      <div className="flex justify-end items-center gap-2 pt-2 border-t border-[#2a3441]">
        <button
          onClick={handleCancel}
          disabled={isPosting}
          className="px-4 py-1.5 rounded-full border border-[#2a3441] text-[#8a9aa9] text-sm font-semibold hover:border-[#0085ff] hover:text-[#e7e9ea] disabled:opacity-40 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePost}
          disabled={isPosting || (!text && !activeOgData)}
          className="px-4 py-1.5 rounded-full bg-[#0085ff] text-white text-sm font-semibold disabled:opacity-40"
        >
          {isPosting ? 'Posting...' : 'Post ↗'}
        </button>
      </div>

      {posted && <p className="text-center text-sm text-green-400">Posted ✓</p>}
    </div>
  );
};
