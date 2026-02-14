import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ──────────────────────────── Types ──────────────────────────── */

export type LeadUrgency = "emergency" | "urgent" | "standard" | "flexible";
export type LeadStatus =
  | "new"
  | "classifying"
  | "quoted"
  | "approved"
  | "rejected"
  | "booked"
  | "completed";

export interface QuoteLineItem {
  label: string;
  amount: number;
  detail?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  suburb: string;
  urgency: LeadUrgency;
  status: LeadStatus;
  jobType: string;
  description: string;
  photoUrls: string[];
  visionSummary?: string;
  distanceKm?: number;
  travelMinutes?: number;
  quoteLines: QuoteLineItem[];
  quoteTotal?: number;
  scheduledDate?: string;
  scheduledSlot?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  businessName: string;
  baseAddress: string;
  calloutFee: number;
  hourlyRate: number;
  markupPercent: number;
  serviceRadius: number;
  services: string[];
  workingHours: { start: string; end: string };
}

interface LeadsState {
  leads: Lead[];
  profile: UserProfile;
  stats: { pending: number; booked: number; revenue: number };
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  decideLead: (leadId: string, decision: "approve" | "reject", edits?: Partial<Lead>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  refreshLeads: () => void;
}

const LeadsContext = createContext<LeadsState | null>(null);

export function useLeads(): LeadsState {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}

/* ──────────────────────── Demo Data ──────────────────────── */

const DEMO_LEADS: Lead[] = [
  {
    id: "lead-001",
    customerName: "Sarah Mitchell",
    customerPhone: "0412 345 678",
    address: "42 Pacific Parade",
    suburb: "Burleigh Heads",
    urgency: "emergency",
    status: "quoted",
    jobType: "Burst Pipe",
    description: "Main water pipe burst under the kitchen sink. Water is flooding the kitchen floor. Needs immediate attention.",
    photoUrls: [],
    visionSummary: "Detected: corroded copper pipe, active water leak, water damage to cabinetry",
    distanceKm: 8.2,
    travelMinutes: 14,
    quoteLines: [
      { label: "Call-out Fee", amount: 80 },
      { label: "Labour", amount: 190, detail: "2.0 hrs @ $95/hr" },
      { label: "Parts", amount: 47.5, detail: "15mm copper pipe + fittings" },
      { label: "Travel", amount: 12.3, detail: "8.2 km @ $1.50/km" },
      { label: "GST (10%)", amount: 32.98 },
    ],
    quoteTotal: 362.78,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "lead-002",
    customerName: "James Cooper",
    customerPhone: "0423 456 789",
    address: "15 Sunshine Ave",
    suburb: "Miami",
    urgency: "urgent",
    status: "quoted",
    jobType: "Blocked Drain",
    description: "Bathroom drain completely blocked. Water won't drain at all. Tried a plunger but no luck.",
    photoUrls: [],
    distanceKm: 12.5,
    travelMinutes: 18,
    quoteLines: [
      { label: "Call-out Fee", amount: 80 },
      { label: "Labour", amount: 95, detail: "1.0 hrs @ $95/hr" },
      { label: "Parts", amount: 10.24, detail: "Drain snake tip" },
      { label: "Travel", amount: 18.75, detail: "12.5 km @ $1.50/km" },
      { label: "GST (10%)", amount: 20.4 },
    ],
    quoteTotal: 224.39,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
  },
  {
    id: "lead-003",
    customerName: "Emily Watson",
    customerPhone: "0434 567 890",
    address: "8 Ocean View Cres",
    suburb: "Palm Beach",
    urgency: "standard",
    status: "quoted",
    jobType: "Leaking Tap",
    description: "Kitchen tap dripping constantly. Washer probably needs replacing.",
    photoUrls: [],
    visionSummary: "Detected: mixer tap, visible corrosion on spout base",
    distanceKm: 18.0,
    travelMinutes: 24,
    quoteLines: [
      { label: "Call-out Fee", amount: 80 },
      { label: "Labour", amount: 47.5, detail: "0.5 hrs @ $95/hr" },
      { label: "Parts", amount: 8.63, detail: "Tap washer kit" },
      { label: "Travel", amount: 27, detail: "18 km @ $1.50/km" },
      { label: "GST (10%)", amount: 16.31 },
    ],
    quoteTotal: 179.44,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
  },
  {
    id: "lead-004",
    customerName: "Tom Richards",
    customerPhone: "0445 678 901",
    address: "22 Gold Coast Hwy",
    suburb: "Mermaid Beach",
    urgency: "flexible",
    status: "quoted",
    jobType: "Hot Water System",
    description: "Hot water system making a rumbling noise. Still working but want it checked before it dies.",
    photoUrls: [],
    distanceKm: 5.4,
    travelMinutes: 10,
    quoteLines: [
      { label: "Call-out Fee", amount: 80 },
      { label: "Labour", amount: 95, detail: "1.0 hrs @ $95/hr" },
      { label: "Parts", amount: 23, detail: "Anode rod + thermostat check" },
      { label: "Travel", amount: 8.1, detail: "5.4 km @ $1.50/km" },
      { label: "GST (10%)", amount: 20.61 },
    ],
    quoteTotal: 226.71,
    scheduledDate: "2026-02-17",
    scheduledSlot: "14:00-16:00",
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
];

const DEFAULT_PROFILE: UserProfile = {
  businessName: "GC Plumbing Solutions",
  baseAddress: "Southport, QLD 4215",
  calloutFee: 80,
  hourlyRate: 95,
  markupPercent: 15,
  serviceRadius: 30,
  services: ["General Plumbing", "Burst Pipes", "Blocked Drains", "Hot Water", "Gas Fitting"],
  workingHours: { start: "07:00", end: "17:00" },
};

/* ──────────────────────── Provider ──────────────────────── */

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(DEMO_LEADS);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("connected"); // Default connected for demo

  const wsRef = useRef<WebSocket | null>(null);

  // Computed stats
  const stats = {
    pending: leads.filter((l) => l.status === "quoted" || l.status === "new").length,
    booked: leads.filter((l) => l.status === "booked" || l.status === "approved").length,
    revenue: leads
      .filter((l) => l.status === "booked" || l.status === "approved" || l.status === "completed")
      .reduce((sum, l) => sum + (l.quoteTotal ?? 0), 0),
  };

  const decideLead = useCallback(
    (leadId: string, decision: "approve" | "reject", edits?: Partial<Lead>) => {
      setLeads((prev) =>
        prev.map((l) => {
          if (l.id !== leadId) return l;
          if (decision === "approve") {
            return {
              ...l,
              ...edits,
              status: "approved" as LeadStatus,
              scheduledDate: l.scheduledDate || new Date(Date.now() + 86400000).toISOString().split("T")[0],
              scheduledSlot: l.scheduledSlot || "08:00-10:00",
              updatedAt: new Date().toISOString(),
            };
          }
          return { ...l, status: "rejected" as LeadStatus, updatedAt: new Date().toISOString() };
        })
      );

      // Send to API (fire-and-forget for demo)
      fetch(`${API_URL}/api/leads/${leadId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, edits }),
      }).catch(() => {});
    },
    []
  );

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const refreshLeads = useCallback(() => {
    // In production: fetch from API
    // For demo: reset to initial data
    setLeads(DEMO_LEADS);
  }, []);

  // WebSocket for real-time lead updates (connects if API is available)
  useEffect(() => {
    const connectWs = () => {
      try {
        const ws = new WebSocket(`${API_URL.replace("http", "ws")}/ws/leads`);
        ws.onopen = () => setConnectionStatus("connected");
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "new_lead") {
              setLeads((prev) => [data.lead as Lead, ...prev]);
            } else if (data.type === "lead_update") {
              setLeads((prev) =>
                prev.map((l) => (l.id === data.lead.id ? { ...l, ...(data.lead as Lead) } : l))
              );
            }
          } catch {}
        };
        ws.onclose = () => setConnectionStatus("disconnected");
        ws.onerror = () => setConnectionStatus("error");
        wsRef.current = ws;
      } catch {
        setConnectionStatus("connected"); // Fallback to demo mode
      }
    };

    connectWs();
    return () => wsRef.current?.close();
  }, []);

  return (
    <LeadsContext.Provider
      value={{ leads, profile, stats, connectionStatus, decideLead, updateProfile, refreshLeads }}
    >
      {children}
    </LeadsContext.Provider>
  );
}
