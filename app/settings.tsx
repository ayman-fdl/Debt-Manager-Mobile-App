import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../store/LanguageContext';
import { useSettings } from '../store/SettingsContext';
import { StatusBar } from 'expo-status-bar';
import { StyledModal } from '../components/StyledModal';
import { useTransactions } from '../store/TransactionContext';
import { exportToJSON } from '../utils/export';
import { useError } from '../store/ErrorContext';
import { PageHeader } from '../components/PageHeader';

export default function Settings() {
    const router = useRouter();
    const { language, setLanguage, t } = useLanguage();
    const { ignoreCaseName, setIgnoreCaseName, biometricEnabled, setBiometricEnabled, lockHistory, setLockHistory } = useSettings();
    const { transactions } = useTransactions();
    const { showError } = useError();
    const [showLanguageModal, setShowLanguageModal] = React.useState(false);
    const [exporting, setExporting] = React.useState(false);
    const [exportNotice, setExportNotice] = React.useState({ visible: false, title: "", message: "" });

    const languages = [
        { code: 'en', label: 'English' },
        { code: 'fr', label: 'Français' },
        { code: 'ar', label: 'العربية' }
    ];

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <StatusBar style="light" />

            {/* Header */}
            <PageHeader
                title={t('settings')}
                subtitle={t('settings_subtitle')}
                onBack={() => router.back()}
            />

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Language Section - Select Box Style */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-3 mb-4 ml-1">
                        <Ionicons name="language" size={20} color="#60a5fa" />
                        <Text className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('language_option')}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowLanguageModal(true)}
                        activeOpacity={0.7}
                        className="flex-row items-center justify-between p-5 bg-gray-900 rounded-2xl border border-gray-800 shadow-xl"
                    >
                        <View className="flex-row items-center gap-4">
                            <View className="bg-blue-500/10 p-2 rounded-lg">
                                <Ionicons name="globe-outline" size={20} color="#60a5fa" />
                            </View>
                            <Text className="text-white text-lg font-bold">{currentLang.label}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-gray-500 capitalize">{language}</Text>
                            <Ionicons name="chevron-down" size={20} color="#4b5563" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-3 mb-4 ml-1">
                        <Ionicons name="options" size={20} color="#60a5fa" />
                        <Text className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('notice')}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setIgnoreCaseName(!ignoreCaseName)}
                        activeOpacity={0.7}
                        className="p-5 bg-gray-900 rounded-2xl border border-gray-800"
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-blue-500/10 p-2 rounded-lg">
                                    <Ionicons name="text" size={22} color="#60a5fa" />
                                </View>
                                <Text className="text-white text-lg font-bold">{t('ignore_case')}</Text>
                            </View>
                            <View className={`w-14 h-8 rounded-full p-1 ${ignoreCaseName ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}>
                                <View className={`w-6 h-6 bg-white rounded-full ${ignoreCaseName ? 'self-end' : 'self-start'}`} />
                            </View>
                        </View>
                        <Text className="text-gray-500 text-sm leading-relaxed">
                            {t('ignore_case_desc')}
                        </Text>
                    </TouchableOpacity>

                    {/* Biometric Authentication Toggle */}
                    <TouchableOpacity
                        onPress={() => setBiometricEnabled(!biometricEnabled)}
                        activeOpacity={0.7}
                        className="p-5 bg-gray-900 rounded-2xl border border-gray-800 mt-3"
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-purple-500/10 p-2 rounded-lg">
                                    <Ionicons name="finger-print" size={22} color="#a855f7" />
                                </View>
                                <Text className="text-white text-lg font-bold">{t('biometric_auth')}</Text>
                            </View>
                            <View className={`w-14 h-8 rounded-full p-1 ${biometricEnabled ? 'bg-purple-600' : 'bg-gray-800 border border-gray-700'}`}>
                                <View className={`w-6 h-6 bg-white rounded-full ${biometricEnabled ? 'self-end' : 'self-start'}`} />
                            </View>
                        </View>
                        <Text className="text-gray-500 text-sm leading-relaxed">
                            {t('biometric_auth_desc')}
                        </Text>
                    </TouchableOpacity>

                    {/* Lock History Toggle */}
                    <TouchableOpacity
                        onPress={() => setLockHistory(!lockHistory)}
                        activeOpacity={0.7}
                        className="p-5 bg-gray-900 rounded-2xl border border-gray-800 mt-3"
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-amber-500/10 p-2 rounded-lg">
                                    <Ionicons name="lock-closed" size={22} color="#f59e0b" />
                                </View>
                                <Text className="text-white text-lg font-bold">{t('lock_history')}</Text>
                            </View>
                            <View className={`w-14 h-8 rounded-full p-1 ${lockHistory ? 'bg-amber-600' : 'bg-gray-800 border border-gray-700'}`}>
                                <View className={`w-6 h-6 bg-white rounded-full ${lockHistory ? 'self-end' : 'self-start'}`} />
                            </View>
                        </View>
                        <Text className="text-gray-500 text-sm leading-relaxed">
                            {t('lock_history_desc')}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Data Management Section */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-3 mb-4 ml-1">
                        <Ionicons name="cloud-download-outline" size={20} color="#60a5fa" />
                        <Text className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('data_management')}</Text>
                    </View>

                    <View className="bg-gray-900 rounded-2xl border border-gray-800">
                        {/* Backup JSON */}
                        <TouchableOpacity
                            onPress={async () => {
                                setExporting(true);
                                try {
                                    const result = await exportToJSON(transactions);
                                    if (result.success) {
                                        // setExportNotice({
                                        //     visible: true,
                                        //     title: t('export_success') || 'Success',
                                        //     message: t('export_success') || 'Data exported successfully'
                                        // });
                                    } else if (result.error) {
                                        showError(result.error);
                                        setExportNotice({
                                            visible: true,
                                            title: t('error'),
                                            message: result.error.message || t('export_error') || 'Export failed'
                                        });
                                    }
                                } catch (error) {
                                    showError(error);
                                    setExportNotice({
                                        visible: true,
                                        title: t('error'),
                                        message: t('export_error') || 'Export failed'
                                    });
                                } finally {
                                    setExporting(false);
                                }
                            }}
                            className="flex-row items-center justify-between p-5"
                            disabled={exporting}
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="bg-amber-500/10 p-2 rounded-lg">
                                    <Ionicons name="cloud-upload-outline" size={22} color="#f59e0b" />
                                </View>
                                <Text className="text-white text-lg font-bold">{t('backup_json')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* About Section */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-3 mb-4 ml-1">
                        <Ionicons name="information-circle-outline" size={20} color="#60a5fa" />
                        <Text className="text-gray-400 text-sm font-bold uppercase tracking-widest">{t('about')}</Text>
                    </View>

                    <View className="bg-gray-900 rounded-2xl border border-gray-800">
                        <TouchableOpacity
                            onPress={() => router.push('/about')}
                            className="flex-row items-center justify-between p-5"
                        >
                            <View className="flex-row items-center gap-4">
                                <View className="bg-emerald-500/10 p-2 rounded-lg">
                                    <Ionicons name="information" size={22} color="#10b981" />
                                </View>
                                <Text className="text-white text-lg font-bold">{t('about_app')}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Language Selection Modal */}
            <StyledModal
                visible={showLanguageModal}
                onClose={() => setShowLanguageModal(false)}
                title={t('language_option')}
            >
                <View className="gap-3">
                    {languages.map((lang) => (
                        <TouchableOpacity
                            key={lang.code}
                            onPress={() => {
                                setLanguage(lang.code as any);
                                setShowLanguageModal(false);
                            }}
                            className={`flex-row items-center justify-between p-5 rounded-2xl border-2 transition-all ${language === lang.code
                                ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10'
                                : 'bg-gray-800/60 border-gray-700/50'
                                } active:scale-[0.98]`}
                        >
                            <View className="flex-row items-center gap-4 flex-1">
                                <View className={`w-10 h-10 rounded-full items-center justify-center ${language === lang.code ? 'bg-blue-500/20' : 'bg-gray-700/50'
                                    }`}>
                                    <Ionicons
                                        name="globe"
                                        size={20}
                                        color={language === lang.code ? "#60a5fa" : "#9ca3af"}
                                    />
                                </View>
                                <Text className={`text-lg font-bold ${language === lang.code ? 'text-blue-400' : 'text-white'
                                    }`}>
                                    {lang.label}
                                </Text>
                            </View>
                            {language === lang.code && (
                                <View className="bg-blue-500/30 p-2 rounded-full border border-blue-400/30">
                                    <Ionicons name="checkmark-sharp" size={18} color="#60a5fa" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </StyledModal>

            {/* Export Notice Modal */}
            <StyledModal
                visible={exportNotice.visible}
                onClose={() => setExportNotice({ ...exportNotice, visible: false })}
                title={exportNotice.title}
            >
                <View className="pb-6 items-center">
                    <View className={`w-20 h-20 rounded-full items-center justify-center mb-6 border-2 ${exportNotice.title === t('export_success') || exportNotice.title === 'Success'
                        ? 'bg-emerald-500/10 border-emerald-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        <Ionicons
                            name={exportNotice.title === t('export_success') || exportNotice.title === 'Success' ? "checkmark-circle" : "alert-circle"}
                            size={40}
                            color={exportNotice.title === t('export_success') || exportNotice.title === 'Success' ? "#10b981" : "#ef4444"}
                        />
                    </View>
                    <Text className="text-white text-lg text-center mb-8 px-4 font-medium leading-relaxed">
                        {exportNotice.message}
                    </Text>
                    <TouchableOpacity
                        onPress={() => setExportNotice({ ...exportNotice, visible: false })}
                        className={`w-full py-4.5 rounded-2xl items-center shadow-xl active:scale-[0.97] border ${exportNotice.title === t('export_success') || exportNotice.title === 'Success'
                            ? 'bg-emerald-600 border-emerald-500/30'
                            : 'bg-blue-600 border-blue-500/30'
                            }`}
                    >
                        <Text className="text-white font-extrabold text-lg tracking-tight">{t('confirm') || 'OK'}</Text>
                    </TouchableOpacity>
                </View>
            </StyledModal>
        </View>
    );
}
