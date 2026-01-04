import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBack?: () => void;
    rightAction?: React.ReactNode;
}

export function PageHeader({
    title,
    subtitle,
    showBackButton = true,
    onBack,
    rightAction
}: PageHeaderProps) {
    return (
        <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
                {showBackButton && onBack && (
                    <TouchableOpacity
                        onPress={onBack}
                        className="w-10 h-10 bg-gray-900 rounded-full items-center justify-center border border-gray-800"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                )}
                <View>
                    <Text className="text-white text-3xl font-bold">{title}</Text>
                    {subtitle && <Text className="text-gray-400">{subtitle}</Text>}
                </View>
            </View>
            {rightAction}
        </View>
    );
}
