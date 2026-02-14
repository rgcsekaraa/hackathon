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

import { useColors, SHAPE } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Premium command bar input - Redesigned for a high-end production feel.
 * Minimalist aesthetic with subtle borders and clear micro-interactions.
 */
export function TextInput() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
          borderColor: isFocused ? colors.primary : colors.border,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isFocused ? 0.05 : 0.02,
          shadowRadius: 2,
          elevation: isFocused ? 2 : 0,
        },
      ]}
    >
      <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={{ marginRight: 4 }} />
      <RNTextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Type a command or search..."
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
            backgroundColor: text.trim() ? `${colors.primary}10` : "transparent",
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons 
          name="return-down-back" 
          size={18} 
          color={text.trim() ? colors.primary : colors.textSecondary} 
          style={{ opacity: text.trim() ? 1 : 0.5 }}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: SHAPE.borderRadius,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 2,
    gap: 4,
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: SHAPE.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
});
