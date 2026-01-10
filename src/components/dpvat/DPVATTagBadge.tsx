import React from 'react';
import { cn } from '@/lib/utils';
import { DPVATTag } from '@/types/dpvat';

interface DPVATTagBadgeProps {
  tag: DPVATTag;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export const DPVATTagBadge = React.forwardRef<HTMLSpanElement, DPVATTagBadgeProps>(
  ({ tag, size = 'md', removable, onRemove }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full font-medium',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        )}
        style={{
          backgroundColor: `${tag.color}15`,
          color: tag.color,
          border: `1px solid ${tag.color}30`,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: tag.color }}
        />
        {tag.name}
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:opacity-70"
          >
            ×
          </button>
        )}
      </span>
    );
  }
);

DPVATTagBadge.displayName = 'DPVATTagBadge';
