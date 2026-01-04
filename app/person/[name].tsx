import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTransactions } from "../../store/TransactionContext";
import { TransactionCard } from "../../components/TransactionCard";
import { CURRENCY_SYMBOL } from "../../constants/Config";
import { PageHeader } from "../../components/PageHeader";
import { formatAmount } from "../../utils/numbers";
import { useLanguage } from "../../store/LanguageContext";

export default function PersonDetail() {
    const { name } = useLocalSearchParams();
    const router = useRouter();
    const { transactions } = useTransactions();
    const { t } = useLanguage();

    const personName = Array.isArray(name) ? name[0] : name;

    const personTransactions = transactions.filter(t => t.name === personName);

    // Calculate Net Balance
    const netBalance = personTransactions.reduce((acc, t) => {
        if (t.isSettled) return acc;
        return acc + (t.type === 'OWED' ? t.amount : -t.amount);
    }, 0);

    const isOwed = netBalance > 0;
    const isDebt = netBalance < 0;

    return (
        <View className="flex-1 bg-gray-950 px-4 pt-12">
            <PageHeader
                title={personName}
                subtitle={t('person_subtitle')}
                onBack={() => router.back()}
            />

            <View className="bg-gray-900 p-6 rounded-xl border border-gray-800 mb-6 items-center">
                <Text className="text-gray-400 text-sm font-medium mb-1">Net Balance</Text>
                <Text className={`text-4xl font-bold ${isOwed ? 'text-emerald-400' : isDebt ? 'text-rose-400' : 'text-gray-400'}`}>
                    {formatAmount(Math.abs(netBalance))} {CURRENCY_SYMBOL}
                </Text>
                <Text className="text-gray-500 text-sm mt-2 uppercase">
                    {isOwed ? 'They Owe You' : isDebt ? 'You Owe Them' : 'All Settled'}
                </Text>
            </View>

            <Text className="text-gray-400 mb-4 font-bold">{t('transactions_header')}</Text>

            <FlatList
                data={personTransactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => <TransactionCard transaction={item} index={index} />}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        </View>
    );
}
