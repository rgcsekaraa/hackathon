import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

import { useColors, typography } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Voice capture button with real speech-to-text via react-native-voice.
 * Shows pulse animation while recording, displays live transcript,
 * and sends final text to the workspace backend.
 */
export function VoiceButton() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialResults, setPartialResults] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Set up Voice event handlers
  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
      stopPulse();
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] || "";
      setTranscript(text);
      setPartialResults("");

      // Send the final transcript to the backend
      if (text.trim()) {
        sendUtterance(text.trim(), "voice");
        // Clear transcript after a delay so user can see what was sent
        setTimeout(() => setTranscript(""), 2000);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      setPartialResults(event.value?.[0] || "");
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
      stopPulse();
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [sendUtterance]);

  const startPulse = useCallback(() => {
    pulseLoop.current = Animated.loop(
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
    );
    pulseLoop.current.start();
  }, [pulseAnim]);

  const stopPulse = useCallback(() => {
    pulseLoop.current?.stop();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [pulseAnim]);

  const handlePress = useCallback(async () => {
    if (isListening) {
      // Stop listening
      try {
        await Voice.stop();
      } catch (e) {
        console.error("Failed to stop voice:", e);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      stopPulse();
    } else {
      // Start listening
      setTranscript("");
      setPartialResults("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      startPulse();

      try {
        await Voice.start("en-US");
      } catch (e) {
        console.error("Failed to start voice:", e);
        stopPulse();
      }
    }
  }, [isListening, startPulse, stopPulse]);

  const displayText = partialResults || transcript;

  return (
    <View style={styles.container}>
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
      </Animated.View>
      {isListening && (
        <Text
          style={[typography.caption, styles.label, { color: colors.error }]}
        >
          Tap to stop
        </Text>
      )}
      {displayText ? (
        <Text
          style={[
            typography.bodySmall,
            styles.transcript,
            { color: partialResults ? colors.textSecondary : colors.text },
          ]}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
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
  transcript: {
    textAlign: "center",
    marginTop: 6,
    maxWidth: 200,
  },
});
