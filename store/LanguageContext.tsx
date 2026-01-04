import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../constants/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations['en']) => string;
    isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'user_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Enforce LTR for all languages
        if (I18nManager.isRTL) {
            I18nManager.allowRTL(false);
            I18nManager.forceRTL(false);
        }
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLang && (savedLang === 'en' || savedLang === 'fr' || savedLang === 'ar')) {
                setLanguageState(savedLang as Language);
            }
        } catch (e) {
            console.error("Failed to load language", e);
        }
    };

    const setLanguage = async (lang: Language) => {
        try {
            setLanguageState(lang);
            await AsyncStorage.setItem(LANGUAGE_KEY, lang);
        } catch (error) {
            console.error("Failed to set language", error);
        }
    };

    const t = (key: keyof typeof translations['en']) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, isRTL: false }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
