import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors, useThemeMode, typography, SHAPE } from "../../lib/theme";
import { useWorkspace, type WorkspaceComponent } from "../../lib/workspace-provider";
import { TaskCard } from "../../components/workspace/TaskCard";
import { StatusIndicator } from "../../components/workspace/StatusIndicator";
import { VoiceButton } from "../../components/voice/VoiceButton";
import { TextInput } from "../../components/input/TextInput";
import { ActionChips } from "../../components/input/ActionChips";

import { TopBar } from "../../components/layout/TopBar";

/**
 * Main workspace screen -- Redesigned for production-grade high-density dashboard.
 * Primary mobile interface following the Sophiie-inspired design system.
 */
export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mode } = useThemeMode();
  const { components, sendAction } = useWorkspace();

  const handleToggleComplete = useCallback(
    (id: string) => {
      sendAction("toggle_complete", id);
    },
    [sendAction]
  );

  const handleDelete = useCallback(
    (id: string) => {
      sendAction("delete", id);
    },
    [sendAction]
  );

  const renderItem = useCallback(
    ({ item }: { item: WorkspaceComponent }) => (
      <TaskCard
        id={item.id}
        title={item.title}
        description={item.description}
        priority={item.priority}
        date={item.date}
        timeSlot={item.timeSlot}
        completed={item.completed}
        onToggleComplete={handleToggleComplete}
        onDelete={handleDelete}
      />
    ),
    [handleToggleComplete, handleDelete]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}10` }]}>
          <Ionicons name="mail-unread-outline" size={32} color={colors.primary} />
        </View>
        <Text style={[typography.h3, { color: colors.text, textAlign: "center", marginBottom: 8 }]}>
          Your inbox is empty
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, textAlign: "center", fontWeight: "500", paddingHorizontal: 20 },
          ]}
        >
          Speak or type commands to capture ideas and plan your workspace.
        </Text>
      </View>
    ),
    [colors]
  );

  return (
    <View
      style={[styles.root, { backgroundColor: mode === "light" ? "#fbfcfd" : colors.background }]}
    >
      <TopBar />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Task list */}
        <FlatList
          data={components}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Docked Command Bar */}
        <View
          style={[
            styles.inputArea,
            {
              paddingBottom: insets.bottom + 12,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={{ marginBottom: 4 }}>
            <ActionChips />
          </View>
          <View style={styles.inputRow}>
            <VoiceButton />
            <TextInput />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    borderRadius: SHAPE.borderRadius,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
