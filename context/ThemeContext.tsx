import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, ThemeColors } from "@/constants/theme";

type ThemeType = "light" | "dark";

interface ThemeContextValue {
    theme: ThemeType;
    toggleTheme: () => void;
    C: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggleTheme: () => { },
    C: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemTheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>("light");

    useEffect(() => {
        AsyncStorage.getItem("@theme").then((savedTheme: string | null) => {
            if (savedTheme === "light" || savedTheme === "dark") {
                setTheme(savedTheme);
            } else if (systemTheme === "dark") {
                setTheme("dark");
            }
        });
    }, [systemTheme]);

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        await AsyncStorage.setItem("@theme", newTheme);
    };

    const currentColors = theme === "light" ? lightTheme : darkTheme;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, C: currentColors }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
