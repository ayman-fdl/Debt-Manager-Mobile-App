import React, { createContext, useContext, useState, useCallback } from 'react';

interface SuccessContextType {
    message: string | null;
    showSuccess: (message: string) => void;
    clearSuccess: () => void;
}

const SuccessContext = createContext<SuccessContextType | undefined>(undefined);

export function SuccessProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);

    const showSuccess = useCallback((msg: string) => {
        setMessage(msg);
    }, []);

    const clearSuccess = useCallback(() => {
        setMessage(null);
    }, []);

    return (
        <SuccessContext.Provider value={{ message, showSuccess, clearSuccess }}>
            {children}
        </SuccessContext.Provider>
    );
}

export function useSuccess() {
    const context = useContext(SuccessContext);
    if (!context) {
        throw new Error('useSuccess must be used within a SuccessProvider');
    }
    return context;
}
