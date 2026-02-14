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

interface WorkspaceState {
  components: WorkspaceComponent[];
  connectionStatus: ConnectionStatus;
  serverStatus: ServerStatus;
  lastIntents: Array<Record<string, unknown>>;
  sendUtterance: (text: string, source: "voice" | "text" | "chip") => void;
  sendAction: (action: string, componentId: string, payload?: Record<string, unknown>) => void;
  requestSync: () => void;
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
export function WorkspaceProvider({ sessionId = "default", children }: WorkspaceProviderProps) {
  const [components, setComponents] = useState<WorkspaceComponent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("synced");
  const [lastIntents, setLastIntents] = useState<Array<Record<string, unknown>>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");
    const ws = new WebSocket(`${WS_BASE_URL}/ws/session/${sessionId}`);

    ws.onopen = () => {
      setConnectionStatus("connected");

      // Request full state sync on connect
      ws.send(JSON.stringify({ type: "sync_request" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      // Auto-reconnect after 2 seconds
      reconnectTimerRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    wsRef.current = ws;
  }, [sessionId]);

  const handleServerMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string;

    if (type === "status") {
      setServerStatus(message.status as ServerStatus);
    } else if (type === "intent_parsed") {
      setLastIntents(message.intents as Array<Record<string, unknown>>);
    } else if (type === "patch") {
      const operations = message.operations as Array<Record<string, unknown>>;
      applyPatches(operations);
    }
  }, []);

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
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const value: WorkspaceState = {
    components,
    connectionStatus,
    serverStatus,
    lastIntents,
    sendUtterance,
    sendAction,
    requestSync,
  };

  return (
    <WorkspaceContext value={value}>
      {children}
    </WorkspaceContext>
  );
}
