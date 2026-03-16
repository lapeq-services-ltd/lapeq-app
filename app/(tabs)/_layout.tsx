import { Tabs } from "expo-router";
import { Home, Search, Calendar, Map, User, Bell } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";

export default function TabsLayout() {
    const { C } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: C.card,
                    borderTopColor: C.border,
                    borderTopWidth: 1,
                    height: 90,
                    paddingBottom: 25,
                    paddingTop: 10,
                },
                tabBarActiveTintColor: C.primary,
                tabBarInactiveTintColor: C.muted,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600",
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, focused }) => (
                        <Home size={28} color={color} fill={focused ? color : "none"} />
                    ),
                }}
            />
            <Tabs.Screen
                name="explore"
                options={{
                    title: "Explore",
                    tabBarIcon: ({ color }) => <Search size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="events"
                options={{
                    title: "Events",
                    tabBarIcon: ({ color }) => <Calendar size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: "Map",
                    tabBarIcon: ({ color }) => <Map size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, focused }) => (
                        <User size={28} color={color} fill={focused ? color : "none"} />
                    ),
                }}
            />
            <Tabs.Screen name="settings" options={{ href: null }} />
            <Tabs.Screen name="requests" options={{ href: null }} />
        </Tabs>
    );
}
