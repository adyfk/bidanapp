'use client';

import { ArrowRight, BriefcaseMedical, ChevronLeft, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useEffect, useId, useState } from 'react';
import { StandardPhoneInput } from '@/components/ui/form-controls';
import { buildStandardInputClass, standardFieldLabelClass } from '@/components/ui/form-styles';
import { useRouter } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { APP_ROUTES, type CustomerAccessIntent, professionalAccessRoute } from '@/lib/routes';
import { useCustomerAuthSession } from '@/lib/use-customer-auth-session';
import { useViewerSession } from '@/lib/use-viewer-session';

interface CustomerAccessScreenProps {
  intent?: CustomerAccessIntent;
  nextHref?: string;
}

type AccessTab = 'login' | 'register';
type AccessErrorKey =
  | 'loginPhoneRequired'
  | 'loginPasswordRequired'
  | 'loginFailed'
  | 'registerNameRequired'
  | 'registerPhoneRequired'
  | 'registerPasswordRequired'
  | 'registerPasswordWeak'
  | 'registerFailed'
  | null;

const intentKeyByValue: Record<CustomerAccessIntent, 'general' | 'activity' | 'profile' | 'booking' | 'notifications'> =
  {
    activity: 'activity',
    booking: 'booking',
    general: 'general',
    notifications: 'notifications',
    profile: 'profile',
  };

const fieldClass = buildStandardInputClass({
  accent: 'pink',
  surface: 'muted',
});

export const CustomerAccessScreen = ({ intent = 'general', nextHref = APP_ROUTES.home }: CustomerAccessScreenProps) => {
  const router = useRouter();
  const t = useTranslations('CustomerAccess');
  const { continueAsVisitor, isCustomer } = useViewerSession();
  const { hasHydrated, isAuthenticated, login, register, session } = useCustomerAuthSession();
  const [activeTab, setActiveTab] = useState<AccessTab>('login');
  const [errorKey, setErrorKey] = useState<AccessErrorKey>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerCity, setRegisterCity] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intentKey = intentKeyByValue[intent];
  const resolvedNextHref = (nextHref.startsWith('/') ? nextHref : APP_ROUTES.home) as Route;
  const idPrefix = useId();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (session.phone) {
      setLoginPhone(session.phone);
      setRegisterPhone(session.phone);
    }
    if (session.displayName) {
      setRegisterName(session.displayName);
    }
    if (session.city) {
      setRegisterCity(session.city);
    }
  }, [hasHydrated, session.city, session.displayName, session.phone]);

  const handleLogin = async () => {
    if (!loginPhone.trim()) {
      setErrorKey('loginPhoneRequired');
      return;
    }

    if (!loginPassword.trim()) {
      setErrorKey('loginPasswordRequired');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorKey(null);
      await login({
        password: loginPassword.trim(),
        phone: loginPhone.trim(),
      });
      router.push(resolvedNextHref);
    } catch {
      setErrorKey('loginFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerName.trim()) {
      setErrorKey('registerNameRequired');
      return;
    }

    if (!registerPhone.trim()) {
      setErrorKey('registerPhoneRequired');
      return;
    }

    if (!registerPassword.trim()) {
      setErrorKey('registerPasswordRequired');
      return;
    }

    if (!/\d/.test(registerPassword) || !/[A-Z]/.test(registerPassword) || registerPassword.length < 8) {
      setErrorKey('registerPasswordWeak');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorKey(null);
      await register({
        city: registerCity.trim(),
        displayName: registerName.trim(),
        password: registerPassword,
        phone: registerPhone.trim(),
      });
      router.push(resolvedNextHref);
    } catch {
      setErrorKey('registerFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#fff8fb] pb-10 custom-scrollbar">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-rose-100/80 bg-white/90 px-4 pb-4 pt-14 backdrop-blur-sm">
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
        <section
          className="overflow-hidden rounded-[30px] p-6 text-white shadow-[0_24px_60px_-32px_rgba(190,24,93,0.55)]"
          style={{
            background: `linear-gradient(145deg, ${APP_CONFIG.colors.primary} 0%, ${APP_CONFIG.colors.secondary} 100%)`,
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
              {t('eyebrow')}
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90">
              {t('accessBadge')}
            </span>
          </div>

          <h1 className="mt-5 text-[28px] font-bold leading-tight">{t(`intent.${intentKey}.title`)}</h1>
          <p className="mt-3 max-w-[28rem] text-[14px] leading-relaxed text-white/85">
            {t(`intent.${intentKey}.description`)}
          </p>

          <div className="mt-5 grid gap-3">
            <FeaturePill icon={<ShieldCheck className="h-4 w-4" />} label={t('benefits.savedHistory')} />
            <FeaturePill icon={<LogIn className="h-4 w-4" />} label={t('benefits.familyContext')} />
            <FeaturePill icon={<UserPlus className="h-4 w-4" />} label={t('benefits.followUp')} />
          </div>
        </section>

        {hasHydrated && isAuthenticated && isCustomer ? (
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
            {t('alreadyCustomer')}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorKey(null);
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
              <div>
                <label htmlFor={`${idPrefix}-login-phone`} className={standardFieldLabelClass}>
                  {t('fields.phone')}
                </label>
                <StandardPhoneInput
                  id={`${idPrefix}-login-phone`}
                  disabled={isSubmitting}
                  value={loginPhone}
                  onValueChange={setLoginPhone}
                  placeholder={t('placeholders.phone')}
                  accent="pink"
                  surface="muted"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-login-password`} className={standardFieldLabelClass}>
                  {t('fields.password')}
                </label>
                <input
                  id={`${idPrefix}-login-password`}
                  type="password"
                  disabled={isSubmitting}
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  placeholder={t('placeholders.password')}
                  className={fieldClass}
                />
              </div>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
              >
                {t('actions.login')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor={`${idPrefix}-register-name`} className={standardFieldLabelClass}>
                  {t('fields.fullName')}
                </label>
                <input
                  id={`${idPrefix}-register-name`}
                  type="text"
                  disabled={isSubmitting}
                  value={registerName}
                  onChange={(event) => setRegisterName(event.target.value)}
                  placeholder={t('placeholders.fullName')}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-register-phone`} className={standardFieldLabelClass}>
                  {t('fields.phone')}
                </label>
                <StandardPhoneInput
                  id={`${idPrefix}-register-phone`}
                  disabled={isSubmitting}
                  value={registerPhone}
                  onValueChange={setRegisterPhone}
                  placeholder={t('placeholders.phone')}
                  accent="pink"
                  surface="muted"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-register-city`} className={standardFieldLabelClass}>
                  {t('fields.city')}
                </label>
                <input
                  id={`${idPrefix}-register-city`}
                  type="text"
                  disabled={isSubmitting}
                  value={registerCity}
                  onChange={(event) => setRegisterCity(event.target.value)}
                  placeholder={t('placeholders.city')}
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor={`${idPrefix}-register-password`} className={standardFieldLabelClass}>
                  {t('fields.password')}
                </label>
                <input
                  id={`${idPrefix}-register-password`}
                  type="password"
                  disabled={isSubmitting}
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  placeholder={t('placeholders.password')}
                  className={fieldClass}
                />
              </div>
              <p className="rounded-[18px] bg-gray-50 px-4 py-3 text-[12px] leading-relaxed text-gray-500">
                {t('registerHelper')}
              </p>
              <button
                type="button"
                onClick={handleRegister}
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[14px] font-bold text-white shadow-lg shadow-pink-500/20 transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: APP_CONFIG.colors.primary }}
              >
                {t('actions.register')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <div className="rounded-[26px] border border-dashed border-gray-200 bg-white px-5 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gray-400">{t('visitorEyebrow')}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-gray-600">{t('visitorDescription')}</p>
          <button
            type="button"
            onClick={() => {
              continueAsVisitor();
              router.push(APP_ROUTES.home);
            }}
            className="mt-4 rounded-full bg-gray-100 px-4 py-2.5 text-[13px] font-bold text-gray-700 transition-colors hover:bg-gray-200"
          >
            {t('actions.continueVisitor')}
          </button>
        </div>

        <section className="rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <BriefcaseMedical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                {t('professional.eyebrow')}
              </p>
              <h2 className="mt-2 text-[20px] font-bold leading-tight text-gray-900">{t('professional.title')}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{t('professional.description')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(professionalAccessRoute())}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-[14px] font-bold text-blue-700 shadow-sm transition-transform active:scale-[0.99]"
          >
            {t('professional.cta')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      </div>
    </div>
  );
};

const FeaturePill = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-[12px] font-medium text-white/90">
    {icon}
    <span>{label}</span>
  </div>
);
