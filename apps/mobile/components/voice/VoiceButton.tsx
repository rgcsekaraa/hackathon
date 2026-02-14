import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
} from "@react-native-voice/voice";

import { useColors, typography, SHAPE } from "../../lib/theme";
import { useWorkspace } from "../../lib/workspace-provider";

/**
 * Voice capture button with real speech-to-text via react-native-voice.
 * Redesigned with the "Sharp Pro" industrial aesthetic.
 */
export function VoiceButton() {
  const colors = useColors();
  const { sendUtterance } = useWorkspace();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialResults, setPartialResults] = useState("");

  // Set up Voice event handlers
  useEffect(() => {
    Voice.onSpeechStart = () => {
      setIsListening(true);
    };

    Voice.onSpeechEnd = () => {
      setIsListening(false);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const text = event.value?.[0] || "";
      setTranscript(text);
      setPartialResults("");

      if (text.trim()) {
        sendUtterance(text.trim(), "voice");
        setTimeout(() => setTranscript(""), 2200);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      setPartialResults(event.value?.[0] || "");
    };

    Voice.onSpeechError = (event: SpeechErrorEvent) => {
      console.error("Speech error:", event.error);
      setIsListening(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [sendUtterance]);

  const handlePress = useCallback(async () => {
    if (isListening) {
      try {
        await Voice.stop();
      } catch (e) {
        console.error("Failed to stop voice:", e);
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setTranscript("");
      setPartialResults("");
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      try {
        await Voice.start("en-US");
      } catch (e) {
        console.error("Failed to start voice:", e);
      }
    }
  }, [isListening]);

  const displayText = partialResults || transcript;

  return (
    <View style={styles.container}>
      {displayText ? (
        <View 
          style={[
            styles.transcriptBubble, 
            { 
              backgroundColor: isListening ? `${colors.primary}08` : colors.surface, 
              borderColor: isListening ? colors.primary : colors.border 
            }
          ]}
        >
          <Text
            style={[
              typography.bodySmall,
              { 
                color: partialResults ? colors.textSecondary : colors.text, 
                fontWeight: "600", 
                fontSize: 12,
                textAlign: "center" 
              },
            ]}
            numberOfLines={1}
          >
            {displayText.toUpperCase()}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isListening ? colors.primary : `${colors.primary}10`,
            borderColor: colors.primary,
            borderWidth: isListening ? 0 : 1,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Ionicons
          name={isListening ? "stop" : "mic"}
          size={20}
          color={isListening ? "white" : colors.primary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: SHAPE.borderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SHAPE.borderRadius,
    borderWidth: 1,
    position: "absolute",
    top: -46,
    minWidth: 100,
    maxWidth: 240,
    alignSelf: "center",
  },
});
