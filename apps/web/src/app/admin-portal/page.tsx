"use client";

import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  TextField, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

export default function AdminPortal() {
  const [customers, setCustomers] = useState([
    { id: 1, name: "ABC Plumbing", email: "contact@abc.com", status: "Active" },
    { id: 2, name: "Sunset Electrical", email: "admin@sunset.com", status: "Pending" },
  ]);

  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleOpenSetup = (customer: any) => {
    setSelectedCustomer(customer);
    setOpen(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Typography variant="h3" fontWeight="bold" color="primary">
            Sophiie Space
          </Typography>

          <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Onboard New Customer Portal
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box component="form" sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
              <TextField label="Business Name" variant="outlined" size="small" sx={{ flexGrow: 1 }} />
              <TextField label="Contact Email" variant="outlined" size="small" sx={{ flexGrow: 1 }} />
              <Button variant="contained" size="large" sx={{ px: 4 }}>
                Onboard
              </Button>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ borderRadius: 4, overflow: "hidden" }}>
            <Box sx={{ p: 3, bgcolor: "rgba(99, 102, 241, 0.1)" }}>
              <Typography variant="h6" fontWeight="bold">
                Managed Customers
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Business Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.status}</TableCell>
                      <TableCell align="right">
                        <Button size="small" onClick={() => handleOpenSetup(customer)}>Setup Inbound</Button>
                        <Button size="small" color="error">Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Stack>
      </Container>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Inbound Setup: {selectedCustomer?.name}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={3}>
            <Typography variant="body2" color="text.secondary">
              Configure how Sophiie Orbit handles incoming enquiries for this business.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Inbound Source</InputLabel>
              <Select label="Inbound Source" defaultValue="google-voice">
                <MenuItem value="google-voice">Google Voice</MenuItem>
                <MenuItem value="twillio">Twilio (SMS/Voice)</MenuItem>
                <MenuItem value="email-forward">Email Forwarding</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Source Identifier (Phone/Email)" variant="outlined" fullWidth placeholder="+61 4XX XXX XXX" />
            <TextField label="AI Prompt Persona" variant="outlined" multiline rows={3} defaultValue="Professional receptionist for a trade business. Polite, efficient, captures name and emergency status." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpen(false)}>Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
