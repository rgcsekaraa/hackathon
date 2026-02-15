"use client";

import React, { useState, useEffect } from "react";
import SpaceShell from "@/components/space/space-shell";
import { OrbitCard, OrbitButton } from "@/lib/orbit-ui";
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
  LayoutDashboard,
  Mail, 
  Monitor, 
  Plus, 
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
    <SpaceShell>
      <div className="p-8 space-y-12 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">SYSTEM SPACE</h1>
            <p className="text-zinc-500 text-xs font-bold tracking-[0.3em] uppercase">Control Plane Infrastructure Monitor</p>
          </div>
          <OrbitButton size="sm" className="h-10 px-8 bg-white text-black hover:bg-zinc-200">
            <Plus className="mr-2 h-4 w-4" /> SPAWN NODE
          </OrbitButton>
        </div>

        {/* Minimal Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Active Nodes", val: stats?.total_customers ?? 0, icon: Users },
            { label: "Lead Throughput", val: stats?.total_leads ?? 0, icon: Activity },
            { label: "Conversion", val: `${(stats?.booking_rate ?? 0).toFixed(1)}%`, icon: TrendingUp },
            { label: "System Uptime", val: "100%", icon: LayoutDashboard },
          ].map((m, i) => (
            <div key={i} className="p-5 border border-white/[0.05] bg-zinc-950/40 rounded-sm">
              <div className="flex items-center justify-between opacity-30 mb-3">
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">{m.label}</span>
                <m.icon className="h-3 w-3" />
              </div>
              <div className="text-3xl font-medium tracking-tighter text-white">{m.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Managed Infrastructure */}
          <div className="lg:col-span-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-6">Cluster Management</h3>
            <div className="border border-white/[0.05] rounded-sm bg-zinc-950/20 backdrop-blur-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
                    <TableHead className="text-[8px] uppercase tracking-[0.2em] text-zinc-600">SID</TableHead>
                    <TableHead className="text-[8px] uppercase tracking-[0.2em] text-zinc-600">Runtime Status</TableHead>
                    <TableHead className="text-[8px] uppercase tracking-[0.2em] text-zinc-600">Auth state</TableHead>
                    <TableHead className="text-right text-[8px] uppercase tracking-[0.2em] text-zinc-600">CMD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20"><OrbitLoader /></TableCell></TableRow>
                  ) : customers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-20 text-zinc-800 text-[10px] font-bold uppercase tracking-widest">No active nodes detected.</TableCell></TableRow>
                  ) : (
                    customers.map((customer) => (
                      <TableRow key={customer.id} className="border-white/[0.02] hover:bg-white/[0.01] transition-all group">
                        <TableCell className="py-4">
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-tight">{customer.business_name}</div>
                          <div className="text-[8px] text-zinc-700 font-mono mt-0.5 uppercase tracking-tighter cursor-copy hover:text-zinc-500">{customer.id}</div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-none text-[8px] font-black bg-zinc-900 text-zinc-500 border border-white/[0.05]">
                            STABLE.V1
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className={cn("h-1 w-1 rounded-full", customer.is_gmail_setup ? "bg-white" : "bg-zinc-800")} />
                             <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                               {customer.is_gmail_setup ? "SECURED" : "PENDING"}
                             </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 px-3 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-700 hover:text-white hover:bg-white/[0.05]" onClick={() => handleOpenSetup(customer)}>
                             PARAMS
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Onboarding Logic Console */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">System Logs</h3>
            <div className="space-y-4">
              <div className="p-5 border border-white/[0.05] bg-zinc-900/30 rounded-none">
                <div className="flex items-center gap-3 mb-4">
                  <Mail className="h-3 w-3 text-zinc-500" />
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.1em]">Onboarding Relay</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed mb-6 font-medium italic">
                  Manual validation of node gateway credentials requested.
                </p>
                <OrbitButton 
                  size="sm" 
                  className="w-full h-8 text-[9px] font-black uppercase tracking-[0.2em]"
                  onClick={() => selectedCustomer && handleUpdateCustomer(selectedCustomer.id, { is_gmail_setup: true })}
                >
                  AUTHORIZE GATEWAY
                </OrbitButton>
              </div>

              <div className="p-5 border border-white/[0.05] bg-zinc-900/10 rounded-none opacity-40">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="h-3 w-3 text-zinc-700" />
                  <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.1em]">LIVE FEED</span>
                </div>
                <p className="text-[9px] text-zinc-800 font-bold uppercase tracking-tighter">SELECT NODE TO INITIATE PIPE</p>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Dialog */}
        <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <DialogContent className="bg-zinc-950 border-white/[0.1] text-white max-w-sm rounded-none border-2">
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-[0.3em]">NODE PARAMS</DialogTitle>
              <DialogDescription className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">
                RUNTIME CONFIGURATION OVERRIDE
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 border-y border-white/[0.05]">
              <div className="grid gap-2">
                <Label htmlFor="persona" className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-black">AI_CORE_DIRECTIVES</Label>
                <Textarea 
                  id="persona" 
                  className="bg-zinc-900/30 border-white/[0.1] text-zinc-400 text-[10px] font-mono focus:border-white/[0.2] transition-all rounded-none" 
                  placeholder="INPUT DIRECTIVES..."
                  rows={6}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[8px] uppercase tracking-[0.2em] text-zinc-600 font-black">PRIMARY_INBOUND</Label>
                <Select defaultValue="twilio">
                  <SelectTrigger className="bg-zinc-900/30 border-white/[0.1] text-zinc-400 h-9 rounded-none text-[10px] font-bold">
                    <SelectValue placeholder="SELECT_CARRIER" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/[0.1] text-white rounded-none">
                    <SelectItem value="twilio" className="text-[10px] font-bold">TWILIO_PSTN</SelectItem>
                    <SelectItem value="google" className="text-[10px] font-bold">GOOGLE_CLOUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button variant="ghost" onClick={() => setIsSetupOpen(false)} className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-700">CANCEL</Button>
              <OrbitButton className="h-9 px-8 text-[9px] font-black uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200">COMMIT_UPDATE</OrbitButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SpaceShell>
  );
}
