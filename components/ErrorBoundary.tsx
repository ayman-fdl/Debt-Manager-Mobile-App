import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View className="flex-1 bg-gray-950 items-center justify-center p-6">
                    <View className="bg-gray-900 rounded-2xl p-6 border border-red-500/20 max-w-md w-full">
                        <View className="items-center mb-6">
                            <View className="w-16 h-16 bg-red-500/10 rounded-full items-center justify-center mb-4">
                                <Ionicons name="alert-circle" size={32} color="#ef4444" />
                            </View>
                            <Text className="text-white text-2xl font-bold mb-2 text-center">
                                Something went wrong
                            </Text>
                            <Text className="text-gray-400 text-center text-sm">
                                The app encountered an unexpected error
                            </Text>
                        </View>

                        {__DEV__ && this.state.error && (
                            <ScrollView className="max-h-48 mb-4 bg-gray-800 rounded-xl p-3">
                                <Text className="text-red-400 text-xs font-mono mb-2">
                                    {this.state.error.toString()}
                                </Text>
                                {this.state.errorInfo && (
                                    <Text className="text-gray-500 text-xs font-mono">
                                        {this.state.errorInfo.componentStack}
                                    </Text>
                                )}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            onPress={this.handleReset}
                            className="bg-blue-600 py-4 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-lg">Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

