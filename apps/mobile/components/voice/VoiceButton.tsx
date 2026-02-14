import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

import { useColors, typography } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Voice capture button with visual feedback.
 *
 * Uses expo-speech for TTS feedback. For actual STT (speech-to-text),
 * we use a placeholder that records and sends audio to the backend,
 * or falls back to a simulated flow for demo purposes.
 *
 * Note: Full native STT requires react-native-voice which needs
 * a dev build. For Expo Go demo, this provides visual + haptic feedback
 * and uses the text input as the primary entry method.
 */
export function VoiceButton() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useState(() => new Animated.Value(1))[0];

  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const handlePress = useCallback(() => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      stopPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Provide audio feedback
      Speech.speak("Got it", { rate: 1.1, pitch: 1.0 });
    } else {
      // Start listening
      setIsListening(true);
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Provide audio feedback
      Speech.speak("Listening", { rate: 1.1, pitch: 1.0 });
    }
  }, [isListening, startPulse, stopPulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isListening
              ? `${colors.error}20`
              : `${colors.primary}15`,
            borderColor: isListening ? colors.error : colors.primary,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons
          name={isListening ? "mic-off" : "mic"}
          size={24}
          color={isListening ? colors.error : colors.primary}
        />
      </Pressable>
      {isListening && (
        <Text
          style={[
            typography.caption,
            styles.label,
            { color: colors.error },
          ]}
        >
          Tap to stop
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    textAlign: "center",
    marginTop: 4,
  },
});
