'use client';

import type { ProfessionalPlatformWorkspace, ViewerSession } from '@marketplace/marketplace-core';
import type { ProfessionalRegistrationField } from '@marketplace/platform-config';
import {
  DocumentList,
  MarketplaceAccessHero,
  MarketplaceAccessOptionCard,
  MessageBanner,
  PrimaryButton,
  SecondaryButton,
} from '@marketplace/ui';
import { ArrowRight, CheckCircle2, FileText, MapPin, ShieldCheck } from 'lucide-react';
import { getApiOrigin } from '../../../../lib/env';
import { isEnglishLocale } from '../../../../lib/marketplace-copy';
import { applyFieldClassName, FormField } from './form-field';
import { PreviewAvatar } from './profile-preview';
import { ProfessionalSchemaField } from './schema-field';

export function NotReadyStateCard({ locale }: { locale: string }) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm"
          style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          <ShieldCheck className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
            >
              {isEnglishLocale(locale) ? 'Professional access' : 'Akses profesional'}
            </span>
          </div>
          <h1 className="mt-3 text-[22px] font-bold leading-tight text-gray-900">
            {isEnglishLocale(locale) ? 'We are preparing your form' : 'Kami sedang menyiapkan form Anda'}
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'Please refresh in a moment. The professional application shell is ready but your profile data is not loaded yet.'
              : 'Silakan muat ulang sebentar lagi. Shell aplikasi profesional sudah siap, tetapi data profil Anda belum berhasil dimuat.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProfessionalAccessHero({
  locale,
  localizedReviewStatus,
  localizedSchemaDescription,
  localizedSchemaTitle,
  localizedStatus,
  platformName,
}: {
  locale: string;
  localizedReviewStatus: string;
  localizedSchemaDescription: string;
  localizedSchemaTitle: string;
  localizedStatus: string;
  platformName: string;
}) {
  return (
    <MarketplaceAccessHero
      badgeLabel={isEnglishLocale(locale) ? 'Professional access' : 'Akses profesional'}
      benefits={[
        { icon: <ShieldCheck className="h-4 w-4" />, label: localizedStatus },
        { icon: <MapPin className="h-4 w-4" />, label: platformName },
        { icon: <CheckCircle2 className="h-4 w-4" />, label: localizedReviewStatus },
      ]}
      description={localizedSchemaDescription}
      statusLabel={localizedReviewStatus}
      title={localizedSchemaTitle}
    />
  );
}

export function ApplicationStatusCard({
  applicationFormCity,
  authHref,
  displayName,
  locale,
  localizedReviewStatus,
  localizedStatus,
  message,
  profileHref,
  reviewNotes,
}: {
  applicationFormCity: string;
  authHref: string;
  displayName: string;
  locale: string;
  localizedReviewStatus: string;
  localizedStatus: string;
  message: string;
  profileHref: string;
  reviewNotes: string;
}) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <PreviewAvatar label={displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
            >
              {isEnglishLocale(locale) ? 'Application status' : 'Status aplikasi'}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500">
              {localizedStatus}
            </span>
          </div>
          <p className="mt-3 text-[18px] font-bold break-words text-gray-900 [overflow-wrap:anywhere]">{displayName}</p>
          <p className="mt-1 break-words text-[13px] leading-relaxed text-gray-500 [overflow-wrap:anywhere]">
            {message ||
              (isEnglishLocale(locale)
                ? 'Keep your profile tidy, upload the requested proof, and we will review it before publishing.'
                : 'Rapikan profil, unggah bukti yang diminta, lalu tim kami akan meninjau sebelum dipublikasikan.')}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Review</p>
          <p className="mt-2 text-[16px] font-bold text-slate-900">{localizedReviewStatus}</p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {isEnglishLocale(locale) ? 'City' : 'Kota'}
          </p>
          <p className="mt-2 text-[16px] font-bold text-slate-900">{applicationFormCity || '-'}</p>
        </div>
      </div>

      {reviewNotes ? (
        <div
          className="mt-4 rounded-[20px] border px-4 py-4"
          style={{
            background:
              'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 56%, white) 100%)',
            borderColor: 'var(--ui-border)',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--ui-primary)' }}>
            {isEnglishLocale(locale) ? 'Reviewer note' : 'Catatan reviewer'}
          </p>
          <p className="mt-2 break-words text-[13px] leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {reviewNotes}
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        <a href={profileHref}>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-slate-900/10 transition-transform active:scale-[0.99]"
            style={{
              background:
                'linear-gradient(180deg, var(--ui-primary) 0%, color-mix(in srgb, var(--ui-primary) 66%, var(--ui-secondary)) 100%)',
            }}
          >
            {isEnglishLocale(locale) ? 'Open my profile' : 'Buka profil saya'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </a>
        <a href={authHref}>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            <ShieldCheck className="h-4 w-4" />
            {isEnglishLocale(locale) ? 'Open account center' : 'Buka pusat akun'}
          </button>
        </a>
      </div>
    </section>
  );
}

export function ApplicationFormSection({
  applicationForm,
  isSubmitting,
  locale,
  message,
  onAttributeBooleanChange,
  onAttributeTextChange,
  onCityChange,
  onDisplayNameChange,
  onProfileClick,
  onSave,
  onSlugChange,
  onUpload,
  schemaFields,
  uploadingFieldKey,
}: {
  applicationForm: {
    attributes: Record<string, string | boolean>;
    city: string;
    displayName: string;
    slug: string;
  };
  isSubmitting: boolean;
  locale: string;
  message: string;
  onAttributeBooleanChange: (key: string, checked: boolean) => void;
  onAttributeTextChange: (key: string, value: string) => void;
  onCityChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onProfileClick: () => void;
  onSave: () => void;
  onSlugChange: (value: string) => void;
  onUpload: (key: string, file: File | null) => void;
  schemaFields: ProfessionalRegistrationField[];
  uploadingFieldKey: string;
}) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
        >
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-gray-900">
            {isEnglishLocale(locale) ? 'Complete your application' : 'Lengkapi aplikasi Anda'}
          </p>
          <p className="text-[12px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'Fill the profile basics first, then continue with the details requested below.'
              : 'Isi dasar profil lebih dulu, lalu lanjutkan detail yang diminta di bawah ini.'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <FormField label={isEnglishLocale(locale) ? 'Professional name' : 'Nama profesional'}>
          <input
            className={applyFieldClassName}
            value={applicationForm.displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
          />
        </FormField>

        <FormField label={isEnglishLocale(locale) ? 'City' : 'Kota'}>
          <input
            className={applyFieldClassName}
            value={applicationForm.city}
            onChange={(event) => onCityChange(event.target.value)}
          />
        </FormField>

        <FormField
          label={isEnglishLocale(locale) ? 'Public slug' : 'Slug publik'}
          helperText={
            isEnglishLocale(locale)
              ? 'Optional. Leave it empty if you want us to generate it from your profile name.'
              : 'Opsional. Kosongkan jika Anda ingin kami membuatnya dari nama profil Anda.'
          }
        >
          <input
            className={applyFieldClassName}
            placeholder="alya-rahmawati"
            value={applicationForm.slug}
            onChange={(event) => onSlugChange(event.target.value)}
          />
        </FormField>
      </div>

      <div className="mt-5 grid gap-4">
        {schemaFields.map((field) => (
          <ProfessionalSchemaField
            key={field.key}
            field={field}
            locale={locale}
            onBooleanChange={(checked) => onAttributeBooleanChange(field.key, checked)}
            onTextChange={(value) => onAttributeTextChange(field.key, value)}
            onUpload={(file) => onUpload(field.key, file)}
            uploadingFieldKey={uploadingFieldKey}
            value={applicationForm.attributes[field.key]}
          />
        ))}
      </div>

      {message ? (
        <div className="mt-5">
          <MessageBanner tone={/berhasil|success/i.test(message) ? 'success' : 'info'}>{message}</MessageBanner>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton disabled={isSubmitting} onClick={onSave} type="button">
          {isSubmitting
            ? isEnglishLocale(locale)
              ? 'Saving...'
              : 'Menyimpan...'
            : isEnglishLocale(locale)
              ? 'Save application'
              : 'Kirim aplikasi'}
        </PrimaryButton>
        <SecondaryButton onClick={onProfileClick} type="button">
          {isEnglishLocale(locale) ? 'Open my profile' : 'Buka profil saya'}
        </SecondaryButton>
      </div>
    </section>
  );
}

export function ReviewAttachmentsSection({
  documents,
  locale,
  localizedReviewStatus,
  session,
}: {
  documents: NonNullable<ProfessionalPlatformWorkspace['application']>['documents'];
  locale: string;
  localizedReviewStatus: string;
  session?: ViewerSession | null;
}) {
  return (
    <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[16px] font-bold text-gray-900">
            {isEnglishLocale(locale) ? 'Review attachments' : 'Lampiran review'}
          </p>
          <p className="text-[12px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'Every document you upload will appear here for quick review.'
              : 'Setiap dokumen yang Anda unggah akan muncul di sini untuk review cepat.'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {isEnglishLocale(locale) ? 'Account ID' : 'ID akun'}
          </p>
          <p className="mt-2 text-[14px] font-bold text-slate-900">{session?.userId || '-'}</p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Review</p>
          <p className="mt-2 text-[14px] font-bold text-slate-900">{localizedReviewStatus}</p>
        </div>
      </div>

      <div className="mt-5">
        <DocumentList
          emptyLabel={
            isEnglishLocale(locale)
              ? 'Uploaded document fields will appear here.'
              : 'Field dokumen yang Anda isi akan muncul di sini.'
          }
          items={(documents ?? []).map((document) => ({
            href: new URL(document.documentUrl, getApiOrigin()).toString(),
            id: document.id,
            label: `${document.documentKey}: ${document.fileName || document.documentUrl}`,
            meta: document.fileName || document.documentUrl,
          }))}
        />
      </div>
    </section>
  );
}

export function ProfileMaintenanceCard({
  authHref,
  locale,
  onProfileClick,
}: {
  authHref: string;
  locale: string;
  onProfileClick: () => void;
}) {
  return (
    <section className="rounded-[26px] border border-dashed border-gray-200 bg-white px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-gray-900">
            {isEnglishLocale(locale) ? 'Keep your profile fresh' : 'Jaga profil tetap segar'}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
            {isEnglishLocale(locale)
              ? 'After review is complete, this is where you keep your professional page and account details tidy.'
              : 'Setelah review selesai, jalur ini menjadi tempat untuk merapikan halaman profesional dan detail akun Anda.'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <MarketplaceAccessOptionCard
          arrow={<ArrowRight className="h-4 w-4" />}
          description={
            isEnglishLocale(locale)
              ? 'Open your profile and keep your details up to date.'
              : 'Buka profil Anda dan pastikan informasi tetap terbaru.'
          }
          icon={<MapPin className="h-5 w-5" />}
          onClick={onProfileClick}
          title={isEnglishLocale(locale) ? 'My profile' : 'Profil saya'}
          tone="light"
        />
        <MarketplaceAccessOptionCard
          arrow={<ArrowRight className="h-4 w-4" />}
          description={
            isEnglishLocale(locale)
              ? 'Need password help or device settings? Open the account center.'
              : 'Butuh bantuan password atau pengaturan perangkat? Buka keamanan akun.'
          }
          icon={<ShieldCheck className="h-5 w-5" />}
          onClick={() => {
            window.location.href = authHref;
          }}
          title={isEnglishLocale(locale) ? 'Account security' : 'Keamanan akun'}
          tone="light"
        />
      </div>
    </section>
  );
}
