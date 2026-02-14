import { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors, useThemeMode, typography } from "../../lib/theme";
import { useWorkspace, type WorkspaceComponent } from "../../lib/workspace-provider";
import { TaskCard } from "../../components/workspace/TaskCard";
import { StatusIndicator } from "../../components/workspace/StatusIndicator";
import { VoiceButton } from "../../components/voice/VoiceButton";
import { TextInput } from "../../components/input/TextInput";
import { ActionChips } from "../../components/input/ActionChips";

/**
 * Main workspace screen -- the primary mobile interface.
 * Shows task list, voice capture, text input, and action chips.
 */
export default function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mode } = useThemeMode();
  const { components, serverStatus, sendAction } = useWorkspace();

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
      <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
        <Text style={[typography.body, { color: colors.textSecondary, textAlign: "center" }]}>
          No tasks yet
        </Text>
        <Text
          style={[
            typography.bodySmall,
            { color: colors.textSecondary, textAlign: "center", marginTop: 4 },
          ]}
        >
          Type a command below to start planning
        </Text>
      </View>
    ),
    [colors]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text
            style={[
              typography.h2,
              { color: colors.primary },
            ]}
          >
            Spatial Voice
          </Text>
          <StatusIndicator status={serverStatus} />
        </View>
      </View>

      {/* Task list */}
      <FlatList
        data={components}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          components.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Input area */}
      <View
        style={[
          styles.inputArea,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <ActionChips />
        <View style={styles.inputRow}>
          <VoiceButton />
          <View style={styles.textInputWrap}>
            <TextInput />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listContent: {
    padding: 16,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
  },
  inputArea: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  textInputWrap: {
    flex: 1,
  },
});
