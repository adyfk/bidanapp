'use client';

import {
  BadgeAlert,
  Bug,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Flag,
  KeyRound,
  LifeBuoy,
  Mail,
  MessageCircleMore,
  MessagesSquare,
  PhoneCall,
  ReceiptText,
  Search,
  ShieldAlert,
  WalletCards,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useSupportDesk } from '@/features/admin/hooks/useSupportDesk';
import { APP_CONFIG } from '@/lib/config';
import type {
  CustomerSupportCategoryId,
  ProfessionalSupportCategoryId,
  SupportCategoryId,
  SupportChannelId,
  SupportRole,
  SupportTicketStatus,
  SupportUrgencyId,
} from '@/types/admin';
import {
  ProfileSheetField,
  ProfileSheetNotice,
  ProfileSheetSection,
  ProfileSheetShell,
  profileSheetInputClassName,
} from './ProfileSheetPrimitives';

type SupportNamespace = 'Profile' | 'ProfessionalProfile';
type SupportSubmitState = 'error' | 'idle' | 'success';
type SupportErrorKey = 'categoryRequired' | 'contactRequired' | 'detailsRequired' | null;

interface ProfileSupportEntryCardProps {
  namespace: SupportNamespace;
  onOpen: () => void;
}

interface ProfileSupportSheetProps {
  defaultContact: string;
  isOpen: boolean;
  namespace: SupportNamespace;
  onClose: () => void;
  reporterName: string;
  reporterPhone: string;
  supportRole: SupportRole;
}

interface SupportDraft {
  categoryId: SupportCategoryId | '';
  contactValue: string;
  details: string;
  preferredChannel: SupportChannelId;
  reference: string;
  summary: string;
  urgency: SupportUrgencyId;
}

interface SupportCase {
  categoryId: SupportCategoryId;
  createdAt: string;
  etaKey: SupportUrgencyId;
  id: string;
  status: SupportTicketStatus;
  summary: string;
}

const customerCategoryIds: CustomerSupportCategoryId[] = [
  'serviceComplaint',
  'refundRequest',
  'paymentIssue',
  'reportProfessional',
  'accountAccess',
  'other',
];

const professionalCategoryIds: ProfessionalSupportCategoryId[] = [
  'serviceDispute',
  'refundClarification',
  'accountAccess',
  'reportCustomer',
  'technicalIssue',
  'other',
];

const flowStepIds = ['stepOne', 'stepTwo', 'stepThree', 'stepFour'] as const;
const momentIds = ['caseOne', 'caseTwo', 'caseThree'] as const;
const metricIds = ['firstResponse', 'reviewWindow', 'resolution'] as const;
const urgencyIds: SupportUrgencyId[] = ['normal', 'high', 'urgent'];
const channelIds: SupportChannelId[] = ['whatsapp', 'call', 'email'];

const categoryIconMap: Record<SupportCategoryId, ReactNode> = {
  accountAccess: <KeyRound className="h-4 w-4" />,
  other: <CircleHelp className="h-4 w-4" />,
  paymentIssue: <ReceiptText className="h-4 w-4" />,
  refundClarification: <WalletCards className="h-4 w-4" />,
  refundRequest: <WalletCards className="h-4 w-4" />,
  reportCustomer: <Flag className="h-4 w-4" />,
  reportProfessional: <Flag className="h-4 w-4" />,
  serviceComplaint: <BadgeAlert className="h-4 w-4" />,
  serviceDispute: <BadgeAlert className="h-4 w-4" />,
  technicalIssue: <Bug className="h-4 w-4" />,
};

const channelIconMap: Record<SupportChannelId, ReactNode> = {
  call: <PhoneCall className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageCircleMore className="h-4 w-4" />,
};

const statusClassNameMap: Record<SupportTicketStatus, string> = {
  new: 'bg-amber-100 text-amber-700',
  refunded: 'bg-emerald-100 text-emerald-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  reviewing: 'bg-blue-100 text-blue-700',
  triaged: 'bg-violet-100 text-violet-700',
};

const createInitialDraft = (defaultContact: string): SupportDraft => ({
  categoryId: '',
  contactValue: defaultContact,
  details: '',
  preferredChannel: 'whatsapp',
  reference: '',
  summary: '',
  urgency: 'normal',
});

const sanitizeContact = (value: string) => value.replace(/[^\w@.+\s()-]/g, '');

export const ProfileSupportEntryCard = ({ namespace, onOpen }: ProfileSupportEntryCardProps) => {
  const t = useTranslations(namespace);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[30px] border border-amber-100/80 bg-[linear-gradient(135deg,#FFF8E8_0%,#FFFFFF_48%,#FFF5F7_100%)] p-5 text-left shadow-[0_22px_48px_-36px_rgba(146,64,14,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_28px_54px_-36px_rgba(146,64,14,0.32)] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] border border-white/80 bg-white text-amber-600 shadow-[0_12px_28px_-22px_rgba(146,64,14,0.45)]">
            <LifeBuoy className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="text-[18px] font-bold leading-tight text-slate-900">{t('support.entry.title')}</p>
            <p className="mt-2 max-w-[18rem] text-[13px] leading-7 text-slate-600">{t('support.entry.description')}</p>
          </div>
        </div>

        <div className="flex-shrink-0 rounded-[20px] border border-white/80 bg-white px-3 py-2 text-center text-[11px] font-bold leading-5 text-amber-700 shadow-[0_12px_28px_-22px_rgba(146,64,14,0.45)]">
          {t('support.entry.responseBadge')}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.4)]">
          {t('support.entry.issueBadge')}
        </span>
        <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.4)]">
          {t('support.entry.refundBadge')}
        </span>
        <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-[0_10px_20px_-20px_rgba(15,23,42,0.4)]">
          {t('support.entry.reportBadge')}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-amber-100/70 pt-4 text-[14px] font-semibold text-amber-700">
        <span>{t('support.entry.action')}</span>
        <ChevronRight className="h-4 w-4" />
      </div>
    </button>
  );
};

export const ProfileSupportSheet = ({
  defaultContact,
  isOpen,
  namespace,
  onClose,
  reporterName,
  reporterPhone,
  supportRole,
}: ProfileSupportSheetProps) => {
  const t = useTranslations(namespace);
  const locale = useLocale();
  const { submitSupportTicket, tickets } = useSupportDesk();
  const [draft, setDraft] = useState<SupportDraft>(() => createInitialDraft(defaultContact));
  const [submitState, setSubmitState] = useState<SupportSubmitState>('idle');
  const [errorKey, setErrorKey] = useState<SupportErrorKey>(null);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);
  const recentCases: SupportCase[] = tickets
    .filter((ticket) => ticket.reporterRole === supportRole)
    .slice(0, 4)
    .map((ticket) => ({
      categoryId: ticket.categoryId,
      createdAt: ticket.createdAt,
      etaKey: ticket.etaKey,
      id: ticket.id,
      status: ticket.status,
      summary: ticket.summary,
    }));

  useEffect(() => {
    setDraft((currentDraft) =>
      currentDraft.contactValue.trim().length > 0
        ? currentDraft
        : {
            ...currentDraft,
            contactValue: defaultContact,
          },
    );
  }, [defaultContact]);

  if (!isOpen) {
    return null;
  }

  const categoryIds = supportRole === 'customer' ? customerCategoryIds : professionalCategoryIds;
  const formatter = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  });
  const statusMessage =
    submitState === 'success' && submittedTicketId
      ? t('support.success', { ticketId: submittedTicketId })
      : submitState === 'error' && errorKey
        ? t(`support.errors.${errorKey}`)
        : null;

  const updateDraftField = <K extends keyof SupportDraft>(field: K, value: SupportDraft[K]) => {
    setSubmitState('idle');
    setErrorKey(null);

    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: field === 'contactValue' ? sanitizeContact(String(value)) : value,
    }));
  };

  const handleSubmit = () => {
    if (!draft.categoryId) {
      setSubmitState('error');
      setErrorKey('categoryRequired');
      return;
    }

    if (!draft.contactValue.trim()) {
      setSubmitState('error');
      setErrorKey('contactRequired');
      return;
    }

    if (!draft.details.trim()) {
      setSubmitState('error');
      setErrorKey('detailsRequired');
      return;
    }

    const createdTicket = submitSupportTicket({
      categoryId: draft.categoryId,
      contactValue: draft.contactValue.trim(),
      details: draft.details.trim(),
      preferredChannel: draft.preferredChannel,
      referenceCode: draft.reference.trim() || undefined,
      relatedAppointmentId: draft.reference.trim().startsWith('apt-') ? draft.reference.trim() : undefined,
      reporterName,
      reporterPhone,
      reporterRole: supportRole,
      sourceSurface: supportRole === 'customer' ? 'profile_customer' : 'profile_professional',
      summary: draft.summary.trim() || t(`support.categories.${draft.categoryId}.title`),
      urgency: draft.urgency,
    });

    setSubmittedTicketId(createdTicket.id);
    setSubmitState('success');
    setErrorKey(null);
    setDraft((currentDraft) => ({
      ...createInitialDraft(currentDraft.contactValue),
      contactValue: currentDraft.contactValue,
      preferredChannel: currentDraft.preferredChannel,
    }));
  };

  return (
    <ProfileSheetShell
      closeLabel={t('buttons.close')}
      description={t('support.description')}
      onClose={onClose}
      title={t('support.title')}
    >
      <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5">
        <div className="space-y-6">
          {statusMessage ? (
            <ProfileSheetNotice message={statusMessage} tone={submitState === 'success' ? 'success' : 'error'} />
          ) : null}

          <ProfileSheetSection
            icon={<ShieldAlert className="h-5 w-5" />}
            iconClassName="bg-amber-50 text-amber-600"
            title={t('support.overview.title')}
            description={t('support.overview.description')}
          >
            <div className="grid grid-cols-3 gap-3">
              {metricIds.map((metricId) => (
                <div key={metricId} className="rounded-[20px] border border-gray-200 bg-gray-50 px-3 py-3">
                  <p className="text-[11px] font-semibold text-gray-500">{t(`support.metrics.${metricId}.label`)}</p>
                  <p className="mt-2 text-[15px] font-bold text-gray-900">{t(`support.metrics.${metricId}.value`)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              {momentIds.map((momentId) => (
                <div key={momentId} className="rounded-[20px] border border-gray-200 bg-white px-4 py-3">
                  <p className="text-[13px] font-semibold text-gray-900">{t(`support.moments.${momentId}.title`)}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                    {t(`support.moments.${momentId}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </ProfileSheetSection>

          <ProfileSheetSection
            icon={<MessagesSquare className="h-5 w-5" />}
            iconClassName="bg-rose-50 text-rose-500"
            title={t('support.form.title')}
            description={t('support.form.description')}
          >
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[12px] font-semibold text-gray-500">{t('support.form.categoryLabel')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {categoryIds.map((categoryId) => {
                    const isActive = draft.categoryId === categoryId;

                    return (
                      <button
                        key={categoryId}
                        type="button"
                        onClick={() => updateDraftField('categoryId', categoryId)}
                        className={`rounded-[22px] border px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'border-pink-200 bg-pink-50 shadow-[0_10px_20px_rgba(236,72,153,0.12)]'
                            : 'border-gray-200 bg-white hover:border-pink-100 hover:bg-pink-50/40'
                        }`}
                      >
                        <div
                          className={`inline-flex rounded-full p-2 ${
                            isActive ? 'bg-white text-pink-500' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {categoryIconMap[categoryId]}
                        </div>
                        <p className="mt-3 text-[13px] font-semibold text-gray-900">
                          {t(`support.categories.${categoryId}.title`)}
                        </p>
                        <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                          {t(`support.categories.${categoryId}.description`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ProfileSheetField label={t('support.form.summaryLabel')}>
                <input
                  type="text"
                  value={draft.summary}
                  onChange={(event) => updateDraftField('summary', event.target.value)}
                  placeholder={t('support.form.summaryPlaceholder')}
                  className={profileSheetInputClassName}
                />
              </ProfileSheetField>

              <ProfileSheetField label={t('support.form.referenceLabel')}>
                <input
                  type="text"
                  value={draft.reference}
                  onChange={(event) => updateDraftField('reference', event.target.value)}
                  placeholder={t('support.form.referencePlaceholder')}
                  className={profileSheetInputClassName}
                />
              </ProfileSheetField>

              <div>
                <p className="mb-2 text-[12px] font-semibold text-gray-500">{t('support.form.channelLabel')}</p>
                <div className="grid grid-cols-3 gap-3">
                  {channelIds.map((channelId) => {
                    const isActive = draft.preferredChannel === channelId;

                    return (
                      <button
                        key={channelId}
                        type="button"
                        onClick={() => updateDraftField('preferredChannel', channelId)}
                        className={`rounded-[18px] border px-3 py-3 text-center transition-all ${
                          isActive
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-100 hover:bg-blue-50/40'
                        }`}
                      >
                        <div className="mx-auto inline-flex rounded-full bg-white p-2 shadow-sm">
                          {channelIconMap[channelId]}
                        </div>
                        <p className="mt-2 text-[12px] font-semibold">{t(`support.channels.${channelId}`)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ProfileSheetField label={t('support.form.contactLabel')}>
                <input
                  type="text"
                  value={draft.contactValue}
                  onChange={(event) => updateDraftField('contactValue', event.target.value)}
                  placeholder={t('support.form.contactPlaceholder')}
                  className={profileSheetInputClassName}
                />
              </ProfileSheetField>

              <div>
                <p className="mb-2 text-[12px] font-semibold text-gray-500">{t('support.form.urgencyLabel')}</p>
                <div className="grid gap-3">
                  {urgencyIds.map((urgencyId) => {
                    const isActive = draft.urgency === urgencyId;

                    return (
                      <button
                        key={urgencyId}
                        type="button"
                        onClick={() => updateDraftField('urgency', urgencyId)}
                        className={`rounded-[20px] border px-4 py-3 text-left transition-all ${
                          isActive
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-gray-200 bg-white hover:border-amber-100 hover:bg-amber-50/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">
                              {t(`support.urgency.${urgencyId}.title`)}
                            </p>
                            <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                              {t(`support.urgency.${urgencyId}.description`)}
                            </p>
                          </div>
                          <Clock3 className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-gray-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <ProfileSheetField label={t('support.form.detailsLabel')}>
                <textarea
                  value={draft.details}
                  onChange={(event) => updateDraftField('details', event.target.value)}
                  placeholder={t('support.form.detailsPlaceholder')}
                  className={`${profileSheetInputClassName} h-32 resize-none`}
                />
              </ProfileSheetField>

              <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-[12px] leading-relaxed text-gray-500">{t('support.form.helper')}</p>
              </div>
            </div>
          </ProfileSheetSection>

          <ProfileSheetSection
            icon={<ClipboardCheck className="h-5 w-5" />}
            iconClassName="bg-emerald-50 text-emerald-600"
            title={t('support.flow.title')}
            description={t('support.flow.description')}
          >
            <div className="space-y-3">
              {flowStepIds.map((stepId, index) => (
                <div key={stepId} className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
                      {index === 0 ? (
                        <MessagesSquare className="h-4 w-4" />
                      ) : index === 1 ? (
                        <ClipboardCheck className="h-4 w-4" />
                      ) : index === 2 ? (
                        <Search className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        {t(`support.flow.${stepId}.badge`)}
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-gray-900">
                        {t(`support.flow.${stepId}.title`)}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed text-gray-500">
                        {t(`support.flow.${stepId}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ProfileSheetSection>

          <ProfileSheetSection
            icon={<LifeBuoy className="h-5 w-5" />}
            iconClassName="bg-blue-50 text-blue-600"
            title={t('support.recent.title')}
            description={t('support.recent.description')}
          >
            <div className="space-y-3">
              {recentCases.length === 0 ? (
                <div className="rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-4 text-[12px] text-gray-500">
                  {t('support.recent.empty')}
                </div>
              ) : (
                recentCases.map((supportCase) => (
                  <div key={supportCase.id} className="rounded-[22px] border border-gray-200 bg-white px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{supportCase.summary}</p>
                        <p className="mt-1 text-[12px] text-gray-500">
                          {t(`support.categories.${supportCase.categoryId}.title`)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClassNameMap[supportCase.status]}`}
                      >
                        {t(`support.recent.statuses.${supportCase.status}`)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-[18px] bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-semibold text-gray-500">{t('support.recent.ticketLabel')}</p>
                        <p className="mt-1 text-[12px] font-semibold text-gray-800">{supportCase.id}</p>
                      </div>
                      <div className="rounded-[18px] bg-gray-50 px-3 py-3">
                        <p className="text-[11px] font-semibold text-gray-500">{t('support.recent.etaLabel')}</p>
                        <p className="mt-1 text-[12px] font-semibold text-gray-800">
                          {t(`support.recent.etas.${supportCase.etaKey}`)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-gray-400">
                      {formatter.format(new Date(supportCase.createdAt))}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ProfileSheetSection>
        </div>
      </div>

      <div className="border-t border-gray-100 bg-white p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full rounded-[18px] py-4 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(233,30,140,0.25)] transition-all active:scale-[0.99]"
          style={{ backgroundColor: APP_CONFIG.colors.primary }}
        >
          {t('support.submitButton')}
        </button>
      </div>
    </ProfileSheetShell>
  );
};
