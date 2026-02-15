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
import { useTheme } from "@mui/material/styles";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";
import { FiberManualRecord } from "@mui/icons-material";
import { useWorkspace, type Enquiry } from "@/components/providers/WorkspaceProvider";
import { OrbitLoader } from "@/lib/orbit-ui";
import { useAuth } from "@/lib/auth-context";

type FilterTab = "all" | "new" | "pending" | "responded" | "closed";

function EnquiryItem({ item }: { item: Enquiry }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [expanded, setExpanded] = useState(false);

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

  const { token, user } = useAuth(); // Need token to call API

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // window.open(`tel:${item.phone.replace(/\s/g, "")}`, "_self");
    if (!token) return;

    try {
        const res = await fetch("/api/voice/outbound", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                customer_phone: item.phone,
                customer_enquiry_id: item.id
            })
        });
        if (res.ok) {
            alert("Calling you now... when you answer, we'll connect the customer.");
        } else {
            alert("Failed to initiate call.");
        }
    } catch (err) {
        console.error("Call failed", err);
        alert("Error starting call.");
    }
  };

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
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2" sx={{ color: "text.primary", fontSize: "0.85rem", fontWeight: 500 }}>
              {item.phone}
            </Typography>
            <IconButton
              onClick={handleCall}
              size="small"
              aria-label={`Call ${item.name}`}
              sx={{
                bgcolor: isDark ? "rgba(129,201,149,0.12)" : "rgba(30,142,62,0.08)",
                color: isDark ? "#81C995" : "#1E8E3E",
                "&:hover": {
                  bgcolor: isDark ? "rgba(129,201,149,0.2)" : "rgba(30,142,62,0.15)",
                },
                width: 40,
                height: 40,
              }}
            >
              <PhoneOutlined sx={{ fontSize: 20 }} />
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
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
              No enquiries
            </Typography>
          </Box>
        ) : (
          filtered.map((item) => <EnquiryItem key={item.id} item={item} />)
        )}
      </List>
    </Box>
  );
}
