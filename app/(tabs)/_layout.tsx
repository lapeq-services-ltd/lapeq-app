import { Tabs } from "expo-router";
import { Home, Search, Calendar, User, Gift } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    View,
    StyleSheet,
    Animated,
    Pressable,
} from "react-native";
import { useEffect, useRef } from "react";

const TABS = [
    { name: "index",    Icon: Home     },
    { name: "benefits", Icon: Gift     },
    { name: "explore",  Icon: Search   },
    { name: "events",   Icon: Calendar },
    { name: "profile",  Icon: User     },
];

function TabItem({ tab, focused, onPress, primaryColor, theme }: any) {
    const scale = useRef(new Animated.Value(focused ? 1.2 : 1)).current;
    const dotScale = useRef(new Animated.Value(focused ? 1 : 0)).current;
    const dotOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: focused ? 1.25 : 1,
                tension: 300,
                friction: 15,
                useNativeDriver: true,
            }),
            Animated.spring(dotScale, {
                toValue: focused ? 1 : 0,
                tension: 300,
                friction: 15,
                useNativeDriver: true,
            }),
            Animated.timing(dotOpacity, {
                toValue: focused ? 1 : 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [focused]);

    return (
        <Pressable style={styles.tabCell} onPress={onPress}>
            <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
                <tab.Icon
                    size={24}
                    color={focused ? primaryColor : theme === "dark" ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)"}
                    strokeWidth={focused ? 2.2 : 1.6}
                />
            </Animated.View>
            <Animated.View
                style={[
                    styles.dot,
                    {
                        backgroundColor: primaryColor,
                        transform: [{ scale: dotScale }],
                        opacity: dotOpacity,
                    },
                ]}
            />
        </Pressable>
    );
}

function FloatingTabBar({ state, descriptors, navigation }: any) {
    const { C, theme } = useTheme();
    const insets = useSafeAreaInsets();

    const visibleRoutes = state.routes.filter((r: any) => {
        const opts = descriptors[r.key]?.options;
        return opts?.href !== null && TABS.find(t => t.name === r.name);
    });

    return (
        <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 36) }]}>
            <View style={[
                styles.bar,
                {
                    backgroundColor: theme === "dark" ? "rgba(14,14,14,0.92)" : "rgba(255,255,255,0.92)",
                    borderColor: theme === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
                }
            ]}>
                {visibleRoutes.map((route: any) => {
                    const tab = TABS.find(t => t.name === route.name)!;
                    const focused = state.index === state.routes.indexOf(route);

                    return (
                        <TabItem
                            key={route.key}
                            tab={tab}
                            focused={focused}
                            primaryColor={C.primary}
                            theme={theme}
                            onPress={() => {
                                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        left: 32,
        right: 32,
        alignItems: "center",
        zIndex: 999,
    },
    bar: {
        flexDirection: "row",
        borderRadius: 40,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 12,
        width: "100%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    tabCell: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
    },
    tabInner: {
        alignItems: "center",
        justifyContent: "center",
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
});

export default function TabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <FloatingTabBar {...props} />}
            screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}
        >
            <Tabs.Screen name="index"    options={{ title: "Home",     tabBarIcon: () => null }} />
            <Tabs.Screen name="benefits" options={{ title: "Benefits", tabBarIcon: () => null }} />
            <Tabs.Screen name="explore"  options={{ title: "Explore",  tabBarIcon: () => null }} />
            <Tabs.Screen name="events"   options={{ title: "Events",   tabBarIcon: () => null }} />
            <Tabs.Screen name="map"      options={{ href: null }} />
            <Tabs.Screen name="profile"  options={{ title: "Profile",  tabBarIcon: () => null }} />
            <Tabs.Screen name="settings" options={{ href: null }} />
        </Tabs>
    );
}
