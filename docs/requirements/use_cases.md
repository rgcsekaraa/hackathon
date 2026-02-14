# Use Cases

This document describes the primary use cases and interaction flows for Sophiie Space.

## Use Case 1: Voice-Driven Task Creation

**Actor**: User
**Trigger**: User wants to quickly record a task without typing.

**Flow**:
1. User clicks the "Voice Capture" button on the dashboard.
2. System activates the microphone and shows a listening indicator.
3. User speaks: "Remind me to review the backend API at 4 PM."
4. System processes the audio stream via Web Speech API.
5. AI parsing logic identifies the intent (Task Creation), subject (Review backend API), and time (4 PM).
6. System adds a new task card to the workspace.
7. System provides a tonal confirmation tone and visual snackbar.

**Outcome**: Task is created and synced across all active sessions.

## Use Case 2: Real-time Multi-Device Sync

**Actor**: User (on multiple devices)
**Trigger**: User updates a task on their mobile device.

**Flow**:
1. User opens the dashboard on their laptop and phone.
2. User marks a task as "Completed" on the mobile interface.
3. Mobile client sends an 'action' message via WebSocket to the server.
4. Server updates the database and broadcasts a 'patch' operation to all active sessions for that user.
5. Desktop client receives the patch and updates the UI state instantly without a page refresh.

**Outcome**: Consistent state across all devices.

## Use Case 3: Interactive AI Workspace Chat

**Actor**: User
**Trigger**: User needs context-aware assistance.

**Flow**:
1. User opens the AI Chat Sidebar.
2. User types: "What are my high-priority tasks for today?"
3. Frontend sends the query to the backend API.
4. Backend retrieves the user's task list from the database.
5. AI processes the data and generates a summarized response.
6. The response is displayed with M3 styling in the sidebar.

**Outcome**: User receives helpful, contextual information from the AI.
