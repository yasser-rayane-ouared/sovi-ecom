import { create } from 'zustand';
import { useEffect } from 'react';
import { translations, Language } from '../lib/translations';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['ar'], fallback?: string) => string;
  isRtl: boolean;
}

const applyHtmlAttributes = (lang: Language) => {
  if (typeof window !== 'undefined') {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }
};

// Base store with server-safe initial state (always 'ar' for initial render)
export const useLanguageStoreBase = create<LanguageState>((set, get) => {
  return {
    language: 'ar',
    isRtl: true,
    setLanguage: (lang: Language) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
        applyHtmlAttributes(lang);
      }
      set({ language: lang, isRtl: lang === 'ar' });
    },
    t: (key, fallback) => {
      const lang = get().language;
      return translations[lang]?.[key] || translations['ar']?.[key] || fallback || String(key);
    },
  };
});

// Custom hook wrapping the base store to safely initialize on the client side after mounting
export function useLanguageStore(): LanguageState;
export function useLanguageStore<T>(selector: (state: LanguageState) => T): T;
export function useLanguageStore(selector?: any) {
  const store = selector ? useLanguageStoreBase(selector) : useLanguageStoreBase();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language') as Language;
      if (saved && (saved === 'ar' || saved === 'en' || saved === 'fr')) {
        const currentLang = useLanguageStoreBase.getState().language;
        if (saved !== currentLang) {
          useLanguageStoreBase.getState().setLanguage(saved);
        }
      }
    }
  }, []);

  return store;
}


// Add properties to the hook to act as a fallback for direct store object calls (like useLanguageStore.getState())
Object.assign(useLanguageStore, useLanguageStoreBase);

