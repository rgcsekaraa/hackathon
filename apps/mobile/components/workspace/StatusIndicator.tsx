import { View, Text, StyleSheet } from "react-native";
import { useColors, typography } from "../../lib/theme";

interface StatusIndicatorProps {
  status: "listening" | "thinking" | "updating" | "synced" | "error";
}

const STATUS_CONFIG = {
  listening: { label: "Listening", colorKey: "primary" as const },
  thinking: { label: "Thinking", colorKey: "warning" as const },
  updating: { label: "Updating", colorKey: "secondary" as const },
  synced: { label: "Synced", colorKey: "success" as const },
  error: { label: "Error", colorKey: "error" as const },
} as const;

/**
 * Status indicator showing the current workspace connection state.
 */
export function StatusIndicator({ status }: StatusIndicatorProps) {
  const colors = useColors();
  const config = STATUS_CONFIG[status];
  const color = colors[config.colorKey];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[typography.caption, { color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
