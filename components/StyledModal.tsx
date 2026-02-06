import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SuccessToast } from './SuccessToast';
import { ErrorToast } from './ErrorToast';

interface StyledModalProps {
    visible: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    showCloseButton?: boolean;
    headerActions?: React.ReactNode;
}


import { SafeAreaView } from 'react-native-safe-area-context';

export const StyledModal: React.FC<StyledModalProps> = ({
    visible,
    onClose,
    title,
    children,
    showCloseButton = true,
    headerActions
}) => {
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1">
                <Animated.View
                    style={{ opacity: fadeAnim }}
                    className="absolute inset-0 bg-black/80"
                >
                    <Pressable className="flex-1" onPress={onClose} />
                </Animated.View>

                <SafeAreaView className="flex-1 justify-center items-center px-4" pointerEvents="box-none">
                    {/* Toasts - Rendered inside Modal to appear on top */}
                    <SuccessToast />
                    <ErrorToast />

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                            width: '100%',
                            maxWidth: 400,
                        }}
                        className="bg-gray-900 rounded-[28px] border border-gray-800 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <View className="flex-row justify-between items-center px-6 py-5 border-b border-gray-800/50 bg-gray-900/50">
                            <View className="flex-1">
                                {typeof title === 'string' ? (
                                    <Text className="text-white text-xl font-bold tracking-tight">
                                        {title}
                                    </Text>
                                ) : (
                                    title
                                )}
                            </View>
                            {headerActions && (
                                <View className="mr-2">
                                    {headerActions}
                                </View>
                            )}
                            {showCloseButton && (
                                <TouchableOpacity
                                    onPress={onClose}
                                    className="ml-2 w-8 h-8 bg-gray-800/50 rounded-full items-center justify-center border border-gray-700/50 active:bg-gray-700/50 active:scale-95"
                                >
                                    <Ionicons name="close" size={18} color="#9ca3af" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Content */}
                        <View className="px-6 py-6 bg-gray-900">
                            {children}
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};
