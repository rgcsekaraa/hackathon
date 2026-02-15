"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SpaceShell from "@/components/space/space-shell";
import { OrbitLoader } from "@/lib/orbit-ui";
import { useAuth } from "@/components/providers/AuthProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  status: string;
  checks?: Record<string, unknown>;
  pipeline?: {
    connected_tradies?: number;
    active_connections?: number;
    livekit_configured?: boolean;
    twilio_configured?: boolean;
    elevenlabs_configured?: boolean;
    openrouter_configured?: boolean;
    frontend_url?: string;
  };
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
  base_callout_fee: string;
  hourly_rate: string;
  service_radius_km: string;
  timezone: string;
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
  base_callout_fee: "80",
  hourly_rate: "95",
  service_radius_km: "30",
  timezone: "Australia/Brisbane",
  inbound_identifier: "",
};

function parseServiceTypes(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AdminPortalPage() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    total_customers: 0,
    total_leads: 0,
    booking_rate: 0,
    active_portals: 0,
  });
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [onboardBusy, setOnboardBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [monitorBusy, setMonitorBusy] = useState(false);

  const [onboardForm, setOnboardForm] = useState<OnboardForm>(INITIAL_ONBOARD_FORM);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupDraft, setSetupDraft] = useState<SetupDraft>({
    provider: "twilio",
    identifier: "",
    instructions: "",
  });

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

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

      const profilesJson = (await profilesRes.json()) as Profile[];
      const statsJson = (await statsRes.json()) as AdminStats;

      setProfiles(Array.isArray(profilesJson) ? profilesJson : []);
      setStats(statsJson || { total_customers: 0, total_leads: 0, booking_rate: 0, active_portals: 0 });
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
        throw new Error(body.detail || "Failed to fetch voice pipeline status");
      }
      const payload = (await res.json()) as VoiceStatus;
      setVoiceStatus(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch voice status");
    } finally {
      setMonitorBusy(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
    void fetchVoiceStatus();
  }, [token]);

  const handleOnboard = async () => {
    if (!token) {
      setError("Please login as admin to continue");
      return;
    }

    setOnboardBusy(true);
    setError(null);

    try {
      const profilePayload = {
        business_name: onboardForm.business_name,
        service_types: parseServiceTypes(onboardForm.service_types),
        base_address: onboardForm.base_address,
        base_callout_fee: Number(onboardForm.base_callout_fee || 80),
        hourly_rate: Number(onboardForm.hourly_rate || 95),
        service_radius_km: Number(onboardForm.service_radius_km || 30),
        timezone: onboardForm.timezone || "Australia/Brisbane",
        working_hours: DEFAULT_WORKING_HOURS,
        inbound_config: {
          provider: "twilio",
          identifier: onboardForm.inbound_identifier,
          instructions: "Answer inbound jobs, capture details, and offer booking windows.",
        },
      };

      const res = await fetch(`${API_URL}/api/admin/onboard`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_in: {
            email: onboardForm.email,
            full_name: onboardForm.full_name,
            password: onboardForm.password,
          },
          profile_in: profilePayload,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Onboarding failed");
      }

      setOnboardForm(INITIAL_ONBOARD_FORM);
      await fetchAdminData();
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
    if (!selectedProfile || !token) {
      return;
    }

    setSetupBusy(true);
    setError(null);

    try {
      const body = {
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
      };

      const res = await fetch(`${API_URL}/api/admin/profiles/${selectedProfile.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.detail || "Failed to save inbound setup");
      }

      setSetupOpen(false);
      setSelectedProfile(null);
      await fetchAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save inbound setup");
    } finally {
      setSetupBusy(false);
    }
  };

  return (
    <SpaceShell>
      <Box sx={{ maxWidth: 1280, mx: "auto", width: "100%", display: "grid", gap: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
              Sophiie Space Admin Portal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Onboard customers, configure inbound call routing, and monitor live backend pipelines.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => void fetchAdminData()} disabled={loading || !token}>
            Refresh Data
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {!token ? <Alert severity="warning">Login required to access admin actions.</Alert> : null}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Total Customers</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.total_customers}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Total Leads</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.total_leads}</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Booking Rate</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.booking_rate.toFixed(1)}%</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">Active Portals</Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>{stats.active_portals}</Typography>
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Customer Portals</Typography>
            {loading ? (
              <OrbitLoader />
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Business</TableCell>
                    <TableCell>Inbound Number</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="body2" color="text.secondary">No customer profiles yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => {
                      const inbound = profile.inbound_config || {};
                      return (
                        <TableRow key={profile.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{profile.business_name || "Untitled"}</Typography>
                            <Typography variant="caption" color="text.secondary">{profile.id}</Typography>
                          </TableCell>
                          <TableCell>{String(inbound.identifier || "Not set")}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              color={profile.is_active ? "success" : "default"}
                              label={profile.is_active ? "Active" : "Inactive"}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" onClick={() => openSetup(profile)}>Inbound Setup</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </Paper>

          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Onboard Customer</Typography>
              <Stack spacing={1.25}>
                <TextField label="Customer Email" size="small" value={onboardForm.email} onChange={(e) => setOnboardForm((prev) => ({ ...prev, email: e.target.value }))} />
                <TextField label="Full Name" size="small" value={onboardForm.full_name} onChange={(e) => setOnboardForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                <TextField label="Temporary Password" size="small" type="password" value={onboardForm.password} onChange={(e) => setOnboardForm((prev) => ({ ...prev, password: e.target.value }))} />
                <TextField label="Business Name" size="small" value={onboardForm.business_name} onChange={(e) => setOnboardForm((prev) => ({ ...prev, business_name: e.target.value }))} />
                <TextField label="Service Types (comma-separated)" size="small" value={onboardForm.service_types} onChange={(e) => setOnboardForm((prev) => ({ ...prev, service_types: e.target.value }))} />
                <TextField label="Base Address" size="small" value={onboardForm.base_address} onChange={(e) => setOnboardForm((prev) => ({ ...prev, base_address: e.target.value }))} />
                <TextField label="Inbound Number (Twilio)" size="small" value={onboardForm.inbound_identifier} onChange={(e) => setOnboardForm((prev) => ({ ...prev, inbound_identifier: e.target.value }))} />
                <Button variant="contained" disabled={onboardBusy || !token} onClick={() => void handleOnboard()}>
                  {onboardBusy ? "Creating..." : "Create Customer Portal"}
                </Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">Monitoring</Typography>
                <Button size="small" onClick={() => void fetchVoiceStatus()} disabled={monitorBusy || !token}>
                  {monitorBusy ? "Refreshing..." : "Refresh"}
                </Button>
              </Stack>
              {voiceStatus ? (
                <Stack spacing={0.75}>
                  <Typography variant="body2">Status: <strong>{voiceStatus.status}</strong></Typography>
                  <Typography variant="body2">Active call streams: {voiceStatus.pipeline?.active_connections ?? 0}</Typography>
                  <Typography variant="body2">Connected tradies: {voiceStatus.pipeline?.connected_tradies ?? 0}</Typography>
                  <Typography variant="body2">Twilio configured: {String(Boolean(voiceStatus.pipeline?.twilio_configured))}</Typography>
                  <Typography variant="body2">OpenRouter configured: {String(Boolean(voiceStatus.pipeline?.openrouter_configured))}</Typography>
                  <Typography variant="body2">LiveKit configured: {String(Boolean(voiceStatus.pipeline?.livekit_configured))}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No monitoring data yet.</Typography>
              )}
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Dialog open={setupOpen} onClose={() => setSetupOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Inbound Call Setup</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Provider"
              size="small"
              value={setupDraft.provider}
              onChange={(e) => setSetupDraft((prev) => ({ ...prev, provider: e.target.value }))}
              placeholder="twilio"
            />
            <TextField
              label="Inbound Identifier"
              size="small"
              value={setupDraft.identifier}
              onChange={(e) => setSetupDraft((prev) => ({ ...prev, identifier: e.target.value }))}
              placeholder="+1xxxxxxxxxx"
            />
            <TextField
              label="Call Handling Instructions"
              size="small"
              value={setupDraft.instructions}
              onChange={(e) => setSetupDraft((prev) => ({ ...prev, instructions: e.target.value }))}
              multiline
              minRows={4}
              placeholder="Ask for job details, urgency, and preferred schedule."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetupOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void handleSaveSetup()} disabled={setupBusy || !token}>
            {setupBusy ? "Saving..." : "Save Setup"}
          </Button>
        </DialogActions>
      </Dialog>
    </SpaceShell>
  );
}
