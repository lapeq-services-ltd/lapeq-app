import { Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function PackageLayout() {
    const { C } = useTheme();
    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.background }, animation: "none" }} />;
}
