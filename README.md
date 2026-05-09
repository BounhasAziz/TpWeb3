## CvTech - Features & Technologies

**CvTech** is a comprehensive CV management platform built with NestJS featuring real-time communication, event-driven architecture, and external integrations.

### Key Technologies Used

#### 1. **WebSockets (Socket.IO)** - Real-Time Chat

- **Location**: `src/chat/chat.gateway.ts`
- **Purpose**: Enables bidirectional real-time communication between clients
- **Features**:
  - Join/leave chat rooms (rooms can be linked to CV IDs, e.g., `cv-12`)
  - Send and receive messages instantly
  - Reply to specific messages (threads)
  - Add emoji reactions to messages
  - Real-time typing indicators
  - Message history retrieval
- **How it works**: Client connects via `socket.io`, emits events (`join`, `sendMessage`, `replyToMessage`, `reactToMessage`), and receives live updates via `receiveMessage`, `receiveReply`, `reactionUpdated` events

**Example client usage**:

```js
const socket = io('http://localhost:3000');
socket.emit('join', { room: 'cv-1', username: 'john' });
socket.emit('sendMessage', {
  room: 'cv-1',
  username: 'john',
  userId: 1,
  content: 'hello',
});
socket.on('receiveMessage', (msg) => console.log(msg));
```

#### 2. **Server-Sent Events (SSE)** - Push Notifications

- **Location**: `src/sse/sse.service.ts`, `src/sse/sse.controller.ts`
- **Purpose**: Pushes real-time notifications to clients via HTTP long-polling
- **Features**:
  - One-way server → client communication (simpler than WebSocket for notifications)
  - Connected users receive CV change notifications
  - Role-based filtering:
    - **ADMIN**: receives all CV events
    - **USER**: receives only their own CV events
  - Persists in-memory client connections
- **How it works**: Client opens `GET /events/stream` connection, server maintains it open and writes events as `data: {...}\n\n`

#### 3. **Webhooks** - External Server Integration

- **Location**: `src/webhook/webhook.service.ts`, `src/webhook/webhook.controller.ts`
- **Purpose**: Notifies external servers (dashboards, CRMs, integrations) when CV data changes
- **Features**:
  - Admin can register webhook URLs via `POST /webhooks`
  - Filtered by event type (CREATED, UPDATED, DELETED)
  - Cryptographic signing using **HMAC-SHA256** for security
  - Automatic retry logic (catch errors gracefully)
- **How it works**:
  1. CV event occurs → `cv.event` is emitted
  2. WebhookService fetches all active webhooks
  3. For each matching webhook, creates signed POST request
  4. Sends to external URL with `X-Webhook-Signature` header
  5. External server verifies signature using the shared secret

### How These Technologies Work Together

1. **CV Created** → WebhookService notifies external dashboard → Dashboard updates in real-time
2. **Chat Active** → Multiple users join room → Share messages & reactions in real-time via WebSocket
3. **Changes Happen** → SSE pushes notifications to authorized users → Dashboard updates instantly

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

```

## Run tests

```bash
# unit tests
$ npm run test


```
