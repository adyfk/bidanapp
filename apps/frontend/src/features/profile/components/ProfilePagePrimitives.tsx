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
  <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 pb-4 pt-14 shadow-sm">
    <IconButton icon={<ChevronLeft className="h-6 w-6 text-gray-800" />} onClick={onBack} />
    <h1 className="text-[16px] font-bold tracking-wide text-gray-900">{title}</h1>
    {rightSlot || <div className="w-10" />}
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
  <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-4">
      <AppAvatar
        name={avatarName}
        src={avatarSrc}
        className="h-16 w-16 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
        fallbackClassName="text-[18px] font-bold"
      />

      <div className="min-w-0 flex-1">
        <h2 className="text-[18px] font-bold leading-tight text-gray-900">{title}</h2>
        <p className="mt-1 text-[13px] font-medium text-gray-500">{subtitle}</p>
        {chipLabel ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-[11px] font-semibold text-pink-600">
            {chipIcon}
            {chipLabel}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onAction}
        className="flex items-center gap-1 rounded-full bg-gray-50 px-3 py-2 text-[12px] font-semibold text-gray-600 transition-colors hover:bg-gray-100"
      >
        {actionLabel}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export const ProfileQuickActionCard = ({ description, icon, onClick, title }: ProfileQuickActionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-[26px] border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]"
  >
    <div
      className="flex h-11 w-11 items-center justify-center rounded-2xl"
      style={{ backgroundColor: APP_CONFIG.colors.primaryLight, color: APP_CONFIG.colors.primary }}
    >
      {icon}
    </div>
    <h3 className="mt-4 text-[15px] font-bold text-gray-900">{title}</h3>
    <p className="mt-1 text-[12px] leading-relaxed text-gray-500">{description}</p>
  </button>
);

export const ProfileSettingsCard = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">{children}</div>
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
      <div className="flex items-center gap-3 text-gray-700">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconClassName}`}>{icon}</div>
        <div>
          <p className="text-[15px] font-medium">{title}</p>
          <p className="text-[12px] text-gray-500">{description}</p>
        </div>
      </div>
      {trailing || (onClick ? <ChevronRight className="h-5 w-5 text-gray-300" /> : null)}
    </>
  );

  const className = `flex w-full items-center justify-between gap-3 p-4 text-left transition-colors ${
    isLast ? '' : 'border-b border-gray-50'
  } ${onClick ? 'hover:bg-gray-50' : ''}`;

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
    className="mt-2 flex w-full items-center justify-center gap-2 rounded-[24px] bg-red-50 p-4 font-bold text-red-500 shadow-sm transition-colors active:bg-red-100"
  >
    {icon}
    {label}
  </button>
);
