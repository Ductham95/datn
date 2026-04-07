import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './locales/vi.json';
import en from './locales/en.json';
import { STORAGE_KEYS } from '@/utils/constants';

const savedLang = localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'vi';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
  });

// Persist language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, lng);
  document.documentElement.lang = lng;
});

export default i18n;
