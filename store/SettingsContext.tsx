import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsContextType {
    ignoreCaseName: boolean;
    setIgnoreCaseName: (value: boolean) => void;
    biometricEnabled: boolean;
    setBiometricEnabled: (value: boolean) => void;
    lockHistory: boolean;
    setLockHistory: (value: boolean) => void;
    hasOnboarded: boolean;
    completeOnboarding: () => void;
    isLoadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = 'user_settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [ignoreCaseName, setIgnoreCaseNameState] = useState<boolean>(false);
    const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(false);
    const [lockHistory, setLockHistoryState] = useState<boolean>(false);
    const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);
    const [hasOnboarded, setHasOnboardedState] = useState<boolean>(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
            if (jsonValue != null) {
                try {
                    const settings = JSON.parse(jsonValue);
                    if (settings && typeof settings === 'object') {
                        if (typeof settings.ignoreCaseName === 'boolean') {
                            setIgnoreCaseNameState(settings.ignoreCaseName);
                        }
                        if (typeof settings.biometricEnabled === 'boolean') {
                            setBiometricEnabledState(settings.biometricEnabled);
                        }
                        if (typeof settings.lockHistory === 'boolean') {
                            setLockHistoryState(settings.lockHistory);
                        }
                        if (typeof settings.hasOnboarded === 'boolean') {
                            setHasOnboardedState(settings.hasOnboarded);
                        } else {
                            // If key doesn't exist (new update or fresh install), set to false to show onboarding
                            setHasOnboardedState(false);
                        }
                    }
                } catch (parseError) {
                    console.error("Failed to parse settings", parseError);
                    // Continue with default settings
                }
            } else {
                // No settings found - first time app open
                setHasOnboardedState(false);
            }
        } catch (e) {
            console.error("Failed to load settings", e);
            // Continue with default settings on error
        } finally {
            // Always set loading to false after attempt
            setIsLoadingSettings(false);
        }
    };

    const setIgnoreCaseName = async (value: boolean) => {
        if (typeof value !== 'boolean') {
            console.error("Invalid value for ignoreCaseName:", value);
            return;
        }

        setIgnoreCaseNameState(value);
        try {
            const currentSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            let settings: any = {};

            if (currentSettings) {
                try {
                    settings = JSON.parse(currentSettings);
                    if (typeof settings !== 'object' || settings === null) {
                        settings = {};
                    }
                } catch (parseError) {
                    console.error("Failed to parse existing settings", parseError);
                    settings = {};
                }
            }

            settings.ignoreCaseName = value;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
            // Setting is still applied in memory, just not persisted
        }
    };

    const setBiometricEnabled = async (value: boolean) => {
        if (typeof value !== 'boolean') {
            console.error("Invalid value for biometricEnabled:", value);
            return;
        }

        setBiometricEnabledState(value);
        try {
            const currentSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            let settings: any = {};

            if (currentSettings) {
                try {
                    settings = JSON.parse(currentSettings);
                    if (typeof settings !== 'object' || settings === null) {
                        settings = {};
                    }
                } catch (parseError) {
                    console.error("Failed to parse existing settings", parseError);
                    settings = {};
                }
            }

            settings.biometricEnabled = value;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
            // Setting is still applied in memory, just not persisted
        }
    };

    const setLockHistory = async (value: boolean) => {
        if (typeof value !== 'boolean') {
            console.error("Invalid value for lockHistory:", value);
            return;
        }

        setLockHistoryState(value);
        try {
            const currentSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            let settings: any = {};

            if (currentSettings) {
                try {
                    settings = JSON.parse(currentSettings);
                    if (typeof settings !== 'object' || settings === null) {
                        settings = {};
                    }
                } catch (parseError) {
                    console.error("Failed to parse existing settings", parseError);
                    settings = {};
                }
            }

            settings.lockHistory = value;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings", e);
            // Setting is still applied in memory, just not persisted
        }
    };


    const completeOnboarding = async () => {
        setHasOnboardedState(true);
        try {
            const currentSettings = await AsyncStorage.getItem(SETTINGS_KEY);
            let settings: any = {};
            if (currentSettings) {
                try {
                    settings = JSON.parse(currentSettings);
                } catch (e) { settings = {}; }
            }
            settings.hasOnboarded = true;
            await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save onboarding status", e);
        }
    };

    return (
        <SettingsContext.Provider value={{
            ignoreCaseName, setIgnoreCaseName,
            biometricEnabled, setBiometricEnabled,
            lockHistory, setLockHistory,
            hasOnboarded, completeOnboarding,
            isLoadingSettings
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
