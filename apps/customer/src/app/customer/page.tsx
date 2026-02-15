"use client";

import { useState, useCallback, useRef } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha, useTheme } from "@mui/material/styles";

/**
 * Minimal photo upload page for customers.
 * Linked via SMS — no auth required.
 * URL: /customer?lead=<lead_id>
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PhotoUploadPage() {
  const theme = useTheme();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract lead ID from URL
  const leadId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("lead")
      : null;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setFiles(Array.from(e.target.files));
        setError(null);
      }
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!leadId || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `${API_URL}/api/leads/${leadId}/photos`,
          { method: "POST", body: formData }
        );

        if (!res.ok) throw new Error("Upload failed");
      }
      setUploaded(true);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [leadId, files]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        background: theme.palette.background.default,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 420,
          width: "100%",
          p: 4,
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          textAlign: "center",
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <Typography variant="h5" fontWeight={800} gutterBottom>
          📸 Upload Photos
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Take clear photos of the issue to help your tradie prepare an
          accurate quote.
        </Typography>

        {!uploaded ? (
          <>
            {/* File picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <Button
              variant="outlined"
              fullWidth
              onClick={() => fileInputRef.current?.click()}
              sx={{
                py: 5,
                mb: 2,
                borderStyle: "dashed",
                borderColor: alpha(theme.palette.primary.main, 0.3),
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              <Box>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  📷
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap to take a photo or choose from gallery
                </Typography>
              </Box>
            </Button>

            {files.length > 0 && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ mb: 2, fontWeight: 600 }}
              >
                {files.length} photo{files.length > 1 ? "s" : ""} selected
              </Typography>
            )}

            {error && (
              <Typography
                variant="body2"
                color="error"
                sx={{ mb: 2 }}
              >
                {error}
              </Typography>
            )}

            <Button
              variant="contained"
              fullWidth
              disabled={files.length === 0 || uploading}
              onClick={handleUpload}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              {uploading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Upload ${files.length || ""} Photo${files.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </>
        ) : (
          <Box sx={{ py: 3 }}>
            <Typography variant="h3" sx={{ mb: 2 }}>
              ✅
            </Typography>
            <Typography
              variant="h6"
              fontWeight={700}
              color="success.main"
              gutterBottom
            >
              Photos Received!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your tradie has been notified. They'll review your photos
              and confirm the quote shortly.
            </Typography>
          </Box>
        )}

        {!leadId && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 2, display: "block" }}
          >
            Invalid link — please use the link from your SMS.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
