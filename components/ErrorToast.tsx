import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useError } from '../store/ErrorContext';

export function ErrorToast() {
    const { error, errorMessage, clearError } = useError();
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const dismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            clearError();
        });
    }, [slideAnim, opacityAnim, clearError]);

    useEffect(() => {
        if (error) {
            // Slide in
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after 5 seconds
            const timer = setTimeout(() => {
                dismiss();
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            dismiss();
        }
    }, [error, slideAnim, opacityAnim, dismiss]);

    if (!error) return null;

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
            }}
            className="absolute top-12 left-4 right-4 z-50"
        >
            <View className="bg-red-600 rounded-2xl p-4 flex-row items-center shadow-2xl border border-red-500/20">
                <View className="w-10 h-10 bg-red-500/20 rounded-full items-center justify-center mr-3">
                    <Ionicons name="alert-circle" size={20} color="white" />
                </View>
                <View className="flex-1 mr-3">
                    <Text className="text-white font-bold text-sm mb-1">Error</Text>
                    <Text className="text-white/90 text-xs leading-tight">{errorMessage}</Text>
                </View>
                <TouchableOpacity
                    onPress={dismiss}
                    className="p-1"
                >
                    <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

