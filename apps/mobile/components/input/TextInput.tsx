import { useCallback, useRef, useState } from "react";
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  Pressable,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Text input for typing workspace commands.
 * Submits on press of the send button or Return key.
 */
export function TextInput() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();
  const [text, setText] = useState("");
  const inputRef = useRef<RNTextInput>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendUtterance(trimmed, "text");
    setText("");
    Keyboard.dismiss();
  }, [text, sendUtterance]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <RNTextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder="Type a command..."
        placeholderTextColor={colors.textSecondary}
        returnKeyType="send"
        style={[styles.input, { color: colors.text }]}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim()}
        style={({ pressed }) => [
          styles.sendBtn,
          {
            backgroundColor: text.trim()
              ? colors.primary
              : `${colors.primary}30`,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="send" size={16} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
