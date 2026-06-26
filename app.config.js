require("dotenv").config({ path: ".env.local" });

module.exports = {
  expo: {
    name: "lapeq-app",
    slug: "lapeq-app",
    scheme: "lapeq",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#f7f4ee",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lapeq.app",
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
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_TOKEN,
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          // Derived from iOS OAuth Client ID: strip ".apps.googleusercontent.com" suffix
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
            ? `com.googleusercontent.apps.${process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.replace(".apps.googleusercontent.com", "")}`
            : "com.googleusercontent.apps.placeholder",
        },
      ],
    ],
  },
};
