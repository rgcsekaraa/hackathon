import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, typography, SHAPE, useThemeMode } from "../../lib/theme";
import { StatusIndicator } from "../workspace/StatusIndicator";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Enterprise-grade TopBar for the mobile application.
 * Replaces the basic heading with a structured, professional navigation header.
 */
export function TopBar() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mode, toggleTheme } = useThemeMode();
  const { serverStatus, components } = useWorkspace();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.row}>
        {/* Brand/Logo Section */}
        <View style={styles.brandRow}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <View>
            <Text style={[typography.h3, { color: colors.text, fontWeight: "800", letterSpacing: -0.5 }]}>
              Spatial
            </Text>
            <View style={styles.statusRow}>
              <StatusIndicator status={serverStatus} />
              <View style={[styles.metaDot, { backgroundColor: colors.textSecondary }]} />
              <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700" }]}>
                {components.length} ITEMS
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable 
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.iconBtn, 
              { backgroundColor: pressed ? colors.surfaceHover : "transparent" }
            ]}
          >
            <Ionicons 
              name={mode === "dark" ? "sunny-outline" : "moon-outline"} 
              size={20} 
              color={colors.textSecondary} 
            />
          </Pressable>
          
          <View style={[styles.avatar, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: SHAPE.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -2,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    opacity: 0.3,
    marginHorizontal: 6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: SHAPE.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
