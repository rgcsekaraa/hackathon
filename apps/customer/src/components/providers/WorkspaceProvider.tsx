"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type ServerStatus = "listening" | "thinking" | "updating" | "synced" | "error";
type AgentStage = "idle" | "receptionist" | "estimating" | "tradie_copilot" | "completed";

interface WorkspaceComponent {
  id: string;
  type: "timeline" | "task" | "note";
  title: string;
  description?: string;
  priority: "urgent" | "high" | "normal" | "low";
  date?: string;
  timeSlot?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  subject: string;
  summary: string;
  status: "new" | "pending" | "responded" | "closed";
  receivedAt: string;
  rawCreatedAt?: string;
  location?: string;
  distanceKm?: number;
  totalEstimate?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

interface WorkspaceState {
  components: WorkspaceComponent[];
  leads: Enquiry[];
  notifications: Notification[]; // Derived from leads
  connectionStatus: ConnectionStatus;
  serverStatus: ServerStatus;
  lastIntents: Array<Record<string, unknown>>;
  sendUtterance: (text: string, source: "voice" | "text" | "chip") => void;
  sendAction: (action: string, componentId: string, payload?: Record<string, unknown>) => void;
  requestSync: () => void;
  refreshLeads: () => Promise<void>;
  newLeadPush: Enquiry | null;
  clearNewLeadPush: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  activeCall: boolean;
  activeCaller: string | null;
  agentStage: AgentStage;
  lastVoiceEvent: string | null;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function useWorkspace(): WorkspaceState {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}

interface WorkspaceProviderProps {
  sessionId?: string;
  children: ReactNode;
}

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

function mapLeadStatus(status: string): Enquiry["status"] {
  if (status === "details_collected" || status === "media_pending" || status === "pricing" || status === "tradie_review") {
    return "pending";
  }
  if (status === "confirmed" || status === "booked") {
    return "responded";
  }
  if (status === "rejected" || status === "cancelled") {
    return "closed";
  }
  return "new";
}

function mapAgentStageFromLeadStatus(status: string | null | undefined): AgentStage {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "tradie_review") return "tradie_copilot";
  if (normalized === "confirmed" || normalized === "booked") return "completed";
  if (
    normalized === "new" ||
    normalized === "details_collected" ||
    normalized === "media_pending" ||
    normalized === "pricing"
  ) {
    return "estimating";
  }
  return "idle";
}

/**
 * Manages WebSocket connection to the backend and workspace state.
 *
 * Components are maintained as an ordered array. The provider listens
 * for patch operations from the server and applies them locally.
 * This is the central state management for the workspace.
 */
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [components, setComponents] = useState<WorkspaceComponent[]>([]);
  const [leads, setLeads] = useState<Enquiry[]>([]);
  // We'll manage read state locally for now since backend doesn't exist
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("synced");
  const [lastIntents, setLastIntents] = useState<Array<Record<string, unknown>>>([]);
  const [newLeadPush, setNewLeadPush] = useState<Enquiry | null>(null);
  const [activeCall, setActiveCall] = useState(false);
  const [activeCaller, setActiveCaller] = useState<string | null>(null);
  const [agentStage, setAgentStage] = useState<AgentStage>("idle");
  const [lastVoiceEvent, setLastVoiceEvent] = useState<string | null>(null);
  const latestLeadStatusRef = useRef<string | null>(null);
  
  const { token } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const refreshLeads = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        latestLeadStatusRef.current = data[0]?.status ? String(data[0].status) : null;
        // Map backend LeadSession to UI Enquiry
        const mapped = data.map((l: any) => ({
          id: l.id,
          name: l.customer_name || "Unknown Customer",
          phone: l.customer_phone || "",
          subject: l.job_type || "General Enquiry",
          summary: l.job_description || "",
          status: mapLeadStatus(l.status),
          receivedAt: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawCreatedAt: l.created_at,
          location: l.customer_address || "",
          distanceKm: typeof l.distance_km === "number" ? l.distance_km : undefined,
          totalEstimate: typeof l.quote_total === "number" ? l.quote_total : undefined,
        }));
        setLeads(mapped);
        if (!activeCall) {
          setAgentStage(mapAgentStageFromLeadStatus(latestLeadStatusRef.current));
        }
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }, [token, API_URL, activeCall]);

  useEffect(() => {
    if (token) refreshLeads();
  }, [token, refreshLeads]);

  // Derive notifications from leads
  const notifications: Notification[] = leads.map(lead => {
    let title = "New enquiry";
    let body = `${lead.name}: ${lead.subject}`;
    let type: "info" | "success" | "warning" = "info";

    if (lead.status === "responded") {
        title = "Quote sent";
        type = "success";
    } else if (lead.status === "closed") {
        title = "Enquiry closed";
        type = "warning";
    }

    return {
      id: `notif-${lead.id}`,
      title,
      body,
      time: lead.receivedAt,
      read: readNotificationIds.has(`notif-${lead.id}`),
      type
    };
  });

  const markNotificationRead = useCallback((id: string) => {
    setReadNotificationIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
    });
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(new Set(allIds));
  }, [notifications]);

  const sessionWsRef = useRef<WebSocket | null>(null);
  const leadsWsRef = useRef<WebSocket | null>(null);
  const sessionReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leadsReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyPatches = useCallback((operations: Array<Record<string, unknown>>) => {
    setComponents((prev) => {
      let next = [...prev];

      for (const op of operations) {
        if (op.op === "add") {
          const component = op.component as WorkspaceComponent;
          const index = op.index as number | undefined;
          // Avoid duplicates
          next = next.filter((c) => c.id !== component.id);
          if (index !== undefined && index < next.length) {
            next.splice(index, 0, component);
          } else {
            next.push(component);
          }
        } else if (op.op === "remove") {
          next = next.filter((c) => c.id !== (op.componentId as string));
        } else if (op.op === "update") {
          const cid = op.componentId as string;
          const changes = op.changes as Partial<WorkspaceComponent>;
          next = next.map((c) => (c.id === cid ? { ...c, ...changes } : c));
        } else if (op.op === "reorder") {
          const cid = op.componentId as string;
          const newIndex = op.newIndex as number;
          const item = next.find((c) => c.id === cid);
          if (item) {
            next = next.filter((c) => c.id !== cid);
            next.splice(Math.min(newIndex, next.length), 0, item);
          }
        }
      }

      return next;
    });
  }, []);

  const handleSessionMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string;

    if (type === "status") {
      setServerStatus(message.status as ServerStatus);
    } else if (type === "intent_parsed") {
      setLastIntents(message.intents as Array<Record<string, unknown>>);
    } else if (type === "patch") {
      const operations = message.operations as Array<Record<string, unknown>>;
      applyPatches(operations);
    }
  }, [applyPatches]);

  const handleLeadsMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string;

    if (type === "new_lead") {
      const l = message.lead as any;
      latestLeadStatusRef.current = String(l?.status || "new");
      const mapped: Enquiry = {
        id: l.id,
        name: l.customerName || l.customer_name || "Unknown Customer",
        phone: l.customerPhone || l.customer_phone || "",
        subject: l.jobType || l.job_type || "New Request",
        summary: l.description || l.job_description || "",
        status: mapLeadStatus(String(l.status || "new")),
        receivedAt: "Just now",
        location: l.address || l.customer_address || "",
        distanceKm: typeof l.distanceKm === "number" ? l.distanceKm : (typeof l.distance_km === "number" ? l.distance_km : undefined),
        totalEstimate: typeof l.quoteTotal === "number" ? l.quoteTotal : (typeof l.quote_total === "number" ? l.quote_total : undefined),
      };
      // Populate newLeadPush for the UI alert
      setNewLeadPush(mapped);
      // Add to list immediately
      setLeads(prev => [mapped, ...prev.filter((item) => item.id !== mapped.id)]);
      setAgentStage("estimating");
      setLastVoiceEvent(`New lead captured: ${mapped.subject}`);
      void refreshLeads();
    } else if (type === "lead_update") {
      const lead = message.lead as Record<string, unknown> | undefined;
      const status = String(lead?.status ?? "");
      if (status) latestLeadStatusRef.current = status;
      if (status === "photo_analysed") {
        setAgentStage("estimating");
        setLastVoiceEvent("Photo analysed. Quote refinement in progress.");
      } else if (status === "photo_received") {
        setAgentStage("estimating");
        setLastVoiceEvent("Photo received. Analysis queued.");
      } else if (status === "analysis_failed") {
        setAgentStage("estimating");
        setLastVoiceEvent("Photo analysis failed. Check provider/API config.");
      } else if (status === "tradie_review") {
        setAgentStage("tradie_copilot");
        setLastVoiceEvent("Estimator complete. Handoff to tradie copilot.");
      } else if (status === "confirmed" || status === "booked") {
        setAgentStage("completed");
        setLastVoiceEvent(`Lead ${status}.`);
      } else if (status) {
        setAgentStage(mapAgentStageFromLeadStatus(status));
      }
      void refreshLeads();
    } else if (type === "call_status") {
        const status = message.status as string;
        const caller = message.caller as string;
        if (status === "started") {
            setActiveCall(true);
            setActiveCaller(caller);
            setAgentStage(caller?.startsWith("user-") ? "tradie_copilot" : "receptionist");
            setLastVoiceEvent(`Call started: ${caller || "unknown caller"}`);
        } else {
            setActiveCall(false);
            setActiveCaller(null);
            setAgentStage(mapAgentStageFromLeadStatus(latestLeadStatusRef.current));
            setLastVoiceEvent("Call ended");
        }
    }
  }, [refreshLeads]);

  const connectSessionRef = useRef<() => void>(() => {});
  const connectLeadsRef = useRef<() => void>(() => {});

  const connectSession = useCallback(() => {
    if (!token || sessionWsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");
    const ws = new WebSocket(`${WS_BASE_URL}/ws/session?token=${token}`);

    ws.onopen = () => {
      setConnectionStatus("connected");
      ws.send(JSON.stringify({ type: "sync_request" }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleSessionMessage(message as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      sessionReconnectRef.current = setTimeout(() => connectSessionRef.current(), 2000);
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    sessionWsRef.current = ws;
  }, [token, handleSessionMessage]);

  const connectLeads = useCallback(() => {
    if (!token || leadsWsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(`${WS_BASE_URL}/ws/leads?token=${token}`);

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleLeadsMessage(message as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to parse leads WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      leadsReconnectRef.current = setTimeout(() => connectLeadsRef.current(), 2000);
    };

    leadsWsRef.current = ws;
  }, [token, handleLeadsMessage]);

  useEffect(() => {
    connectSessionRef.current = connectSession;
  }, [connectSession]);

  useEffect(() => {
    connectLeadsRef.current = connectLeads;
  }, [connectLeads]);

  const sendUtterance = useCallback((text: string, source: "voice" | "text" | "chip") => {
    if (sessionWsRef.current?.readyState !== WebSocket.OPEN) return;

    sessionWsRef.current.send(JSON.stringify({
      type: "utterance",
      text,
      source,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const sendAction = useCallback((action: string, componentId: string, payload?: Record<string, unknown>) => {
    if (sessionWsRef.current?.readyState !== WebSocket.OPEN) return;

    sessionWsRef.current.send(JSON.stringify({
      type: "action",
      action,
      componentId,
      payload,
    }));
  }, []);

  const requestSync = useCallback(() => {
    if (sessionWsRef.current?.readyState !== WebSocket.OPEN) return;
    sessionWsRef.current.send(JSON.stringify({ type: "sync_request" }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      connectSession();
      connectLeads();
    }, 0);

    return () => {
      clearTimeout(timer);
      if (sessionReconnectRef.current) clearTimeout(sessionReconnectRef.current);
      if (leadsReconnectRef.current) clearTimeout(leadsReconnectRef.current);
      sessionWsRef.current?.close();
      leadsWsRef.current?.close();
    };
  }, [connectSession, connectLeads, token]);

  const value: WorkspaceState = {
    components,
    leads,
    notifications,
    connectionStatus,
    serverStatus,
    lastIntents,
    sendUtterance,
    sendAction,
    requestSync,
    refreshLeads,
    newLeadPush,
    clearNewLeadPush: () => setNewLeadPush(null),
    markNotificationRead,
    markAllNotificationsRead,
    activeCall,
    activeCaller,
    agentStage,
    lastVoiceEvent,
  };

  return (
    <WorkspaceContext value={value}>
      {children}
    </WorkspaceContext>
  );
}
