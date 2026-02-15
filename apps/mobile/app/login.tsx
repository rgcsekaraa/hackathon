import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  FadeInDown,
  FadeInUp
} from "react-native-reanimated";
import { useAuth } from "../context/AuthProvider";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { Alert } from "react-native";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuth();
  
  const googleWebClientId =
    (Constants.expoConfig?.extra?.googleWebClientId as string | undefined) ?? "";
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: googleWebClientId,
    // androidClientId: "...",
    // iosClientId: "...",
  });

  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        signInWithGoogle(id_token)
          .catch((err) => setError(err.message || "Google Login Failed"))
          .finally(() => setLoading(false));
      }
    }
  }, [response]);
  
  const handleForgotPassword = () => {
      Alert.alert(
          "Reset Password",
          "Please check your email for instructions to reset your password. (Mock Only)",
          [{ text: "OK" }]
      );
      // Ideally call API here
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Dynamic Background Gradient */}
      <LinearGradient
        colors={["#0f172a", "#1e1b4b", "#020617"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Optional: Add some ambient glowing orbs if desired, using Views with simple styles */}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View 
          entering={FadeInDown.delay(200).duration(1000).springify()}
          style={[styles.contentContainer, { paddingTop: insets.top + 20 }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="rocket-outline" size={32} color="#60a5fa" />
            </View>
            <Text style={styles.title}>Orbit.</Text>
            <Text style={styles.subtitle}>Welcome back, Tradie.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <Animated.View entering={FadeInUp} style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#f87171" />
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
              style={styles.buttonContainer}
            >
              <LinearGradient
                colors={["#3b82f6", "#2563eb"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>


            {/* Google Sign In Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (!googleWebClientId) {
                  Alert.alert("Google Sign-In not configured", "Set extra.googleWebClientId in app config.");
                  return;
                }
                promptAsync();
              }}
              disabled={!request || loading || !googleWebClientId}
              style={[styles.buttonContainer, { marginTop: 8 }]}
            >
              <View style={[styles.button, { backgroundColor: "white" }]}>
                 {/* Simple Google Icon (Text for now or Ionicons) */}
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Ionicons name="logo-google" size={20} color="black" />
                    <Text style={[styles.buttonText, { color: "black" }]}>Sign in with Google</Text>
                 </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton} onPress={handleForgotPassword}>
               <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  title: {
    fontSize: 42,
    fontWeight: "800",
    color: "#f8fafc",
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    letterSpacing: 0.5,
  },
  form: {
    gap: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)", // red-500/10
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#f87171",
    fontSize: 14,
    fontWeight: "500",
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    marginLeft: 4,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.6)", // Slate-800/60
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    height: 56,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#f8fafc",
    fontSize: 16,
    paddingRight: 16,
  },
  buttonContainer: {
    marginTop: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  forgotButton: {
    alignItems: "center",
    padding: 8,
  },
  forgotText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
});
