import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors, typography, SHAPE, SPACING, GLASS } from "../../lib/theme";
import type { Lead, LeadUrgency } from "../../lib/leads-provider";

/* ──────────────────── Urgency Config ──────────────────── */

const URGENCY_CONFIG: Record<
  LeadUrgency,
  { label: string; colorKey: "urgent" | "high" | "normal" | "low"; icon: keyof typeof Ionicons.glyphMap }
> = {
  emergency: { label: "EMERGENCY", colorKey: "urgent", icon: "warning" },
  urgent: { label: "URGENT", colorKey: "high", icon: "alert-circle" },
  standard: { label: "STANDARD", colorKey: "normal", icon: "time" },
  flexible: { label: "FLEXIBLE", colorKey: "low", icon: "calendar-outline" },
};

interface LeadCardProps {
  lead: Lead;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onPress: (lead: Lead) => void;
}

export function LeadCard({ lead, onApprove, onReject, onPress }: LeadCardProps) {
  const colors = useColors();
  const urgency = URGENCY_CONFIG[lead.urgency];
  const urgencyColor = colors[urgency.colorKey];
  const isNew = lead.status === "quoted" || lead.status === "new";
  const isApproved = lead.status === "approved" || lead.status === "booked";
  const isRejected = lead.status === "rejected";

  // Pulsing border for new/urgent leads
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew && (lead.urgency === "emergency" || lead.urgency === "urgent")) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [isNew, lead.urgency, pulseAnim]);

  const borderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, urgencyColor],
  });

  // Time ago
  const minutesAgo = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 60000);
  const timeAgo =
    minutesAgo < 1
      ? "Just now"
      : minutesAgo < 60
      ? `${minutesAgo}m ago`
      : `${Math.floor(minutesAgo / 60)}h ago`;

  const handleApprove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApprove(lead.id);
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReject(lead.id);
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isNew ? borderColor : colors.border,
          opacity: isRejected ? 0.5 : 1,
        },
      ]}
    >
      <Pressable onPress={() => onPress(lead)} style={styles.cardContent}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={[typography.body, { color: colors.text, fontWeight: "700", fontSize: 16 }]}>
              {lead.jobType}
            </Text>
            <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColor}20` }]}>
              <Ionicons name={urgency.icon} size={10} color={urgencyColor} />
              <Text style={[styles.urgencyText, { color: urgencyColor }]}>{urgency.label}</Text>
            </View>
          </View>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>{timeAgo}</Text>
        </View>

        {/* Customer Info */}
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={[typography.bodySmall, { color: colors.text, marginLeft: 6 }]}>
            {lead.customerName}
          </Text>
          <View style={styles.spacer} />
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginLeft: 4 }]}>
            {lead.suburb}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 6 }]}
          numberOfLines={2}
        >
          {lead.description}
        </Text>

        {/* Vision summary if available */}
        {lead.visionSummary && (
          <View style={[styles.visionRow, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="eye-outline" size={12} color={colors.primary} />
            <Text style={[typography.caption, { color: colors.primary, marginLeft: 6, flex: 1 }]}>
              {lead.visionSummary}
            </Text>
          </View>
        )}

        {/* Distance + Quote Row */}
        <View style={styles.metricsRow}>
          {lead.distanceKm != null && (
            <View style={styles.metric}>
              <Ionicons name="navigate-outline" size={14} color={colors.textSecondary} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                {lead.distanceKm} km • ~{lead.travelMinutes} min
              </Text>
            </View>
          )}
          {lead.quoteTotal != null && (
            <View style={[styles.quoteBadge, { backgroundColor: `${colors.success}15` }]}>
              <Text style={[typography.body, { color: colors.success, fontWeight: "800", fontSize: 18 }]}>
                ${lead.quoteTotal.toFixed(2)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 4 }]}>
                inc. GST
              </Text>
            </View>
          )}
        </View>

        {/* Quote Breakdown (compact) */}
        {isNew && lead.quoteLines.length > 0 && (
          <View style={[styles.quoteBreakdown, { borderTopColor: colors.border }]}>
            {lead.quoteLines.map((line, i) => (
              <View key={i} style={styles.quoteLine}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {line.label}
                  {line.detail ? ` (${line.detail})` : ""}
                </Text>
                <Text style={[typography.caption, { color: colors.text, fontWeight: "600" }]}>
                  ${line.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Status badge for non-pending */}
        {isApproved && (
          <View style={[styles.statusBanner, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[typography.bodySmall, { color: colors.success, fontWeight: "700", marginLeft: 6 }]}>
              Approved • {lead.scheduledDate} {lead.scheduledSlot}
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={[styles.statusBanner, { backgroundColor: `${colors.error}15` }]}>
            <Ionicons name="close-circle" size={16} color={colors.error} />
            <Text style={[typography.bodySmall, { color: colors.error, fontWeight: "700", marginLeft: 6 }]}>
              Rejected
            </Text>
          </View>
        )}
      </Pressable>

      {/* Action Buttons - only for pending leads */}
      {isNew && (
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleReject}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.rejectBtn,
              { backgroundColor: pressed ? `${colors.error}20` : "transparent" },
            ]}
          >
            <Ionicons name="close" size={18} color={colors.error} />
            <Text style={[typography.button, { color: colors.error, marginLeft: 6 }]}>Reject</Text>
          </Pressable>

          <Pressable
            onPress={handleApprove}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.approveBtn,
              {
                backgroundColor: pressed ? colors.success : `${colors.success}15`,
              },
            ]}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
            <Text style={[typography.button, { color: colors.success, marginLeft: 6 }]}>Approve</Text>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: SHAPE.borderRadius + 4,
    marginBottom: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 4,
  },
  urgencyText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  spacer: { flex: 1 },
  visionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
  },
  quoteBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quoteBreakdown: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  quoteLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  rejectBtn: {},
  approveBtn: {},
});
