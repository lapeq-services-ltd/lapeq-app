import { StyleSheet } from "react-native";

if (!(StyleSheet as any).absoluteFillObject) {
  (StyleSheet as any).absoluteFillObject = StyleSheet.absoluteFill;
}

import "expo-router/entry";
