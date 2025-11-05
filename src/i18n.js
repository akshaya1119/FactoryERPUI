/**
 * Created by Shivom on 08/10/24
 * Updated by Shivom on 09/10/24 to add error handler
 * Purpose: Configure i18next for internationalization with backend integration
 * and custom parsing for text labels with optional ID display.
 * Error Handler: Implements robust error handling to manage translation failures
 * and provide fallback mechanisms for missing or invalid translations.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';
import useShowLabelIdStore from './store/showLabelIdStore';

const apiUrl = import.meta.env.VITE_API_BASE_API;

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    backend: {
      loadPath: `${apiUrl}/TextLabels/translations/{{lng}}`,
      parse: (data) => {
        try {
          const parsedData = JSON.parse(data);
          const simplifiedData = {};
          const showLabelId = useShowLabelIdStore.getState().showLabelId;
          for (const [key, value] of Object.entries(parsedData)) {
            if (typeof value === 'object' && value !== null) {
              simplifiedData[key] = showLabelId ? `(${value.id}). ${value.text}` : value.text;
            } else {
              simplifiedData[key] = value;
            }
          }
          return simplifiedData;
        } catch (error) {
          console.error('Error parsing translation data:', error);
          return {};
        }
      },
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    parseMissingKeyHandler: (key, defaultValue) => {
      return key; // Return the key if there's an error or missing translation
    },
    react: {
      useSuspense: false, // Disable suspense to prevent UI from not rendering
    },
  }).catch(error => {
    console.error('Error initializing i18next:', error);
    // You can add additional error handling here, such as displaying an error message to the user
  });

export default i18n;
