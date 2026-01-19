import React from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, FlatList, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useTransactions } from "../store/TransactionContext";
import { useSettings } from "../store/SettingsContext";
import { useLanguage } from "../store/LanguageContext";
import { StyledModal } from "../components/StyledModal";
import { DebtType } from "../types";
import { CURRENCY_SYMBOL } from "../constants/Config";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { validateTransaction } from "../utils/errorHandler";
import { useError } from "../store/ErrorContext";
import { useSuccess } from "../store/SuccessContext";
import { StatusBar } from "expo-status-bar";

export default function AddTransaction() {
    const router = useRouter();
    const { addTransaction } = useTransactions();
    const { ignoreCaseName } = useSettings();
    const { t } = useLanguage();
    const { showError } = useError();
    const { showSuccess } = useSuccess();

    const [type, setType] = useState<DebtType>('OWED'); // Default: I Gave (someone owes me)
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    // Date Picker State
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Contacts State
    const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contacts.Contact[]>([]);
    const [showContactModal, setShowContactModal] = useState(false);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [contactSearch, setContactSearch] = useState("");
    const [notice, setNotice] = useState({ visible: false, title: "", message: "" });

    // Dynamic Colors based on Type
    const isOwed = type === 'OWED';
    const accentColor = isOwed ? '#10b981' : '#f43f5e'; // Emerald-500 vs Rose-500
    const accentBg = isOwed ? 'bg-emerald-600' : 'bg-rose-600';
    const accentBorder = isOwed ? 'border-emerald-500/20' : 'border-rose-500/20';
    const accentText = isOwed ? 'text-emerald-500' : 'text-rose-500';
    const accentClass = isOwed ? 'emerald' : 'rose';

    const formatName = (str: string) => {
        if (!ignoreCaseName) return str;
        return str
            .trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const handleSave = () => {
        try {
            // Validate transaction data
            const validation = validateTransaction({
                name,
                amount,
                date: date.toISOString(),
            });

            if (!validation.valid && validation.error) {
                setNotice({
                    visible: true,
                    title: t('error'),
                    message: validation.error.message || t('amount_error')
                });
                showError(validation.error);
                return;
            }

            const normalizedName = formatName(name);
            const amountNum = parseFloat(amount);

            if (isNaN(amountNum)) {
                const error = {
                    type: 'VALIDATION_ERROR' as const,
                    message: t('amount_error'),
                    code: 'INVALID_AMOUNT'
                };
                setNotice({
                    visible: true,
                    title: t('error'),
                    message: t('amount_error')
                });
                showError(error);
                return;
            }

            addTransaction({
                name: normalizedName,
                amount: amountNum,
                description,
                date: date.toISOString(),
                type,
                isSettled: false
            });
            showSuccess(t('transaction_saved'));
            router.back();
        } catch (error) {
            showError(error);
            setNotice({
                visible: true,
                title: t('error'),
                message: error instanceof Error ? error.message : t('amount_error')
            });
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowDatePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const onTimeChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        setShowTimePicker(Platform.OS === 'ios');
        setDate(currentDate);
    };

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const { status } = await Contacts.requestPermissionsAsync();

            if (status === 'granted') {
                try {
                    const { data } = await Contacts.getContactsAsync({
                        fields: [Contacts.Fields.Name, Contacts.Fields.ID],
                        sort: Contacts.SortTypes.FirstName,
                    });

                    if (data && data.length > 0) {
                        setContacts(data);
                        setFilteredContacts(data);
                        setShowContactModal(true);
                    } else {
                        setNotice({
                            visible: true,
                            title: t('error'),
                            message: t('no_contacts') || "No contacts found on this device."
                        });
                    }
                } catch (fetchError) {
                    showError(fetchError, 'Failed to fetch contacts');
                    setNotice({
                        visible: true,
                        title: t('error'),
                        message: "Failed to load contacts. Please try again."
                    });
                }
            } else {
                setNotice({
                    visible: true,
                    title: t('error'),
                    message: t('error_contacts') || "Permission to access contacts was denied."
                });
            }
        } catch (error) {
            showError(error, 'Failed to request contacts permission');
            setNotice({
                visible: true,
                title: t('error'),
                message: "Failed to access contacts. Please check app permissions."
            });
        } finally {
            setLoadingContacts(false);
        }
    };

    const searchContacts = (text: string) => {
        setContactSearch(text);
        if (text) {
            const newData = contacts.filter(item => {
                const itemData = item.name ? item.name.toUpperCase() : ''.toUpperCase();
                const textData = text.toUpperCase();
                return itemData.indexOf(textData) > -1;
            });
            setFilteredContacts(newData);
        } else {
            setFilteredContacts(contacts);
        }
    };

    const selectContact = (contactName: string) => {
        if (contactName) {
            setName(contactName);
            setShowContactModal(false);
            setContactSearch("");
        }
    };

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <StatusBar style="light" />

            {/* Header - Matching History Page Style */}
            <View className="flex-row items-center justify-between mb-8">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-900 rounded-full items-center justify-center border border-gray-800"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-3xl font-bold">{t('add_transaction')}</Text>
                        <Text className="text-gray-400">{t('add_subtitle')}</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 150 }}
            >
                {/* Type Selector - Keeping the prominent cards but ensuring they fit the theme */}
                <View className="flex-row gap-3 mb-8">
                    <TouchableOpacity
                        onPress={() => setType('OWED')}
                        activeOpacity={0.9}
                        className={`flex-1 p-4 rounded-2xl border transition-all ${type === 'OWED'
                            ? 'bg-gray-800 border-emerald-500/50'
                            : 'bg-gray-900 border-gray-800'
                            }`}
                    >
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className={`w-6 h-6 rounded-full items-center justify-center ${type === 'OWED' ? 'bg-emerald-500/20' : 'bg-gray-800'
                                }`}>
                                <Ionicons name="arrow-down" size={14} color={type === 'OWED' ? '#10b981' : '#6b7280'} />
                            </View>
                            <Text className={`font-bold text-xs uppercase tracking-wider ${type === 'OWED' ? 'text-emerald-500' : 'text-gray-500'
                                }`}>{t('you_gave')}</Text>
                        </View>
                        <Text className={`text-lg font-bold ${type === 'OWED' ? 'text-white' : 'text-gray-500'
                            }`}>{t('i_gave')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setType('OWE')}
                        activeOpacity={0.9}
                        className={`flex-1 p-4 rounded-2xl border transition-all ${type === 'OWE'
                            ? 'bg-gray-800 border-rose-500/50'
                            : 'bg-gray-900 border-gray-800'
                            }`}
                    >
                        <View className="flex-row items-center gap-2 mb-2">
                            <View className={`w-6 h-6 rounded-full items-center justify-center ${type === 'OWE' ? 'bg-rose-500/20' : 'bg-gray-800'
                                }`}>
                                <Ionicons name="arrow-up" size={14} color={type === 'OWE' ? '#f43f5e' : '#6b7280'} />
                            </View>
                            <Text className={`font-bold text-xs uppercase tracking-wider ${type === 'OWE' ? 'text-rose-500' : 'text-gray-500'
                                }`}>{t('you_took')}</Text>
                        </View>
                        <Text className={`text-lg font-bold ${type === 'OWE' ? 'text-white' : 'text-gray-500'
                            }`}>{t('i_took')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Form Inputs */}
                <View className="gap-4">

                    {/* Person Input */}
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">{t('person_name')}</Text>
                        <View className="flex-row gap-2">
                            <View className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex-row items-center px-4 py-1">
                                <Ionicons name="person-outline" size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 text-white p-3 text-base font-medium"
                                    placeholder={t('name_placeholder')}
                                    placeholderTextColor="#4b5563"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <TouchableOpacity
                                onPress={fetchContacts}
                                className="w-14 bg-gray-900 border border-gray-800 rounded-xl justify-center items-center active:bg-gray-800"
                            >
                                <Ionicons name="people" size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Amount Input */}
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">{t('amount')}</Text>
                        <View className="bg-gray-900 border border-gray-800 rounded-xl flex-row items-center px-4 py-2">
                            <Text className="text-gray-500 text-lg font-bold mr-2">{CURRENCY_SYMBOL}</Text>
                            <TextInput
                                className="flex-1 text-white p-2 text-2xl font-bold"
                                placeholder="0.00"
                                placeholderTextColor="#4b5563"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    {/* Description Input */}
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">{t('description')}</Text>
                        <View className="bg-gray-900 border border-gray-800 rounded-xl flex-row items-center px-4 py-1">
                            <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
                            <TextInput
                                className="flex-1 text-white p-3 text-base font-medium"
                                placeholder={t('desc_placeholder')}
                                placeholderTextColor="#4b5563"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Date & Time Input */}
                    <View>
                        <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-1">{t('date')}</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex-row items-center px-4 py-3 active:bg-gray-800"
                            >
                                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                                <Text className="flex-1 text-white text-base font-medium ml-3">
                                    {date.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                className="flex-1 bg-gray-900 border border-gray-800 rounded-xl flex-row items-center px-4 py-3 active:bg-gray-800"
                            >
                                <Ionicons name="time-outline" size={20} color="#6b7280" />
                                <Text className="flex-1 text-white text-base font-medium ml-3">
                                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode="date"
                                display="default"
                                onChange={onDateChange}
                                themeVariant="dark"
                            />
                        )}

                        {showTimePicker && (
                            <DateTimePicker
                                value={date}
                                mode="time"
                                display="default"
                                onChange={onTimeChange}
                                themeVariant="dark"
                            />
                        )}
                    </View>
                </View>

                {/* Buttons */}
                <View className="mt-12 mb-10 gap-3">
                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-blue-600 py-4 rounded-xl items-center justify-center shadow active:bg-blue-700"
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">{t('save_transaction')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="py-4 rounded-xl items-center justify-center bg-transparent active:opacity-70"
                    >
                        <Text className="text-gray-500 font-semibold">{t('cancel')}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Contact Picker Modal - using same style as index.tsx */}
            <StyledModal
                visible={showContactModal}
                onClose={() => setShowContactModal(false)}
                title={t('select_contact')}
            >
                <View className="flex-1">
                    {/* Enhanced Search Bar */}
                    <View className="flex-row items-center bg-gray-800/80 rounded-2xl px-5 py-4 mb-6 border border-gray-700/50 shadow-lg">
                        <View className="mr-3">
                            <Ionicons name="search" size={22} color="#60a5fa" />
                        </View>
                        <TextInput
                            className="flex-1 text-white text-base font-medium"
                            placeholder={t('search_contacts')}
                            placeholderTextColor="#6b7280"
                            value={contactSearch}
                            onChangeText={searchContacts}
                            autoCorrect={false}
                        />
                        {contactSearch.length > 0 && (
                            <TouchableOpacity
                                onPress={() => searchContacts("")}
                                className="ml-2 p-1"
                            >
                                <Ionicons name="close-circle" size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {loadingContacts ? (
                        <ActivityIndicator size="large" color="#60a5fa" className="my-10" />
                    ) : (
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={(item: any) => item.id || item.name}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    className="px-5 py-4 bg-gray-800/60 rounded-2xl mb-3 border border-gray-700/50 active:bg-blue-900/30 active:border-blue-500/50 active:scale-[0.98] shadow-sm"
                                    onPress={() => selectContact(item.name)}
                                >
                                    <View className="flex-row items-center gap-4">
                                        <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center border-2 border-blue-500/30 shadow-sm">
                                            <Text className="text-blue-400 font-bold text-lg">
                                                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                            </Text>
                                        </View>
                                        <Text className="text-white text-lg font-semibold flex-1">{item.name}</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ paddingBottom: 100 }}
                            ListEmptyComponent={() => (
                                <View className="items-center py-20">
                                    <View className="w-20 h-20 bg-gray-800/50 rounded-full items-center justify-center mb-4">
                                        <Ionicons name="person-remove-outline" size={40} color="#6b7280" />
                                    </View>
                                    <Text className="text-gray-400 mt-4 text-lg font-semibold">{t('no_contacts')}</Text>
                                    <Text className="text-gray-500 mt-2 text-sm text-center">{t('search_empty')}</Text>
                                </View>
                            )}
                        />
                    )}
                </View>
            </StyledModal>

            {/* Notice Modal */}
            <StyledModal
                visible={notice.visible}
                onClose={() => setNotice({ ...notice, visible: false })}
                title={notice.title}
            >
                <View className="pb-6 items-center">
                    <View className="w-20 h-20 bg-blue-500/10 rounded-full items-center justify-center mb-6 border-2 border-blue-500/20">
                        <Ionicons name="information-circle" size={40} color="#60a5fa" />
                    </View>
                    <Text className="text-white text-lg text-center mb-8 px-4 font-medium leading-relaxed">
                        {notice.message}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setNotice({ ...notice, visible: false })}
                        className="w-full bg-blue-600 py-4.5 rounded-2xl items-center shadow-xl active:scale-[0.97] border border-blue-500/30"
                    >
                        <Text className="text-white font-extrabold text-lg tracking-tight">{t('confirm') || 'OK'}</Text>
                    </TouchableOpacity>
                </View>
            </StyledModal>
        </View>
    );
}
