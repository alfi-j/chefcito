
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Language = 'en' | 'es';

const translations = { en, es };

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && (storedLang === 'en' || storedLang === 'es')) {
      setLanguage(storedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let translation = translations[language] as any;

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English if key not found
        translation = en as any;
        for (const enK of keys) {
            if (translation && typeof translation === 'object' && enK in translation) {
                translation = translation[enK];
            } else {
                return key; // Return the key if not found in English either
            }
        }
        break;
      }
    }

    if (typeof translation === 'string' && replacements) {
        let result = translation;
        for (const placeholder in replacements) {
            result = result.replace(`{{${placeholder}}}`, String(replacements[placeholder]));
        }
        return result;
    }

    return typeof translation === 'string' ? translation : key;
  }, [language]);


  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
