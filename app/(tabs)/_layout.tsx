import { Tabs } from "expo-router";
import { Colors } from "@/constants/colors";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.gold,
                tabBarInactiveTintColor: Colors.muted,
                tabBarStyle: {
                    backgroundColor: Colors.cream,
                    borderTopColor: Colors.border,
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 64,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                },
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="requests" options={{ title: "Requests" }} />
            <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
    );
}
