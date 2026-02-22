import React from 'react';
import { motion } from 'framer-motion';

interface LinkCardActionsProps {
  isDark: boolean;
  fetchMetadata: () => void;
  postWithCard: () => void;
  isCreatingPost: boolean;
  showPostButton: boolean;
}

export const LinkCardActions: React.FC<LinkCardActionsProps> = ({
  isDark,
  fetchMetadata,
  postWithCard,
  isCreatingPost,
  showPostButton,
}) => (
  <div className="flex justify-between items-center mb-2">
    <span
      className={`font-medium ${isDark ? 'text-slate-50' : 'text-gray-900'}`}
    >
      Link card preview
    </span>
    <div className="flex gap-2">
      <motion.button
        aria-label="Fetch link metadata"
        type="button"
        className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`}
        onClick={fetchMetadata}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Fetch Link Card
      </motion.button>
      {showPostButton && (
        <motion.button
          type="button"
          className={`px-3 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          onClick={postWithCard}
          disabled={isCreatingPost}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isCreatingPost ? 'Posting…' : 'Post with Card'}
        </motion.button>
      )}
    </div>
  </div>
);
