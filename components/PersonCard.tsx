import { View, Text, TouchableOpacity } from "react-native";
import { PersonSummary } from "../types";
import { CURRENCY_SYMBOL } from "../constants/Config";
import Animated, { FadeInDown } from "react-native-reanimated";

interface PersonCardProps {
    person: PersonSummary;
    index: number;
    onPress: () => void;
}

export function PersonCard({ person, index, onPress }: PersonCardProps) {
    const isOwed = person.totalDebt > 0;
    const isDebt = person.totalDebt < 0;
    const isSettled = person.totalDebt === 0;

    return (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity
                onPress={onPress}
                className="bg-gray-800 p-4 rounded-xl mb-3 flex-row justify-between items-center shadow-sm"
            >
                <View className="flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isOwed ? 'bg-emerald-900' : isDebt ? 'bg-rose-900' : 'bg-gray-700'}`}>
                        <Text className={`font-bold text-lg ${isOwed ? 'text-emerald-400' : isDebt ? 'text-rose-400' : 'text-gray-400'}`}>
                            {person.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-white font-bold text-lg">{person.name}</Text>
                        <Text className="text-gray-400 text-xs">{person.transactionCount} active transactions</Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className={`font-bold text-lg ${isOwed ? 'text-emerald-400' : isDebt ? 'text-rose-400' : 'text-gray-400'}`}>
                        {Math.abs(person.totalDebt).toFixed(2)} {CURRENCY_SYMBOL}
                    </Text>
                    <Text className="text-xs text-gray-500 uppercase">
                        {isOwed ? 'Owes You' : isDebt ? 'You Owe' : 'Settled'}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
