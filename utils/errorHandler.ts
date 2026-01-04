/**
 * Centralized error handling utility
 * Provides error types, messages, and handling functions
 */

export enum ErrorType {
    STORAGE_ERROR = 'STORAGE_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    PERMISSION_ERROR = 'PERMISSION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
    type: ErrorType;
    message: string;
    originalError?: Error | unknown;
    code?: string;
    retryable?: boolean;
}

/**
 * Creates a standardized error object
 */
export function createError(
    type: ErrorType,
    message: string,
    originalError?: Error | unknown,
    code?: string,
    retryable: boolean = false
): AppError {
    return {
        type,
        message,
        originalError,
        code,
        retryable,
    };
}

/**
 * Determines error type from an unknown error
 */
export function classifyError(error: unknown): ErrorType {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('storage') || message.includes('asyncstorage')) {
            return ErrorType.STORAGE_ERROR;
        }
        if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return ErrorType.NETWORK_ERROR;
        }
        if (message.includes('permission') || message.includes('denied')) {
            return ErrorType.PERMISSION_ERROR;
        }
        if (message.includes('auth') || message.includes('authentication') || message.includes('biometric')) {
            return ErrorType.AUTHENTICATION_ERROR;
        }
        if (message.includes('file') || message.includes('filesystem')) {
            return ErrorType.FILE_SYSTEM_ERROR;
        }
    }
    
    return ErrorType.UNKNOWN_ERROR;
}

/**
 * Gets user-friendly error message based on error type and language
 */
export function getErrorMessage(error: AppError, language: 'en' | 'fr' | 'ar' = 'en'): string {
    const messages: Record<ErrorType, Record<'en' | 'fr' | 'ar', string>> = {
        [ErrorType.STORAGE_ERROR]: {
            en: 'Failed to save data. Please try again.',
            fr: 'Échec de l\'enregistrement des données. Veuillez réessayer.',
            ar: 'فشل حفظ البيانات. يرجى المحاولة مرة أخرى.',
        },
        [ErrorType.VALIDATION_ERROR]: {
            en: error.message || 'Invalid input. Please check your data.',
            fr: error.message || 'Données invalides. Veuillez vérifier vos données.',
            ar: error.message || 'إدخال غير صحيح. يرجى التحقق من البيانات.',
        },
        [ErrorType.NETWORK_ERROR]: {
            en: 'Network error. Please check your connection.',
            fr: 'Erreur réseau. Veuillez vérifier votre connexion.',
            ar: 'خطأ في الشبكة. يرجى التحقق من الاتصال.',
        },
        [ErrorType.PERMISSION_ERROR]: {
            en: 'Permission denied. Please grant the required permissions in settings.',
            fr: 'Permission refusée. Veuillez accorder les permissions requises dans les paramètres.',
            ar: 'تم رفض الإذن. يرجى منح الأذونات المطلوبة في الإعدادات.',
        },
        [ErrorType.AUTHENTICATION_ERROR]: {
            en: 'Authentication failed. Please try again.',
            fr: 'Échec de l\'authentification. Veuillez réessayer.',
            ar: 'فشل المصادقة. يرجى المحاولة مرة أخرى.',
        },
        [ErrorType.FILE_SYSTEM_ERROR]: {
            en: 'File system error. Unable to access storage.',
            fr: 'Erreur du système de fichiers. Impossible d\'accéder au stockage.',
            ar: 'خطأ في نظام الملفات. لا يمكن الوصول إلى التخزين.',
        },
        [ErrorType.UNKNOWN_ERROR]: {
            en: 'An unexpected error occurred. Please try again.',
            fr: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
            ar: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
        },
    };

    return messages[error.type]?.[language] || messages[error.type]?.en || error.message;
}

/**
 * Handles errors with retry logic
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    onRetry?: (attempt: number, error: AppError) => void
): Promise<T> {
    let lastError: AppError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = createError(
                classifyError(error),
                error instanceof Error ? error.message : 'Unknown error',
                error,
                undefined,
                attempt < maxRetries
            );

            if (onRetry && attempt < maxRetries) {
                onRetry(attempt, lastError);
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    throw lastError || createError(ErrorType.UNKNOWN_ERROR, 'Operation failed after retries');
}

/**
 * Validates transaction data
 */
export function validateTransaction(data: {
    name?: string;
    amount?: string | number;
    date?: string | Date;
}): { valid: boolean; error?: AppError } {
    if (!data.name || data.name.trim().length === 0) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Person name is required',
                undefined,
                'NAME_REQUIRED'
            ),
        };
    }

    if (data.name.trim().length > 100) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Person name is too long (max 100 characters)',
                undefined,
                'NAME_TOO_LONG'
            ),
        };
    }

    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    
    if (amount === undefined || amount === null || isNaN(amount)) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Amount is required and must be a valid number',
                undefined,
                'AMOUNT_REQUIRED'
            ),
        };
    }

    if (amount <= 0) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Amount must be greater than 0',
                undefined,
                'AMOUNT_INVALID'
            ),
        };
    }

    if (amount > 1000000000) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Amount is too large (max 1,000,000,000)',
                undefined,
                'AMOUNT_TOO_LARGE'
            ),
        };
    }

    return { valid: true };
}

/**
 * Validates partial payment amount
 */
export function validatePartialPayment(
    amount: string | number,
    maxAmount: number
): { valid: boolean; error?: AppError } {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount) || numAmount <= 0) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                'Payment amount must be greater than 0',
                undefined,
                'PARTIAL_AMOUNT_INVALID'
            ),
        };
    }

    if (numAmount >= maxAmount) {
        return {
            valid: false,
            error: createError(
                ErrorType.VALIDATION_ERROR,
                `Payment amount must be less than ${maxAmount}`,
                undefined,
                'PARTIAL_AMOUNT_TOO_LARGE'
            ),
        };
    }

    return { valid: true };
}

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
    try {
        return JSON.parse(json) as T;
    } catch (error) {
        console.error('JSON parse error:', error);
        return fallback;
    }
}

