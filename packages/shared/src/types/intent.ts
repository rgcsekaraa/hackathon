import type { ComponentId, Priority } from "./workspace";

/**
 * Intent types the AI can emit.
 * The LLM outputs intents, NOT final operations -- the server
 * resolves targets deterministically to avoid hallucinated IDs.
 */
export type IntentType =
  | "create_plan"
  | "create_task"
  | "create_note"
  | "set_priority"
  | "move_item"
  | "delete_item"
  | "update_item"
  | "mark_complete";

/**
 * Base shape for all intents.
 */
export interface BaseIntent {
  type: IntentType;
}

/**
 * Create a plan with multiple items at once.
 * Triggered by utterances like "Tomorrow: Smith reno morning, Henderson leak after lunch".
 */
export interface CreatePlanIntent extends BaseIntent {
  type: "create_plan";
  items: Array<{
    title: string;
    description?: string;
    date?: string;
    timeSlot?: string;
    priority?: Priority;
  }>;
}

/**
 * Create a single task.
 */
export interface CreateTaskIntent extends BaseIntent {
  type: "create_task";
  title: string;
  description?: string;
  date?: string;
  timeSlot?: string;
  priority?: Priority;
}

/**
 * Create a note.
 */
export interface CreateNoteIntent extends BaseIntent {
  type: "create_note";
  title: string;
  description?: string;
}

/**
 * Change priority of an existing item.
 * "target" is a natural language reference the server resolves.
 */
export interface SetPriorityIntent extends BaseIntent {
  type: "set_priority";
  target: string;
  priority: Priority;
}

/**
 * Move an item to a new position or time slot.
 */
export interface MoveItemIntent extends BaseIntent {
  type: "move_item";
  target: string;
  position?: "first" | "last" | number;
  date?: string;
  timeSlot?: string;
}

/**
 * Delete an item from the workspace.
 */
export interface DeleteItemIntent extends BaseIntent {
  type: "delete_item";
  target: string;
}

/**
 * Update an item's properties.
 */
export interface UpdateItemIntent extends BaseIntent {
  type: "update_item";
  target: string;
  title?: string;
  description?: string;
  date?: string;
  timeSlot?: string;
}

/**
 * Mark an item as complete or incomplete.
 */
export interface MarkCompleteIntent extends BaseIntent {
  type: "mark_complete";
  target: string;
  completed: boolean;
}

/**
 * Union of all possible intents.
 */
export type Intent =
  | CreatePlanIntent
  | CreateTaskIntent
  | CreateNoteIntent
  | SetPriorityIntent
  | MoveItemIntent
  | DeleteItemIntent
  | UpdateItemIntent
  | MarkCompleteIntent;
