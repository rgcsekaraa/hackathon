"use client";

import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
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
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";

import { useWorkspace, type Enquiry } from "@/components/providers/WorkspaceProvider";

const SlideUp = React.forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface EnquiryPushModalProps {
  open: boolean;
  data: Enquiry | null;
  onClose: () => void;
  onApprove: (data: Enquiry) => void;
}

function EnquiryPushModal({ open, data, onClose, onApprove }: EnquiryPushModalProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!data) return null;

  return (
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
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <NotificationsActiveOutlined sx={{ fontSize: 18, color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>New Enquiry</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>{data.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
           <Chip label={data.subject} color="primary" size="small" />
           <Chip icon={<PhoneOutlined sx={{ fontSize: '14px !important' }} />} label={data.phone} variant="outlined" size="small" />
        </Box>
        
        <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
            {data.summary || "No additional description provided."}
        </Typography>
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
         <Button variant="outlined" fullWidth onClick={onClose}>Dismiss</Button>
         <Button variant="contained" fullWidth onClick={() => onApprove(data)} startIcon={<CheckCircleOutline />}>Review Now</Button>
      </Box>
    </Dialog>
  );
}

function PushBanner({ data, onTap, onDismiss }: { data: Enquiry, onTap: () => void, onDismiss: () => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      onClick={onTap}
      sx={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: { xs: "calc(100% - 16px)", sm: 400 },
        zIndex: 2000,
        bgcolor: "background.paper",
        border: 1,
        borderColor: "primary.main",
        borderRadius: 3,
        boxShadow: 8,
        cursor: "pointer",
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 2, color: 'white' }}>
         <NotificationsActiveOutlined />
      </Box>
      <Box sx={{ flex: 1 }}>
         <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{data.name}</Typography>
         <Typography variant="body2" color="text.secondary" noWrap>{data.subject}</Typography>
      </Box>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDismiss(); }}><Close fontSize="small" /></IconButton>
    </Box>
  );
}

export default function EnquiryPushSystem() {
  const { newLeadPush, clearNewLeadPush } = useWorkspace();
  const [modalOpen, setModalOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  useEffect(() => {
    if (newLeadPush) {
        // Trigger sound or notification if possible
    }
  }, [newLeadPush]);

  const handleTap = () => {
    setModalOpen(true);
  };

  const handleApprove = (data: Enquiry) => {
    setModalOpen(false);
    clearNewLeadPush();
    setSnackOpen(true);
    // Navigation to enquiry view would happen here
  };

  return (
    <>
      {newLeadPush && (
        <PushBanner
          data={newLeadPush}
          onTap={handleTap}
          onDismiss={clearNewLeadPush}
        />
      )}
      <EnquiryPushModal
        open={modalOpen}
        data={newLeadPush}
        onClose={() => setModalOpen(false)}
        onApprove={handleApprove}
      />
      <Snackbar open={snackOpen} autoHideDuration={3000} onClose={() => setSnackOpen(false)}>
         <Alert severity="success" sx={{ width: '100%', borderRadius: 3 }}>Enquiry opened for review</Alert>
      </Snackbar>
    </>
  );
}
