"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import SettingsPhoneOutlined from "@mui/icons-material/SettingsPhoneOutlined";
import MonitorHeartOutlined from "@mui/icons-material/MonitorHeartOutlined";
import DarkModeOutlined from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlined from "@mui/icons-material/LightModeOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PeopleOutlined from "@mui/icons-material/PeopleOutlined";
import LeaderboardOutlined from "@mui/icons-material/LeaderboardOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import PortalOutlined from "@mui/icons-material/LanguageOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";

import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/lib/theme-context";
import NotificationCenter from "@/components/NotificationCenter";
import UserOnboardingStepper from "@/components/UserOnboardingStepper";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AdminTab = "overview" | "customers" | "inbound" | "monitoring";

interface AdminStats {
  total_customers: number;
  total_leads: number;
  booking_rate: number;
  active_portals: number;
}

interface Profile {
  id: string;
  user_id: string;
  business_name: string;
  service_types: string[];
  base_callout_fee: number;
  hourly_rate: number;
  markup_pct: number;
  min_labour_hours: number;
  base_address: string;
  service_radius_km: number;
  travel_rate_per_km: number;
  timezone: string;
  working_hours: Record<string, string[]>;
  inbound_config: Record<string, unknown>;
  is_active: boolean;
}

interface VoiceStatus {
  deepgram?: { configured?: boolean };
  elevenlabs?: { configured?: boolean; voice_id?: string };
  twilio?: { configured?: boolean };
  websocket?: { connected_tradies?: string[]; active_connections?: number };
}

type AgentStage = "idle" | "receptionist" | "estimating" | "tradie_copilot" | "completed";

interface SetupDraft {
  provider: string;
  identifier: string;
  instructions: string;
}

const TAB_CONFIG: { value: AdminTab; label: string; icon: React.ReactElement }[] = [
  { value: "overview", label: "Overview", icon: <DashboardOutlined /> },
  { value: "customers", label: "Customers", icon: <GroupOutlined /> },
  { value: "inbound", label: "Inbound Setup", icon: <SettingsPhoneOutlined /> },
  { value: "monitoring", label: "Monitoring", icon: <MonitorHeartOutlined /> },
];

function OrbitLoader({ className }: { className?: string }) {
  return (
    <Box
      className={className}
      sx={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <CircularProgress size={22} />
    </Box>
  );
}

/* -- Stat card with icon + accent -- */
function StatCard({
  label,
  value,
  icon,
  accent,
  isDark,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent: string;
  isDark: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 3,
        display: "flex",
        alignItems: "flex-start",
        gap: 2,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.06)" },
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          bgcolor: `${accent}${isDark ? "1A" : "12"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem", letterSpacing: 0.3 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mt: 0.25 }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

/* -- Status dot chip -- */
function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, py: 1 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          bgcolor: ok ? "#34A853" : "#EA4335",
          boxShadow: ok ? "0 0 8px rgba(52,168,83,0.5)" : "0 0 8px rgba(234,67,53,0.4)",
          animation: ok ? "glow 2s infinite" : "none",
          "@keyframes glow": {
            "0%, 100%": { boxShadow: ok ? "0 0 4px rgba(52,168,83,0.3)" : "none" },
            "50%": { boxShadow: ok ? "0 0 12px rgba(52,168,83,0.6)" : "none" },
          },
        }}
      />
      <Typography variant="body2" sx={{ color: "text.primary", fontSize: "0.875rem" }}>
        {label}
      </Typography>
      <Chip
        label={ok ? "Active" : "Inactive"}
        size="small"
        sx={{
          bgcolor: ok ? "rgba(52,168,83,0.1)" : "rgba(234,67,53,0.1)",
          color: ok ? "#34A853" : "#EA4335",
          height: 22,
          fontSize: "0.7rem",
          fontWeight: 600,
        }}
      />
    </Box>
  );
}

/* -- Agent stage chip -- */
function AgentStageChip({ stage, isDark }: { stage: AgentStage; isDark: boolean }) {
  const config: Record<AgentStage, { label: string; color: string; pulse: boolean }> = {
    idle: { label: "Idle", color: isDark ? "#9AA0A6" : "#5F6368", pulse: false },
    receptionist: { label: "Receptionist", color: isDark ? "#8AB4F8" : "#1A73E8", pulse: true },
    estimating: { label: "Estimating", color: isDark ? "#FDD663" : "#E37400", pulse: true },
    tradie_copilot: { label: "Tradie Copilot", color: isDark ? "#81C995" : "#1E8E3E", pulse: true },
    completed: { label: "Completed", color: isDark ? "#81C995" : "#1E8E3E", pulse: false },
  };
  const c = config[stage];
  return (
    <Chip
      icon={
        <FiberManualRecord
          sx={{
            fontSize: "8px !important",
            color: `${c.color} !important`,
            animation: c.pulse ? "pulse 1.5s infinite" : "none",
            "@keyframes pulse": {
              "0%": { transform: "scale(0.9)", opacity: 0.6 },
              "50%": { transform: "scale(1.15)", opacity: 1 },
              "100%": { transform: "scale(0.9)", opacity: 0.6 },
            },
          }}
        />
      }
      label={c.label}
      size="small"
      sx={{
        bgcolor: `${c.color}1A`,
        color: c.color,
        height: 26,
        fontSize: "0.75rem",
        fontWeight: 600,
        "& .MuiChip-icon": { ml: 0.5 },
      }}
    />
  );
}

export default function AdminPortalPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const { token, user, isLoggedIn, logout } = useAuth();
  const { toggleMode } = useThemeMode();
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({ total_customers: 0, total_leads: 0, booking_rate: 0, active_portals: 0 });
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);
  const [agentStage, setAgentStage] = useState<AgentStage>("idle");
  const [lastVoiceEvent, setLastVoiceEvent] = useState<string>("No realtime voice events yet.");
  const [voiceTimeline, setVoiceTimeline] = useState<string[]>([]);

  const [setupBusy, setSetupBusy] = useState(false);
  const [monitorBusy, setMonitorBusy] = useState(false);
  const [voiceTokenPreview, setVoiceTokenPreview] = useState<string>("");

  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [setupDraft, setSetupDraft] = useState<SetupDraft>({ provider: "twilio", identifier: "", instructions: "" });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SA";

  const sideWidth = isDesktop ? 240 : 72;

  const fetchAdminData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profilesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/profiles`, { headers }),
        fetch(`${API_URL}/api/admin/stats`, { headers }),
      ]);

      if (!profilesRes.ok) {
        const body = await profilesRes.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to fetch admin profiles");
      }
      if (!statsRes.ok) {
        const body = await statsRes.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to fetch admin stats");
      }

      setProfiles((await profilesRes.json()) as Profile[]);
      setStats((await statsRes.json()) as AdminStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchVoiceStatus = async () => {
    if (!token) {
      return;
    }
    setMonitorBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/voice/status`, { headers });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to fetch monitoring data");
      }
      setVoiceStatus((await res.json()) as VoiceStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch monitoring data");
    } finally {
      setMonitorBusy(false);
    }
  };

  const generateVoiceToken = async (mode: "tradie_copilot" | "receptionist") => {
    if (!token) return;
    setMonitorBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/voice/token`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mode }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.detail || "Failed to generate token");
      setVoiceTokenPreview(`${mode}: ${String(payload.room_name || "")}`);
      setSnack({ open: true, message: `Voice token generated for ${mode}`, severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err instanceof Error ? err.message : "Token generation failed", severity: "error" });
    } finally {
      setMonitorBusy(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
    void fetchVoiceStatus();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${wsBase}/ws/leads?token=${token}`);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as Record<string, unknown>;
        const type = String(message.type || "");
        const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        if (type === "call_status") {
          const status = String(message.status || "");
          const caller = String(message.caller || "unknown");
          if (status === "started") {
            setAgentStage(caller.startsWith("user-") ? "tradie_copilot" : "receptionist");
            setLastVoiceEvent(`Call started: ${caller}`);
            setVoiceTimeline((prev) => [`${now} — Call started: ${caller}`, ...prev].slice(0, 8));
          } else {
            setAgentStage("idle");
            setLastVoiceEvent(`Call ended: ${caller}`);
            setVoiceTimeline((prev) => [`${now} — Call ended: ${caller}`, ...prev].slice(0, 8));
          }
        } else if (type === "new_lead") {
          const lead = message.lead as Record<string, unknown> | undefined;
          setAgentStage("estimating");
          const leadName = String(lead?.customer_name || lead?.id || "unknown");
          setLastVoiceEvent(`Lead captured: ${leadName}`);
          setVoiceTimeline((prev) => [`${now} — Lead: ${leadName}`, ...prev].slice(0, 8));
          void fetchAdminData();
        } else if (type === "lead_update") {
          const lead = message.lead as Record<string, unknown> | undefined;
          const status = String(lead?.status || "");
          if (status === "photo_analysed") {
            setAgentStage("estimating");
            setLastVoiceEvent("Photo analysed. Recomputing quote.");
          } else if (status === "photo_received") {
            setAgentStage("estimating");
            setLastVoiceEvent("Photo received. Analysis pending.");
          } else if (status === "analysis_failed") {
            setAgentStage("estimating");
            setLastVoiceEvent("Photo analysis failed.");
          } else if (status === "tradie_review") {
            setAgentStage("tradie_copilot");
            setLastVoiceEvent("Estimator complete. Waiting tradie decision.");
          } else if (status === "confirmed" || status === "booked") {
            setAgentStage("completed");
            setLastVoiceEvent(`Lead ${status}.`);
          }
          if (status) {
            setVoiceTimeline((prev) => [`${now} — ${status}: ${String(lead?.id || "").slice(0, 8)}`, ...prev].slice(0, 8));
          }
        }
      } catch {
        // Ignore malformed ws messages
      }
    };

    ws.onclose = () => {
      setLastVoiceEvent("Realtime stream disconnected.");
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const handleOnboardSuccess = async () => {
    await fetchAdminData();
    setTab("customers");
    setSnack({ open: true, message: "Customer onboarded successfully!", severity: "success" });
  };

  const openSetup = (profile: Profile) => {
    const inbound = profile.inbound_config || {};
    setSelectedProfile(profile);
    setSetupDraft({
      provider: String(inbound.provider || "twilio"),
      identifier: String(inbound.identifier || ""),
      instructions: String(inbound.instructions || ""),
    });
    setSetupOpen(true);
  };

  const handleSaveSetup = async () => {
    if (!token || !selectedProfile) return;

    // Validation
    if (!setupDraft.identifier.trim()) {
      setSnack({ open: true, message: "Inbound identifier is required.", severity: "error" });
      return;
    }

    setSetupBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/profiles/${selectedProfile.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          business_name: selectedProfile.business_name,
          service_types: selectedProfile.service_types,
          base_callout_fee: selectedProfile.base_callout_fee,
          hourly_rate: selectedProfile.hourly_rate,
          markup_pct: selectedProfile.markup_pct,
          min_labour_hours: selectedProfile.min_labour_hours,
          base_address: selectedProfile.base_address,
          service_radius_km: selectedProfile.service_radius_km,
          travel_rate_per_km: selectedProfile.travel_rate_per_km,
          timezone: selectedProfile.timezone,
          working_hours: selectedProfile.working_hours,
          inbound_config: {
            ...(selectedProfile.inbound_config || {}),
            provider: setupDraft.provider,
            identifier: setupDraft.identifier,
            instructions: setupDraft.instructions,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to save inbound setup");
      }

      setSetupOpen(false);
      setSnack({ open: true, message: "Inbound setup saved!", severity: "success" });
      await fetchAdminData();
    } catch (err) {
      setSnack({ open: true, message: err instanceof Error ? err.message : "Save failed", severity: "error" });
    } finally {
      setSetupBusy(false);
    }
  };

  const filteredProfiles = useMemo(() => {
    if (!customerSearch.trim()) return profiles;
    const q = customerSearch.toLowerCase();
    return profiles.filter(
      (p) =>
        p.business_name.toLowerCase().includes(q) ||
        p.service_types.some((s) => s.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
    );
  }, [profiles, customerSearch]);

  const renderOverview = () => (
    <Stack spacing={3}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Admin Overview</Typography>
        <AgentStageChip stage={agentStage} isDark={isDark} />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0,1fr))" }, gap: 2 }}>
        <StatCard
          label="Total Customers"
          value={stats.total_customers}
          icon={<PeopleOutlined sx={{ color: isDark ? "#8AB4F8" : "#1A73E8", fontSize: 22 }} />}
          accent={isDark ? "#8AB4F8" : "#1A73E8"}
          isDark={isDark}
        />
        <StatCard
          label="Total Leads"
          value={stats.total_leads}
          icon={<LeaderboardOutlined sx={{ color: isDark ? "#FDD663" : "#E37400", fontSize: 22 }} />}
          accent={isDark ? "#FDD663" : "#E37400"}
          isDark={isDark}
        />
        <StatCard
          label="Booking Rate"
          value={`${stats.booking_rate.toFixed(1)}%`}
          icon={<TrendingUpOutlined sx={{ color: isDark ? "#81C995" : "#1E8E3E", fontSize: 22 }} />}
          accent={isDark ? "#81C995" : "#1E8E3E"}
          isDark={isDark}
        />
        <StatCard
          label="Active Portals"
          value={stats.active_portals}
          icon={<PortalOutlined sx={{ color: isDark ? "#F28B82" : "#D93025", fontSize: 22 }} />}
          accent={isDark ? "#F28B82" : "#D93025"}
          isDark={isDark}
        />
      </Box>

      {/* Last event + stage */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <AutoAwesomeOutlined sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "0.9rem" }}>AI Pipeline Status</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          {lastVoiceEvent}
        </Typography>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
          Sophiie Space controls onboarding and inbound call setup. Sophiie Orbit is for customers/tradies to track appointments, schedule, and confirmations.
        </Typography>
      </Paper>
    </Stack>
  );

  const renderCustomers = () => (
    <Stack spacing={2}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Customers</Typography>
        <TextField
          placeholder="Search customers…"
          size="small"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined sx={{ fontSize: 20, color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 260 },
            "& .MuiOutlinedInput-root": { borderRadius: 2, fontSize: "0.875rem" },
          }}
        />
      </Box>
      <Paper variant="outlined" sx={{ p: 0, borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <OrbitLoader />
        ) : filteredProfiles.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <BusinessOutlined
              sx={{ fontSize: 48, color: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", mb: 2 }}
            />
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500, mb: 0.5 }}>
              {customerSearch ? "No matching customers" : "No customers yet"}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", opacity: 0.7 }}>
              {customerSearch
                ? "Try a different search term."
                : "Onboard your first customer from the Inbound Setup tab."}
            </Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>Business</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>Services</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>Inbound Number</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.8rem" }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.8rem" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{profile.business_name || "Untitled"}</Typography>
                    <Typography variant="caption" color="text.secondary">{profile.id.slice(0, 12)}…</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {profile.service_types.length > 0 ? (
                        profile.service_types.slice(0, 2).map((s) => (
                          <Chip
                            key={s}
                            label={s}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              bgcolor: isDark ? "rgba(138,180,248,0.1)" : "rgba(26,115,232,0.06)",
                              color: "primary.main",
                            }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                      {profile.service_types.length > 2 && (
                        <Chip
                          label={`+${profile.service_types.length - 2}`}
                          size="small"
                          sx={{ height: 22, fontSize: "0.7rem" }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                      {String(profile.inbound_config?.identifier || "Not set")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={profile.is_active ? "Active" : "Inactive"}
                      sx={{
                        bgcolor: profile.is_active
                          ? (isDark ? "rgba(52,168,83,0.12)" : "rgba(52,168,83,0.08)")
                          : (isDark ? "rgba(154,160,166,0.12)" : "rgba(95,99,104,0.08)"),
                        color: profile.is_active
                          ? (isDark ? "#81C995" : "#1E8E3E")
                          : (isDark ? "#9AA0A6" : "#5F6368"),
                        height: 24,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => {
                        openSetup(profile);
                        setTab("inbound");
                      }}
                      sx={{ textTransform: "none", fontSize: "0.8rem" }}
                    >
                      Setup
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Stack>
  );

  const renderInbound = () => (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Onboard and Inbound Setup</Typography>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}>
        <UserOnboardingStepper onSuccess={handleOnboardSuccess} />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Existing Profiles</Typography>
        <Stack spacing={1}>
          {profiles.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No profiles yet. Onboard a customer above.
            </Typography>
          )}
          {profiles.map((p) => (
            <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{p.business_name}</Typography>
              <Button size="small" onClick={() => openSetup(p)} sx={{ textTransform: "none" }}>Edit Inbound</Button>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );

  const renderMonitoring = () => (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Monitoring</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <AgentStageChip stage={agentStage} isDark={isDark} />
          <Button
            size="small"
            onClick={() => void fetchVoiceStatus()}
            disabled={monitorBusy || !token}
            sx={{ textTransform: "none" }}
          >
            {monitorBusy ? "Refreshing…" : "Refresh"}
          </Button>
        </Box>
      </Stack>

      {/* Service status */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontSize: "0.9rem" }}>
          Service Status
        </Typography>
        <StatusDot ok={Boolean(voiceStatus?.deepgram?.configured)} label="Deepgram (STT)" />
        <StatusDot ok={Boolean(voiceStatus?.elevenlabs?.configured)} label="ElevenLabs (TTS)" />
        <StatusDot ok={Boolean(voiceStatus?.twilio?.configured)} label="Twilio (Telephony)" />
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Connected Tradies:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {voiceStatus?.websocket?.connected_tradies?.length ?? 0}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">Active WebSocket Connections:</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {voiceStatus?.websocket?.active_connections ?? 0}
          </Typography>
        </Box>
      </Paper>

      {/* Voice event timeline */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontSize: "0.9rem" }}>
          Event Timeline
        </Typography>
        {voiceTimeline.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", fontStyle: "italic" }}>
            {lastVoiceEvent}
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {voiceTimeline.map((evt, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  py: 0.75,
                  borderBottom: i < voiceTimeline.length - 1 ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: i === 0 ? "primary.main" : "divider",
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ color: i === 0 ? "text.primary" : "text.secondary", fontSize: "0.85rem" }}>
                  {evt}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Test buttons */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontSize: "0.9rem" }}>
          Voice Token Testing
        </Typography>
        <Stack direction="row" spacing={1.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => void generateVoiceToken("tradie_copilot")}
            disabled={monitorBusy || !token}
            sx={{ textTransform: "none" }}
          >
            Test Tradie Mode
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => void generateVoiceToken("receptionist")}
            disabled={monitorBusy || !token}
            sx={{ textTransform: "none" }}
          >
            Test Receptionist Mode
          </Button>
        </Stack>
        {voiceTokenPreview ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {voiceTokenPreview}
          </Typography>
        ) : null}
      </Paper>
    </Stack>
  );

  const content =
    tab === "overview"
      ? renderOverview()
      : tab === "customers"
      ? renderCustomers()
      : tab === "inbound"
      ? renderInbound()
      : renderMonitoring();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/auth/login");
    }
  }, [loading, token, router]);

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token) {
    return null; // Will redirect
  }

  if (user?.role && user.role !== "admin") {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography color="text.secondary">Admin account required for Sophiie Space.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      {(isDesktop || isTablet) && (
        <Drawer
          variant="permanent"
          PaperProps={{ sx: { width: sideWidth, bgcolor: "background.paper", borderRight: 1, borderColor: "divider" } }}
        >
          <Box sx={{ px: isDesktop ? 2 : 1, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AutoAwesomeOutlined sx={{ color: "primary.main", fontSize: 20 }} />
            </Box>
            {isDesktop && (
              <Typography variant="h6" sx={{ color: "text.primary", fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                Sophiie Space
              </Typography>
            )}
          </Box>

          <Divider sx={{ borderColor: "divider" }} />

          <List sx={{ px: 1, pt: 1, flex: 1 }}>
            {TAB_CONFIG.map((t) => (
              <ListItemButton
                key={t.value}
                selected={tab === t.value}
                onClick={() => setTab(t.value)}
                sx={{ mb: 0.5, borderRadius: 2, justifyContent: isDesktop ? "flex-start" : "center", px: isDesktop ? 2 : 1, minHeight: 44 }}
              >
                <ListItemIcon
                  sx={{ minWidth: isDesktop ? 36 : 0, color: tab === t.value ? "primary.main" : "text.secondary", justifyContent: "center" }}
                >
                  {t.icon}
                </ListItemIcon>
                {isDesktop && (
                  <ListItemText
                    primary={t.label}
                    primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: tab === t.value ? 500 : 400, color: tab === t.value ? "text.primary" : "text.secondary" }}
                  />
                )}
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ px: 1, pb: 2 }}>
            <ListItemButton
              onClick={toggleMode}
              sx={{ borderRadius: 2, justifyContent: isDesktop ? "flex-start" : "center", px: isDesktop ? 2 : 1, minHeight: 44 }}
            >
              <ListItemIcon sx={{ minWidth: isDesktop ? 36 : 0, color: "text.secondary", justifyContent: "center" }}>
                {isDark ? <LightModeOutlined /> : <DarkModeOutlined />}
              </ListItemIcon>
              {isDesktop && (
                <ListItemText primary={isDark ? "Light mode" : "Dark mode"} primaryTypographyProps={{ fontSize: "0.875rem", color: "text.secondary" }} />
              )}
            </ListItemButton>
          </Box>
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", ml: isDesktop ? `${sideWidth}px` : isTablet ? `${sideWidth}px` : 0, width: isDesktop || isTablet ? `calc(100% - ${sideWidth}px)` : "100%" }}>
        <AppBar position="sticky" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
            {!isDesktop && !isTablet && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 1 }}>
                <AutoAwesomeOutlined sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography variant="h6" sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
                  Space
                </Typography>
              </Box>
            )}

            <Typography variant="h6" sx={{ flex: 1, color: isDesktop || isTablet ? "text.primary" : "text.secondary", fontSize: { xs: "0.85rem", sm: "1rem" }, fontWeight: isDesktop || isTablet ? 500 : 400 }}>
              {isDesktop || isTablet ? TAB_CONFIG.find((t) => t.value === tab)?.label : ""}
            </Typography>

            <NotificationCenter />
            
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Open user menu" sx={{ p: 0.5, ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: isDark ? "rgba(138,180,248,0.15)" : "rgba(26,115,232,0.1)", color: "primary.main", fontSize: "0.75rem", fontWeight: 600 }}>
                {initials}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{ paper: { sx: { bgcolor: "background.paper", backgroundImage: "none", border: 1, borderColor: "divider", minWidth: 200, mt: 1 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: "0.875rem" }}>{user?.name}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>{user?.email}</Typography>
              </Box>
              <Divider sx={{ borderColor: "divider" }} />
              <MenuItem onClick={() => setAnchorEl(null)} sx={{ gap: 1.5, py: 1 }}>
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}><PersonOutline fontSize="small" /></ListItemIcon>
                <Typography variant="body1" sx={{ color: "text.primary" }}>Profile</Typography>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
                sx={{ gap: 1.5, py: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: "text.secondary" }}><LogoutOutlined fontSize="small" /></ListItemIcon>
                <Typography variant="body1" sx={{ color: "text.primary" }}>Sign out</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, overflow: "auto", pb: 2 }}>
          <Box sx={{ maxWidth: 1120, mx: "auto", px: { xs: 1, sm: 2, md: 3 }, py: 2 }}>
            {error ? (
              <Alert
                severity="error"
                sx={{ mb: 2, borderRadius: 2 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            ) : null}
            {!token ? <Alert severity="warning" sx={{ mb: 2 }}>Login required for admin actions.</Alert> : null}
            {content}
          </Box>
        </Box>
      </Box>

      {/* Inbound Setup Dialog */}
      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Inbound Call Setup</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Provider"
              size="small"
              value={setupDraft.provider}
              onChange={(e) => setSetupDraft((p) => ({ ...p, provider: e.target.value }))}
              helperText="e.g. twilio, signalwire"
            />
            <TextField
              label="Inbound Identifier"
              size="small"
              value={setupDraft.identifier}
              onChange={(e) => setSetupDraft((p) => ({ ...p, identifier: e.target.value }))}
              helperText="Phone number or SIP URI for inbound calls"
              error={setupBusy === false && setupDraft.identifier.trim() === "" && setupOpen}
            />
            <TextField
              label="Instructions"
              size="small"
              multiline
              minRows={4}
              value={setupDraft.instructions}
              onChange={(e) => setSetupDraft((p) => ({ ...p, instructions: e.target.value }))}
              helperText="Custom instructions for the AI receptionist"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveSetup()} disabled={setupBusy || !token} sx={{ textTransform: "none" }}>
            {setupBusy ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, fontWeight: 500 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
