import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Transaction } from "../types";
import { useTransactions } from "../store/TransactionContext";
import Animated, { FadeInDown } from "react-native-reanimated";
import { CURRENCY_SYMBOL } from "../constants/Config";
import { useState, useRef, useEffect } from "react";
import Swipeable from 'react-native-gesture-handler/Swipeable';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from "react-native";
import { useLanguage } from "../store/LanguageContext";
import { Ionicons } from '@expo/vector-icons';
import { StyledModal } from "./StyledModal";
import { formatTime } from "../utils/date";
import { formatAmount } from "../utils/numbers";
import { validatePartialPayment } from "../utils/errorHandler";
import { useError } from "../store/ErrorContext";
import { useSuccess } from "../store/SuccessContext";

// Transaction card with partial payment support
export function TransactionCard({ transaction, index, isReadOnly = false }: { transaction: Transaction; index: number; isReadOnly?: boolean }) {
    const { transactions, settleTransaction, deleteTransaction, unsettleTransaction, addTransaction, updateTransaction } = useTransactions();
    const { t } = useLanguage();
    const { showError } = useError();
    const { showSuccess } = useSuccess();
    const isOwed = transaction.type === 'OWED';
    const swipeableRef = useRef<Swipeable>(null);

    const [showPartialModal, setShowPartialModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [partialAmount, setPartialAmount] = useState("");
    const [partialNote, setPartialNote] = useState("");
    const [partialDate, setPartialDate] = useState(new Date());
    const [showPartialDatePicker, setShowPartialDatePicker] = useState(false);
    const [showPartialTimePicker, setShowPartialTimePicker] = useState(false);
    const [partialError, setPartialError] = useState<string | null>(null);

    const onPartialDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || partialDate;
        setShowPartialDatePicker(Platform.OS === 'ios');
        setPartialDate(currentDate);
    };

    const onPartialTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || partialDate;
        setShowPartialTimePicker(Platform.OS === 'ios');
        setPartialDate(currentDate);
    };

    const handlePartialPayment = () => {
        // Clear previous errors
        setPartialError(null);

        try {
            // Validate partial payment
            const validation = validatePartialPayment(partialAmount, transaction.amount);
            if (!validation.valid && validation.error) {
                // Determine error message based on error code
                if (validation.error.code === 'PARTIAL_AMOUNT_INVALID') {
                    setPartialError(t('partial_amount_zero'));
                    return;
                }
                if (validation.error.code === 'PARTIAL_AMOUNT_TOO_LARGE') {
                    setPartialError(t('partial_amount_exceeds'));
                    return;
                }

                // Fallback for generic errors
                setPartialError(validation.error.message || t('invalid_amount'));
                return;
            }

            const num = parseFloat(partialAmount || "0");

            if (num <= 0) {
                setPartialError(t('partial_amount_zero'));
                return;
            }
            if (num >= transaction.amount) {
                setPartialError(t('partial_amount_exceeds'));
                return;
            }

            try {
                // Create history record for the payment
                addTransaction({
                    name: transaction.name,
                    amount: num,
                    description: partialNote ? `KEY:partial_prefix:${partialNote}` : `KEY:no_description`,
                    date: partialDate.toISOString(),
                    type: transaction.type,
                    parentId: transaction.id,
                    isSettled: true,
                    settledDate: new Date().toISOString()
                });

                // Reduce the active debt amount
                const remaining = parseFloat((transaction.amount - num).toFixed(2));
                const originalTotal = transaction.initialAmount || transaction.amount;

                updateTransaction(transaction.id, {
                    amount: remaining,
                    initialAmount: originalTotal
                });

                setShowPartialModal(false);
                setPartialAmount("");
                setPartialNote("");
                showSuccess(t('transaction_saved') || 'Partial payment saved');
            } catch (error) {
                showError(error, 'Failed to process partial payment');
            }
        } catch (error) {
            showError(error);
        }
    };

    const handlePress = () => {
        // if (isReadOnly) return; 
        // Allow opening options modal for detailed view even in ReadOnly, but hide actions there.
        setShowOptionsModal(true);
    };

    const closeSwipeable = () => {
        swipeableRef.current?.close();
    };

    const onSettle = () => {
        try {
            closeSwipeable();
            if (transaction.isSettled) {
                unsettleTransaction(transaction.id);
                showSuccess(t('transaction_updated') || 'Transaction unsettled');
            } else {
                settleTransaction(transaction.id);
                showSuccess(t('transaction_settled') || 'Transaction settled');
            }
        } catch (error) {
            showError(error, 'Failed to update transaction status');
        }
    };

    const onDelete = () => {
        closeSwipeable();
        setShowDeleteModal(true);
    };

    const renderDescription = (desc: string) => {
        if (!desc) return "";
        if (desc.startsWith('KEY:')) {
            const parts = desc.split(':');
            // parts[0] is "KEY", parts[1] is the translation key
            const key = parts[1];
            // Re-assemble the rest of the string as the param (in case the note itself contained colons)
            const param = parts.slice(2).join(':');

            if (key === 'no_description') return t('no_description');
            if (key === 'partial_prefix') return `${t('partial_prefix') || t('repayment_for')}: ${param}`;

            return desc;
        }
        return desc;
    };

    const renderLeftActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity
                onPress={onSettle}
                className={`${transaction.isSettled ? 'bg-amber-600 border-amber-500/30' : 'bg-emerald-600 border-emerald-500/30'} justify-center items-center w-24 mb-3 rounded-xl ml-4 border`}
            >
                <Ionicons name={transaction.isSettled ? "arrow-undo-circle" : "checkmark-circle"} size={24} color="white" />
                <Text className="text-white font-bold text-xs mt-1 text-center px-1">
                    {transaction.isSettled ? t('unsettle') : t('settle_label')}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderRightActions = (progress: any, dragX: any) => {
        return (
            <TouchableOpacity
                onPress={onDelete}
                className="bg-red-600 justify-center items-center w-24 mb-3 rounded-xl border border-red-500/30"
            >
                <Ionicons name="trash" size={24} color="white" />
                <Text className="text-white font-bold text-xs mt-1">{t('delete_label')}</Text>
            </TouchableOpacity>
        );
    };

    const actionText = isOwed ? "Confirm Receipt" : "Repay Debt";
    const message = isOwed
        ? `Has ${transaction.name} paid you back?`
        : `Have you paid ${transaction.name} back?`;

    const itemRef = useRef<any>(null);

    return (
        <>
            <Animated.View
                ref={itemRef}
                entering={FadeInDown.delay(index * 100).springify()}
            >
                <Swipeable
                    ref={swipeableRef}
                    renderLeftActions={renderLeftActions}
                    renderRightActions={renderRightActions}
                    enabled={!isReadOnly}
                    containerStyle={{ overflow: 'visible' }} // Ensure shadow visible
                >
                    <TouchableOpacity
                        onPress={handlePress}
                        activeOpacity={isReadOnly ? 1 : 0.7}
                        className={`p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm border ${transaction.isSettled ? 'bg-gray-900 border-gray-800' : 'bg-gray-800 border-gray-700/50'}`}
                    >
                        <View className="flex-1">
                            <Text className={`font-bold text-lg ${transaction.isSettled ? 'text-gray-500' : 'text-white'}`}>
                                {transaction.name}
                            </Text>
                            {transaction.description ? (
                                <Text className="text-gray-500 text-xs italic mt-0.5" numberOfLines={1}>
                                    {renderDescription(transaction.description)}
                                </Text>
                            ) : null}
                            <View className="flex-row items-center gap-2 mt-1">
                                <Text className="text-gray-400 text-xs">
                                    {new Date(transaction.date).toLocaleDateString()} • {formatTime(new Date(transaction.date))}
                                </Text>
                                {transaction.initialAmount && !transaction.isSettled && (
                                    <View className="bg-gray-700 px-1.5 py-0.5 rounded">
                                        <Text className="text-gray-300 text-[10px] font-medium">{t('was')}: {formatAmount(transaction.initialAmount)}</Text>
                                    </View>
                                )}
                            </View>
                            {transaction.isSettled && transaction.settledDate && (
                                <Text className="text-gray-500 text-[10px] mt-0.5 font-medium">
                                    {t('settled_date')}: {new Date(transaction.settledDate).toLocaleDateString()} • {formatTime(new Date(transaction.settledDate))}
                                </Text>
                            )}
                        </View>
                        <View className="items-end">
                            {transaction.isSettled ? (
                                <View className={`px-2 py-1 rounded-md ${isOwed ? 'bg-emerald-900/50' : 'bg-rose-900/50'}`}>
                                    <Text className={`text-xs font-bold ${isOwed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {isOwed ? t('received') : t('paid')}
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <Text className={`font-bold text-lg ${isOwed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isOwed ? '+' : '-'}{formatAmount(transaction.amount)} {CURRENCY_SYMBOL}
                                    </Text>
                                    <Text className="text-xs text-gray-500 uppercase">
                                        {isOwed ? t('you_gave') : t('you_took')}
                                    </Text>
                                </>
                            )}
                        </View>
                    </TouchableOpacity>
                </Swipeable>
            </Animated.View>

            {/* Settlement Options Modal - Now acts as Details View */}
            <StyledModal
                visible={showOptionsModal}
                onClose={() => setShowOptionsModal(false)}
                title={`${formatAmount(transaction.amount)} ${CURRENCY_SYMBOL}`}
            >
                <View className="pb-6">
                    {/* Header with person name */}
                    <View className="flex-row items-center gap-3 mb-6 pb-4 border-b border-gray-800/50">
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${isOwed ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                            } border-2 ${isOwed ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                            <Text className={`font-bold text-lg ${isOwed ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {transaction.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-white text-xl font-bold">{transaction.name}</Text>
                            <Text className={`text-sm font-semibold ${isOwed ? 'text-emerald-400' : 'text-rose-400'
                                }`}>
                                {isOwed ? t('you_gave') : t('you_took')}
                            </Text>
                        </View>
                    </View>

                    {/* Enhanced Details Card */}
                    <View className="bg-gray-800/60 p-5 rounded-2xl mb-6 border border-gray-700/50 shadow-lg">
                        <View className="mb-4">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Ionicons name="document-text-outline" size={18} color="#9ca3af" />
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('description')}</Text>
                            </View>
                            <Text className="text-white text-base leading-relaxed ml-7">
                                {renderDescription(transaction.description) || t('no_description')}
                            </Text>
                        </View>

                        <View className="pt-4 border-t border-gray-700/50">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Ionicons name="calendar-outline" size={18} color="#9ca3af" />
                                <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('date')}</Text>
                            </View>
                            <Text className="text-white text-base ml-7 font-medium">
                                {new Date(transaction.date).toLocaleDateString()} • {formatTime(new Date(transaction.date))}
                            </Text>
                        </View>

                        {transaction.isSettled && transaction.settledDate && (
                            <View className="pt-4 border-t border-gray-700/50 mt-4">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
                                    <Text className="text-emerald-500 text-xs font-bold uppercase tracking-wider">{t('settled_date')}</Text>
                                </View>
                                <Text className="text-emerald-400 text-base ml-7 font-medium">
                                    {new Date(transaction.settledDate).toLocaleDateString()} • {formatTime(new Date(transaction.settledDate))}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Related Payments History */}
                    {(() => {
                        const relatedPayments = transactions.filter(t => t.parentId === transaction.id);
                        if (relatedPayments.length === 0) return null;

                        return (
                            <View className="bg-gray-800/60 p-5 rounded-2xl mb-6 border border-gray-700/50 shadow-lg">
                                <View className="flex-row items-center gap-2 mb-4">
                                    <Ionicons name="time-outline" size={18} color="#9ca3af" />
                                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('payment_history')}</Text>
                                </View>
                                <ScrollView
                                    style={{ maxHeight: 200 }}
                                    showsVerticalScrollIndicator={true}
                                    nestedScrollEnabled={true}
                                >
                                    {relatedPayments.map((payment, pIdx) => (
                                        <View
                                            key={payment.id}
                                            className={`p-3 rounded-xl mb-2 ${pIdx !== relatedPayments.length - 1 ? 'border-b border-gray-700/50 pb-3' : ''
                                                } ${pIdx === 0 ? 'bg-gray-700/30' : ''}`}
                                        >
                                            <View className="flex-row justify-between items-center mb-1">
                                                <Text className="text-gray-400 text-xs font-medium">
                                                    {new Date(payment.date).toLocaleDateString()} • {formatTime(new Date(payment.date))}
                                                </Text>
                                                <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                                                    <Text className="text-emerald-400 font-bold text-xs">
                                                        {isOwed ? "+" : "-"}{formatAmount(payment.amount)} {CURRENCY_SYMBOL}
                                                    </Text>
                                                </View>
                                            </View>
                                            {payment.description ? (
                                                <Text className="text-gray-500 text-xs italic mt-1 ml-1">{renderDescription(payment.description)}</Text>
                                            ) : null}
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        );
                    })()}

                    {/* Actions (Only if not Read Only) */}
                    {!isReadOnly && (
                        <View className="gap-3 pt-2">
                            {transaction.isSettled ? (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => {
                                            onSettle();
                                            setShowOptionsModal(false);
                                        }}
                                        className="flex-1 bg-blue-500/10 py-4 rounded-2xl border-2 border-blue-500/30 items-center justify-center active:scale-[0.97] shadow-sm"
                                    >
                                        <View className="flex-row items-center gap-2">
                                            <Ionicons name="refresh" size={20} color="#60a5fa" />
                                            <Text className="text-blue-400 font-bold">{t('unsettle')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => {
                                            onDelete();
                                            setShowOptionsModal(false);
                                        }}
                                        className="flex-1 bg-red-500/10 py-4 rounded-2xl border-2 border-red-500/30 items-center justify-center active:scale-[0.97] shadow-sm"
                                    >
                                        <View className="flex-row items-center gap-2">
                                            <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                            <Text className="text-red-500 font-bold">{t('delete')}</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowOptionsModal(false);
                                        setShowPartialModal(true);
                                    }}
                                    className="bg-blue-600/10 py-4.5 rounded-2xl border-2 border-blue-500/30 items-center active:scale-[0.97] shadow-lg"
                                >
                                    <View className="flex-row items-center gap-2">
                                        <Ionicons name="add-circle" size={22} color="#60a5fa" />
                                        <Text className="text-blue-400 font-bold text-lg">{t('add_partial')}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </StyledModal>

            {/* Partial Payment Modal */}
            <StyledModal
                visible={showPartialModal}
                onClose={() => setShowPartialModal(false)}
                title={t('partial_payment')}
            >
                <View className="pb-6">
                    {/* Info Banner */}
                    <View className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Ionicons name="information-circle" size={18} color="#60a5fa" />
                            <Text className="text-blue-400 text-xs font-bold uppercase tracking-wider">{t('max_amount')}</Text>
                        </View>
                        <Text className="text-emerald-400 font-extrabold text-2xl ml-6">
                            {formatAmount(transaction.amount)} {CURRENCY_SYMBOL}
                        </Text>
                    </View>

                    {/* Amount Input */}
                    <View className="mb-6">
                        <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3 ml-1">{t('amount')}</Text>
                        <View className="bg-gray-800/60 rounded-2xl p-5 border-2 border-gray-700/50 flex-row items-center shadow-lg">
                            <View className="bg-blue-500/10 px-4 py-2 rounded-xl mr-3 border border-blue-500/20">
                                <Text className="text-blue-400 text-lg font-bold">{CURRENCY_SYMBOL}</Text>
                            </View>
                            <TextInput
                                className="flex-1 text-white text-4xl font-extrabold"
                                placeholder="0.00"
                                placeholderTextColor="#4b5563"
                                keyboardType="decimal-pad"
                                value={partialAmount}
                                onChangeText={(text) => {
                                    setPartialAmount(text);
                                    if (partialError) setPartialError(null);
                                }}
                                autoFocus
                            />
                        </View>
                        {partialError && (
                            <Animated.View entering={FadeInDown.duration(200)} className="mt-2 ml-1 flex-row items-center gap-1.5">
                                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                                <Text className="text-red-500 text-xs font-bold">{partialError}</Text>
                            </Animated.View>
                        )}
                    </View>

                    {/* Note Input */}
                    <View className="mb-8">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Ionicons name="document-text-outline" size={16} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('note_optional')}</Text>
                        </View>
                        <View className="bg-gray-800/60 rounded-2xl p-4 border-2 border-gray-700/50 shadow-sm">
                            <TextInput
                                className="text-white text-base"
                                placeholder={t('partial_note_placeholder')}
                                placeholderTextColor="#6b7280"
                                value={partialNote}
                                onChangeText={setPartialNote}
                            />
                        </View>
                    </View>

                    {/* Date & Time Picker */}
                    <View className="mb-6">
                        <View className="flex-row items-center gap-2 mb-3">
                            <Ionicons name="calendar-outline" size={16} color="#9ca3af" />
                            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('date')}</Text>
                        </View>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowPartialDatePicker(true)}
                                className="flex-1 bg-gray-800/60 p-4 rounded-2xl border-2 border-gray-700/50 flex-row items-center justify-between"
                            >
                                <Text className="text-white text-base font-medium">{partialDate.toLocaleDateString()}</Text>
                                <Ionicons name="calendar" size={18} color="#6b7280" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowPartialTimePicker(true)}
                                className="flex-1 bg-gray-800/60 p-4 rounded-2xl border-2 border-gray-700/50 flex-row items-center justify-between"
                            >
                                <Text className="text-white text-base font-medium">
                                    {partialDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </Text>
                                <Ionicons name="time" size={18} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        {showPartialDatePicker && (
                            <DateTimePicker
                                value={partialDate}
                                mode="date"
                                display="default"
                                onChange={onPartialDateChange}
                                themeVariant="dark"
                            />
                        )}

                        {showPartialTimePicker && (
                            <DateTimePicker
                                value={partialDate}
                                mode="time"
                                display="default"
                                onChange={onPartialTimeChange}
                                themeVariant="dark"
                            />
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            onPress={() => {
                                setShowPartialModal(false);
                                setPartialAmount("");
                                setPartialNote("");
                                setPartialDate(new Date());
                            }}
                            className="flex-1 bg-gray-800/60 p-4.5 rounded-2xl items-center border-2 border-gray-700/50 active:scale-[0.97] shadow-sm"
                        >
                            <Text className="text-gray-400 font-bold text-lg">{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handlePartialPayment}
                            className="flex-1 bg-blue-600 p-4.5 rounded-2xl items-center shadow-xl active:scale-[0.97] border-2 border-blue-500/30"
                        >
                            <Text className="text-white font-extrabold text-lg tracking-tight">{t('save')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </StyledModal>

            {/* Delete Confirmation Modal */}
            <StyledModal
                visible={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('delete')}
            >
                <View className="pb-6 items-center">
                    <View className="w-20 h-20 bg-red-500/10 rounded-full items-center justify-center mb-6 border-2 border-red-500/20">
                        <Ionicons name="trash" size={40} color="#ef4444" />
                    </View>

                    <Text className="text-white text-2xl font-extrabold text-center mb-3">
                        {t('delete_confirm')}
                    </Text>
                    <Text className="text-gray-400 text-center text-base leading-relaxed px-4 mb-8">
                        {t('delete_warning')}
                    </Text>

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity
                            onPress={() => setShowDeleteModal(false)}
                            className="flex-1 bg-gray-800/60 p-5 rounded-2xl items-center border-2 border-gray-700/50 active:scale-[0.97] shadow-sm"
                        >
                            <Text className="text-gray-400 font-bold text-lg">{t('cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                try {
                                    deleteTransaction(transaction.id);
                                    setShowDeleteModal(false);
                                    showSuccess(t('transaction_deleted') || 'Transaction deleted');
                                } catch (error) {
                                    showError(error, 'Failed to delete transaction');
                                    setShowDeleteModal(false);
                                }
                            }}
                            className="flex-1 bg-red-600 p-5 rounded-2xl items-center shadow-xl active:scale-[0.97] border-2 border-red-500/30"
                        >
                            <Text className="text-white font-extrabold text-lg tracking-tight">{t('delete')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </StyledModal>
        </>
    );
}
