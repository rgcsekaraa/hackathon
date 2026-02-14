import React, { useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, SPACING, typography, GLASS } from "../lib/theme";
import { LinearGradient } from "expo-linear-gradient";

interface VoiceHUDProps {
  visible: boolean;
  onClose: () => void;
  status?: "listening" | "processing" | "speaking";
}

export function VoiceHUD({ visible, onClose, status = "listening" }: VoiceHUDProps) {
  const colors = useColors();
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [visible, pulseAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Glassmorphism Background */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(2, 6, 23, 0.85)" }]} />
        
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.orbContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.orb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={[styles.orbGlow, { backgroundColor: colors.primary }]} />
          </Animated.View>

          <Text style={[typography.h2, { color: colors.text, marginTop: SPACING.xl, textAlign: "center" }]}>
            {status === "listening" ? "Listening..." : "Processing..."}
          </Text>
          
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: SPACING.sm, textAlign: "center" }]}>
            Speak clearly to add a task or note.
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              GLASS.dark,
              { backgroundColor: colors.surfaceHover, borderColor: colors.border }
            ]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: SPACING.xl,
  },
  orbContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    zIndex: 2,
  },
  orbGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    zIndex: 1,
  },
  closeButton: {
    marginTop: 60,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
