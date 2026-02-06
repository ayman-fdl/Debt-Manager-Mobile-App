import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useState } from "react";
import { useLanguage } from "../store/LanguageContext";
import { useSettings } from "../store/SettingsContext";
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from "react-native-reanimated";

export function OnboardingModal() {
    const { hasOnboarded, completeOnboarding, isLoadingSettings } = useSettings();
    const { language, setLanguage, t } = useLanguage();
    const [step, setStep] = useState(0); // 0 = Language, 1,2,3 = Tutorial

    // Don't render anything while settings are loading
    if (isLoadingSettings) return null;

    // Don't render if user has already onboarded
    if (hasOnboarded) return null;

    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    ];

    const slides = [
        {
            icon: "wallet-outline",
            title: "onboarding_step1_title",
            desc: "onboarding_step1_desc",
            color: "#3b82f6"
        },
        {
            icon: "lock-closed-outline",
            title: "onboarding_step2_title",
            desc: "onboarding_step2_desc",
            color: "#10b981"
        },
        {
            icon: "time-outline",
            title: "onboarding_step3_title",
            desc: "onboarding_step3_desc",
            color: "#8b5cf6"
        }
    ];

    const handleLanguageSelect = (lang: 'en' | 'fr' | 'ar') => {
        setLanguage(lang);
        setStep(1);
    };

    const handleNext = () => {
        if (step < slides.length) {
            setStep(step + 1);
        } else {
            completeOnboarding();
        }
    };

    const renderLanguageSelection = () => (
        <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="flex-1 items-center justify-center px-6"
        >
            <View className="mb-12 items-center">
                <View className="w-20 h-20 bg-blue-500/20 rounded-full items-center justify-center mb-6">
                    <Ionicons name="globe-outline" size={40} color="#3b82f6" />
                </View>
                <Text className="text-white text-3xl font-bold mb-2 text-center">{t('select_language_title')}</Text>
                <Text className="text-gray-400 text-base text-center">{t('select_language_subtitle')}</Text>
            </View>

            <View className="w-full gap-4">
                {languages.map((lang) => (
                    <TouchableOpacity
                        key={lang.code}
                        onPress={() => handleLanguageSelect(lang.code as any)}
                        className={`flex-row items-center p-5 rounded-2xl border-2 ${language === lang.code ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-800/60 border-gray-700/50'
                            }`}
                    >
                        <Text className="text-4xl mr-4">{lang.flag}</Text>
                        <View className="flex-1">
                            <Text className={`text-xl font-bold ${language === lang.code ? 'text-white' : 'text-gray-300'
                                }`}>{lang.name}</Text>
                        </View>
                        {language === lang.code && (
                            <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );

    const renderSlide = (index: number) => {
        const slide = slides[index - 1]; // Step 1 = Slide 0
        if (!slide) return null;

        return (
            <Animated.View
                entering={SlideInRight}
                exiting={SlideOutLeft}
                className="flex-1 items-center justify-center px-8"
            >
                <View className={`w-32 h-32 rounded-full items-center justify-center mb-8 bg-gray-800 border-4 border-gray-700`}
                    style={{ shadowColor: slide.color, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 }}>
                    <Ionicons name={slide.icon as any} size={64} color={slide.color} />
                </View>

                <Text className="text-white text-3xl font-extrabold text-center mb-4 leading-tight">
                    {t(slide.title as any)}
                </Text>

                <Text className="text-gray-400 text-lg text-center leading-relaxed">
                    {t(slide.desc as any)}
                </Text>

                {/* Dots Indicator */}
                <View className="flex-row gap-2 mt-12 mb-8">
                    {slides.map((_, i) => (
                        <View
                            key={i}
                            className={`h-2 rounded-full transition-all ${i === index - 1 ? 'w-8' : 'w-2'
                                }`}
                            style={{ backgroundColor: i === index - 1 ? slide.color : '#374151' }}
                        />
                    ))}
                </View>
            </Animated.View>
        );
    };

    return (
        <Modal visible={true} animationType="fade" transparent>
            <View className="flex-1 bg-gray-950">
                {/* Safe Area Spacer for top */}
                <View className="h-[10%]" />

                {step === 0 ? renderLanguageSelection() : renderSlide(step)}

                <View className="px-6 pb-12 w-full">
                    {step > 0 && (
                        <TouchableOpacity
                            onPress={handleNext}
                            className={`w-full py-5 rounded-2xl items-center shadow-lg active:scale-[0.98]`}
                            style={{ backgroundColor: slides[step - 1]?.color || '#3b82f6' }}
                        >
                            <Text className="text-white font-bold text-xl uppercase tracking-wider">
                                {step === slides.length ? t('get_started') : t('next')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {step > 0 && step < slides.length && (
                        <TouchableOpacity
                            onPress={() => completeOnboarding()}
                            className="mt-4 py-2 items-center"
                        >
                            <Text className="text-gray-500 font-medium">{t('skip')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}
