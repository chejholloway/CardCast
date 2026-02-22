import React from 'react';
import { motion } from 'framer-motion';

interface LinkCardStatusProps {
  status: 'idle' | 'loading' | 'error' | 'success';
  isDark: boolean;
  errorMessage?: string;
}

export const LinkCardStatus: React.FC<LinkCardStatusProps> = ({
  status,
  isDark,
  errorMessage,
}) => {
  const statusMessage =
    status === 'loading'
      ? 'Fetching metadata…'
      : status === 'error'
        ? `Failed to fetch card: ${errorMessage ?? 'Unknown error'}`
        : status === 'success'
          ? 'Card fetched'
          : '';

  return (
    <>
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      {status === 'loading' && (
        <motion.div
          className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching metadata…
        </motion.div>
      )}
      {status === 'error' && (
        <motion.div
          className="text-xs text-red-400"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {`Failed to fetch card: ${errorMessage ?? 'Unknown error'}`}
        </motion.div>
      )}
    </>
  );
};
