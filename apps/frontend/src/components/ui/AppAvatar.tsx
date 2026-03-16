'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AppAvatarProps {
  alt?: string;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  name: string;
  src?: string | null;
}

const avatarPalettes = [
  {
    backgroundClassName: 'from-rose-100 via-orange-50 to-amber-100',
    textClassName: 'text-rose-700',
  },
  {
    backgroundClassName: 'from-sky-100 via-cyan-50 to-blue-100',
    textClassName: 'text-sky-700',
  },
  {
    backgroundClassName: 'from-emerald-100 via-lime-50 to-teal-100',
    textClassName: 'text-emerald-700',
  },
  {
    backgroundClassName: 'from-violet-100 via-fuchsia-50 to-pink-100',
    textClassName: 'text-violet-700',
  },
];

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const getPalette = (name: string) => {
  const seed = Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarPalettes[seed % avatarPalettes.length];
};

export const AppAvatar = ({
  alt,
  className = 'h-12 w-12 rounded-full',
  fallbackClassName = 'text-[15px] font-bold',
  imageClassName = 'object-cover object-top',
  name,
  src,
}: AppAvatarProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const initials = getInitials(name) || '?';
  const palette = getPalette(name);
  const shouldRenderImage = Boolean(src) && src !== failedSrc;

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {shouldRenderImage && src ? (
        <Image
          src={src}
          alt={alt || name}
          fill
          sizes="96px"
          className={imageClassName}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${palette.backgroundClassName} ${palette.textClassName} ${fallbackClassName}`}
        >
          {initials}
        </div>
      )}
    </div>
  );
};
