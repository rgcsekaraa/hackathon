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
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
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

import { useAuth } from "@/lib/auth-context";
import { useThemeMode } from "@/lib/theme-context";

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
  websocket?: { connected_tradies?: number; active_connections?: number };
}

interface SetupDraft {
  provider: string;
  identifier: string;
  instructions: string;
}

interface OnboardForm {
  email: string;
  full_name: string;
  password: string;
  business_name: string;
  service_types: string;
  base_address: string;
  inbound_identifier: string;
}

const DEFAULT_WORKING_HOURS = {
  monday: ["08:00", "17:00"],
  tuesday: ["08:00", "17:00"],
  wednesday: ["08:00", "17:00"],
  thursday: ["08:00", "17:00"],
  friday: ["08:00", "17:00"],
};

const INITIAL_ONBOARD_FORM: OnboardForm = {
  email: "",
  full_name: "",
  password: "",
  business_name: "",
  service_types: "",
  base_address: "",
  inbound_identifier: "",
};

const TAB_CONFIG: { value: AdminTab; label: string; icon: React.ReactElement }[] = [
  { value: "overview", label: "Overview", icon: <DashboardOutlined /> },
  { value: "customers", label: "Customers", icon: <GroupOutlined /> },
  { value: "inbound", label: "Inbound Setup", icon: <SettingsPhoneOutlined /> },
  { value: "monitoring", label: "Monitoring", icon: <MonitorHeartOutlined /> },
];

function parseServiceTypes(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

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

  const [onboardForm, setOnboardForm] = useState<OnboardForm>(INITIAL_ONBOARD_FORM);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [monitorBusy, setMonitorBusy] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [setupDraft, setSetupDraft] = useState<SetupDraft>({ provider: "twilio", identifier: "", instructions: "" });

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

  useEffect(() => {
    void fetchAdminData();
    void fetchVoiceStatus();
  }, [token]);

  const handleOnboard = async () => {
    if (!token) return;
    if (!onboardForm.email || !onboardForm.business_name) {
      setError("Customer email and business name are required.");
      return;
    }

    setOnboardBusy(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/onboard`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_in: {
            email: onboardForm.email,
            full_name: onboardForm.full_name,
            password: onboardForm.password || "Demo1234!",
          },
          profile_in: {
            business_name: onboardForm.business_name,
            service_types: parseServiceTypes(onboardForm.service_types),
            base_address: onboardForm.base_address,
            base_callout_fee: 80,
            hourly_rate: 95,
            service_radius_km: 30,
            timezone: "Australia/Brisbane",
            working_hours: DEFAULT_WORKING_HOURS,
            inbound_config: {
              provider: "twilio",
              identifier: onboardForm.inbound_identifier,
              instructions: "Capture customer details, urgency, and booking preference.",
            },
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Onboarding failed");
      }

      setOnboardForm(INITIAL_ONBOARD_FORM);
      await fetchAdminData();
      setTab("customers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setOnboardBusy(false);
    }
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
      await fetchAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save inbound setup");
    } finally {
      setSetupBusy(false);
    }
  };

  const renderOverview = () => (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Admin Overview</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0,1fr))" }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Total Customers</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.total_customers}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Total Leads</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.total_leads}</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Booking Rate</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.booking_rate.toFixed(1)}%</Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">Active Portals</Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{stats.active_portals}</Typography>
        </Paper>
      </Box>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Sophiie Space controls onboarding and inbound call setup. Sophiie Orbit is for customers/tradies to track appointments, schedule, and confirmations.
        </Typography>
      </Paper>
    </Stack>
  );

  const renderCustomers = () => (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>Customers</Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {loading ? (
          <OrbitLoader />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Business</TableCell>
                <TableCell>Services</TableCell>
                <TableCell>Inbound Number</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{profile.business_name || "Untitled"}</Typography>
                    <Typography variant="caption" color="text.secondary">{profile.id}</Typography>
                  </TableCell>
                  <TableCell>{profile.service_types.join(", ") || "-"}</TableCell>
                  <TableCell>{String(profile.inbound_config?.identifier || "Not set")}</TableCell>
                  <TableCell>
                    <Chip size="small" color={profile.is_active ? "success" : "default"} label={profile.is_active ? "Active" : "Inactive"} />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => { openSetup(profile); setTab("inbound"); }}>Setup</Button>
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
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <TextField label="Customer Email" size="small" value={onboardForm.email} onChange={(e) => setOnboardForm((p) => ({ ...p, email: e.target.value }))} />
          <TextField label="Full Name" size="small" value={onboardForm.full_name} onChange={(e) => setOnboardForm((p) => ({ ...p, full_name: e.target.value }))} />
          <TextField label="Temporary Password" size="small" type="password" value={onboardForm.password} onChange={(e) => setOnboardForm((p) => ({ ...p, password: e.target.value }))} />
          <TextField label="Business Name" size="small" value={onboardForm.business_name} onChange={(e) => setOnboardForm((p) => ({ ...p, business_name: e.target.value }))} />
          <TextField label="Service Types (comma separated)" size="small" value={onboardForm.service_types} onChange={(e) => setOnboardForm((p) => ({ ...p, service_types: e.target.value }))} />
          <TextField label="Base Address" size="small" value={onboardForm.base_address} onChange={(e) => setOnboardForm((p) => ({ ...p, base_address: e.target.value }))} />
          <TextField label="Inbound Twilio Number" size="small" value={onboardForm.inbound_identifier} onChange={(e) => setOnboardForm((p) => ({ ...p, inbound_identifier: e.target.value }))} />
          <Button variant="contained" onClick={() => void handleOnboard()} disabled={!token || onboardBusy}>
            {onboardBusy ? "Creating..." : "Create Customer"}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Existing Profiles</Typography>
        <Stack spacing={1}>
          {profiles.map((p) => (
            <Stack key={p.id} direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{p.business_name}</Typography>
              <Button size="small" onClick={() => openSetup(p)}>Edit Inbound</Button>
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
        <Button size="small" onClick={() => void fetchVoiceStatus()} disabled={monitorBusy || !token}>
          {monitorBusy ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Typography variant="body2">Deepgram configured: {String(Boolean(voiceStatus?.deepgram?.configured))}</Typography>
          <Typography variant="body2">ElevenLabs configured: {String(Boolean(voiceStatus?.elevenlabs?.configured))}</Typography>
          <Typography variant="body2">Twilio configured: {String(Boolean(voiceStatus?.twilio?.configured))}</Typography>
          <Typography variant="body2">Live connected tradies: {voiceStatus?.websocket?.connected_tradies ?? 0}</Typography>
          <Typography variant="body2">Active WS connections: {voiceStatus?.websocket?.active_connections ?? 0}</Typography>
        </Stack>
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
    if (!isLoggedIn && !token) {
      router.replace("/auth/login");
    }
  }, [isLoggedIn, token, router]);

  if (!isLoggedIn && !token) {
    return null;
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

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="Open user menu" sx={{ p: 0.5 }}>
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
            {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
            {!token ? <Alert severity="warning" sx={{ mb: 2 }}>Login required for admin actions.</Alert> : null}
            {content}
          </Box>
        </Box>
      </Box>

      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Inbound Call Setup</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField label="Provider" size="small" value={setupDraft.provider} onChange={(e) => setSetupDraft((p) => ({ ...p, provider: e.target.value }))} />
            <TextField label="Inbound Identifier" size="small" value={setupDraft.identifier} onChange={(e) => setSetupDraft((p) => ({ ...p, identifier: e.target.value }))} />
            <TextField label="Instructions" size="small" multiline minRows={4} value={setupDraft.instructions} onChange={(e) => setSetupDraft((p) => ({ ...p, instructions: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveSetup()} disabled={setupBusy || !token}>
            {setupBusy ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
