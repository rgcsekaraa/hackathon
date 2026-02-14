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

export interface WorkspaceComponent {
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
  sendUtterance: (text: string, source: "voice" | "text" | "chip") => void;
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
  children: ReactNode;
}

// Point this at your Mac's local network IP when testing on a real device
const WS_URL = process.env.EXPO_PUBLIC_WS_URL || "ws://localhost:8000";
const SESSION_ID = "default";

/**
 * WebSocket-based workspace state provider for the mobile app.
 * Mirrors the web WorkspaceProvider, managing connection lifecycle
 * and applying patch operations from the server.
 */
export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [components, setComponents] = useState<WorkspaceComponent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [serverStatus, setServerStatus] = useState<ServerStatus>("synced");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyPatches = useCallback((operations: Array<Record<string, unknown>>) => {
    setComponents((prev) => {
      let next = [...prev];

      for (const op of operations) {
        if (op.op === "add") {
          const component = op.component as WorkspaceComponent;
          next = next.filter((c) => c.id !== component.id);
          const index = op.index as number | undefined;
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

  const handleMessage = useCallback((message: Record<string, unknown>) => {
    const type = message.type as string;
    if (type === "status") {
      setServerStatus(message.status as ServerStatus);
    } else if (type === "patch") {
      applyPatches(message.operations as Array<Record<string, unknown>>);
    }
  }, [applyPatches]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus("connecting");
    const ws = new WebSocket(`${WS_URL}/ws/session/${SESSION_ID}`);

    ws.onopen = () => {
      setConnectionStatus("connected");
      ws.send(JSON.stringify({ type: "sync_request" }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      reconnectTimerRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      setConnectionStatus("error");
    };

    wsRef.current = ws;
  }, [handleMessage]);

  const sendUtterance = useCallback((text: string, source: "voice" | "text" | "chip") => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "utterance",
      text,
      source,
      timestamp: new Date().toISOString(),
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

  return (
    <WorkspaceContext.Provider
      value={{ components, connectionStatus, serverStatus, sendUtterance, requestSync }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
