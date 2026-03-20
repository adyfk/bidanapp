import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

type AppLocale = (typeof routing.locales)[number];

const isSupportedLocale = (locale: string): locale is AppLocale => routing.locales.includes(locale as AppLocale);

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  const requestLocaleValue = await requestLocale;
  const locale =
    requestLocaleValue && isSupportedLocale(requestLocaleValue) ? requestLocaleValue : routing.defaultLocale;

  // Ensure that a valid locale is used
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
