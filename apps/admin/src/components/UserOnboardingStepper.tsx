"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  TextField,
  Stack,
  Paper,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,
  Slider,
} from "@mui/material";
import { useAuth } from "@/lib/auth-context";

const steps = [
  "Account Details",
  "Business Profile",
  "Rates & Service Area",
  "Inbound Configuration",
  "Review",
];

const DEFAULT_WORKING_HOURS = {
  monday: ["08:00", "17:00"],
  tuesday: ["08:00", "17:00"],
  wednesday: ["08:00", "17:00"],
  thursday: ["08:00", "17:00"],
  friday: ["08:00", "17:00"],
};

export default function UserOnboardingStepper({ onSuccess }: { onSuccess: () => void }) {
  const { token } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: "",
    full_name: "",
    password: "",
    
    // Step 2: Profile
    business_name: "",
    base_address: "",
    service_types: "", // comma separated string for input
    
    // Step 3: Rates
    base_callout_fee: 80,
    hourly_rate: 95,
    service_radius_km: 30,
    travel_rate_per_km: 1.50,
    timezone: "Australia/Brisbane",
    
    // Step 4: Inbound
    inbound_provider: "twilio",
    inbound_identifier: "",
    inbound_instructions: "Capture customer details, urgency, and booking preference.",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const serviceTypesArray = formData.service_types
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        user_in: {
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password || "Demo1234!",
        },
        profile_in: {
          business_name: formData.business_name,
          service_types: serviceTypesArray.length > 0 ? serviceTypesArray : ["general"],
          base_address: formData.base_address,
          base_callout_fee: Number(formData.base_callout_fee),
          hourly_rate: Number(formData.hourly_rate),
          service_radius_km: Number(formData.service_radius_km),
          travel_rate_per_km: Number(formData.travel_rate_per_km),
          timezone: formData.timezone,
          working_hours: DEFAULT_WORKING_HOURS,
          inbound_config: {
            provider: formData.inbound_provider,
            identifier: formData.inbound_identifier,
            instructions: formData.inbound_instructions,
          },
        },
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/admin/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Onboarding failed");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Account Details</Typography>
            <TextField
              label="Email Address"
              fullWidth
              required
              value={formData.email}
              onChange={handleChange("email")}
            />
            <TextField
              label="Full Name"
              fullWidth
              required
              value={formData.full_name}
              onChange={handleChange("full_name")}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              helperText="Default: Demo1234!"
              value={formData.password}
              onChange={handleChange("password")}
            />
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Business Profile</Typography>
            <TextField
              label="Business Name"
              fullWidth
              required
              value={formData.business_name}
              onChange={handleChange("business_name")}
            />
            <TextField
              label="Base Address"
              fullWidth
              required
              helperText="Starting location for travel calculations"
              value={formData.base_address}
              onChange={handleChange("base_address")}
            />
            <TextField
              label="Service Types"
              fullWidth
              helperText="Comma separated (e.g. plumbing, gas, roofing)"
              value={formData.service_types}
              onChange={handleChange("service_types")}
            />
          </Stack>
        );
      case 2:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Rates & Service Area</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Callout Fee"
                type="number"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={formData.base_callout_fee}
                onChange={handleChange("base_callout_fee")}
              />
              <TextField
                label="Hourly Rate"
                type="number"
                fullWidth
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                value={formData.hourly_rate}
                onChange={handleChange("hourly_rate")}
              />
            </Stack>
            <Box sx={{ px: 1, py: 2 }}>
                <Typography gutterBottom>Service Radius: {formData.service_radius_km} km</Typography>
                <Slider
                    value={typeof formData.service_radius_km === 'number' ? formData.service_radius_km : 30}
                    onChange={(_, val) => setFormData((prev) => ({ ...prev, service_radius_km: val as number }))}
                    valueLabelDisplay="auto"
                    step={5}
                    marks
                    min={5}
                    max={100}
                />
            </Box>
            <Stack direction="row" spacing={2}>
                <TextField
                    label="Travel Rate ($/km)"
                    type="number"
                    fullWidth
                    value={formData.travel_rate_per_km}
                    onChange={handleChange("travel_rate_per_km")}
                />
            </Stack>
            <TextField
                select
                label="Timezone"
                fullWidth
                value={formData.timezone}
                onChange={handleChange("timezone")}
            >
                <MenuItem value="Australia/Brisbane">Australia/Brisbane</MenuItem>
                <MenuItem value="Australia/Sydney">Australia/Sydney</MenuItem>
                <MenuItem value="Australia/Melbourne">Australia/Melbourne</MenuItem>
                <MenuItem value="Australia/Perth">Australia/Perth</MenuItem>
                <MenuItem value="Australia/Adelaide">Australia/Adelaide</MenuItem>
            </TextField>
          </Stack>
        );
      case 3:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Inbound Call Configuration</Typography>
            <TextField
                select
                label="Provider"
                fullWidth
                value={formData.inbound_provider}
                onChange={handleChange("inbound_provider")}
            >
                <MenuItem value="twilio">Twilio</MenuItem>
                <MenuItem value="sip">SIP/VoIP</MenuItem>
            </TextField>
            <TextField
              label="Inbound Identifier (Phone Number)"
              fullWidth
              required
              placeholder="+61..."
              value={formData.inbound_identifier}
              onChange={handleChange("inbound_identifier")}
            />
            <TextField
              label="Receptionist Instructions"
              fullWidth
              multiline
              rows={4}
              value={formData.inbound_instructions}
              onChange={handleChange("inbound_instructions")}
            />
          </Stack>
        );
      case 4:
        return (
          <Stack spacing={2}>
            <Typography variant="h6">Review Details</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">Account</Typography>
                <Typography variant="body2">{formData.full_name} ({formData.email})</Typography>
                <Typography variant="body2" color="text.secondary">Pass: {formData.password || '******'}</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Business</Typography>
                <Typography variant="body2">{formData.business_name}</Typography>
                <Typography variant="body2" color="text.secondary">{formData.base_address}</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Rates</Typography>
                <Typography variant="body2">${formData.base_callout_fee} callout + ${formData.hourly_rate}/hr</Typography>
                
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Inbound</Typography>
                <Typography variant="body2">{formData.inbound_identifier} ({formData.inbound_provider})</Typography>
            </Paper>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        );
      default:
        return "Unknown step";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4, mb: 2, minHeight: 300 }}>
        {renderStepContent(activeStep)}
      </Box>

      <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
        <Button
          color="inherit"
          disabled={activeStep === 0 || loading}
          onClick={handleBack}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Box sx={{ flex: "1 1 auto" }} />
        <Button onClick={handleNext} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? "Create Customer" : "Next"}
        </Button>
      </Box>
    </Box>
  );
}
