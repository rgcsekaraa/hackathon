import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, GLASS, SHAPE, SPACING } from "../lib/theme";

interface OrbitHubProps {
  onPressMic: () => void;
  onPressHome: () => void;
  onPressTasks: () => void;
}

export function OrbitHub({ onPressMic, onPressHome, onPressTasks }: OrbitHubProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.hub,
          GLASS.dark, // Always use dark glass for the hub for contrast
          {
            backgroundColor: colors.surfaceHover, 
            borderColor: colors.border,
            shadowColor: colors.primary,
          },
        ]}
      >
        <TouchableOpacity onPress={onPressHome} style={styles.button}>
          <Ionicons name="grid-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPressMic}
          style={[styles.micButton, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        >
          <Ionicons name="mic" size={28} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onPressTasks} style={styles.button}>
          <Ionicons name="list" size={26} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: SPACING.xl,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  hub: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 100,
    width: 220,
    height: 70,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    padding: SPACING.sm,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
    borderWidth: 4,
    borderColor: "#020617", // Match Deep Slate background to create "cutout" effect
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
