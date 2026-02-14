import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors, typography, SHAPE } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

interface ChipConfig {
  label: string;
  command: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CHIPS: ChipConfig[] = [
  { label: "Urgent", command: "Make it urgent", icon: "alert-circle-outline" },
  { label: "Tomorrow", command: "Schedule for tomorrow", icon: "calendar-outline" },
  { label: "Call", command: "Add a call task", icon: "call-outline" },
  { label: "1h", command: "Estimate one hour", icon: "time-outline" },
];

/**
 * Quick action chips for common workspace commands.
 * Refined for a professional look with minimal borders and subtle interactions.
 */
export function ActionChips() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();

  const handlePress = (command: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendUtterance(command, "chip");
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {CHIPS.map((chip) => (
        <Pressable
          key={chip.label}
          onPress={() => handlePress(chip.command)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: pressed ? `${colors.primary}10` : colors.surface,
              borderColor: pressed ? colors.primary : colors.border,
            },
          ]}
        >
          <Ionicons 
            name={chip.icon} 
            size={14} 
            color={colors.textSecondary} 
            style={{ marginRight: 4 }}
          />
          <Text style={[typography.caption, { color: colors.text, fontWeight: "700" }]}>
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SHAPE.borderRadius,
    borderWidth: 1,
  },
});
