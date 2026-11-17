import React from 'react';
import type { StoreId } from '../types/unishop';
import { STORE_META } from '../utils/commerce';

interface StoreBadgeProps {
  store: StoreId;
  size?: 'sm' | 'md';
}

export const StoreLogoMark: React.FC<{ store: StoreId; className?: string }> = ({
  store,
  className = 'h-4 w-4',
}) => {
  switch (store) {
    case 'amazon':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#131921" />
          <path
            d="M5.5 14.8C8.9 17.5 14.3 17.9 18.2 15.2"
            stroke="#FF9900"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M16.5 13.8L18.9 14.8L18.1 17.3"
            stroke="#FF9900"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 6.5C9.9 6.5 8.5 7.9 8.5 9.8C8.5 11.4 9.7 12.6 11.4 12.6C12.9 12.6 14 11.7 14.2 10.6V12.4H15.8V6.7H14.2V8.1C13.8 7.1 13 6.5 12 6.5ZM12.1 11.2C11 11.2 10.2 10.5 10.2 9.6C10.2 8.6 11 7.9 12.1 7.9C13.2 7.9 14 8.6 14 9.6C14 10.5 13.2 11.2 12.1 11.2Z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'vinted':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#007782" />
          <path
            d="M7.2 7.5L11.6 17.2H13.4L17 7.5H14.9L12.5 14.5L9.4 7.5H7.2Z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'wallapop':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#13C1AC" />
          <path
            d="M6.2 8.2L8.7 16.2H10.5L12 11.2L13.5 16.2H15.3L17.8 8.2H15.7L14.3 13.4L12.8 8.2H11.2L9.7 13.4L8.3 8.2H6.2Z"
            fill="#0F172A"
          />
        </svg>
      );
    case 'aliexpress':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#E62E04" />
          <path
            d="M7.5 16.5L11.1 7.2H13L16.5 16.5H14.4L13.6 14.3H10.4L9.6 16.5H7.5ZM10.9 12.6H13.1L12 9.4L10.9 12.6Z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case 'ebay':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect width="24" height="24" rx="5" fill="#FFFFFF" stroke="#E2E8F0" />
          <circle cx="8" cy="12" r="3" fill="#E53238" />
          <circle cx="12" cy="12" r="3" fill="#0064D2" />
          <circle cx="16" cy="12" r="3" fill="#F5AF02" />
        </svg>
      );
  }
};

export const StoreBadge: React.FC<StoreBadgeProps> = ({ store, size = 'sm' }) => {
  const meta = STORE_META[store];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <StoreLogoMark store={store} className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      <span
        className={`font-semibold tracking-tight text-slate-800 dark:text-slate-100 ${
          size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        {meta.label}
      </span>
    </span>
  );
};
