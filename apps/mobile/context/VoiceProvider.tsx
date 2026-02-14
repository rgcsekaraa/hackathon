import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  LiveKitRoom,
  useRoomContext,
  useConnectionState,
} from "@livekit/react-native";
import { ConnectionState } from "livekit-client";
import { registerGlobals } from "@livekit/react-native";
import { useAuth } from "./AuthProvider";

// Register WebRTC globals
registerGlobals();

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

interface VoiceContextState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  agentState: "listening" | "speaking" | "thinking" | "idle"; // specialized state
}

const VoiceContext = createContext<VoiceContextState | null>(null);

export function useVoice(): VoiceContextState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { token: authToken } = useAuth();
  const [roomToken, setRoomToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentState, setAgentState] = useState<"listening" | "speaking" | "thinking" | "idle">("idle");

  // 2. Connect to LiveKit Room
  const connect = useCallback(async () => {
    if (!authToken) {
      setError("Not authenticated yet");
      return;
    }
    setIsConnecting(true);
    setError(null);

    try {
      console.log("Fetching LiveKit token...");
      const res = await fetch(`${API_URL}/api/voice/token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) throw new Error("Failed to get LiveKit token");

      const data = await res.json();
      setRoomToken(data.token);
      setWsUrl(data.url);
      console.log("LiveKit token received for room:", data.room_name);
    } catch (err) {
      console.error(err);
      setError("Failed to connect to voice server");
      setIsConnecting(false);
    }
  }, [authToken]);

  const disconnect = useCallback(async () => {
    setRoomToken("");
    setIsConnecting(false);
    setAgentState("idle");
  }, []);

  // Compute stats based on LiveKitRoom state?
  // We can't access `useConnectionState` here because it must be INSIDE <LiveKitRoom>.
  // So we wrap the children in an inner component?
  // OR we just provide the outer logic, and the hooks inside children will work.
  // BUT `useVoice` is used by UI components.
  // The UI components will be inside `VoiceProvider`, which is inside `LiveKitRoom`?
  // Yes, `VoiceProvider` RENDERS `LiveKitRoom`.

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={roomToken}
      connect={!!roomToken && !!wsUrl}
      audio={true}
      video={false}
      options={{
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        publishDefaults: {
          dtx: true,
        },
      }}
      onError={(err) => {
        console.error("LiveKit Room Error:", err);
        setError(err.message);
        setIsConnecting(false);
      }}
    >
      <InnerVoiceProvider
        connect={connect}
        disconnect={disconnect}
        isConnecting={isConnecting}
        error={error}
        agentState={agentState}
        setAgentState={setAgentState}
      >
        {children}
      </InnerVoiceProvider>
    </LiveKitRoom>
  );
}

// Inner component to access LiveKit context
function InnerVoiceProvider({
  children,
  connect,
  disconnect,
  isConnecting,
  error,
  agentState,
  setAgentState,
}: {
  children: ReactNode;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  agentState: any;
  setAgentState: (s: any) => void;
}) {
  const roomState = useConnectionState();
  const isConnected = roomState === ConnectionState.Connected;

  // We can listen to events here to update `agentState` (e.g. VAD active)
  // But for now, simple connection state.

  // Reset connecting state when connected/disconnected
  useEffect(() => {
    if (roomState === ConnectionState.Connected || roomState === ConnectionState.Disconnected) {
      // isConnecting managed by parent is for the *token fetch* phase mostly.
      // But LiveKit also has a connecting state.
    }
  }, [roomState]);

  return (
    <VoiceContext.Provider
      value={{
        connect,
        disconnect,
        isConnecting: isConnecting || roomState === ConnectionState.Connecting,
        isConnected,
        error,
        agentState: isConnected ? "listening" : "idle", // Simplify for now
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}
