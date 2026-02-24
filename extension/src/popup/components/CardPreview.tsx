import React from 'react';
import { motion } from 'framer-motion';

interface CardPreviewProps {
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  title,
  description,
  imageUrl,
  url,
}) => {
  const domain = new URL(url).hostname;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="border border-[#2a3441] rounded-lg overflow-hidden flex items-center gap-3"
    >
      {imageUrl && (
        <img src={imageUrl} alt={title} className="w-20 h-20 object-cover" />
      )}
      <div className="p-3 flex-1">
        <div className="font-bold text-sm mb-1 truncate">{title}</div>
        <div className="text-xs text-[#8a9aa9] mb-1 max-h-10 overflow-hidden">
          {description}
        </div>
        <div className="text-xs text-[#6e7d8f]">{domain}</div>
      </div>
    </motion.div>
  );
};
