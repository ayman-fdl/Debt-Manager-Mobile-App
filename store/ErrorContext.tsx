import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AppError, createError, classifyError, getErrorMessage } from '../utils/errorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalErrorHandler } from './TransactionContext';

interface ErrorContextType {
    error: AppError | null;
    showError: (error: AppError | Error | unknown, customMessage?: string) => void;
    clearError: () => void;
    errorMessage: string | null;
    getErrorMessage: (language?: 'en' | 'fr' | 'ar') => string | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);
const LANGUAGE_KEY = 'user_language';

export function ErrorProvider({ children }: { children: React.ReactNode }) {
    const [error, setError] = useState<AppError | null>(null);
    const [language, setLanguage] = useState<'en' | 'fr' | 'ar'>('en');

    // Load language preference
    React.useEffect(() => {
        AsyncStorage.getItem(LANGUAGE_KEY).then((lang) => {
            if (lang && (lang === 'en' || lang === 'fr' || lang === 'ar')) {
                setLanguage(lang);
            }
        }).catch(() => {
            // Ignore error, use default
        });
    }, []);

    const showError = useCallback((err: AppError | Error | unknown, customMessage?: string) => {
        let appError: AppError;

        if (err && typeof err === 'object' && 'type' in err && 'message' in err) {
            // Already an AppError
            appError = err as AppError;
        } else {
            // Convert to AppError
            appError = createError(
                classifyError(err),
                customMessage || (err instanceof Error ? err.message : 'An unknown error occurred'),
                err
            );
        }

        setError(appError);
        console.error('App Error:', appError);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const getErrorMessageForLanguage = useCallback((lang?: 'en' | 'fr' | 'ar') => {
        if (!error) return null;
        return getErrorMessage(error, lang || language);
    }, [error, language]);

    const errorMessage = error ? getErrorMessage(error, language) : null;

    // Register error handler with TransactionContext
    useEffect(() => {
        setGlobalErrorHandler(showError);
        return () => {
            setGlobalErrorHandler(null as any);
        };
    }, [showError]);

    return (
        <ErrorContext.Provider value={{ 
            error, 
            showError, 
            clearError, 
            errorMessage,
            getErrorMessage: getErrorMessageForLanguage
        }}>
            {children}
        </ErrorContext.Provider>
    );
}

export function useError() {
    const context = useContext(ErrorContext);
    if (!context) {
        throw new Error('useError must be used within an ErrorProvider');
    }
    return context;
}

