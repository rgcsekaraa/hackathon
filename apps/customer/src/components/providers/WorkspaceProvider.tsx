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
        // Map backend LeadSession to UI Enquiry
        const mapped = data.map((l: any) => ({
          id: l.id,
          name: l.customer_name || "Unknown Customer",
          phone: l.customer_phone || "",
          subject: l.job_type || "General Enquiry",
          summary: l.job_description || "",
          status: l.status === "details_collected" ? "pending" : 
                  l.status === "confirmed" ? "responded" :
                  l.status === "booked" ? "responded" :
                  l.status === "rejected" ? "closed" :
                  l.status === "cancelled" ? "closed" : "new",
          receivedAt: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawCreatedAt: l.created_at // Keep for sorting if needed
        }));
        setLeads(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  }, [token, API_URL]);

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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [activeCall, setActiveCall] = useState(false);
  const [activeCaller, setActiveCaller] = useState<string | null>(null);

  const handleServerMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string;

    if (type === "status") {
      setServerStatus(message.status as ServerStatus);
    } else if (type === "intent_parsed") {
      setLastIntents(message.intents as Array<Record<string, unknown>>);
    } else if (type === "patch") {
      const operations = message.operations as Array<Record<string, unknown>>;
      applyPatches(operations);
    } else if (type === "new_lead") {
      const l = message.lead as any;
      const mapped: Enquiry = {
        id: l.id,
        name: l.customerName || "Unknown Customer",
        phone: l.customerPhone || "",
        subject: l.jobType || "New Request",
        summary: l.description || "",
        status: "new",
        receivedAt: "Just now"
      };
      // Populate newLeadPush for the UI alert
      setNewLeadPush(mapped);
      // Add to list immediately
      setLeads(prev => [mapped, ...prev]);
    } else if (type === "call_status") {
        const status = message.status as string;
        const caller = message.caller as string;
        if (status === "started") {
            setActiveCall(true);
            setActiveCaller(caller);
        } else {
            setActiveCall(false);
            setActiveCaller(null);
        }
    }
  }, [applyPatches]);

  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || !token) return;

    setConnectionStatus("connecting");
    const ws = new WebSocket(`${WS_BASE_URL}/ws/leads?token=${token}`);

    ws.onopen = () => {
      setConnectionStatus("connected");
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      reconnectTimerRef.current = setTimeout(() => connectRef.current(), 2000);
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    wsRef.current = ws;
  }, [token, handleServerMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const sendUtterance = useCallback((text: string, source: "voice" | "text" | "chip") => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "utterance",
      text,
      source,
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const sendAction = useCallback((action: string, componentId: string, payload?: Record<string, unknown>) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "action",
      action,
      componentId,
      payload,
    }));
  }, []);

  const requestSync = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "sync_request" }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => connect(), 0);

    return () => {
      clearTimeout(timer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect, token]);

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
  };

  return (
    <WorkspaceContext value={value}>
      {children}
    </WorkspaceContext>
  );
}
