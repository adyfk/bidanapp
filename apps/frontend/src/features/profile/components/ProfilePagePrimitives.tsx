'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { IconButton } from '@/components/ui/IconButton';
import { APP_CONFIG } from '@/lib/config';

interface ProfilePageHeaderProps {
  onBack: () => void;
  rightSlot?: ReactNode;
  title: string;
}

interface ProfileIdentityCardProps {
  actionLabel: string;
  avatarName: string;
  avatarSrc?: string | null;
  chipIcon?: ReactNode;
  chipLabel?: string;
  onAction: () => void;
  subtitle: string;
  title: string;
}

interface ProfileQuickActionCardProps {
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}

interface ProfileSettingsRowProps {
  description: string;
  icon: ReactNode;
  iconClassName: string;
  isLast?: boolean;
  onClick?: () => void;
  title: string;
  trailing?: ReactNode;
}

interface ProfileLogoutButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export const ProfilePageHeader = ({ onBack, rightSlot, title }: ProfilePageHeaderProps) => (
  <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#FBFCFE_100%)] px-4 pb-4 pt-14 shadow-[0_18px_42px_-38px_rgba(15,23,42,0.35)]">
    <div className="flex items-center justify-between">
      <IconButton icon={<ChevronLeft className="h-6 w-6 text-gray-800" />} onClick={onBack} />
      <h1 className="text-[17px] font-bold tracking-[0.01em] text-slate-900">{title}</h1>
      {rightSlot || <div className="w-10" />}
    </div>
  </div>
);

export const ProfileIdentityCard = ({
  actionLabel,
  avatarName,
  avatarSrc,
  chipIcon,
  chipLabel,
  onAction,
  subtitle,
  title,
}: ProfileIdentityCardProps) => (
  <div className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.28)]">
    <div className="flex items-start gap-4">
      <AppAvatar
        name={avatarName}
        src={avatarSrc}
        className="h-[72px] w-[72px] flex-shrink-0 rounded-full border-2 border-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)]"
        fallbackClassName="text-[18px] font-bold"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold leading-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-600 shadow-[0_10px_26px_-22px_rgba(15,23,42,0.35)] transition-colors hover:bg-slate-50"
          >
            {actionLabel}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {chipLabel ? (
          <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full border border-pink-100 bg-pink-50/80 px-3 py-1.5 text-[11px] font-semibold text-pink-600">
            {chipIcon}
            <span className="truncate">{chipLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);

export const ProfileQuickActionCard = ({ description, icon, onClick, title }: ProfileQuickActionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-h-[172px] flex-col rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_100%)] p-5 text-left shadow-[0_18px_42px_-36px_rgba(15,23,42,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-34px_rgba(15,23,42,0.28)] active:scale-[0.99]"
  >
    <div
      className="flex h-12 w-12 items-center justify-center rounded-[18px]"
      style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
    >
      {icon}
    </div>
    <div className="mt-5">
      <h3 className="text-[15px] font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-6 text-slate-500">{description}</p>
    </div>
  </button>
);

export const ProfileSettingsCard = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_22px_50px_-40px_rgba(15,23,42,0.25)]">
    {children}
  </div>
);

export const ProfileSettingsRow = ({
  description,
  icon,
  iconClassName,
  isLast = false,
  onClick,
  title,
  trailing,
}: ProfileSettingsRowProps) => {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-4 text-slate-700">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-slate-800">{title}</p>
          <p className="mt-0.5 text-[12.5px] leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {trailing || (onClick ? <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-300" /> : null)}
    </>
  );

  const className = `flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors ${
    isLast ? '' : 'border-b border-slate-100'
  } ${onClick ? 'hover:bg-slate-50/80' : ''}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};

export const ProfileLogoutButton = ({ icon, label, onClick }: ProfileLogoutButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-1 flex w-full items-center justify-center gap-2 rounded-[28px] border border-red-100 bg-[linear-gradient(180deg,#FFF4F4_0%,#FFECEC_100%)] p-4 font-bold text-red-500 shadow-[0_18px_40px_-34px_rgba(239,68,68,0.28)] transition-colors active:bg-red-100"
  >
    {icon}
    {label}
  </button>
);
