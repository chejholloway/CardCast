import React from 'react';
import { motion } from 'framer-motion';
import type { OgData } from './types';

interface LinkCardPreviewProps {
  data: OgData;
  isDark: boolean;
  url: string;
}

export const LinkCardPreview: React.FC<LinkCardPreviewProps> = ({
  data,
  isDark,
  url,
}) => (
  <motion.div
    className="flex gap-3"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
  >
    <div className="flex-1">
      <div className="text-sm font-semibold line-clamp-2">{data.title}</div>
      <div
        className={`mt-1 text-xs line-clamp-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}
      >
        {data.description}
      </div>
    </div>
    <motion.div
      className={`w-20 h-20 flex-shrink-0 overflow-hidden rounded-md ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {data.imageUrl && (
        <img
          src={data.imageUrl}
          alt={`Preview image for ${data.title ?? url}`}
          className="h-full w-full object-cover"
        />
      )}
    </motion.div>
  </motion.div>
);
