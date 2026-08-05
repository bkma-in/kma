import React from 'react';
import { Tag } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TopicTagProps {
  topic: string;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const TopicTag: React.FC<TopicTagProps> = ({ topic, onClick, isSelected, className }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer border",
        isSelected
          ? "bg-black text-white border-black shadow-md"
          : "bg-zinc-100/80 text-zinc-700 border-zinc-200 hover:bg-zinc-200/80 hover:text-black",
        className
      )}
    >
      <Tag size={12} className={isSelected ? 'text-white' : 'text-zinc-400'} />
      <span>{topic}</span>
    </button>
  );
};
