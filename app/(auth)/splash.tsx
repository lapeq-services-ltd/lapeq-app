import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SplashRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/(auth)/onboarding");
    }, []);

    return <View style={{ flex: 1, backgroundColor: "#0a0a0a" }} />;
}
