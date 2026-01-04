export type DebtType = 'OWE' | 'OWED'; // 'OWE' = I took (I owe), 'OWED' = I gave (Owed to me)

export interface Transaction {
    id: string;
    name: string; // The person
    amount: number;
    description: string;
    date: string; // ISO string
    type: DebtType;
    isSettled: boolean;
    initialAmount?: number; // The original amount before partial payments
    parentId?: string; // ID of the parent transaction if this is a partial payment
    settledDate?: string; // ISO string for when the transaction was settled
    createdAt: number;
}

export interface PersonSummary {
    name: string;
    totalDebt: number; // Positive = They owe me, Negative = I owe them
    transactionCount: number;
}

export interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'isSettled'> & { isSettled?: boolean }) => void;
    updateTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    settleTransaction: (id: string) => void;
    unsettleTransaction: (id: string) => void;
    totalOwed: number; // Money people owe me
    totalOwe: number; // Money I owe people
    getGroupedTransactions: () => PersonSummary[];
}
