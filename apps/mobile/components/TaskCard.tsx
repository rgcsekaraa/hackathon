import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, SPACING, typography, GLASS, SHAPE } from "../lib/theme";

interface TaskCardProps {
  title: string;
  description?: string;
  priority?: "urgent" | "high" | "normal" | "low";
  completed?: boolean;
  onPress: () => void;
  onToggleComplete?: () => void;
}

export function TaskCard({ 
  title, 
  description, 
  priority = "normal", 
  completed, 
  onPress,
  onToggleComplete
}: TaskCardProps) {
  const colors = useColors();

  const getPriorityColor = () => {
    switch (priority) {
      case "urgent": return colors.urgent;
      case "high": return colors.high;
      case "low": return colors.low;
      default: return colors.normal;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderLeftColor: getPriorityColor(),
        }
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onToggleComplete} style={styles.checkboxContainer}>
          <View style={[
            styles.checkbox, 
            { borderColor: completed ? colors.success : colors.textSecondary },
            completed && { backgroundColor: colors.success, borderColor: colors.success }
          ]}>
            {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text 
            style={[
              typography.h3, 
              { color: completed ? colors.textSecondary : colors.text },
              completed && { textDecorationLine: "line-through" }
            ]} 
            numberOfLines={1}
          >
            {title}
          </Text>
          {description && (
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>

        <View style={styles.action}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: SHAPE.borderRadius * 2,
    borderWidth: 1,
    borderLeftWidth: 4, 
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkboxContainer: {
    paddingRight: SPACING.sm,
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  action: {
    justifyContent: "center",
    paddingTop: 2,
  },
});
