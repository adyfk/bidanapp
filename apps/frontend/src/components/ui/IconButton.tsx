'use client';
import type React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

export const IconButton = ({ icon, onClick, className = '', ariaLabel }: IconButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors ${className}`}
  >
    {icon}
  </button>
);
