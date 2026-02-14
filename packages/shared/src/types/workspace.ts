/**
 * Unique identifier for workspace components.
 * Generated client-side using nanoid for offline-first creation.
 */
export type ComponentId = string;

/**
 * The types of visual components that can exist in a workspace.
 * Kept minimal for reliability -- extend only when stable.
 */
export type ComponentType = "timeline" | "task" | "note";

/**
 * Priority levels for tasks. "normal" is the default.
 */
export type Priority = "urgent" | "high" | "normal" | "low";

/**
 * A single component in the workspace.
 * This is the source of truth stored in the Yjs CRDT document.
 */
export interface WorkspaceComponent {
  id: ComponentId;
  type: ComponentType;
  title: string;
  description?: string;
  priority: Priority;
  date?: string;
  timeSlot?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Metadata about the current workspace session.
 * Used for entity resolution and UI state.
 */
export interface WorkspaceMeta {
  activeId: ComponentId | null;
  lastEntities: Record<string, ComponentId>;
  sessionId: string;
}

/**
 * The full workspace document shape.
 * Maps directly to the Yjs shared types structure.
 */
export interface WorkspaceDocument {
  components: Record<ComponentId, WorkspaceComponent>;
  order: ComponentId[];
  meta: WorkspaceMeta;
}
