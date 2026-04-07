'use client';

import { Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { useProfessionalUserPreferences } from '@/lib/use-professional-user-preferences';

interface ProfessionalProfileActionsProps {
  locale: string;
  professionalId: string;
  professionalName: string;
}

export const ProfessionalProfileActions = ({
  locale,
  professionalId,
  professionalName,
}: ProfessionalProfileActionsProps) => {
  const { isFavorite, toggleFavorite } = useProfessionalUserPreferences();
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const favorite = isFavorite(professionalId);

  useEffect(() => {
    if (shareState !== 'copied') {
      return;
    }

    const timeoutId = window.setTimeout(() => setShareState('idle'), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  const shareProfile = async () => {
    const shareTitle =
      locale === 'id' ? `Lihat profil ${professionalName} di ${document.title}` : `View ${professionalName}'s profile`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareState('copied');
      }
    } catch {
      // Keep the action best effort.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <IconButton
        ariaLabel={locale === 'id' ? 'Bagikan profil profesional' : 'Share professional profile'}
        className="h-11 w-11 rounded-full border border-white/70 bg-white/90 text-slate-600 shadow-sm hover:bg-white"
        icon={<Share2 className="h-[18px] w-[18px]" />}
        onClick={() => {
          void shareProfile();
        }}
      />
      <IconButton
        ariaLabel={
          favorite
            ? locale === 'id'
              ? `Hapus ${professionalName} dari favorit`
              : `Remove ${professionalName} from favorites`
            : locale === 'id'
              ? `Tambahkan ${professionalName} ke favorit`
              : `Add ${professionalName} to favorites`
        }
        className={`h-11 w-11 rounded-full border border-white/70 bg-white/90 shadow-sm hover:bg-white ${
          favorite ? 'text-rose-600' : 'text-slate-600'
        }`}
        icon={<Heart className={`h-[18px] w-[18px] ${favorite ? 'fill-current' : ''}`} />}
        onClick={() => toggleFavorite(professionalId)}
      />
      {shareState === 'copied' ? (
        <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
          {locale === 'id' ? 'Link disalin' : 'Link copied'}
        </span>
      ) : null}
    </div>
  );
};
