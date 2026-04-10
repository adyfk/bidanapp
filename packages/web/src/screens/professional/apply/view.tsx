'use client';

import {
  createMarketplaceApiClient,
  type DirectoryProfessional,
  fetchDirectoryProfessionals,
  fetchProfessionalPlatformWorkspace,
  fetchViewerAuthSession,
  issueProfessionalDocumentUploadToken,
  type ProfessionalPlatformWorkspace,
  saveProfessionalPlatformApplication,
  type ViewerSession,
} from '@marketplace/marketplace-core';
import {
  getPlatformRegistrationSchema,
  getServicePlatformConfig,
  type ServicePlatformId,
} from '@marketplace/platform-config';
import { MarketplaceMobileShell } from '@marketplace/ui';
import { useEffect, useMemo, useState } from 'react';
import { createLocaleSwitcherItems } from '../../../layout/navigation';
import { getApiBaseUrl, getApiOrigin } from '../../../lib/env';
import { isEnglishLocale } from '../../../lib/marketplace-copy';
import { createLocalizedPath } from '../../../lib/platform';
import { ProfessionalAccessSkeleton } from './parts/access-skeleton';
import {
  ApplicationFormSection,
  ApplicationStatusCard,
  ProfessionalAccessHero,
  ProfileMaintenanceCard,
  ReviewAttachmentsSection,
} from './parts/application-sections';
import { GuestAccessSection, GuestPreviewSection, PathSeparationCard } from './parts/guest-access';
import { ProfessionalApplyNotReadyState } from './parts/not-ready-state';
import { ProfessionalApplyPageHeader } from './parts/page-header';
import { fallbackPreviewProfessionals, stringifyApplyValue } from './utils';

const apiBaseUrl = getApiBaseUrl();
const client = createMarketplaceApiClient(apiBaseUrl);

function formatApplicationErrorMessage(error: unknown, locale: string) {
  const rawMessage = error instanceof Error ? error.message : '';
  const normalizedMessage = rawMessage.toLowerCase();
  const isEnglish = isEnglishLocale(locale);

  if (normalizedMessage.includes('str_number')) {
    return isEnglish
      ? 'STR license number is required before sending the application.'
      : 'Nomor STR wajib diisi sebelum aplikasi dikirim.';
  }

  if (normalizedMessage.includes('sipb_document_url')) {
    return isEnglish
      ? 'SIPB document must be uploaded before sending the application.'
      : 'Dokumen SIPB wajib diunggah sebelum aplikasi dikirim.';
  }

  if (normalizedMessage.includes('education_history')) {
    return isEnglish
      ? 'Education history is required before sending the application.'
      : 'Riwayat pendidikan wajib diisi sebelum aplikasi dikirim.';
  }

  if (normalizedMessage.includes('storefront name')) {
    return isEnglish ? 'Professional name is required.' : 'Nama profesional wajib diisi.';
  }

  if (normalizedMessage.includes('invalid professional onboarding payload')) {
    return isEnglish
      ? 'Please complete the required professional application fields first.'
      : 'Lengkapi field wajib aplikasi profesional terlebih dahulu.';
  }

  return rawMessage || (isEnglish ? 'Failed to save the application.' : 'Gagal menyimpan aplikasi.');
}

export function ProfessionalApplyPage({
  authHref,
  initialSession,
  locale,
  platformId,
}: {
  authHref: string;
  initialSession?: ViewerSession | null;
  locale: string;
  platformId: ServicePlatformId;
}) {
  const platform = getServicePlatformConfig(platformId);
  const localizedSchema = getPlatformRegistrationSchema(platform, locale);
  const [workspace, setWorkspace] = useState<ProfessionalPlatformWorkspace | null>(null);
  const [session, setSession] = useState<ViewerSession | null>(initialSession ?? null);
  const [previewProfessionals, setPreviewProfessionals] = useState<DirectoryProfessional[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFieldKey, setUploadingFieldKey] = useState('');
  const [applicationForm, setApplicationForm] = useState<{
    attributes: Record<string, string | boolean>;
    city: string;
    displayName: string;
    slug: string;
  }>({
    attributes: {},
    city: '',
    displayName: '',
    slug: '',
  });

  const schemaFields = localizedSchema.fields;
  const loginHref = createLocalizedPath(locale, '/login');
  const registerHref = createLocalizedPath(locale, '/register');
  const forgotPasswordHref = createLocalizedPath(locale, '/forgot-password');
  const homeHref = createLocalizedPath(locale);
  const profileHref = createLocalizedPath(locale, '/profile');
  const currentPath = createLocalizedPath(locale, '/professionals/apply');
  const localeItems = createLocaleSwitcherItems(currentPath, locale);

  const previewCards = useMemo(() => {
    if (previewProfessionals.length) {
      return previewProfessionals.slice(0, 3);
    }
    return fallbackPreviewProfessionals(locale, platformId);
  }, [locale, platformId, previewProfessionals]);

  const selectedPreview =
    previewCards.find((professional) => professional.id === selectedPreviewId) || previewCards[0] || null;

  useEffect(() => {
    if (!selectedPreviewId && previewCards[0]?.id) {
      setSelectedPreviewId(previewCards[0].id);
    }
  }, [previewCards, selectedPreviewId]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const [sessionResult, previewResult] = await Promise.allSettled([
          fetchViewerAuthSession(client),
          fetchDirectoryProfessionals(client, platformId),
        ]);

        if (!isActive) {
          return;
        }

        if (previewResult.status === 'fulfilled') {
          setPreviewProfessionals(previewResult.value.professionals ?? []);
        }

        if (sessionResult.status === 'fulfilled') {
          setSession(sessionResult.value);

          if (sessionResult.value.isAuthenticated) {
            const workspaceResult = await fetchProfessionalPlatformWorkspace(client, platformId);
            if (!isActive) {
              return;
            }

            setWorkspace(workspaceResult);
            setApplicationForm({
              displayName:
                workspaceResult.profile?.displayName || sessionResult.value.customerProfile?.displayName || '',
              city: workspaceResult.profile?.city || sessionResult.value.customerProfile?.city || '',
              slug: workspaceResult.profile?.slug || '',
              attributes: Object.fromEntries(
                (localizedSchema.fields ?? []).map((field) => [
                  field.key,
                  typeof workspaceResult.application?.attributes?.[field.key] === 'boolean'
                    ? Boolean(workspaceResult.application?.attributes?.[field.key])
                    : stringifyApplyValue(workspaceResult.application?.attributes?.[field.key]),
                ]),
              ),
            });
          } else {
            setWorkspace(null);
            setApplicationForm((current) => ({
              ...current,
              attributes: Object.fromEntries(
                schemaFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
              ),
              city: sessionResult.value.customerProfile?.city || current.city,
              displayName: sessionResult.value.customerProfile?.displayName || current.displayName,
            }));
          }
        } else {
          setWorkspace(null);
          setApplicationForm((current) => ({
            ...current,
            attributes: Object.fromEntries(
              schemaFields.map((field) => [field.key, field.type === 'boolean' ? false : '']),
            ),
          }));
        }
      } catch (error) {
        if (isActive) {
          setMessage(error instanceof Error ? error.message : 'Gagal memuat halaman profesional.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [platformId, schemaFields, localizedSchema.fields]);

  const currentStatus = workspace?.application?.status || 'draft';
  const isAuthenticated = Boolean(session?.isAuthenticated);
  const reviewStatus = workspace?.profile?.reviewStatus || 'draft';
  const localizedStatus = currentStatus.replaceAll('_', ' ');
  const localizedReviewStatus = reviewStatus.replaceAll('_', ' ');
  const documentFields = schemaFields.filter((field) => field.type === 'document');
  const documentCompletion = documentFields.filter((field) =>
    Boolean(stringifyApplyValue(applicationForm.attributes[field.key])),
  ).length;
  const readinessFields = schemaFields.filter((field) => field.type !== 'document');
  const readinessCompletion = readinessFields.filter((field) => {
    const value = applicationForm.attributes[field.key];
    return field.type === 'boolean' ? Boolean(value) : Boolean(stringifyApplyValue(value).trim());
  }).length;
  const milestones = [
    {
      complete: Boolean(applicationForm.displayName.trim() && applicationForm.city.trim()),
      key: 'identity',
      label: 'Identitas',
      meta: applicationForm.displayName.trim() && applicationForm.city.trim() ? 'Siap' : 'Nama + kota',
    },
    {
      complete: documentFields.length ? documentCompletion === documentFields.length : true,
      key: 'documents',
      label: 'Dokumen',
      meta: documentFields.length ? `${documentCompletion}/${documentFields.length}` : 'Tidak ada',
    },
    {
      complete: readinessFields.length
        ? readinessCompletion >= Math.max(1, Math.ceil(readinessFields.length / 2))
        : true,
      key: 'readiness',
      label: 'Kesiapan layanan',
      meta: readinessFields.length ? `${readinessCompletion}/${readinessFields.length}` : 'Siap',
    },
    {
      complete: currentStatus !== 'draft',
      key: 'review',
      label: 'Review',
      meta: localizedStatus,
    },
  ];

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setMessage('');

      const result = await saveProfessionalPlatformApplication(client, platformId, {
        city: applicationForm.city,
        displayName: applicationForm.displayName,
        slug: applicationForm.slug,
        attributes: Object.fromEntries(
          Object.entries(applicationForm.attributes).map(([key, value]) => [key, value === '' ? null : value]),
        ),
      });

      setWorkspace(result);
      setMessage(isEnglishLocale(locale) ? 'Your application has been saved.' : 'Aplikasi Anda berhasil disimpan.');
    } catch (error) {
      setMessage(formatApplicationErrorMessage(error, locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = async (fieldKey: string, file: File | null) => {
    if (!file) {
      return;
    }

    try {
      setUploadingFieldKey(fieldKey);
      setMessage('');
      const token = await issueProfessionalDocumentUploadToken(client, platformId, {
        contentType: file.type,
        documentKey: fieldKey,
        fileName: file.name,
      });

      const uploadUrl = new URL(token.uploadUrl, getApiOrigin()).toString();
      const uploadResponse = await fetch(uploadUrl, {
        body: file,
        credentials: 'include',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        method: token.method || 'PUT',
      });
      if (!uploadResponse.ok) {
        throw new Error(isEnglishLocale(locale) ? 'Document upload failed.' : 'Upload dokumen gagal.');
      }

      setApplicationForm((current) => ({
        ...current,
        attributes: {
          ...current.attributes,
          [fieldKey]: token.documentId,
        },
      }));
      setMessage(
        isEnglishLocale(locale) ? `${file.name} uploaded successfully.` : `Dokumen ${file.name} berhasil diunggah.`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal mengunggah dokumen.');
    } finally {
      setUploadingFieldKey('');
    }
  };

  if (loading) {
    return <ProfessionalAccessSkeleton homeHref={homeHref} locale={locale} localeItems={localeItems} />;
  }

  if (isAuthenticated && !workspace) {
    return <ProfessionalApplyNotReadyState homeHref={homeHref} locale={locale} localeItems={localeItems} />;
  }

  return (
    <MarketplaceMobileShell showNav={false}>
      <div
        className="flex h-full flex-col overflow-y-auto pb-10 custom-scrollbar"
        style={{ backgroundColor: 'var(--ui-background)' }}
      >
        <ProfessionalApplyPageHeader homeHref={homeHref} locale={locale} localeItems={localeItems} />

        <div className="space-y-6 px-5 py-6">
          {isAuthenticated ? (
            <section
              className="sticky top-[94px] z-10 rounded-[28px] border p-4 shadow-[0_20px_44px_-32px_rgba(88,49,66,0.16)] backdrop-blur-md"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, color-mix(in srgb, var(--ui-surface-muted) 44%, white) 100%)',
                borderColor: 'var(--ui-border)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: 'var(--ui-primary)' }}
                  >
                    Progress aplikasi
                  </p>
                  <h2 className="mt-2 text-[16px] font-bold text-slate-900">
                    4 milestone tetap untuk form profesional
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500">
                    Form ini sekarang dipisah menjadi identitas, dokumen, kesiapan layanan, lalu review.
                  </p>
                </div>
                <div
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
                  style={{ backgroundColor: 'var(--ui-surface-muted)', color: 'var(--ui-primary)' }}
                >
                  {milestones.filter((item) => item.complete).length}/4
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {milestones.map((milestone) => (
                  <div
                    className="rounded-[20px] border px-3 py-3"
                    key={milestone.key}
                    style={{
                      background: milestone.complete
                        ? 'linear-gradient(180deg, #FFFFFF 0%, color-mix(in srgb, var(--ui-surface-muted) 52%, white) 100%)'
                        : '#ffffff',
                      borderColor: milestone.complete ? 'var(--ui-border-strong)' : 'var(--ui-border)',
                    }}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {milestone.label}
                    </div>
                    <div className="mt-2 text-[14px] font-bold text-slate-900">{milestone.meta}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <ProfessionalAccessHero
            locale={locale}
            localizedReviewStatus={localizedReviewStatus}
            localizedSchemaDescription={
              localizedSchema.description ||
              (isEnglishLocale(locale)
                ? 'Choose your professional path, complete the requested details, then send your application.'
                : 'Pilih jalur profesional Anda, lengkapi detail yang diminta, lalu kirim aplikasi Anda.')
            }
            localizedSchemaTitle={
              localizedSchema.title || (isEnglishLocale(locale) ? 'Professional application' : 'Aplikasi profesional')
            }
            localizedStatus={localizedStatus}
            platformName={platform.name}
          />

          {!isAuthenticated ? (
            <>
              <GuestPreviewSection
                locale={locale}
                onSelect={setSelectedPreviewId}
                previewCards={previewCards}
                selectedPreview={selectedPreview}
              />
              <GuestAccessSection
                forgotPasswordHref={forgotPasswordHref}
                locale={locale}
                loginHref={loginHref}
                registerHref={registerHref}
                selectedPreview={selectedPreview}
              />
              <PathSeparationCard currentPath={currentPath} homeHref={homeHref} locale={locale} />
            </>
          ) : (
            <>
              <ApplicationStatusCard
                applicationFormCity={applicationForm.city}
                authHref={authHref}
                displayName={workspace?.profile?.displayName || applicationForm.displayName || platform.name}
                locale={locale}
                localizedReviewStatus={localizedReviewStatus}
                localizedStatus={localizedStatus}
                message={workspace?.application?.reviewNotes || ''}
                profileHref={profileHref}
                reviewNotes={workspace?.application?.reviewNotes || ''}
              />
              <ApplicationFormSection
                applicationForm={applicationForm}
                isSubmitting={isSubmitting}
                locale={locale}
                message={message}
                onAttributeBooleanChange={(key, checked) =>
                  setApplicationForm((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [key]: checked,
                    },
                  }))
                }
                onAttributeTextChange={(key, value) =>
                  setApplicationForm((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [key]: value,
                    },
                  }))
                }
                onCityChange={(value) => setApplicationForm((current) => ({ ...current, city: value }))}
                onDisplayNameChange={(value) => setApplicationForm((current) => ({ ...current, displayName: value }))}
                onProfileClick={() => {
                  window.location.href = profileHref;
                }}
                onSave={handleSubmit}
                onSlugChange={(value) => setApplicationForm((current) => ({ ...current, slug: value }))}
                onUpload={(key, file) => void handleDocumentUpload(key, file)}
                schemaFields={schemaFields}
                uploadingFieldKey={uploadingFieldKey}
              />
              <ReviewAttachmentsSection
                documents={workspace?.application?.documents ?? []}
                locale={locale}
                localizedReviewStatus={localizedReviewStatus}
                session={session}
              />
              <ProfileMaintenanceCard
                authHref={authHref}
                locale={locale}
                onProfileClick={() => {
                  window.location.href = profileHref;
                }}
              />
            </>
          )}
        </div>
      </div>
    </MarketplaceMobileShell>
  );
}
