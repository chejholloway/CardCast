import React, { useState } from 'react';
import { trpc } from './trpcClient';
import type { AuthSession } from './types';

interface PostCreationModalProps {
  onClose: () => void;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({
  onClose,
}) => {
  const [postText, setPostText] = useState('');
  const [url, setUrl] = useState('');

  const {
    data: ogData,
    refetch: fetchPreview,
    isFetching: isFetchingPreview,
  } = trpc.og.fetch.useQuery({ url }, { enabled: false });

  const createPostMutation = trpc.post.create.useMutation();

  const handleCreatePost = () => {
    if (!ogData) return;

    chrome.storage.session.get(
      'session',
      (result: { session?: AuthSession }) => {
        if (result.session) {
          createPostMutation.mutate(
            {
              text: postText,
              url,
              title: ogData.title,
              description: ogData.description,
              imageUrl: ogData.imageUrl,
              accessJwt: result.session.accessJwt,
              did: result.session.did,
              handle: result.session.handle,
              refreshJwt: result.session.refreshJwt,
            },
            {
              onSuccess: () => {
                onClose();
              },
            }
          );
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Create a New Post</h2>

        <textarea
          className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 mb-4 text-white"
          placeholder="What's on your mind?"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-white"
            placeholder="Enter a URL to create a link card"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => fetchPreview()}
            disabled={isFetchingPreview}
          >
            {isFetchingPreview ? 'Fetching...' : 'Fetch Preview'}
          </button>
        </div>

        {ogData && (
          <div className="border border-slate-700 rounded-md p-4 mb-4">
            <h3 className="text-lg font-bold">{ogData.title}</h3>
            <p className="text-slate-400">{ogData.description}</p>
            {ogData.imageUrl && (
              <img
                src={ogData.imageUrl}
                alt="Preview"
                className="mt-2 rounded-md max-w-full h-auto"
              />
            )}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleCreatePost}
            disabled={!ogData || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? 'Posting...' : 'Create Post'}
          </button>
        </div>
      </div>
    </div>
  );
};
