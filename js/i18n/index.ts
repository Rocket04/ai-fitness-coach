// js/i18n/index.ts
// i18n configuration with lazy loading of translation files

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from './locales/ru.json';
import en from './locales/en.json';

const resources = {
  ru: { translation: ru },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'en'],
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },

    react: {
      useSuspense: false, // Disable suspense for SSR compatibility
    },
  });

export default i18n;
export const supportedLanguages = ['ru', 'en'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

export function changeLanguage(lng: SupportedLanguage) {
  return i18n.changeLanguage(lng);
}

export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language || 'ru') as SupportedLanguage;
}
