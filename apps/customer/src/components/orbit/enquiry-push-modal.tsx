"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { TransitionProps } from "@mui/material/transitions";
import React from "react";

import Close from "@mui/icons-material/Close";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import EditOutlined from "@mui/icons-material/EditOutlined";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import ImageSearchOutlined from "@mui/icons-material/ImageSearchOutlined";
import SendOutlined from "@mui/icons-material/SendOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAuth } from "@/lib/auth-context";

interface ChargeLineItem {
  label: string;
  amount: number;
  note?: string;
}

interface IncomingEnquiryPush {
  id: string;
  customerName: string;
  customerPhone: string;
  requestSummary: string;
  category: string;
  location: string;
  distanceKm: number;
  charges: ChargeLineItem[];
  totalEstimate: number;
  suggestedTime: string;
  suggestedDate: string;
  imageAnalysis?: string;
}

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface EnquiryPushModalProps {
  open: boolean;
  data: IncomingEnquiryPush | null;
  onClose: () => void;
  onApprove: (data: IncomingEnquiryPush) => void;
}

function EnquiryPushModal({ open, data, onClose, onApprove }: EnquiryPushModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [editing, setEditing] = useState(false);
  const [editCharges, setEditCharges] = useState<ChargeLineItem[]>([]);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setEditCharges(data.charges.map((c) => ({ ...c })));
      setEditing(false);
    }
  }, [data]);

  const editTotal = editCharges.reduce((s, c) => s + c.amount, 0);

  const handleApprove = () => {
    if (!data) return;
    const updated = { ...data, charges: editCharges, totalEstimate: editTotal };
    onApprove(updated);
    setSnackOpen(true);
  };

  const handleChargeChange = (idx: number, value: string) => {
    const num = parseFloat(value) || 0;
    setEditCharges((prev) => prev.map((c, i) => (i === idx ? { ...c, amount: num } : c)));
  };

  if (!data) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={SlideUp}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            backgroundImage: "none",
            borderRadius: isMobile ? 0 : 3,
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? "100%" : "90vh",
            overflow: "hidden",
          },
        }}
      >
        {/* Sticky header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                bgcolor: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <NotificationsActiveOutlined sx={{ fontSize: 18, color: "primary.main" }} />
            </Box>
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.2 }}
              >
                Incoming Enquiry
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
                Just now
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} aria-label="Dismiss" sx={{ color: "text.secondary" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable body */}
        <Box sx={{ overflow: "auto", flex: 1 }}>
          {/* Customer info */}
          <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
            <Typography
              variant="h6"
              sx={{ color: "text.primary", fontSize: "1.1rem", fontWeight: 600, mb: 0.5 }}
            >
              {data.customerName}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Chip
                icon={<PhoneOutlined sx={{ fontSize: 14 }} />}
                label={data.customerPhone}
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
              <Chip
                label={data.category}
                size="small"
                sx={{
                  bgcolor: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
                  color: "primary.main",
                  fontSize: "0.75rem",
                  height: 28,
                  fontWeight: 500,
                }}
              />
            </Box>

            {/* Request summary */}
            <Typography
              variant="body1"
              sx={{ color: "text.primary", fontSize: "0.875rem", lineHeight: 1.6, mb: 2 }}
            >
              {data.requestSummary}
            </Typography>

            {/* Location + Distance */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOnOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  {data.location}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <DirectionsCarOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  {data.distanceKm} km away
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ScheduleOutlined sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                  Suggested: {data.suggestedDate}, {data.suggestedTime}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Image analysis */}
          {data.imageAnalysis && (
            <Box
              sx={{
                mx: 2.5,
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: isDark ? "rgba(138,180,248,0.06)" : "rgba(26,115,232,0.04)",
                border: 1,
                borderColor: isDark ? "rgba(138,180,248,0.12)" : "rgba(26,115,232,0.08)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <ImageSearchOutlined sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography
                  variant="subtitle2"
                  sx={{ color: "primary.main", fontSize: "0.8rem", fontWeight: 600 }}
                >
                  AI Image Analysis
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontSize: "0.825rem", lineHeight: 1.6 }}
              >
                {data.imageAnalysis}
              </Typography>
            </Box>
          )}

          <Divider sx={{ borderColor: "divider", mx: 2.5 }} />

          {/* Charges breakdown */}
          <Box sx={{ px: 2.5, py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AutoAwesomeOutlined sx={{ fontSize: 16, color: "primary.main" }} />
                <Typography
                  variant="subtitle1"
                  sx={{ color: "text.primary", fontSize: "0.9rem", fontWeight: 600 }}
                >
                  Proposed Charges
                </Typography>
              </Box>
              {!editing && (
                <Button
                  size="small"
                  startIcon={<EditOutlined sx={{ fontSize: 16 }} />}
                  onClick={() => setEditing(true)}
                  sx={{
                    color: "primary.main",
                    textTransform: "none",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  Edit
                </Button>
              )}
            </Box>

            {/* Line items */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
              {(editing ? editCharges : data.charges).map((line, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontSize: "0.85rem", fontWeight: 400 }}
                    >
                      {line.label}
                    </Typography>
                    {line.note && (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", fontSize: "0.75rem", mt: 0.15 }}
                      >
                        {line.note}
                      </Typography>
                    )}
                  </Box>
                  {editing ? (
                    <TextField
                      type="number"
                      size="small"
                      value={editCharges[idx].amount}
                      onChange={(e) => handleChargeChange(idx, e.target.value)}
                      inputProps={{ min: 0, step: 5 }}
                      sx={{
                        width: 90,
                        "& .MuiOutlinedInput-root": {
                          fontSize: "0.85rem",
                          height: 36,
                        },
                        "& .MuiOutlinedInput-input": {
                          textAlign: "right",
                          py: 0.75,
                        },
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.primary",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      ${line.amount}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {/* Total */}
            <Divider sx={{ borderColor: "divider", mb: 1.5 }} />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{ color: "text.primary", fontSize: "0.95rem", fontWeight: 600 }}
              >
                Total Estimate
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "primary.main",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                }}
              >
                ${editing ? editTotal : data.totalEstimate}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Sticky footer actions */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            position: "sticky",
            bottom: 0,
          }}
        >
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              height: 46,
              borderRadius: 2,
              borderColor: "divider",
              color: "text.primary",
              "&:hover": {
                borderColor: "text.secondary",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              },
            }}
          >
            Dismiss
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={editing ? <SendOutlined sx={{ fontSize: 18 }} /> : <CheckCircleOutline sx={{ fontSize: 18 }} />}
            onClick={handleApprove}
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              height: 46,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: isDark ? "#0E0E0E" : "#FFFFFF",
              "&:hover": {
                bgcolor: isDark ? "#A8C7FA" : "#1565C0",
              },
            }}
          >
            {editing ? "Confirm & Send" : "Approve Quote"}
          </Button>
        </Box>
      </Dialog>

      {/* Success snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3500}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 80, sm: 24 } }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%", borderRadius: 2, fontWeight: 500 }}
        >
          Quote sent to {data.customerName}
        </Alert>
      </Snackbar>
    </>
  );
}

// --- Inline push banner (the toast that triggers the modal) ---

interface PushBannerProps {
  data: IncomingEnquiryPush;
  onTap: () => void;
  onDismiss: () => void;
}

function PushBanner({ data, onTap, onDismiss }: PushBannerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      onClick={onTap}
      role="button"
      tabIndex={0}
      aria-label={`New enquiry from ${data.customerName}`}
      onKeyDown={(e) => e.key === "Enter" && onTap()}
      sx={{
        position: "fixed",
        top: { xs: 8, sm: 16 },
        left: "50%",
        transform: "translateX(-50%)",
        width: { xs: "calc(100% - 16px)", sm: 420 },
        zIndex: 2000,
        bgcolor: isDark ? "#1E1E1E" : "#FFFFFF",
        border: 1,
        borderColor: isDark ? "rgba(138,180,248,0.2)" : "rgba(26,115,232,0.15)",
        borderRadius: 3,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.5)"
          : "0 8px 32px rgba(0,0,0,0.12)",
        cursor: "pointer",
        overflow: "hidden",
        animation: "slideDown 0.4s ease-out",
        "@keyframes slideDown": {
          "0%": { opacity: 0, transform: "translateX(-50%) translateY(-100%)" },
          "100%": { opacity: 1, transform: "translateX(-50%) translateY(0)" },
        },
      }}
    >
      {/* Accent bar */}
      <Box sx={{ height: 3, bgcolor: "primary.main" }} />

      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
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
            mt: 0.25,
          }}
        >
          <NotificationsActiveOutlined sx={{ fontSize: 18, color: "primary.main" }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
            <Typography
              variant="subtitle2"
              sx={{ color: "text.primary", fontSize: "0.825rem", fontWeight: 600 }}
            >
              New Enquiry from {data.customerName}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              aria-label="Dismiss notification"
              sx={{ color: "text.secondary", ml: 0.5, p: 0.25 }}
            >
              <Close sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography
            variant="body2"
            noWrap
            sx={{ color: "text.secondary", fontSize: "0.8rem", lineHeight: 1.4 }}
          >
            {data.category} -- {data.location}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "primary.main",
              fontSize: "0.75rem",
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            Tap to review quote (${data.totalEstimate})
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// --- Orchestrator component ---

export default function EnquiryPushSystem() {
  const { newLeadPush, clearNewLeadPush } = useWorkspace();
  const { token } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<IncomingEnquiryPush | null>(null);

  // Map backend Enquiry to UI IncomingEnquiryPush for the modal
  const pushData = useMemo<IncomingEnquiryPush | null>(() => {
    if (!newLeadPush) return null;
    return {
        id: newLeadPush.id,
        customerName: newLeadPush.name,
        customerPhone: newLeadPush.phone,
        requestSummary: newLeadPush.summary,
        category: newLeadPush.subject,
        location: newLeadPush.location || "Unknown Location",
        distanceKm: newLeadPush.distanceKm ?? 0,
        charges: [],
        totalEstimate: newLeadPush.totalEstimate ?? 0,
        suggestedTime: "ASAP",
        suggestedDate: "Today"
    };
  }, [newLeadPush]);

  const handleTapBanner = useCallback(() => {
    if (pushData) {
        setModalData(pushData);
        clearNewLeadPush(); // Clear from banner, open in modal
        setModalOpen(true);
    }
  }, [pushData, clearNewLeadPush]);

  const handleDismissBanner = useCallback(() => {
    clearNewLeadPush();
  }, [clearNewLeadPush]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setModalData(null);
  }, []);

  const handleApprove = useCallback(
    async (data: IncomingEnquiryPush) => {
      if (!token) {
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const notes = data.charges.length
          ? data.charges.map((line) => `${line.label}: $${line.amount.toFixed(2)}`).join(" | ")
          : "Approved from customer portal";

        const res = await fetch(`${apiUrl}/api/leads/${data.id}/decision`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            decision: "approve",
            notes,
          }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.detail || "Failed to approve lead");
        }
      } catch (err) {
        console.error("Failed to approve lead", err);
      } finally {
        setModalOpen(false);
        setModalData(null);
      }
    },
    [token]
  );

  // Auto-dismiss banner after 10s if not tapped
  useEffect(() => {
    if (!pushData) return;
    const timer = setTimeout(() => {
      handleTapBanner(); // auto-open modal instead of dismissing
    }, 10000);
    return () => clearTimeout(timer);
  }, [pushData, handleTapBanner]);

  return (
    <>
      {pushData && (
        <PushBanner
          data={pushData}
          onTap={handleTapBanner}
          onDismiss={handleDismissBanner}
        />
      )}
      <EnquiryPushModal
        open={modalOpen}
        data={modalData}
        onClose={handleCloseModal}
        onApprove={handleApprove}
      />
    </>
  );
}
