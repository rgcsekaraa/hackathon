import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors, useThemeMode, typography, SHAPE, SPACING, GLASS } from "../../lib/theme";
import { useLeads, type Lead } from "../../lib/leads-provider";
import { LeadCard } from "../../components/leads/LeadCard";

/**
 * Leads screen — live stream of incoming lead cards.
 * Tradies see pending quotes, approve or reject them.
 */
export default function LeadsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { mode } = useThemeMode();
  const { leads, stats, connectionStatus, decideLead, refreshLeads } = useLeads();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refreshLeads();
    setTimeout(() => setRefreshing(false), 800);
  }, [refreshLeads]);

  const handleApprove = useCallback(
    (id: string) => decideLead(id, "approve"),
    [decideLead]
  );

  const handleReject = useCallback(
    (id: string) => decideLead(id, "reject"),
    [decideLead]
  );

  const renderItem = useCallback(
    ({ item }: { item: Lead }) => (
      <LeadCard
        lead={item}
        onApprove={handleApprove}
        onReject={handleReject}
        onPress={setSelectedLead}
      />
    ),
    [handleApprove, handleReject]
  );

  const pendingLeads = leads.filter(
    (l) => l.status === "new" || l.status === "quoted"
  );
  const decidedLeads = leads.filter(
    (l) => l.status === "approved" || l.status === "booked" || l.status === "rejected"
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={[typography.h2, { color: colors.text }]}>Leads</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      connectionStatus === "connected"
                        ? colors.success
                        : connectionStatus === "error"
                        ? colors.error
                        : colors.warning,
                  },
                ]}
              />
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {connectionStatus === "connected" ? "Live" : connectionStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: `${colors.warning}10` }]}>
            <Text style={[styles.statNum, { color: colors.warning }]}>{stats.pending}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${colors.success}10` }]}>
            <Text style={[styles.statNum, { color: colors.success }]}>{stats.booked}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Booked</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>
              ${stats.revenue.toFixed(0)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>
      </View>

      {/* Lead List */}
      <FlatList
        data={[...pendingLeads, ...decidedLeads]}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          pendingLeads.length > 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: 8, fontWeight: "700" }]}>
              {pendingLeads.length} PENDING APPROVAL
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="flash-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[typography.h3, { color: colors.text, marginBottom: 4 }]}>No leads yet</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: "center" }]}>
              New leads will appear here in real-time when customers call in.
            </Text>
          </View>
        }
      />

      {/* Lead Detail Modal */}
      <Modal visible={!!selectedLead} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[typography.h2, { color: colors.text }]}>Lead Details</Text>
              <Pressable onPress={() => setSelectedLead(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            {selectedLead && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                  <Text style={[typography.h3, { color: colors.text, marginBottom: 4 }]}>
                    {selectedLead.jobType}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                    {selectedLead.description}
                  </Text>
                </View>

                <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                  <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }]}>
                    CUSTOMER
                  </Text>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    <Text style={[typography.body, { color: colors.text, marginLeft: 8 }]}>
                      {selectedLead.customerName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                    <Text style={[typography.body, { color: colors.text, marginLeft: 8 }]}>
                      {selectedLead.customerPhone}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    <Text style={[typography.body, { color: colors.text, marginLeft: 8 }]}>
                      {selectedLead.address}, {selectedLead.suburb}
                    </Text>
                  </View>
                </View>

                {selectedLead.visionSummary && (
                  <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                    <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }]}>
                      PHOTO ANALYSIS
                    </Text>
                    <View style={[styles.visionDetail, { backgroundColor: `${colors.primary}10` }]}>
                      <Ionicons name="eye" size={16} color={colors.primary} />
                      <Text style={[typography.bodySmall, { color: colors.primary, marginLeft: 8, flex: 1 }]}>
                        {selectedLead.visionSummary}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.detailSection, { borderBottomColor: colors.border }]}>
                  <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: "700", marginBottom: 8 }]}>
                    QUOTE BREAKDOWN
                  </Text>
                  {selectedLead.quoteLines.map((line, i) => (
                    <View key={i} style={styles.quoteRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[typography.bodySmall, { color: colors.text }]}>{line.label}</Text>
                        {line.detail && (
                          <Text style={[typography.caption, { color: colors.textSecondary }]}>
                            {line.detail}
                          </Text>
                        )}
                      </View>
                      <Text style={[typography.body, { color: colors.text, fontWeight: "700" }]}>
                        ${line.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                    <Text style={[typography.h3, { color: colors.success }]}>Total (inc. GST)</Text>
                    <Text style={[typography.h2, { color: colors.success }]}>
                      ${selectedLead.quoteTotal?.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Actions in modal */}
                {(selectedLead.status === "new" || selectedLead.status === "quoted") && (
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => {
                        handleReject(selectedLead.id);
                        setSelectedLead(null);
                      }}
                      style={[styles.modalBtn, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}
                    >
                      <Ionicons name="close" size={20} color={colors.error} />
                      <Text style={[typography.button, { color: colors.error, marginLeft: 8 }]}>Reject</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        handleApprove(selectedLead.id);
                        setSelectedLead(null);
                      }}
                      style={[styles.modalBtn, { backgroundColor: `${colors.success}15`, borderColor: colors.success }]}
                    >
                      <Ionicons name="checkmark" size={20} color={colors.success} />
                      <Text style={[typography.button, { color: colors.success, marginLeft: 8 }]}>Approve</Text>
                    </Pressable>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: SHAPE.borderRadius,
  },
  statNum: {
    fontSize: 20,
    fontWeight: "900",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: SHAPE.borderRadius,
    padding: 40,
    alignItems: "center",
    marginTop: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  visionDetail: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 6,
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 20,
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
});
