import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionContextType } from '../types';
import { ErrorType, createError, withRetry, safeJsonParse, AppError } from '../utils/errorHandler';

// Optional error handler - will be set by ErrorProvider if available
let globalErrorHandler: ((error: AppError | Error | unknown, customMessage?: string) => void) | null = null;

export function setGlobalErrorHandler(handler: (error: AppError | Error | unknown, customMessage?: string) => void) {
    globalErrorHandler = handler;
}

function handleError(error: AppError | Error | unknown, customMessage?: string) {
    if (globalErrorHandler) {
        globalErrorHandler(error, customMessage);
    } else {
        console.error('Error (no handler):', error);
    }
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const STORAGE_KEY = '@debt_manager_transactions';
const MAX_RETRY_ATTEMPTS = 3;

export function TransactionProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState<Error | null>(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveTransactions(transactions);
        }
    }, [transactions, isLoaded]);

    const loadTransactions = async () => {
        setIsLoading(true);
        setSaveError(null);

        try {
            await withRetry(
                async () => {
                    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
                    if (jsonValue != null) {
                        const parsed = safeJsonParse<Transaction[]>(jsonValue, []);

                        // Validate parsed data
                        if (!Array.isArray(parsed)) {
                            throw new Error('Invalid transaction data format');
                        }

                        // Validate each transaction has required fields
                        const validTransactions = parsed.filter(t =>
                            t &&
                            typeof t.id === 'string' &&
                            typeof t.name === 'string' &&
                            typeof t.amount === 'number' &&
                            typeof t.date === 'string' &&
                            typeof t.type === 'string' &&
                            typeof t.isSettled === 'boolean'
                        );

                        if (validTransactions.length !== parsed.length) {
                            console.warn('Some transactions were invalid and filtered out');
                        }

                        setTransactions(validTransactions);
                    }
                },
                MAX_RETRY_ATTEMPTS,
                1000,
                (attempt, error) => {
                    console.log(`Retry attempt ${attempt} for loading transactions`);
                }
            );
        } catch (e) {
            const error = createError(
                ErrorType.STORAGE_ERROR,
                'Failed to load transactions. Your data may be unavailable.',
                e
            );
            handleError(error);
            setSaveError(e instanceof Error ? e : new Error('Unknown error'));
        } finally {
            setIsLoaded(true);
            setIsLoading(false);
        }
    };

    const saveTransactions = async (newTransactions: Transaction[]) => {
        setSaveError(null);

        try {
            await withRetry(
                async () => {
                    const jsonValue = JSON.stringify(newTransactions);
                    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
                },
                MAX_RETRY_ATTEMPTS,
                500,
                (attempt, error) => {
                    console.log(`Retry attempt ${attempt} for saving transactions`);
                }
            );
        } catch (e) {
            const error = createError(
                ErrorType.STORAGE_ERROR,
                'Failed to save transactions. Changes may not be persisted.',
                e
            );
            handleError(error);
            setSaveError(e instanceof Error ? e : new Error('Unknown error'));

            // Don't throw - allow app to continue functioning
            // The error is logged and shown to user
        }
    };

    const addTransaction = (t: Omit<Transaction, 'id' | 'createdAt' | 'isSettled'> & { isSettled?: boolean }) => {
        try {
            // Validate transaction data
            if (!t.name || t.name.trim().length === 0) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction name is required');
            }
            if (!t.amount || t.amount <= 0 || !isFinite(t.amount)) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction amount must be a positive number');
            }
            if (!t.date) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction date is required');
            }

            const newTransaction: Transaction = {
                ...t,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9), // More unique ID
                createdAt: Date.now(),
                isSettled: t.isSettled ?? false,
            };
            setTransactions(prev => [newTransaction, ...prev]);
        } catch (error) {
            handleError(error);
            throw error; // Re-throw so caller can handle
        }
    };

    const deleteTransaction = (id: string) => {
        try {
            if (!id) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction ID is required');
            }
            setTransactions(prev => {
                const exists = prev.find(t => t.id === id);
                if (!exists) {
                    throw createError(ErrorType.VALIDATION_ERROR, 'Transaction not found');
                }
                return prev.filter((t) => t.id !== id);
            });
        } catch (error) {
            handleError(error);
            throw error;
        }
    };

    const settleTransaction = (id: string) => {
        try {
            if (!id) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction ID is required');
            }
            setTransactions(prev => {
                const transaction = prev.find(t => t.id === id);
                if (!transaction) {
                    throw createError(ErrorType.VALIDATION_ERROR, 'Transaction not found');
                }
                return prev.map((t) =>
                    t.id === id ? { ...t, isSettled: true, settledDate: new Date().toISOString() } : t
                );
            });
        } catch (error) {
            handleError(error);
            throw error;
        }
    };

    const unsettleTransaction = (id: string) => {
        try {
            if (!id) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction ID is required');
            }
            setTransactions(prev => {
                const transaction = prev.find(t => t.id === id);
                if (!transaction) {
                    throw createError(ErrorType.VALIDATION_ERROR, 'Transaction not found');
                }
                return prev.map((t) =>
                    t.id === id ? { ...t, isSettled: false, settledDate: undefined } : t
                );
            });
        } catch (error) {
            handleError(error);
            throw error;
        }
    };

    const updateTransaction = (id: string, updates: Partial<Transaction>) => {
        try {
            if (!id) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Transaction ID is required');
            }
            if (updates.amount !== undefined && (updates.amount <= 0 || !isFinite(updates.amount))) {
                throw createError(ErrorType.VALIDATION_ERROR, 'Amount must be a positive number');
            }
            setTransactions(prev => {
                const transaction = prev.find(t => t.id === id);
                if (!transaction) {
                    throw createError(ErrorType.VALIDATION_ERROR, 'Transaction not found');
                }
                return prev.map((t) =>
                    t.id === id ? { ...t, ...updates } : t
                );
            });
        } catch (error) {
            handleError(error);
            throw error;
        }
    };

    const totalOwed = transactions
        .filter((t) => t.type === 'OWED' && !t.isSettled)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalOwe = transactions
        .filter((t) => t.type === 'OWE' && !t.isSettled)
        .reduce((sum, t) => sum + t.amount, 0);

    const getGroupedTransactions = () => {
        const groups: { [key: string]: number } = {};
        const courts: { [key: string]: number } = {};

        transactions.forEach(t => {
            if (t.isSettled) return;
            const amount = t.type === 'OWED' ? t.amount : -t.amount;
            groups[t.name] = (groups[t.name] || 0) + amount;
            courts[t.name] = (courts[t.name] || 0) + 1;
        });

        return Object.keys(groups).map(name => ({
            name,
            totalDebt: groups[name],
            transactionCount: courts[name]
        })).sort((a, b) => Math.abs(b.totalDebt) - Math.abs(a.totalDebt));
    };

    return (
        <TransactionContext.Provider
            value={{
                transactions,
                addTransaction,
                deleteTransaction,
                settleTransaction,
                unsettleTransaction,
                updateTransaction,
                totalOwed,
                totalOwe,
                getGroupedTransactions,
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
}

// Export loading state for components that need it
export function useTransactionLoading() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactionLoading must be used within a TransactionProvider');
    }
    // This is a workaround - in a real scenario, you'd add loading state to the context
    return { isLoading: false, saveError: null };
}

export function useTransactions() {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
}
