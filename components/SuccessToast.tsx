import { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSuccess } from '../store/SuccessContext';

export function SuccessToast() {
    const { message, clearSuccess } = useSuccess();
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
            clearSuccess();
        });
    }, [slideAnim, opacityAnim, clearSuccess]);

    useEffect(() => {
        if (message) {
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

            // Auto dismiss after 3 seconds (shorter than error)
            const timer = setTimeout(() => {
                dismiss();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            // Ensure visual state is reset if message is cleared externally
            if (opacityAnim['_value'] > 0) {
                dismiss();
            }
        }
    }, [message, slideAnim, opacityAnim, dismiss]);

    if (!message) return null;

    return (
        <Animated.View
            style={{
                transform: [{ translateY: slideAnim }],
                opacity: opacityAnim,
            }}
            className="absolute top-12 left-4 right-4 z-50"
        >
            <View className="bg-emerald-600 rounded-2xl p-4 flex-row items-center shadow-2xl border border-emerald-500/20">
                <View className="w-10 h-10 bg-emerald-500/20 rounded-full items-center justify-center mr-3">
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                </View>
                <View className="flex-1 mr-3">
                    <Text className="text-white font-bold text-sm mb-1">Success</Text>
                    <Text className="text-white/90 text-xs leading-tight">{message}</Text>
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
