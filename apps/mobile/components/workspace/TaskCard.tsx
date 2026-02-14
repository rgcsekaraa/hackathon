import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors, typography, SHAPE } from "../../lib/theme";

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
 * Workspace task card - Redesigned for production-grade high-density dashboard.
 * Horizontal layout inspired by Sophiie.ai Inbox. Matches the web implementation.
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
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: completed ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Content Area */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              style={[
                typography.body,
                {
                  color: colors.text,
                  fontWeight: "700",
                  fontSize: 15,
                  textDecorationLine: completed ? "line-through" : "none",
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {/* Priority Micro-dot */}
            <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
            <View style={{ flex: 1 }} />
            <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "600" }]}>
               {timeSlot ? (TIME_SLOT_LABELS[timeSlot] || timeSlot) : "All day"}
            </Text>
          </View>

          <View style={styles.metaRow}>
            {priority !== "normal" && (
              <Text style={[typography.caption, { color: priorityColor, fontWeight: "700", fontSize: 10 }]}>
                • {priority.toUpperCase()}
              </Text>
            )}
            {date && (
              <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 11 }]}>
                {priority !== "normal" ? " | " : ""}{date}
              </Text>
            )}
          </View>

          <Text
            style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4, lineHeight: 18 }]}
            numberOfLines={2}
          >
            {description || "No additional details provided."}
          </Text>
        </View>

        {/* Action Column */}
        <View style={styles.actionColumn}>
          <Pressable
            onPress={handleToggle}
            hitSlop={8}
            style={[styles.actionBtn, completed && { backgroundColor: `${colors.success}15` }]}
          >
            <Ionicons
              name={completed ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={completed ? colors.success : colors.textSecondary}
            />
          </Pressable>
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={colors.error} style={{ opacity: 0.8 }} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: SHAPE.borderRadius,
    marginBottom: 6,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
    gap: 6,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  actionColumn: {
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    padding: 6,
    borderRadius: SHAPE.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
});
