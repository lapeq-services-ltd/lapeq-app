require("dotenv").config({ path: ".env.local" });

module.exports = {
  expo: {
    name: "Lapeq",
    slug: "lapeq-app",
    scheme: "lapeq",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo/logo-bg.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/logo/blank.png",
      resizeMode: "contain",
      backgroundColor: "#f7f4ee",
      dark: {
        image: "./assets/logo/blank.png",
        backgroundColor: "#0a0a0a",
      },
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lapeq.app",
      buildNumber: "23",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription: "Lapeq uses your location to arrange chauffeur pickups and nearby concierge services.",
        NSMicrophoneUsageDescription: "Lapeq uses your microphone so you can send voice requests to your concierge.",
        NSPhotoLibraryUsageDescription: "Lapeq accesses your photos so you can attach images to bug reports and requests.",
        UIApplicationShortcutItems: [
          {
            UIApplicationShortcutItemType: "dont_remove",
            UIApplicationShortcutItemTitle: "Don't remove Lapeq 👋",
            UIApplicationShortcutItemSubtitle: "Give it a second chance",
            UIApplicationShortcutItemIconType: "UIApplicationShortcutIconTypeLove",
          },
          {
            UIApplicationShortcutItemType: "tell_us_whats_wrong",
            UIApplicationShortcutItemTitle: "Tell us what's wrong 💬",
            UIApplicationShortcutItemSubtitle: "Help us improve",
            UIApplicationShortcutItemIconType: "UIApplicationShortcutIconTypeMessage",
          },
        ],
      },
    },
    android: {
      package: "com.lapeq.app",
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "3ed2e03d-5922-4dd8-bb10-0d7f7219d7e8",
      },
    },
    plugins: [
      "expo-router",
      "expo-quick-actions",
      "expo-font",
      "expo-video",
      "expo-location",
      "expo-image-picker",
      "expo-apple-authentication",
      [
        "expo-av",
        {
          microphonePermission: "Lapeq uses your microphone so you can send voice requests to your concierge.",
        },
      ],
      [
        "expo-build-properties",
        {
          ios: {
            useModularHeaders: true,
          },
        },
      ],
    ],
  },
};
