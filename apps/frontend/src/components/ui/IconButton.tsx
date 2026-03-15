'use client';
import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const IconButton = ({ icon, onClick, className = "" }: IconButtonProps) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors ${className}`}
  >
    {icon}
  </button>
);
