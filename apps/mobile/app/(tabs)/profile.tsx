import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors, useThemeMode, typography, SHAPE, SPACING } from "../../lib/theme";
import { useLeads } from "../../lib/leads-provider";

const SERVICE_OPTIONS = [
  "General Plumbing",
  "Burst Pipes",
  "Blocked Drains",
  "Hot Water",
  "Gas Fitting",
  "Roof Plumbing",
  "Bathroom Reno",
  "Kitchen Plumbing",
  "Backflow Prevention",
  "Stormwater",
];

/**
 * Profile screen — tradie business onboarding and settings.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mode, toggleTheme } = useThemeMode();
  const { profile, updateProfile } = useLeads();

  const [businessName, setBusinessName] = useState(profile.businessName);
  const [baseAddress, setBaseAddress] = useState(profile.baseAddress);
  const [calloutFee, setCalloutFee] = useState(String(profile.calloutFee));
  const [hourlyRate, setHourlyRate] = useState(String(profile.hourlyRate));
  const [markupPercent, setMarkupPercent] = useState(String(profile.markupPercent));
  const [serviceRadius, setServiceRadius] = useState(String(profile.serviceRadius));
  const [services, setServices] = useState(profile.services);

  const toggleService = useCallback(
    (service: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setServices((prev) =>
        prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
      );
    },
    []
  );

  const handleSave = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      businessName,
      baseAddress,
      calloutFee: parseFloat(calloutFee) || 0,
      hourlyRate: parseFloat(hourlyRate) || 0,
      markupPercent: parseFloat(markupPercent) || 0,
      serviceRadius: parseFloat(serviceRadius) || 0,
      services,
    });
    Alert.alert("Saved", "Your profile has been updated.");
  }, [businessName, baseAddress, calloutFee, hourlyRate, markupPercent, serviceRadius, services, updateProfile]);

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    opts?: { prefix?: string; suffix?: string; keyboardType?: "default" | "numeric" }
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700", marginBottom: 6 }]}>
        {label}
      </Text>
      <View style={[styles.fieldRow, { backgroundColor: colors.surfaceHover, borderColor: colors.border }]}>
        {opts?.prefix && (
          <Text style={[typography.body, { color: colors.textSecondary, marginRight: 4 }]}>{opts.prefix}</Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={[typography.body, styles.input, { color: colors.text }]}
          placeholderTextColor={colors.textSecondary}
          keyboardType={opts?.keyboardType || "default"}
        />
        {opts?.suffix && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>{opts.suffix}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[typography.h2, { color: colors.text }]}>Profile</Text>
          <Pressable
            onPress={toggleTheme}
            style={[styles.themeBtn, { backgroundColor: colors.surfaceHover }]}
          >
            <Ionicons
              name={mode === "dark" ? "sunny-outline" : "moon-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Business Info */}
        <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700", marginBottom: 12 }]}>
          BUSINESS DETAILS
        </Text>
        {renderField("Business Name", businessName, setBusinessName)}
        {renderField("Base Address", baseAddress, setBaseAddress)}

        {/* Rates */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, fontWeight: "700", marginTop: 24, marginBottom: 12 },
          ]}
        >
          RATES & PRICING
        </Text>
        <View style={styles.rateRow}>
          {renderField("Call-out Fee", calloutFee, setCalloutFee, { prefix: "$", keyboardType: "numeric" })}
          {renderField("Hourly Rate", hourlyRate, setHourlyRate, {
            prefix: "$",
            suffix: "/hr",
            keyboardType: "numeric",
          })}
        </View>
        <View style={styles.rateRow}>
          {renderField("Parts Markup", markupPercent, setMarkupPercent, {
            suffix: "%",
            keyboardType: "numeric",
          })}
          {renderField("Service Radius", serviceRadius, setServiceRadius, {
            suffix: "km",
            keyboardType: "numeric",
          })}
        </View>

        {/* Services */}
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, fontWeight: "700", marginTop: 24, marginBottom: 12 },
          ]}
        >
          SERVICES OFFERED
        </Text>
        <View style={styles.chipGrid}>
          {SERVICE_OPTIONS.map((s) => {
            const isSelected = services.includes(s);
            return (
              <Pressable
                key={s}
                onPress={() => toggleService(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? `${colors.primary}20` : colors.surfaceHover,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={14} color={colors.primary} style={{ marginRight: 4 }} />}
                <Text
                  style={[
                    typography.caption,
                    {
                      color: isSelected ? colors.primary : colors.textSecondary,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {s}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: pressed ? `${colors.primary}cc` : colors.primary,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={[typography.button, { color: "#fff", marginLeft: 8, fontSize: 16 }]}>
            Save Profile
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  fieldGroup: {
    flex: 1,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: SHAPE.borderRadius,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    height: 44,
    padding: 0,
  },
  rateRow: {
    flexDirection: "row",
    gap: 12,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 32,
  },
});
