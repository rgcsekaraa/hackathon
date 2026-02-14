import React, { createContext, useContext, type ReactNode } from "react";

interface VoiceContextState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  agentState: "listening" | "speaking" | "thinking" | "idle";
}

const VoiceContext = createContext<VoiceContextState | null>(null);

export function useVoice(): VoiceContextState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const connect = async () => {
    console.warn("Voice is not supported on web yet.");
    alert("Voice features are currently limited to mobile app.");
  };

  const disconnect = async () => {};

  return (
    <VoiceContext.Provider
      value={{
        connect,
        disconnect,
        isConnecting: false,
        isConnected: false,
        error: null,
        agentState: "idle",
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}
