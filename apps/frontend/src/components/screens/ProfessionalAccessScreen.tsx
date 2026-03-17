'use client';

import { ArrowRight, BriefcaseMedical, ChevronLeft, KeyRound, UserRound } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import { AppAvatar } from '@/components/ui/AppAvatar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { getProfessionalCategoryLabel } from '@/lib/mock-db/catalog';
import { APP_ROUTES, type ProfessionalAccessTab } from '@/lib/routes';
import { useProfessionalPortal } from '@/lib/use-professional-portal';
import { useViewerSession } from '@/lib/use-viewer-session';

interface ProfessionalAccessScreenProps {
  defaultTab?: ProfessionalAccessTab;
}

type AccessErrorKey =
  | 'loginPhoneRequired'
  | 'loginPasswordRequired'
  | 'registerNameRequired'
  | 'registerPhoneRequired'
  | 'registerCredentialRequired'
  | null;

const fieldClass =
  'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] text-gray-800 outline-none transition-all focus:border-pink-300 focus:ring-2 focus:ring-pink-100';

const getLocalizedProfessionalTitle = (title: string, locale: string) => {
  if (!locale.startsWith('id')) {
    return title;
  }

  const replacements: Array<[string, string]> = [
    ['Professional Newborn Care', 'Perawatan Bayi Baru Lahir'],
    ['Professional Postpartum Recovery', 'Pemulihan Pascapersalinan'],
    ['Newborn', 'Bayi Baru Lahir'],
    ['Postpartum', 'Pascapersalinan'],
  ];

  return replacements.reduce((localizedTitle, [source, target]) => localizedTitle.replaceAll(source, target), title);
};

export const ProfessionalAccessScreen = ({ defaultTab = 'login' }: ProfessionalAccessScreenProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('ProfessionalAccess');
  const { continueAsCustomer, continueAsVisitor, isProfessional } = useViewerSession();
  const {
    activeProfessionalCategoryLabel,
    demoProfessionals,
    portalState,
    startProfessionalLogin,
    startProfessionalRegistration,
  } = useProfessionalPortal();
  const [activeTab, setActiveTab] = useState<ProfessionalAccessTab>(defaultTab);
  const [errorKey, setErrorKey] = useState<AccessErrorKey>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(
    portalState.activeProfessionalId || demoProfessionals[0]?.id || '',
  );
  const [loginPhone, setLoginPhone] = useState(portalState.phone);
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState(portalState.displayName);
  const [registerPhone, setRegisterPhone] = useState(portalState.phone);
  const [registerCity, setRegisterCity] = useState(portalState.city);
  const [registerCredential, setRegisterCredential] = useState(portalState.credentialNumber);
  const [hasMounted, setHasMounted] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState(portalState.phone);
  const [recoveryState, setRecoveryState] = useState<'idle' | 'success' | 'error'>('idle');
  const inputIdPrefix = useId();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const selectedProfessional =
    demoProfessionals.find((professional) => professional.id === selectedProfessionalId) ||
    demoProfessionals[0] ||
    null;
  const selectedProfessionalTitle = selectedProfessional
    ? getLocalizedProfessionalTitle(
        getProfessionalCategoryLabel(selectedProfessional) || selectedProfessional.title,
        locale,
      )
    : activeProfessionalCategoryLabel || t('fallbackCategory');
  const showProfessionalShortcut = hasMounted && isProfessional && !showAccountSwitcher;

  const handleLogin = () => {
    if (!loginPhone.trim()) {
      setErrorKey('loginPhoneRequired');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorKey('loginPasswordRequired');
      return;
    }

    setErrorKey(null);
    startProfessionalLogin({
      phone: loginPhone.trim(),
      professionalId: selectedProfessionalId,
    });
    router.push(APP_ROUTES.professionalDashboard);
  };

  const handleRegister = () => {
    if (!registerName.trim()) {
      setErrorKey('registerNameRequired');
      return;
    }

    if (!registerPhone.trim()) {
      setErrorKey('registerPhoneRequired');
      return;
    }

    if (!registerCredential.trim()) {
      setErrorKey('registerCredentialRequired');
      return;
    }

    setErrorKey(null);
    startProfessionalRegistration({
      city: registerCity.trim(),
      credentialNumber: registerCredential.trim(),
      displayName: registerName.trim(),
      phone: registerPhone.trim(),
      professionalId: selectedProfessionalId,
    });
    router.push(APP_ROUTES.professionalDashboard);
  };

  const handleRecovery = () => {
    if (!recoveryPhone.trim()) {
      setRecoveryState('error');
      return;
    }

    setRecoveryState('success');
  };

  if (!hasMounted) {
    return <ProfessionalAccessSkeleton />;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 pb-4 pt-14 shadow-sm">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[15px] font-bold text-gray-900">{t('navTitle')}</p>
        <div className="w-10" />
      </div>

      <div className="space-y-6 px-5 py-6">
        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <AppAvatar
              name={selectedProfessional?.name || t('fallbackCategory')}
              src={selectedProfessional?.image}
              className="h-16 w-16 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
              fallbackClassName="text-[18px] font-bold"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-pink-600">
                  {t('eyebrow')}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500">
                  {t('demoBadge')}
                </span>
              </div>
              <h1 className="mt-3 text-[22px] font-bold leading-tight text-gray-900">{t('title')}</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{selectedProfessionalTitle}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-pink-500">
                <span className="text-[11px] font-bold">ID/EN</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">{t('language.title')}</p>
                <p className="text-[12px] text-gray-500">{t('language.description')}</p>
              </div>
            </div>
            <LanguageSwitcher variant="light" />
          </div>
        </section>

        {showProfessionalShortcut ? (
          <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <AppAvatar
                name={selectedProfessional?.name || t('fallbackCategory')}
                src={selectedProfessional?.image}
                className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                fallbackClassName="text-[16px] font-bold"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-gray-900">{selectedProfessional?.name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{t('alreadyProfessional')}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.professionalDashboard)}
                className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99]"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
              >
                {t('actions.openDashboard')}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push(APP_ROUTES.professionalProfile)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <UserRound className="h-4 w-4" />
                {t('actions.openProfile')}
              </button>
              <button
                type="button"
                onClick={() => setShowAccountSwitcher(true)}
                className="text-left text-[13px] font-semibold text-gray-500 underline-offset-4 hover:text-gray-700 hover:underline"
              >
                {t('actions.useAnotherAccount')}
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-pink-50 text-pink-500">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-gray-900">{t('profileSelectorLabel')}</p>
                  <p className="text-[12px] leading-relaxed text-gray-500">{t('profileSelectorHint')}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {demoProfessionals.map((professional) => {
                  const isSelected = selectedProfessionalId === professional.id;
                  const professionalCardTitle = getLocalizedProfessionalTitle(
                    getProfessionalCategoryLabel(professional) || professional.title,
                    locale,
                  );

                  return (
                    <button
                      key={professional.id}
                      type="button"
                      onClick={() => setSelectedProfessionalId(professional.id)}
                      className={`flex items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition-all ${
                        isSelected
                          ? 'border-pink-200 bg-pink-50 shadow-sm'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <AppAvatar
                        name={professional.name}
                        src={professional.image}
                        className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                        fallbackClassName="text-[16px] font-bold"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-gray-900">{professional.name}</p>
                        <p className="mt-1 truncate text-[12px] text-gray-500">{professionalCardTitle}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                            {professional.responseTime}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                            {professional.reviews}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setErrorKey(null);
                    setRecoveryState('idle');
                  }}
                  className={`rounded-full px-4 py-3 text-[13px] font-bold transition-all ${
                    activeTab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {t('tabs.login')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorKey(null);
                    setIsRecoveryOpen(false);
                    setRecoveryState('idle');
                  }}
                  className={`rounded-full px-4 py-3 text-[13px] font-bold transition-all ${
                    activeTab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {t('tabs.register')}
                </button>
              </div>

              {errorKey ? (
                <div className="mt-4 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                  {t(`errors.${errorKey}`)}
                </div>
              ) : null}

              {activeTab === 'login' ? (
                <div className="mt-5 space-y-4">
                  <FormField htmlFor={`${inputIdPrefix}-login-phone`} label={t('fields.phone')}>
                    <input
                      id={`${inputIdPrefix}-login-phone`}
                      type="tel"
                      value={loginPhone}
                      onChange={(event) => {
                        setLoginPhone(event.target.value);
                        setRecoveryPhone((currentPhone) => currentPhone || event.target.value);
                      }}
                      placeholder={t('placeholders.phone')}
                      className={fieldClass}
                    />
                  </FormField>
                  <FormField htmlFor={`${inputIdPrefix}-login-password`} label={t('fields.password')}>
                    <input
                      id={`${inputIdPrefix}-login-password`}
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder={t('placeholders.password')}
                      className={fieldClass}
                    />
                  </FormField>
                  <div className="rounded-[20px] bg-gray-50 px-4 py-3">
                    <p className="text-[12px] leading-relaxed text-gray-500">{t('loginHelper')}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryState('idle');
                        setIsRecoveryOpen((currentValue) => !currentValue);
                      }}
                      className="mt-3 inline-flex items-center gap-2 text-[13px] font-semibold text-pink-600"
                    >
                      <KeyRound className="h-4 w-4" />
                      {t('actions.forgotPassword')}
                    </button>
                  </div>

                  {isRecoveryOpen ? (
                    <div className="rounded-[20px] border border-gray-100 bg-white px-4 py-4 shadow-sm">
                      <p className="text-[14px] font-bold text-gray-900">{t('forgotPassword.title')}</p>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                        {t('forgotPassword.description')}
                      </p>
                      <div className="mt-4 space-y-4">
                        <FormField htmlFor={`${inputIdPrefix}-recovery-phone`} label={t('forgotPassword.phoneLabel')}>
                          <input
                            id={`${inputIdPrefix}-recovery-phone`}
                            type="tel"
                            value={recoveryPhone}
                            onChange={(event) => {
                              setRecoveryState('idle');
                              setRecoveryPhone(event.target.value);
                            }}
                            placeholder={t('placeholders.phone')}
                            className={fieldClass}
                          />
                        </FormField>
                        <button
                          type="button"
                          onClick={handleRecovery}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
                        >
                          {t('actions.sendResetLink')}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                      {recoveryState !== 'idle' ? (
                        <div
                          className={`mt-4 rounded-[18px] border px-4 py-3 text-[13px] font-medium ${
                            recoveryState === 'success'
                              ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                              : 'border-red-100 bg-red-50 text-red-600'
                          }`}
                        >
                          {recoveryState === 'success' ? t('forgotPassword.success') : t('forgotPassword.error')}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="rounded-[18px] bg-gray-50 px-4 py-3">
                    <p className="text-[12px] font-semibold text-gray-500">{t('connectedProfileLabel')}</p>
                    <p className="mt-1 text-[14px] font-bold text-gray-900">{selectedProfessionalTitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogin}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99]"
                    style={{ backgroundColor: APP_CONFIG.colors.primary }}
                  >
                    {t('actions.login')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <FormField htmlFor={`${inputIdPrefix}-register-name`} label={t('fields.fullName')}>
                    <input
                      id={`${inputIdPrefix}-register-name`}
                      type="text"
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                      placeholder={t('placeholders.fullName')}
                      className={fieldClass}
                    />
                  </FormField>
                  <FormField htmlFor={`${inputIdPrefix}-register-phone`} label={t('fields.phone')}>
                    <input
                      id={`${inputIdPrefix}-register-phone`}
                      type="tel"
                      value={registerPhone}
                      onChange={(event) => setRegisterPhone(event.target.value)}
                      placeholder={t('placeholders.phone')}
                      className={fieldClass}
                    />
                  </FormField>
                  <FormField htmlFor={`${inputIdPrefix}-register-city`} label={t('fields.city')}>
                    <input
                      id={`${inputIdPrefix}-register-city`}
                      type="text"
                      value={registerCity}
                      onChange={(event) => setRegisterCity(event.target.value)}
                      placeholder={t('placeholders.city')}
                      className={fieldClass}
                    />
                  </FormField>
                  <FormField htmlFor={`${inputIdPrefix}-register-credential`} label={t('fields.credential')}>
                    <input
                      id={`${inputIdPrefix}-register-credential`}
                      type="text"
                      value={registerCredential}
                      onChange={(event) => setRegisterCredential(event.target.value)}
                      placeholder={t('placeholders.credential')}
                      className={fieldClass}
                    />
                  </FormField>
                  <p className="rounded-[18px] bg-gray-50 px-4 py-3 text-[12px] leading-relaxed text-gray-500">
                    {t('registerHelper', { category: selectedProfessionalTitle })}
                  </p>
                  <button
                    type="button"
                    onClick={handleRegister}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99]"
                    style={{ backgroundColor: APP_CONFIG.colors.primary }}
                  >
                    {t('actions.register')}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        <section className="rounded-[26px] border border-dashed border-gray-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
              <BriefcaseMedical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">{t('separationTitle')}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-500">{t('separationDescription')}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                continueAsCustomer();
                router.push(APP_ROUTES.home);
              }}
              className="w-full rounded-full py-4 text-[14px] font-bold text-white"
              style={{ backgroundColor: APP_CONFIG.colors.primary }}
            >
              {t('actions.customer')}
            </button>
            <button
              type="button"
              onClick={() => {
                continueAsVisitor();
                router.push(APP_ROUTES.home);
              }}
              className="w-full rounded-full bg-gray-100 py-4 text-[14px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
            >
              {t('actions.visitor')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

const ProfessionalAccessSkeleton = () => (
  <div className="flex h-full flex-col overflow-y-auto bg-gray-50 pb-10 custom-scrollbar">
    <div className="sticky top-0 z-20 border-b border-gray-100 bg-white px-4 pb-4 pt-14">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-full bg-gray-100" />
        <div className="h-4 w-36 rounded-full bg-gray-100" />
        <div className="h-10 w-10 rounded-full bg-gray-100" />
      </div>
    </div>

    <div className="space-y-6 px-5 py-6">
      <div className="h-36 rounded-[28px] bg-white" />
      <div className="h-64 rounded-[28px] bg-white" />
      <div className="h-96 rounded-[28px] bg-white" />
      <div className="h-40 rounded-[26px] bg-white" />
    </div>
  </div>
);

const FormField = ({ children, htmlFor, label }: { children: ReactNode; htmlFor: string; label: string }) => (
  <div>
    <label htmlFor={htmlFor} className="mb-2 block text-[12px] font-semibold text-gray-500">
      {label}
    </label>
    {children}
  </div>
);
