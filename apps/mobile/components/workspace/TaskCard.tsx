import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors, typography } from "../../lib/theme";

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "normal" | "low";
  date?: string;
  timeSlot?: string;
  completed: boolean;
  onToggleComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  early_morning: "Early Morning",
  morning: "Morning",
  late_morning: "Late Morning",
  noon: "Noon",
  afternoon: "Afternoon",
  late_afternoon: "Late Afternoon",
  evening: "Evening",
};

/**
 * Native task card with priority indicator, completion toggle,
 * haptic feedback, and swipe-to-delete support.
 */
export function TaskCard({
  id,
  title,
  description,
  priority,
  date,
  timeSlot,
  completed,
  onToggleComplete,
  onDelete,
}: TaskCardProps) {
  const colors = useColors();
  const priorityColor = colors[priority];

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleComplete?.(id);
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.(id);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: completed ? `${colors.success}10` : colors.surface,
          borderLeftColor: priorityColor,
          borderColor: colors.border,
          opacity: completed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Completion toggle */}
        <Pressable onPress={handleToggle} hitSlop={8}>
          <Ionicons
            name={completed ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={completed ? colors.success : colors.textSecondary}
          />
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              typography.body,
              {
                color: completed ? colors.textSecondary : colors.text,
                textDecorationLine: completed ? "line-through" : "none",
                fontWeight: "600",
              },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {description ? (
            <Text
              style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}
              numberOfLines={2}
            >
              {description}
            </Text>
          ) : null}

          {/* Badges */}
          <View style={styles.badges}>
            {priority !== "normal" && (
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: `${priorityColor}18`,
                    borderColor: `${priorityColor}40`,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: priorityColor, fontWeight: "600" }]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
              </View>
            )}
            {timeSlot ? (
              <View style={[styles.badge, { borderColor: colors.border }]}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {TIME_SLOT_LABELS[timeSlot] || timeSlot}
                </Text>
              </View>
            ) : null}
            {date ? (
              <View style={[styles.badge, { borderColor: colors.border }]}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {date}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Delete button */}
        <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 10,
  },
  content: {
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteBtn: {
    opacity: 0.5,
    padding: 2,
  },
});
