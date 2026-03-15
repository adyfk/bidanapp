export interface AppTerms {
  professional: string;
  category: string;
  service: string;
  location: string;
  experience: string;
  patients: string;
}

export interface AppColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  darkNav: string;
  textMain: string;
  textMuted: string;
  bgLight: string;
}

export interface AppSettingsFile {
  branding: {
    appName: string;
    seoDescription: string;
    baseUrl: string;
    ogImage: string;
  };
  terms: AppTerms;
  colors: AppColors;
}
