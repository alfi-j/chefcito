'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    keySeparator: '.',
    nsSeparator: false,
  });
}

export type SupportedLanguage = 'en' | 'es';

export function changeLanguage(language: SupportedLanguage) {
  i18n.changeLanguage(language);
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', language);
  }
}

export default i18n;