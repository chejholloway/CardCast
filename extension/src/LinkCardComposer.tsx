import React from 'react';
import { trpc } from './trpcClient';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';
import { LinkCardPreview } from './LinkCardPreview';
import { LinkCardActions } from './LinkCardActions';
import { LinkCardStatus } from './LinkCardStatus';

export const LinkCardComposer: React.FC<{ url: string }> = ({ url }) => {
  const isDark = useTheme();
  const { data, error, isLoading, refetch } = trpc.og.fetch.useQuery(
    { url },
    { enabled: false }
  );
  const createPostMutation = trpc.post.create.useMutation();

  const fetchMetadata = () => {
    refetch();
  };

  const postWithCard = () => {
    const textArea = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder*="What\'s up?"]'
    );
    const text = textArea?.value ?? url;

    if (!data) return;

    createPostMutation.mutate({
      text,
      url,
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
    });
  };

  const status = isLoading
    ? 'loading'
    : error
      ? 'error'
      : data
        ? 'success'
        : 'idle';

  const cardClasses = isDark
    ? 'bsext-card mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100'
    : 'bsext-card mt-2 rounded-xl border border-gray-300 bg-white/80 p-3 text-sm text-gray-900';

  return (
    <motion.div
      role="region"
      aria-label={`Link card preview for ${url}`}
      className={cardClasses}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LinkCardActions
        isDark={isDark}
        fetchMetadata={fetchMetadata}
        postWithCard={postWithCard}
        isCreatingPost={createPostMutation.isPending}
        showPostButton={status === 'success'}
      />
      <LinkCardStatus
        status={status}
        isDark={isDark}
        errorMessage={error?.message}
      />
      {status === 'success' && data && (
        <LinkCardPreview data={data} isDark={isDark} url={url} />
      )}
    </motion.div>
  );
};
