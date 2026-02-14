"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

/**
 * Dashboard view -- the "big screen" workspace surface for judges.
 * Shows the spatial canvas with task cards, timelines, and notes.
 */
export default function DashboardPage() {
  return (
    <DashboardLayout>
      <Box sx={{ height: "100%" }}>
        <Grid container spacing={3}>
          {/* Workspace canvas placeholder */}
          <Grid size={12}>
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: "action.hover",
                border: 1,
                borderColor: "divider",
                borderStyle: "dashed",
                borderRadius: 3,
                minHeight: 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Spatial Workspace
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Tasks and timelines from the mobile view will appear here in real time.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}
