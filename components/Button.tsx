import { Text, TouchableOpacity, TouchableOpacityProps } from "react-native";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ title, variant = 'primary', className, ...props }: ButtonProps) {
    const baseStyles = "p-4 rounded-xl items-center justify-center active:opacity-80";
    const variants = {
        primary: "bg-blue-600",
        secondary: "bg-gray-700",
        danger: "bg-red-500",
    };

    return (
        <TouchableOpacity
            className={twMerge(baseStyles, variants[variant], className)}
            {...props}
        >
            <Text className="text-white font-bold text-lg">{title}</Text>
        </TouchableOpacity>
    );
}
