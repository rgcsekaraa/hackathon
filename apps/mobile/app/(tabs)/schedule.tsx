import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors, typography, SHAPE, SPACING } from "../../lib/theme";
import { useLeads, type Lead } from "../../lib/leads-provider";

/* ──────────────────── Helpers ──────────────────── */

function getWeekDates(): { label: string; dateStr: string; isToday: boolean }[] {
  const now = new Date();
  const days = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dayNames[d.getDay()],
      dateStr: d.toISOString().split("T")[0],
      isToday: i === 0,
    });
  }
  return days;
}

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00",
];

/**
 * Schedule screen — weekly calendar showing booked jobs.
 */
export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { leads } = useLeads();

  const weekDates = useMemo(() => getWeekDates(), []);

  const bookedLeads = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.status === "approved" ||
          l.status === "booked" ||
          l.status === "completed"
      ),
    [leads]
  );

  // Map leads to date+slot for grid rendering
  const scheduleMap = useMemo(() => {
    const map: Record<string, Lead> = {};
    for (const lead of bookedLeads) {
      if (lead.scheduledDate && lead.scheduledSlot) {
        const startHour = lead.scheduledSlot.split("-")[0]?.split(":")[0];
        if (startHour) {
          map[`${lead.scheduledDate}-${startHour}`] = lead;
        }
      }
    }
    return map;
  }, [bookedLeads]);

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
        <Text style={[typography.h2, { color: colors.text }]}>Schedule</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
          {bookedLeads.length} job{bookedLeads.length !== 1 ? "s" : ""} booked this week
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Day columns */}
        {weekDates.map((day) => (
          <View key={day.dateStr} style={styles.daySection}>
            <View style={styles.dayHeader}>
              <View
                style={[
                  styles.dayBadge,
                  {
                    backgroundColor: day.isToday ? colors.primary : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    typography.button,
                    {
                      color: day.isToday ? "#fff" : colors.text,
                    },
                  ]}
                >
                  {day.label}
                </Text>
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {new Date(day.dateStr + "T00:00:00").toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>

            {/* Time slots */}
            <View style={styles.timeSlots}>
              {TIME_SLOTS.map((slot) => {
                const hour = slot.split(":")[0];
                const lead = scheduleMap[`${day.dateStr}-${hour}`];

                return (
                  <View
                    key={slot}
                    style={[
                      styles.slotRow,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: colors.textSecondary,
                          width: 48,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {slot}
                    </Text>

                    {lead ? (
                      <View
                        style={[
                          styles.jobBlock,
                          {
                            backgroundColor: `${colors.primary}15`,
                            borderLeftColor: colors.primary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.bodySmall,
                            { color: colors.text, fontWeight: "700" },
                          ]}
                          numberOfLines={1}
                        >
                          {lead.jobType}
                        </Text>
                        <View style={styles.jobMeta}>
                          <Ionicons
                            name="person-outline"
                            size={11}
                            color={colors.textSecondary}
                          />
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: colors.textSecondary,
                                marginLeft: 3,
                              },
                            ]}
                          >
                            {lead.customerName}
                          </Text>
                          <Text
                            style={[
                              typography.caption,
                              {
                                color: colors.textSecondary,
                                marginLeft: 8,
                              },
                            ]}
                          >
                            {lead.suburb}
                          </Text>
                        </View>
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: colors.success,
                              fontWeight: "800",
                              marginTop: 2,
                            },
                          ]}
                        >
                          ${lead.quoteTotal?.toFixed(2)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.emptySlot}>
                        <View
                          style={[
                            styles.emptyLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
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
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  daySection: {
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeSlots: {},
  slotRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    minHeight: 36,
  },
  jobBlock: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  jobMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },
  emptyLine: {
    height: 1,
    opacity: 0.3,
  },
});
