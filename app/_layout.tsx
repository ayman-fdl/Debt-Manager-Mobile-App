import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TransactionProvider } from "../store/TransactionContext";
import { LanguageProvider } from "../store/LanguageContext";
import { SettingsProvider, useSettings } from "../store/SettingsContext";
import { ErrorProvider } from "../store/ErrorContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ErrorToast } from "../components/ErrorToast";
import { SuccessProvider } from "../store/SuccessContext";
import { SuccessToast } from "../components/SuccessToast";
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const { biometricEnabled } = useSettings();

    useEffect(() => {
        authenticate();
    }, [biometricEnabled]);

    const authenticate = async () => {
        try {
            // If biometric is disabled in settings, skip authentication
            if (!biometricEnabled) {
                setIsUnlocked(true);
                return;
            }

            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                setIsUnlocked(true); // No biometric hardware, fallback to open
                return;
            }

            const { success } = await LocalAuthentication.authenticateAsync({
                promptMessage: "Unlock Debt Manager",
                fallbackLabel: "Enter Passcode",
            });

            if (success) {
                setIsUnlocked(true);
            } else {
                // Optional: Alert or just stay locked
            }
        } catch (error) {
            // If any error occurs (permissions, API failure, etc.), unlock the app
            console.error("Biometric authentication error:", error);
            setIsUnlocked(true);
        }
    };

    if (!isUnlocked) {
        return (
            <View className="flex-1 bg-gray-950 items-center justify-center p-6">
                <Text className="text-white text-3xl font-bold mb-4">Locked</Text>
                <Text className="text-gray-400 mb-8 text-center">Please authenticate to view your finances.</Text>
                <TouchableOpacity
                    onPress={authenticate}
                    className="bg-blue-600 px-8 py-4 rounded-xl"
                >
                    <Text className="text-white font-bold text-lg">Unlock App</Text>
                </TouchableOpacity>
                <StatusBar style="light" />
            </View>
        );
    }

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ErrorProvider>
                    <SuccessProvider>
                        <LanguageProvider>
                            <TransactionProvider>
                                <Stack screenOptions={{ headerShown: false }} />
                                <SuccessToast />
                                <ErrorToast />
                                <StatusBar style="light" />
                            </TransactionProvider>
                        </LanguageProvider>
                    </SuccessProvider>
                </ErrorProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    );
}

export default function Layout() {
    return (
        <SafeAreaProvider>
            <SettingsProvider>
                <AppContent />
            </SettingsProvider>
        </SafeAreaProvider>
    );
}
