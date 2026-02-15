"use client";

import React, { useState, useEffect } from "react";
import DashboardShell from "@/components/orbit/dashboard-shell";
import { OrbitCard, OrbitHeader, OrbitButton } from "@/lib/orbit-ui";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Activity,
  CheckCircle2, 
  Circle, 
  LayoutDashboard,
  Loader2,
  Mail, 
  Monitor, 
  Plus, 
  Settings2, 
  TrendingUp, 
  Users 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrbitLoader } from "@/lib/orbit-ui";

interface Customer {
  id: string;
  user_id: string;
  business_name: string;
  service_radius_km: number;
  is_gmail_setup: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AdminPortal() {
  const { token, user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({ total_customers: 0, total_leads: 0, booking_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    // Auth Guard
    if (isLoggedIn && user && (user as any).role !== "admin" && (user as any).email !== "superadmin@sophiie.com") {
      // Allow if explicit admin or superadmin email for dev
    } else if (!isLoggedIn) {
      // router.push("/login"); 
    }
  }, [isLoggedIn, user, router]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cusRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/profiles`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const [cusData, statsData] = await Promise.all([cusRes.json(), statsRes.json()]);
      setCustomers(Array.isArray(cusData) ? cusData : []);
      setStats(statsData || { total_customers: 0, total_leads: 0, booking_rate: 0 });
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      await fetch(`${API_URL}/api/admin/profiles/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      setCustomers(customers.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      console.error("Failed to update customer", err);
    }
  };

  const handleOpenSetup = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSetupOpen(true);
  };

  return (
    <DashboardShell>
      <div className="p-12 space-y-12 max-w-7xl mx-auto">
        <OrbitHeader 
          title="Space" 
          subtitle="Super-Admin Infrastructure Monitor"
          actions={
            <OrbitButton size="sm" className="h-10 px-6">
              <Plus className="mr-2 h-4 w-4" /> Onboard Business
            </OrbitButton>
          }
        />

        {/* Minimal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Nodes", val: stats?.total_customers ?? 0, icon: Users },
            { label: "Lead Throughput", val: stats?.total_leads ?? 0, icon: Activity },
            { label: "Conversion", val: `${(stats?.booking_rate ?? 0).toFixed(1)}%`, icon: TrendingUp },
            { label: "System Uptime", val: "100%", icon: LayoutDashboard },
          ].map((m, i) => (
            <OrbitCard key={i} className="p-4 py-6">
              <div className="flex items-center justify-between opacity-50 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                <m.icon className="h-3 w-3" />
              </div>
              <div className="text-3xl font-medium tracking-tighter text-white">{m.val}</div>
            </OrbitCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Managed Infrastructure */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Cluster Management</h3>
            <OrbitCard>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Node Identifier</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Process State</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-zinc-500">Gmail Auth</TableHead>
                    <TableHead className="text-right text-[10px] uppercase tracking-wider text-zinc-500">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20"><OrbitLoader /></TableCell></TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-zinc-700 text-xs">No active nodes detected.</TableCell></TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id} className="border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                        <TableCell className="py-6">
                          <div className="font-medium text-zinc-200">{customer.business_name}</div>
                          <div className="text-[10px] text-zinc-600 font-mono tracking-tight mt-1">{customer.id}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold bg-zinc-900 text-zinc-400 border border-white/[0.05]">
                            ACTIVE.STABLE
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className={cn("h-1.5 w-1.5 rounded-full", customer.is_gmail_setup ? "bg-blue-500" : "bg-zinc-800")} />
                             <span className="text-[10px] font-medium text-zinc-500">
                               {customer.is_gmail_setup ? "VERIFIED" : "PENDING"}
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white" onClick={() => handleOpenSetup(customer)}>
                             Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </OrbitCard>
          </div>

          {/* Onboarding Logic Console */}
          <div className="space-y-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">System Logs</h3>
            <div className="space-y-4">
              <div className="p-4 border border-white/[0.05] bg-zinc-900/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Mail className="h-4 w-4 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-200 uppercase">Onboarding Validation</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
                  Manual verification of customer Gmail accounts is required to enable automated lead capture.
                </p>
                <OrbitButton 
                  size="sm" 
                  className="w-full h-8 text-[10px] font-bold uppercase"
                  onClick={() => selectedCustomer && handleUpdateCustomer(selectedCustomer.id, { is_gmail_setup: true })}
                >
                  Authorize Gmail Module
                </OrbitButton>
              </div>

              <div className="p-4 border border-white/[0.05] bg-zinc-900/30 rounded-lg opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="h-4 w-4 text-zinc-600" />
                  <span className="text-xs font-bold text-zinc-600 uppercase">Live Supervision</span>
                </div>
                <p className="text-[10px] text-zinc-700">Select a node to initiate live monitoring of AI voice sessions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Dialog */}
        <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <DialogContent className="bg-zinc-950 border-white/[0.05] text-white max-w-md shadow-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-tight">Node Configuration</DialogTitle>
              <DialogDescription className="text-zinc-500 text-xs">
                Modifying runtime parameters for {selectedCustomer?.business_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 border-y border-white/[0.03]">
              <div className="grid gap-2">
                <Label htmlFor="persona" className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">AI Persona Architecture</Label>
                <Textarea 
                  id="persona" 
                  className="bg-zinc-900/50 border-white/[0.05] text-zinc-300 text-xs focus:border-white/[0.1] transition-all" 
                  placeholder="Define AI behavioral directives..."
                  rows={6}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Primary Inbound Source</Label>
                <Select defaultValue="twilio">
                  <SelectTrigger className="bg-zinc-900/50 border-white/[0.05] text-zinc-300 h-10">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/[0.05] text-white">
                    <SelectItem value="twilio">Twilio Cloud Voice</SelectItem>
                    <SelectItem value="google">Google Voice (Enterprise)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsSetupOpen(false)} className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cancel</Button>
              <OrbitButton className="h-10 px-8 text-[11px] font-bold uppercase tracking-widest bg-white/[0.05] text-white border-white/[0.1]">Apply Runtime Update</OrbitButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
