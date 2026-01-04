import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useTransactions } from "../store/TransactionContext";
import { TransactionCard } from "../components/TransactionCard";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState, useMemo } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLanguage } from "../store/LanguageContext";
import { useSettings } from "../store/SettingsContext";
import { StyledModal } from "../components/StyledModal";
import { formatDateToISO, extractDatePart } from "../utils/date";

export default function History() {
    const router = useRouter();
    const { transactions } = useTransactions();
    const { t, language } = useLanguage();
    const { lockHistory } = useSettings();

    // Filter state
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [showPersonPicker, setShowPersonPicker] = useState(false);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [notice, setNotice] = useState({ visible: false, title: "", message: "" });

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);

    const handleToggleEditMode = async () => {
        if (isEditMode) {
            setIsEditMode(false);
            return;
        }

        // If lockHistory is OFF, enable edit mode directly without authentication
        if (!lockHistory) {
            setIsEditMode(true);
            return;
        }

        // If lockHistory is ON, require authentication
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                // If no hardware, you might allow it or show error.
                setNotice({
                    visible: true,
                    title: t('notice'),
                    message: t('biometrics_unavailable')
                });
                setIsEditMode(true);
                return;
            }

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                setNotice({
                    visible: true,
                    title: t('error'),
                    message: t('no_biometrics')
                });
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to edit history',
                fallbackLabel: 'Enter Passcode'
            });

            if (result.success) {
                setIsEditMode(true);
            }
        } catch (error) {
            console.error(error);
            setNotice({
                visible: true,
                title: t('error'),
                message: t('auth_failed')
            });
        }
    };

    // Get unique person names
    const uniquePeople = useMemo(() => {
        const names = [...new Set(transactions.map(t => t.name))];
        return names.sort();
    }, [transactions]);

    // Apply filters
    const filteredTransactions = useMemo(() => {
        // Show settled transactions, but exclude partial payment records (they are viewing inside the parent)
        let filtered = transactions.filter(t => t.isSettled && !t.parentId);

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

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, selectedPerson, startDate, endDate]);

    // Group transactions by date
    const groupedByDate: { [key: string]: typeof transactions } = {};
    filteredTransactions.forEach(t => {
        const dateKey = extractDatePart(t.date);
        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(t);
    });

    const sections = Object.keys(groupedByDate).map(date => ({
        date,
        data: groupedByDate[date]
    }));

    const clearFilters = () => {
        setSelectedPerson(null);
        setStartDate(null);
        setEndDate(null);
    };

    const hasActiveFilters = selectedPerson || startDate || endDate;

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <StatusBar style="light" />

            <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-900 rounded-full items-center justify-center border border-gray-800"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white text-3xl font-bold">{t('history')}</Text>
                        <Text className="text-gray-400">{t('history_subtitle')}</Text>
                    </View>
                </View>

                {lockHistory && (
                    <TouchableOpacity
                        onPress={handleToggleEditMode}
                        className={`w-12 h-12 rounded-xl items-center justify-center border ${isEditMode ? 'bg-red-500/20 border-red-500' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <Ionicons name={isEditMode ? "lock-open" : "lock-closed"} size={24} color={isEditMode ? "#ef4444" : "#9ca3af"} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filters */}
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

            <FlatList
                data={sections}
                keyExtractor={(item) => item.date}
                renderItem={({ item: section }) => (
                    <View className="mb-6">
                        <Text className="text-gray-500 text-sm font-bold mb-3 uppercase">
                            {new Date(section.date).toLocaleDateString(language, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                        {section.data.map((transaction, idx) => (
                            <TransactionCard
                                key={transaction.id}
                                transaction={transaction}
                                index={idx}
                                isReadOnly={lockHistory ? !isEditMode : false}
                            />
                        ))}
                    </View>
                )}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-20">
                        <Text className="text-gray-500 text-lg">{t('empty_history')}</Text>
                        <Text className="text-gray-600">{t('try_adjusting')}</Text>
                    </View>
                }
            />

            {/* Person Picker Modal */}
            <StyledModal
                visible={showPersonPicker}
                onClose={() => setShowPersonPicker(false)}
                title={t('filter_by_person')}
            >
                <FlatList
                    data={[null, ...uniquePeople]}
                    keyExtractor={(item, idx) => item || 'all'}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedPerson(item);
                                setShowPersonPicker(false);
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
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
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

            {/* Notice Modal (Alert replacement) */}
            <StyledModal
                visible={notice.visible}
                onClose={() => setNotice({ ...notice, visible: false })}
                title={notice.title}
            >
                <View className="pb-6 items-center">
                    <View className="w-20 h-20 bg-blue-500/10 rounded-full items-center justify-center mb-6 border-2 border-blue-500/20">
                        <Ionicons name="shield-checkmark" size={40} color="#60a5fa" />
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
