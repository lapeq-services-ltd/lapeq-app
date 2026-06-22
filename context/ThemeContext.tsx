import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";
import { lightTheme, darkTheme, ThemeColors } from "@/constants/theme";

type ThemeMode = "light" | "dark" | "auto";
type ThemeType = "light" | "dark";

interface ThemeContextValue {
    theme: ThemeType;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    C: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "dark",
    themeMode: "auto",
    setThemeMode: () => {},
    toggleTheme: () => {},
    C: darkTheme,
});

function getSystemTheme(): ThemeType {
    return Appearance.getColorScheme() === "light" ? "light" : "dark";
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [themeMode, setThemeModeState] = useState<ThemeMode>("auto");
    const [systemTheme, setSystemTheme] = useState<ThemeType>(getSystemTheme());

    // Listen for OS appearance changes
    useEffect(() => {
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemTheme(colorScheme === "light" ? "light" : "dark");
        });
        return () => sub.remove();
    }, []);

    // Load saved preference
    useEffect(() => {
        AsyncStorage.getItem("@theme").then((saved: string | null) => {
            if (saved === "light" || saved === "dark" || saved === "auto") {
                setThemeModeState(saved);
            }
        });
    }, []);

    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        await AsyncStorage.setItem("@theme", mode);
    };

    const theme: ThemeType = themeMode === "auto" ? systemTheme : themeMode;

    const toggleTheme = () => {
        setThemeMode(theme === "dark" ? "light" : "dark");
    };

    return (
        <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme, C: theme === "light" ? lightTheme : darkTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
