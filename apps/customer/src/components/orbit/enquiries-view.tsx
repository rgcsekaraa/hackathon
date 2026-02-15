"use client";

import { useState, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import { useTheme } from "@mui/material/styles";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import QuestionAnswerOutlined from "@mui/icons-material/QuestionAnswerOutlined";
import { FiberManualRecord } from "@mui/icons-material";
import { useWorkspace, type Enquiry } from "@/components/providers/WorkspaceProvider";
import { OrbitLoader } from "@/lib/orbit-ui";
import { useAuth } from "@/lib/auth-context";

type FilterTab = "all" | "new" | "pending" | "responded" | "closed";

function EnquiryItem({
  item,
  onCallResult,
}: {
  item: Enquiry;
  onCallResult: (success: boolean, name: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [expanded, setExpanded] = useState(false);
  const [calling, setCalling] = useState(false);

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    new: {
      bg: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
      text: isDark ? "#8AB4F8" : "#1A73E8",
      label: "New",
    },
    pending: {
      bg: isDark ? "rgba(253,214,99,0.12)" : "rgba(227,116,0,0.08)",
      text: isDark ? "#FDD663" : "#E37400",
      label: "Pending",
    },
    responded: {
      bg: isDark ? "rgba(129,201,149,0.12)" : "rgba(30,142,62,0.08)",
      text: isDark ? "#81C995" : "#1E8E3E",
      label: "Responded",
    },
    closed: {
      bg: isDark ? "rgba(154,160,166,0.12)" : "rgba(95,99,104,0.08)",
      text: isDark ? "#9AA0A6" : "#5F6368",
      label: "Closed",
    },
  };

  const cfg = statusConfig[item.status];

  const { token } = useAuth();

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token || !item.phone || calling) return;

    setCalling(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/voice/outbound`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_phone: item.phone,
          customer_enquiry_id: item.id,
        }),
      });
      onCallResult(res.ok, item.name);
    } catch {
      onCallResult(false, item.name);
    } finally {
      setCalling(false);
    }
  };

  const hasPhone = Boolean(item.phone);

  return (
    <Box sx={{ my: 0.5 }}>
      <ListItemButton
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 0.75,
          py: 2,
          px: 2,
          borderRadius: 2,
          "&:hover": {
            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          },
        }}
      >
        {/* Top row */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
            <FiberManualRecord sx={{ fontSize: 8, color: cfg.text, flexShrink: 0 }} />
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 500 }}
            >
              {item.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
            <Chip
              label={cfg.label}
              size="small"
              sx={{ bgcolor: cfg.bg, color: cfg.text, height: 24, fontSize: "0.7rem", fontWeight: 600 }}
            />
            {expanded ? (
              <ExpandLess sx={{ fontSize: 20, color: "text.secondary" }} />
            ) : (
              <ExpandMore sx={{ fontSize: 20, color: "text.secondary" }} />
            )}
          </Box>
        </Box>

        {/* Subject + time */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", pl: 2.5 }}>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: "text.secondary", fontSize: "0.85rem", flex: 1, minWidth: 0 }}
          >
            {item.subject}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontSize: "0.75rem", flexShrink: 0, ml: 1.5, opacity: 0.7 }}
          >
            {item.receivedAt}
          </Typography>
        </Box>

        {/* Quick stats bar */}
        {(item.location || item.distanceKm || item.totalEstimate) && (
          <Box sx={{ display: "flex", gap: 1.5, pl: 2.5, flexWrap: "wrap" }}>
            {item.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationOnOutlined sx={{ fontSize: 14, color: "text.secondary", opacity: 0.7 }} />
                <Typography variant="body2" noWrap sx={{ color: "text.secondary", fontSize: "0.75rem", maxWidth: 120 }}>
                  {item.location}
                </Typography>
              </Box>
            )}
            {typeof item.distanceKm === "number" && item.distanceKm > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <DirectionsCarOutlined sx={{ fontSize: 14, color: "text.secondary", opacity: 0.7 }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  {item.distanceKm.toFixed(1)} km
                </Typography>
              </Box>
            )}
            {typeof item.totalEstimate === "number" && item.totalEstimate > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AttachMoneyOutlined sx={{ fontSize: 14, color: isDark ? "#81C995" : "#1E8E3E", opacity: 0.8 }} />
                <Typography
                  variant="body2"
                  sx={{ color: isDark ? "#81C995" : "#1E8E3E", fontSize: "0.75rem", fontWeight: 600 }}
                >
                  ${item.totalEstimate}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </ListItemButton>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box
          sx={{
            px: 2.5,
            py: 2,
            mx: 1,
            mb: 0.5,
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="body1"
            sx={{ color: "text.secondary", fontSize: "0.85rem", lineHeight: 1.65, mb: 2 }}
          >
            {item.summary}
          </Typography>

          {/* Detail chips */}
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
            {item.location && (
              <Chip
                icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}
                label={item.location}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  height: 28,
                  "& .MuiChip-icon": { color: "text.secondary" },
                }}
              />
            )}
            {typeof item.distanceKm === "number" && item.distanceKm > 0 && (
              <Chip
                icon={<DirectionsCarOutlined sx={{ fontSize: 16 }} />}
                label={`${item.distanceKm.toFixed(1)} km`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  fontSize: "0.75rem",
                  height: 28,
                  "& .MuiChip-icon": { color: "text.secondary" },
                }}
              />
            )}
            {typeof item.totalEstimate === "number" && item.totalEstimate > 0 && (
              <Chip
                icon={<AttachMoneyOutlined sx={{ fontSize: 16 }} />}
                label={`$${item.totalEstimate} est.`}
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(129,201,149,0.12)" : "rgba(30,142,62,0.08)",
                  color: isDark ? "#81C995" : "#1E8E3E",
                  fontSize: "0.75rem",
                  height: 28,
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: isDark ? "#81C995" : "#1E8E3E" },
                }}
              />
            )}
          </Box>

          {/* Phone + Call */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "text.primary", fontSize: "0.85rem", fontWeight: 500 }}>
              {item.phone || "No phone number"}
            </Typography>
            <IconButton
              onClick={handleCall}
              size="small"
              disabled={!hasPhone || calling}
              aria-label={hasPhone ? `Call ${item.name}` : "Phone unavailable"}
              sx={{
                bgcolor: hasPhone
                  ? (isDark ? "rgba(129,201,149,0.12)" : "rgba(30,142,62,0.08)")
                  : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
                color: hasPhone
                  ? (isDark ? "#81C995" : "#1E8E3E")
                  : "text.disabled",
                "&:hover": hasPhone
                  ? { bgcolor: isDark ? "rgba(129,201,149,0.2)" : "rgba(30,142,62,0.15)" }
                  : {},
                width: 40,
                height: 40,
              }}
            >
              {calling ? (
                <Box sx={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LinearProgress sx={{ width: 20 }} />
                </Box>
              ) : (
                <PhoneOutlined sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

export default function EnquiriesView() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { leads, connectionStatus } = useWorkspace();
  const [tab, setTab] = useState<FilterTab>("all");
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCallResult = (success: boolean, name: string) => {
    setSnack({
      open: true,
      message: success
        ? `Calling you now… we'll connect ${name} when you pick up.`
        : `Failed to initiate call to ${name}. Try again later.`,
      severity: success ? "success" : "error",
    });
  };

  const filtered = useMemo(() => {
    if (tab === "all") return leads;
    return leads.filter((e) => e.status === tab);
  }, [tab, leads]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    leads.forEach((e) => {
      c[e.status] = (c[e.status] || 0) + 1;
    });
    return c;
  }, [leads]);

  if (connectionStatus === "connecting") {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 12 }}>
        <OrbitLoader />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 3, pb: 1 }}>
        <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 600, fontSize: { xs: "1.35rem", sm: "1.5rem" } }}>
          Enquiries
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5, fontSize: "0.85rem" }}>
          {counts.new || 0} new, {counts.pending || 0} pending
        </Typography>
      </Box>

      {/* Filter tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          px: 1,
          minHeight: 40,
          "& .MuiTab-root": {
            minHeight: 36,
            py: 0,
            px: 1.5,
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "text.secondary",
            "&.Mui-selected": { color: "primary.main" },
          },
          "& .MuiTabs-indicator": {
            height: 2,
            borderRadius: 1,
            bgcolor: "primary.main",
          },
        }}
      >
        <Tab label={`All (${counts.all})`} value="all" />
        <Tab label={`New (${counts.new || 0})`} value="new" />
        <Tab label={`Pending (${counts.pending || 0})`} value="pending" />
        <Tab label={`Replied (${counts.responded || 0})`} value="responded" />
        <Tab label={`Closed (${counts.closed || 0})`} value="closed" />
      </Tabs>

      <Divider sx={{ borderColor: "divider", mx: 2, mb: 0.5 }} />

      {/* List */}
      <List disablePadding sx={{ px: 1 }}>
        {filtered.length === 0 ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <QuestionAnswerOutlined
              sx={{
                fontSize: 48,
                color: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                mb: 2,
              }}
            />
            <Typography variant="body1" sx={{ color: "text.secondary", fontWeight: 500, mb: 0.5 }}>
              {tab === "all" ? "No enquiries yet" : `No ${tab} enquiries`}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.8rem", opacity: 0.7 }}>
              {tab === "all"
                ? "New enquiries from calls will appear here in real time."
                : "Enquiries matching this filter will show up here."}
            </Typography>
          </Box>
        ) : (
          filtered.map((item) => (
            <EnquiryItem key={item.id} item={item} onCallResult={handleCallResult} />
          ))
        )}
      </List>

      {/* Snackbar feedback */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
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
