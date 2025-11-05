const translations = {
    "translations": {
        "hi": {
            "project": "परियोजना"
        },
        "en": {
            "project": "Project"
        }
    }
};

// Function to get translation based on selected language
export function t(lang, key) {
    return translations.translations[lang][key] || key;
}
