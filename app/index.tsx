import React from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput } from "react-native";
import { Link, useRouter } from "expo-router";
import { useTransactions } from "../store/TransactionContext";
import { TransactionCard } from "../components/TransactionCard"; // Changed from PersonCard
import { StatusBar } from "expo-status-bar";
import { CURRENCY_SYMBOL } from "../constants/Config";
import { useState, useMemo } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from "../store/LanguageContext";
import { StyledModal } from "../components/StyledModal";
import { formatDateToISO } from "../utils/date";
import { formatAmount } from "../utils/numbers";
import { OnboardingModal } from "../components/OnboardingModal";

export default function Home() {
    const router = useRouter();
    const { transactions } = useTransactions();
    const { t } = useLanguage();

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPersonPicker, setShowPersonPicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [personSearch, setPersonSearch] = useState("");

    // Get unique person names (only from non-settled transactions)
    const uniquePeople = useMemo(() => {
        const names = [...new Set(transactions.filter(t => !t.isSettled).map(t => t.name))];
        return names.sort();
    }, [transactions]);

    // Filter people based on search
    const filteredPeople = useMemo(() => {
        if (!personSearch.trim()) {
            return [null, ...uniquePeople];
        }
        const searchLower = personSearch.toLowerCase().trim();
        const filtered = uniquePeople.filter(name =>
            name.toLowerCase().includes(searchLower)
        );
        return [null, ...filtered];
    }, [uniquePeople, personSearch]);

    // Apply filters to transactions
    const filteredTransactions = useMemo(() => {
        let filtered = transactions.filter(t => !t.isSettled);

        if (selectedPerson) {
            filtered = filtered.filter(t => t.name === selectedPerson);
        }

        if (startDate) {
            const startStr = formatDateToISO(startDate);
            filtered = filtered.filter(t => t.date >= startStr);
        }

        if (endDate) {
            const endStr = formatDateToISO(endDate);
            filtered = filtered.filter(t => t.date <= endStr);
        }

        // Sort by date descending (ISO string comparison is faster)
        return filtered.sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, selectedPerson, startDate, endDate]);

    // Calculate totals from filtered transactions
    const totalOwed = filteredTransactions
        .filter(t => t.type === 'OWED')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalOwe = filteredTransactions
        .filter(t => t.type === 'OWE')
        .reduce((sum, t) => sum + t.amount, 0);

    const clearFilters = () => {
        setSelectedPerson(null);
        setStartDate(null);
        setEndDate(null);
    };

    const hasActiveFilters = selectedPerson || startDate || endDate;

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
                <View>
                    <Text className="text-white text-3xl font-bold">{t('dashboard')}</Text>
                    <Text className="text-gray-400">{t('dashboard_subtitle')}</Text>
                </View>

                <View className="flex-row gap-3">


                    <Link href="/history" asChild>
                        <TouchableOpacity
                            accessibilityLabel={t('history')}
                            accessibilityRole="button"
                            className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl items-center justify-center active:scale-95"
                        >
                            <Ionicons name="time-outline" size={24} color="white" />
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                        onPress={() => router.push('/settings')}
                        accessibilityLabel={t('settings')}
                        accessibilityRole="button"
                        className="w-12 h-12 bg-gray-900 border border-gray-800 rounded-xl items-center justify-center active:scale-95"
                    >
                        <Ionicons name="settings-outline" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Summary Cards */}
            <View className="flex-row gap-4 mb-8">
                <View
                    className="flex-1 bg-emerald-600/10 p-5 rounded-[28px] border border-emerald-500/20 shadow-xl"
                >
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-8 h-8 bg-emerald-500/20 rounded-full items-center justify-center flex-shrink-0">
                            <Ionicons name="arrow-down-outline" size={16} color="#10b981" />
                        </View>
                        <Text numberOfLines={1} className="text-emerald-500 font-bold text-xs uppercase tracking-wider flex-1">{t('you_gave')}</Text>
                    </View>
                    <Text className="text-emerald-400 text-2xl font-black">{formatAmount(totalOwed)} {CURRENCY_SYMBOL}</Text>
                </View>

                <View className="flex-1 bg-rose-600/10 p-5 rounded-[28px] border border-rose-500/20 shadow-xl">
                    <View className="flex-row items-center gap-2 mb-2">
                        <View className="w-8 h-8 bg-rose-500/20 rounded-full items-center justify-center flex-shrink-0">
                            <Ionicons name="arrow-up-outline" size={16} color="#f43f5e" />
                        </View>
                        <Text numberOfLines={1} className="text-rose-500 font-bold text-xs uppercase tracking-wider flex-1">{t('you_took')}</Text>
                    </View>
                    <Text className="text-rose-400 text-2xl font-black">{formatAmount(totalOwe)} {CURRENCY_SYMBOL}</Text>
                </View>
            </View>

            {/* Content Section */}
            <View className="flex-1 bg-gray-900/40 rounded-t-[40px] -mx-4 px-6 pt-8 border-t border-gray-800/50">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-white text-2xl font-bold tracking-tight">{t('transactions_header')}</Text>
                        <Text className="text-gray-500 text-xs font-medium">{filteredTransactions.length} {t('active_entries')}</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TouchableOpacity
                            onPress={() => setShowFilters(!showFilters)}
                            accessibilityLabel={t('filters')}
                            accessibilityRole="button"
                            className={`w-10 h-10 items-center justify-center rounded-xl border ${hasActiveFilters ? 'bg-blue-600 border-blue-500' : 'bg-gray-900 border-gray-800'}`}
                        >
                            <Ionicons name="funnel-outline" size={18} color={hasActiveFilters ? "white" : "#9ca3af"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push('/add')}
                            accessibilityLabel={t('add_transaction')}
                            accessibilityRole="button"
                            className="w-10 h-10 items-center justify-center rounded-xl border bg-blue-600 border-blue-500 active:scale-95"
                        >
                            <Ionicons name="add" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filters - Collapsible (like history page) */}
                {showFilters && (
                    <View className="mb-4">
                        <View className="flex-row gap-2 mb-3">
                            {/* Person Filter */}
                            <TouchableOpacity
                                onPress={() => setShowPersonPicker(true)}
                                className={`flex-1 p-3 rounded-xl border ${selectedPerson ? 'bg-blue-600 border-blue-500' : 'bg-gray-900 border-gray-800'}`}
                            >
                                <Text className={`text-sm font-medium ${selectedPerson ? 'text-white' : 'text-gray-400'}`}>
                                    {selectedPerson || t('all_people')}
                                </Text>
                            </TouchableOpacity>

                            {/* Date Range Filters */}
                            <TouchableOpacity
                                onPress={() => setShowStartDatePicker(true)}
                                className={`flex-1 p-3 rounded-xl border ${startDate ? 'bg-blue-600 border-blue-500' : 'bg-gray-900 border-gray-800'}`}
                            >
                                <Text className={`text-sm font-medium ${startDate ? 'text-white' : 'text-gray-400'}`}>
                                    {startDate ? startDate.toLocaleDateString() : t('start_date')}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setShowEndDatePicker(true)}
                                className={`flex-1 p-3 rounded-xl border ${endDate ? 'bg-blue-600 border-blue-500' : 'bg-gray-900 border-gray-800'}`}
                            >
                                <Text className={`text-sm font-medium ${endDate ? 'text-white' : 'text-gray-400'}`}>
                                    {endDate ? endDate.toLocaleDateString() : t('end_date')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {hasActiveFilters && (
                            <TouchableOpacity
                                onPress={clearFilters}
                                className="bg-gray-800 p-2 rounded-lg self-start"
                            >
                                <Text className="text-blue-400 text-sm font-medium">{t('clear_filters')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {filteredTransactions.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50 pb-20">
                        <Ionicons name="receipt-outline" size={64} color="#4b5563" />
                        <Text className="text-gray-500 text-lg mt-4">{t('empty_history')}</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredTransactions}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <TransactionCard
                                transaction={item}
                                index={index}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    />
                )}
            </View>
            {/* Person Picker Modal */}
            <StyledModal
                visible={showPersonPicker}
                onClose={() => {
                    setShowPersonPicker(false);
                    setPersonSearch("");
                }}
                title={t('filter_by_person')}
            >
                <>
                    {/* Search Bar */}
                    <View className="flex-row items-center bg-gray-800/80 rounded-2xl px-5 py-4 mb-6 border border-gray-700/50 shadow-lg">
                        <View className="mr-3">
                            <Ionicons name="search" size={22} color="#60a5fa" />
                        </View>
                        <TextInput
                            className="flex-1 text-white text-base font-medium"
                            placeholder={t('search_contacts') || "Search people..."}
                            placeholderTextColor="#6b7280"
                            value={personSearch}
                            onChangeText={setPersonSearch}
                            autoCorrect={false}
                        />
                        {personSearch.length > 0 && (
                            <TouchableOpacity
                                onPress={() => setPersonSearch("")}
                                className="ml-2 p-1"
                            >
                                <Ionicons name="close-circle" size={22} color="#9ca3af" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <FlatList
                        data={filteredPeople}
                        keyExtractor={(item, idx) => item || 'all'}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedPerson(item);
                                    setShowPersonPicker(false);
                                    setPersonSearch("");
                                }}
                                className={`px-5 py-4 rounded-2xl mb-3 border-2 active:scale-[0.98] ${selectedPerson === item
                                    ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                                    : 'bg-gray-800/60 border-gray-700/50'
                                    }`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View className={`w-10 h-10 rounded-full items-center justify-center ${selectedPerson === item ? 'bg-blue-500/20' : 'bg-gray-700/50'
                                        }`}>
                                        <Ionicons
                                            name={item ? "person" : "people"}
                                            size={20}
                                            color={selectedPerson === item ? "#60a5fa" : "#9ca3af"}
                                        />
                                    </View>
                                    <Text className={`text-base flex-1 ${selectedPerson === item ? 'text-blue-400 font-bold' : 'text-white font-medium'
                                        }`}>
                                        {item || t('all_people')}
                                    </Text>
                                    {selectedPerson === item && (
                                        <Ionicons name="checkmark-circle" size={22} color="#60a5fa" />
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                        style={{ maxHeight: 400 }}
                        nestedScrollEnabled={true}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={() => (
                            <View className="items-center py-20">
                                <View className="w-20 h-20 bg-gray-800/50 rounded-full items-center justify-center mb-4">
                                    <Ionicons name="person-remove-outline" size={40} color="#6b7280" />
                                </View>
                                <Text className="text-gray-400 mt-4 text-lg font-semibold">{t('no_people_found')}</Text>
                                <Text className="text-gray-500 mt-2 text-sm text-center">{t('try_search')}</Text>
                            </View>
                        )}
                    />
                </>
            </StyledModal>

            {/* Date Pickers */}
            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowStartDatePicker(false);
                        if (date) setStartDate(date);
                    }}
                    themeVariant="dark"
                />
            )}

            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                        setShowEndDatePicker(false);
                        if (date) setEndDate(date);
                    }}
                    themeVariant="dark"
                />
            )}



            {/* Onboarding Flow */}
            <OnboardingModal />



            <StatusBar style="light" />
        </View>
    );
}
