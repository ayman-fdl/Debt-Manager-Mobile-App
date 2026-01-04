import { View, Text, TouchableOpacity, ScrollView, Linking } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLanguage } from "../store/LanguageContext";
import { APP_INFO } from "../constants/Config";
import Constants from 'expo-constants';

export default function About() {
    const router = useRouter();
    const { t } = useLanguage();

    const appVersion = Constants.expoConfig?.version || APP_INFO.version;
    const appName = Constants.expoConfig?.name || "Debt Manager";

    const handleEmailPress = () => {
        Linking.openURL(`mailto:${APP_INFO.developerEmail}`);
    };

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <StatusBar style="light" />

            {/* Header */}
            <View className="flex-row items-center gap-4 mb-8">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 bg-gray-900 rounded-full items-center justify-center border border-gray-800"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View>
                    <Text className="text-white text-3xl font-bold">{t('about')}</Text>
                    <Text className="text-gray-400">{t('about_subtitle')}</Text>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* App Info Card */}
                <View className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800/50 mb-6">
                    <View className="items-center mb-6">
                        <View className="w-24 h-24 bg-emerald-500/20 rounded-3xl items-center justify-center mb-4 border-2 border-emerald-500/30">
                            <Ionicons name="cash-outline" size={48} color="#10b981" />
                        </View>
                        <Text className="text-white text-2xl font-bold mb-1">{appName}</Text>
                        <Text className="text-gray-400 text-sm">{t('version')}: {appVersion}</Text>
                    </View>

                    <Text className="text-gray-300 text-center leading-relaxed">
                        {t('app_description')}
                    </Text>
                </View>

                {/* Privacy Card */}
                <View className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20 mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="w-12 h-12 bg-blue-500/20 rounded-full items-center justify-center">
                            <Ionicons name="shield-checkmark" size={24} color="#60a5fa" />
                        </View>
                        <Text className="text-blue-400 text-lg font-bold flex-1">{t('privacy_security')}</Text>
                    </View>
                    <Text className="text-gray-300 leading-relaxed">
                        {t('privacy_statement')}
                    </Text>
                </View>

                {/* Contact Card */}
                <View className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800/50 mb-6">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="w-12 h-12 bg-emerald-500/20 rounded-full items-center justify-center">
                            <Ionicons name="mail" size={24} color="#10b981" />
                        </View>
                        <Text className="text-white text-lg font-bold flex-1">{t('contact_support')}</Text>
                    </View>
                    <Text className="text-gray-400 mb-3">{t('contact_description')}</Text>
                    <TouchableOpacity
                        onPress={handleEmailPress}
                        className="bg-emerald-600/10 p-4 rounded-xl border border-emerald-500/20 active:scale-[0.98]"
                    >
                        <Text className="text-emerald-400 font-bold text-center">{APP_INFO.developerEmail}</Text>
                    </TouchableOpacity>
                </View>

                {/* Developer Card */}
                <View className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800/50 mb-6">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View className="w-12 h-12 bg-purple-500/20 rounded-full items-center justify-center">
                            <Ionicons name="code-slash" size={24} color="#a78bfa" />
                        </View>
                        <Text className="text-white text-lg font-bold flex-1">{t('developer')}</Text>
                    </View>
                    <Text className="text-gray-300">{APP_INFO.developerName}</Text>
                </View>

                {/* Footer */}
                <View className="items-center mt-4 mb-8">
                    <Text className="text-gray-500 text-sm">
                        © {APP_INFO.copyrightYear} {appName}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
