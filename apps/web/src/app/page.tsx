"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import { MobileLayout } from "@/components/layout/MobileLayout";

/**
 * Mobile view -- the primary "control + capture" surface.
 * This is where field workers plan their day via voice, text, and touch.
 */
export default function MobilePage() {
  return (
    <MobileLayout>
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 2 }}
        >
          Your Workspace
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", mb: 4 }}
        >
          Speak or type to create tasks, timelines, and notes.
        </Typography>

        {/* Placeholder for workspace components -- replaced in Phase 7 */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            backgroundColor: "action.hover",
            border: 1,
            borderColor: "divider",
            borderStyle: "dashed",
            borderRadius: 3,
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Workspace components will appear here
          </Typography>
        </Paper>
      </Box>
    </MobileLayout>
  );
}
