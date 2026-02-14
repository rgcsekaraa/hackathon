import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  FadeInDown, 
  FadeInRight,
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence
} from "react-native-reanimated";
import { useLeads } from "../../lib/leads-provider";
import { useVoice } from "../../context/VoiceProvider";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { leads, refreshLeads } = useLeads();
  const { connect, isConnected, agentState } = useVoice();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    refreshLeads();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refreshLeads]);

  // Data Filtering
  const todaysTasks = leads.filter(l => l.status === "booked" || l.status === "approved").slice(0, 2);
  const enquiries = leads.filter(l => ["new", "classifying", "quoted"].includes(l.status));
  const invoices = [
    { id: "inv-101", client: "Sarah Mitchell", amount: 362.78, status: "paid" },
    { id: "inv-102", client: "James Cooper", amount: 224.39, status: "pending" },
  ];

  // Pulse animation for voice button
  const pulseScale = useSharedValue(1);
  useEffect(() => {
    if (isConnected) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isConnected]);

  const animatedVoiceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.username}>Demo Tradie.</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#f8fafc" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/(tabs)/profile")}>
            <Image 
              source={{ uri: "https://i.pravatar.cc/150?u=tradie" }} 
              style={styles.avatar} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* BIG VOICE BUTTON HEADER */}
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <TouchableOpacity 
            onPress={isConnected ? undefined : connect}
            activeOpacity={0.9}
            style={styles.voiceCardContainer}
          >
            <LinearGradient
              colors={isConnected ? ["#059669", "#10b981"] : ["#1d4ed8", "#3b82f6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.voiceCardGradient}
            >
              <View style={styles.voiceContent}>
                 <Animated.View style={[styles.voiceIconCircle, animatedVoiceStyle]}>
                    <Ionicons name={isConnected ? "mic" : "mic-outline"} size={32} color={isConnected ? "#064e3b" : "#1e40af"} />
                 </Animated.View>
                 <View style={{ flex: 1 }}>
                   <Text style={styles.voiceTitle}>
                     {isConnected ? (agentState === "speaking" ? "Speaking..." : "Listening...") : "Talk with AI"}
                   </Text>
                   <Text style={styles.voiceSubtitle}>
                     {isConnected ? "Tap the floating button to stop" : "Tap to start voice assistant"}
                   </Text>
                 </View>
                 <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* TODAY'S TASKS */}
        <View style={styles.section}>
          <TouchableOpacity onPress={() => router.push("/(tabs)/schedule")}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </View>
          </TouchableOpacity>
          {todaysTasks.length > 0 ? (
            todaysTasks.map((task, index) => (
              <Animated.View 
                key={task.id} 
                entering={FadeInRight.delay(200 + index * 100).duration(500)}
              >
                <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/schedule")}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>{task.jobType}</Text>
                    <View style={styles.statusBadge}>
                       <Text style={styles.statusText}>{task.scheduledSlot || "09:00 AM"}</Text>
                    </View>
                  </View>
                  <View style={styles.cardDivider} />
                  <View style={styles.cardRow}>
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                       <Ionicons name="location-outline" size={14} color="#94a3b8" />
                       <Text style={styles.cardSubtitle}>{task.address}, {task.suburb}</Text>
                    </View>
                  </View>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4}}>
                     <Ionicons name="person-outline" size={14} color="#94a3b8" />
                     <Text style={styles.cardFooter}>{task.customerName}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks scheduled for today.</Text>
          )}
        </View>

        {/* ENQUIRIES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Enquiries</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{enquiries.length}</Text>
            </View>
          </View>
          
          {enquiries.length > 0 ? (
            enquiries.map((lead, index) => (
              <Animated.View 
                key={lead.id} 
                entering={FadeInRight.delay(400 + index * 100).duration(500)}
              >
                <TouchableOpacity style={styles.card} onPress={() => router.push("/(tabs)/leads")}>
                   <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>{lead.jobType || "New Enquiry"}</Text>
                    <StatusPill status={lead.status} />
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>{lead.description}</Text>
                  <View style={styles.cardMetaRow}>
                     <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={12} color="#64748b" />
                        <Text style={styles.cardMeta}>{lead.suburb}</Text>
                     </View>
                     <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={12} color="#64748b" />
                        <Text style={styles.cardMeta}>{lead.customerName}</Text>
                     </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
             <Text style={styles.emptyText}>No new enquiries.</Text>
          )}
        </View>

        {/* INVOICES */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Invoices</Text>
           {invoices.map((inv, index) => (
             <Animated.View 
               key={inv.id} 
               entering={FadeInRight.delay(600 + index * 100).duration(500)}
               style={styles.miniCard}
             >
                <View style={styles.cardRow}>
                   <Text style={styles.miniCardTitle}>{inv.client}</Text>
                   <Text style={styles.miniCardAmount}>${inv.amount.toFixed(2)}</Text>
                </View>
                <View style={[styles.cardRow, { marginTop: 4 }]}>
                  <Text style={styles.miniCardId}>#{inv.id}</Text>
                  <Text style={[
                    styles.miniCardStatus, 
                    inv.status === "paid" ? { color: "#4ade80" } : { color: "#facc15" }
                  ]}>• {inv.status.toUpperCase()}</Text>
                </View>
             </Animated.View>
           ))}
        </View>

        <View style={{ height: 100 }} /> 
      </ScrollView>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  let color = "#94a3b8"; // slate-400
  let bg = "rgba(148, 163, 184, 0.1)";

  if (status === "new") { color = "#60a5fa"; bg = "rgba(59, 130, 246, 0.15)"; } // blue-400
  if (status === "quoted") { color = "#c084fc"; bg = "rgba(168, 85, 247, 0.15)"; } // purple-400
  if (status === "classifying") { color = "#facc15"; bg = "rgba(234, 179, 8, 0.15)"; } // yellow-400

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617", // Slate-950
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 14,
    color: "#94a3b8", // Slate-400
    fontWeight: "500",
    marginBottom: 2,
  },
  username: {
    fontSize: 24,
    color: "#f8fafc", // Slate-50
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    borderWidth: 1.5,
    borderColor: "#020617",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#334155",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  // Voice Card
  voiceCardContainer: {
    marginBottom: 32,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: 24,
  },
  voiceCardGradient: {
    borderRadius: 24,
    padding: 24,
    paddingVertical: 28,
  },
  voiceContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  voiceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  voiceSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  // Sections
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f8fafc",
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
    marginLeft: 4,
  },
  // Cards
  card: {
    backgroundColor: "#0f172a", // Slate-900
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f1f5f9",
  },
  cardDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 12,
    lineHeight: 20,
    marginTop: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#1e293b",
    marginVertical: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
  },
  cardFooter: {
    fontSize: 13,
    color: "#94a3b8",
  },
  cardMetaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  statusBadge: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    paddingHorizontal: 8, 
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  statusText: {
    color: "#38bdf8",
    fontSize: 12,
    fontWeight: "600",
  },
  // Mini Cards (Invoices)
  miniCard: {
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  miniCardTitle: {
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: 15,
  },
  miniCardAmount: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  miniCardId: {
    color: "#64748b",
    fontSize: 12,
  },
  miniCardStatus: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Pill
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
