import { Share } from 'react-native';
import { Transaction } from '../types';
import { ErrorType, createError, AppError } from './errorHandler';

/**
 * Exports transactions as a JSON file using the Share API.
 * This allows users to save to their preferred location (Files, Drive, etc.)
 * @returns Object with success status and error if failed
 */
export const exportToJSON = async (transactions: Transaction[]): Promise<{ success: boolean; error?: AppError }> => {
    try {
        // Validate input
        if (!Array.isArray(transactions)) {
            throw createError(ErrorType.VALIDATION_ERROR, 'Transactions must be an array');
        }

        let jsonContent: string;
        try {
            jsonContent = JSON.stringify(transactions, null, 2);
        } catch (stringifyError) {
            throw createError(
                ErrorType.VALIDATION_ERROR,
                'Failed to serialize transactions to JSON',
                stringifyError
            );
        }

        // Use React Native Share API - works in Expo Go and allows user to choose where to save
        try {
            const result = await Share.share({
                message: jsonContent,
                title: `Transaction Backup - ${new Date().toLocaleDateString()}`
            });

            if (result.action === Share.sharedAction) {
                return { success: true };
            } else if (result.action === Share.dismissedAction) {
                // User cancelled - not an error
                return { success: true };
            }
            return { success: true };
        } catch (shareError) {
            console.error("Share Error:", shareError);
            throw createError(
                ErrorType.FILE_SYSTEM_ERROR,
                'Failed to share backup. Please try again.',
                shareError
            );
        }
    } catch (error) {
        console.error("JSON Export Error:", error);
        const appError = error instanceof Error && 'type' in error
            ? error as AppError
            : createError(ErrorType.FILE_SYSTEM_ERROR, 'Failed to export JSON', error);
        return { success: false, error: appError };
    }
};
