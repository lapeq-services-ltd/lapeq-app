require("dotenv").config({ path: ".env.local" });

module.exports = {
  expo: {
    name: "Lapeq",
    slug: "lapeq-app",
    scheme: "lapeq",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo/logo-bg.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/logo/logo-bg.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lapeq.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
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
      "expo-font",
      "expo-video",
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
