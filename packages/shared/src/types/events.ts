import type { Intent } from "./intent";
import type { WorkspaceComponent } from "./workspace";

/**
 * Messages sent from client to server over WebSocket.
 */
export type ClientMessage =
  | UtteranceMessage
  | ActionMessage
  | SyncRequestMessage;

/**
 * User speech or text input sent for AI processing.
 */
export interface UtteranceMessage {
  type: "utterance";
  text: string;
  source: "voice" | "text" | "chip";
  timestamp: string;
}

/**
 * Direct user action (drag reorder, tap edit, swipe delete).
 * These bypass AI and apply directly to the CRDT doc.
 */
export interface ActionMessage {
  type: "action";
  action: "reorder" | "edit" | "delete" | "toggle_complete";
  componentId: string;
  payload?: Record<string, unknown>;
}

/**
 * Client requests a full state sync.
 */
export interface SyncRequestMessage {
  type: "sync_request";
}

/**
 * Messages sent from server to client over WebSocket.
 */
export type ServerMessage =
  | IntentParsedMessage
  | PatchMessage
  | StatusMessage
  | ErrorMessage;

/**
 * Server has parsed an intent from the user's utterance.
 * Sent for transparency -- the client can show what the AI understood.
 */
export interface IntentParsedMessage {
  type: "intent_parsed";
  intents: Intent[];
}

/**
 * Server has resolved intents into workspace patches.
 * These are the actual changes to apply to the CRDT doc.
 */
export interface PatchMessage {
  type: "patch";
  operations: PatchOperation[];
}

export type PatchOperation =
  | { op: "add"; component: WorkspaceComponent; index?: number }
  | { op: "remove"; componentId: string }
  | { op: "update"; componentId: string; changes: Partial<WorkspaceComponent> }
  | { op: "reorder"; componentId: string; newIndex: number };

/**
 * Server status updates for UI indicators.
 */
export interface StatusMessage {
  type: "status";
  status: "listening" | "thinking" | "updating" | "synced" | "error";
  message?: string;
}

/**
 * Server error message.
 */
export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}
