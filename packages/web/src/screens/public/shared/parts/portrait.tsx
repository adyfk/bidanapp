'use client';

import type { DirectoryProfessional } from '@marketplace/marketplace-core/directory';
import type { ViewerSession } from '@marketplace/marketplace-core/viewer-auth';
import { firstName, isEnglishLocale } from '../../../../lib/marketplace-copy';

export function profileInitial(session?: ViewerSession | null) {
  const source = session?.customerProfile?.displayName || session?.phone || 'B';
  return source.charAt(0).toUpperCase();
}

export function viewerLabel(session?: ViewerSession | null, locale?: string) {
  if (!session?.isAuthenticated) {
    return isEnglishLocale(locale) ? 'Guest' : 'Guest';
  }

  return session.customerProfile?.displayName || session.phone || (isEnglishLocale(locale) ? 'Account' : 'Akun');
}

export function currentCity(session?: ViewerSession | null, professionals?: DirectoryProfessional[], locale?: string) {
  return (
    session?.customerProfile?.city ||
    professionals?.[0]?.city ||
    (isEnglishLocale(locale) ? 'Selected area' : 'Area pilihan')
  );
}

const portraitBackgrounds = [
  'linear-gradient(180deg,#FFE0EC 0%,#FFF5F8 100%)',
  'linear-gradient(180deg,#FFD6E5 0%,#FFFAFC 100%)',
  'linear-gradient(180deg,#FFEEF4 0%,#FFFFFF 100%)',
];

function portraitTone(seed: string) {
  const index = seed.length % portraitBackgrounds.length;
  return portraitBackgrounds[index];
}

export function compactNumberLabel(value: number, locale: string, unitId: string, unitEn: string) {
  if (value <= 1) {
    return `${value} ${isEnglishLocale(locale) ? unitEn : unitId}`;
  }
  return `${value} ${isEnglishLocale(locale) ? `${unitEn}s` : unitId}`;
}

export function InitialPortrait({
  label,
  size = 'detail',
}: {
  label: string;
  size?: 'detail' | 'hero' | 'list' | 'small';
}) {
  const dimensions =
    size === 'small'
      ? 'h-14 w-14 rounded-[16px] text-xl'
      : size === 'hero'
        ? 'h-[108px] w-[90px] rounded-[20px] text-[30px]'
        : size === 'list'
          ? 'h-[100px] w-[85px] rounded-[16px] text-[28px]'
          : 'h-[124px] w-[104px] rounded-[24px] text-[36px]';

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border ${dimensions}`}
      style={{
        background: portraitTone(label),
        borderColor: 'rgba(255,255,255,0.6)',
        boxShadow: '0 18px 40px -30px rgba(15,23,42,0.28)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/55 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#FFE0EC] via-[#FFE0EC]/72 to-transparent" />
      <span className="relative z-10 font-bold tracking-[-0.04em]" style={{ color: 'var(--ui-primary)' }}>
        {firstName(label).charAt(0) || 'B'}
      </span>
    </div>
  );
}
