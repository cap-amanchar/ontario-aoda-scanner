/**
 * i18n utilities for Chrome extension
 */

import { useCallback, useEffect, useState } from 'react';
import enMessages from '../_locales/en/messages.json';
import frMessages from '../_locales/fr/messages.json';

// Supported languages
export type Language = 'en' | 'fr';

const STORAGE_KEY = 'moderna11y_language';

// Message structure from Chrome extension i18n
interface LocaleMessage {
  message: string;
  description?: string;
}

// Load locale files
const locales: Record<Language, Record<string, LocaleMessage>> = {
  en: enMessages as Record<string, LocaleMessage>,
  fr: frMessages as Record<string, LocaleMessage>,
};

/**
 * Get current language from storage or browser
 */
export async function getCurrentLanguage(): Promise<Language> {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    if (result[STORAGE_KEY]) {
      return result[STORAGE_KEY] as Language;
    }

    // Fallback to browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Set language preference
 */
export async function setLanguage(lang: Language): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: lang });
}

/**
 * Get translated message
 */
export function getMessage(
  key: string,
  substitutions?: string | string[],
  lang?: Language
): string {
  const currentLang = lang || 'en';
  const message = locales[currentLang]?.[key]?.message;

  if (!message) {
    return key;
  }

  if (!substitutions) {
    return message;
  }

  // Handle substitutions
  const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
  return message
    .replace(/\{(\w+)\}/g, (match: string, placeholder: string) => {
      const index = Number.parseInt(placeholder) - 1;
      return subs[index] || match;
    })
    .replace(/\$(\d+)/g, (match: string, num: string) => {
      const index = Number.parseInt(num) - 1;
      return subs[index] || match;
    });
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const [language, setLang] = useState<Language>('en');

  useEffect(() => {
    // Load initial language
    getCurrentLanguage().then(setLang);

    // Listen for language changes from storage
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEY]) {
        setLang(changes[STORAGE_KEY].newValue as Language);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const t = useCallback(
    (key: string, substitutions?: string | string[]): string => {
      return getMessage(key, substitutions, language);
    },
    [language]
  );

  const changeLanguage = useCallback(async (lang: Language) => {
    await setLanguage(lang);
    setLang(lang);
  }, []);

  return { t, language, changeLanguage };
}
