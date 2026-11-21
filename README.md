# White Pad

White Pad is a real-time collaborative whiteboard application. Users can create accounts, create or join whiteboard sessions, draw together, and share changes through Socket.IO.

## Features

- User registration, login, and JWT-based authentication
- Create, list, open, join, and delete whiteboard sessions
- Public invite-code lookup for joining a session
- Pen, highlighter, eraser, and pan tools
- Custom colors, stroke sizes, opacity, zoom, and canvas panning
- Undo, redo, and clear-canvas actions
- Real-time stroke, cursor, and participant updates
- MongoDB persistence for users, sessions, and strokes

## Technology

- **Client:** React, Vite, React Router, Axios, and `socket.io-client`
- **Server:** Node.js, Express, Socket.IO, Mongoose, MongoDB, JWT, and bcryptjs
- **Security and middleware:** Helmet, CORS, JSON request parsing, and centralized error handling

## Repository structure

```text
WhitePad/
|-- client/                 # React/Vite frontend
|   `-- src/
|       |-- components/     # Canvas, toolbar, and user list
|       |-- contexts/       # Authentication and canvas state
|       |-- pages/          # Home, login, register, and whiteboard pages
|       `-- services/       # REST API and Socket.IO clients
|-- server/                 # Express/Socket.IO backend
|   `-- src/
|       |-- config/         # Environment and MongoDB configuration
|       |-- controllers/    # Authentication and session logic
|       |-- middleware/     # Authentication and error handling
|       |-- models/         # User, Session, and Stroke schemas
|       |-- routes/         # REST endpoints
|       `-- socket/         # Real-time collaboration handlers
|-- package.json            # Root development scripts
`-- README.md
```

## Prerequisites

- Node.js 20 or newer is recommended for the Vite 7 toolchain.
- npm
- A running MongoDB instance, local or hosted

## Installation

From the repository root:

```bash
npm run install:all
```

This installs dependencies for the root workspace, the server, and the client.

## Configuration

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/whitepad
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

All values have development defaults in `server/src/config/index.js`, but `JWT_SECRET` should always be explicitly set outside local development.

## Running the application

Make sure MongoDB is running, then start both applications from the repository root:

```bash
npm run dev
```

The default URLs are:

- Frontend: <http://localhost:5173>
- Backend health check: <http://localhost:5000/health>

The Vite development server proxies `/api` and `/socket.io` requests to the backend at `http://localhost:5000`.

To run either side separately:

```bash
npm run dev:server
npm run dev:client
```

To run the backend without nodemon:

```bash
npm start
```

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install root, server, and client dependencies |
| `npm run dev` | Start the server and client concurrently |
| `npm run dev:server` | Start the backend with nodemon |
| `npm run dev:client` | Start the Vite development server |
| `npm run build` | Create a production build of the client |
| `npm start` | Start the backend with Node.js |
| `cd client && npm run lint` | Run ESLint on the client |
| `cd client && npm run preview` | Preview the built client locally |

## REST API

Protected endpoints require an `Authorization` header in this format:

```http
Authorization: Bearer <jwt-token>
```

### Health

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Returns the server status and timestamp |

### Authentication

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Register with `email`, `password`, and `name` |
| `POST` | `/api/auth/login` | No | Log in with `email` and `password` |
| `GET` | `/api/auth/me` | Yes | Return the authenticated user |

### Sessions

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/sessions` | Yes | Create a whiteboard session |
| `GET` | `/api/sessions/my-sessions` | Yes | List sessions created by the current user |
| `GET` | `/api/sessions/invite/:inviteCode` | No | Resolve an invite code to a session |
| `GET` | `/api/sessions/:sessionId` | Optional | Get session metadata |
| `GET` | `/api/sessions/:sessionId/history` | Optional | Get non-deleted strokes |
| `DELETE` | `/api/sessions/:sessionId` | Yes | Delete a session and its strokes |

## Real-time collaboration

The client connects to Socket.IO using the JWT in the handshake auth object:

```js
io('/', { auth: { token } });
```

### Client-to-server events

| Event | Payload | Purpose |
| --- | --- | --- |
| `join-session` | `{ sessionId, userName }` | Join a whiteboard room |
| `draw-stroke` | `{ sessionId, stroke }` | Save and broadcast a stroke |
| `cursor-move` | `{ sessionId, position }` | Broadcast cursor movement |
| `undo` | `{ sessionId, strokeId }` | Mark a stroke as deleted |
| `redo` | `{ sessionId, strokeId }` | Restore a deleted stroke |
| `clear-canvas` | `{ sessionId }` | Mark all session strokes as deleted |

### Server-to-client events

`session-state`, `user-joined`, `user-left`, `stroke-drawn`, `cursor-update`, `stroke-undone`, `stroke-redone`, `canvas-cleared`, and `error` are emitted as collaboration state changes or validation errors occur.

## Data model

- **User:** email, hashed password, display name, preferences, and login timestamps
- **Session:** UUID, name, owner, invite code, visibility, user limit, canvas settings, and activity timestamps
- **Stroke:** session and user references, tool, points, color, width, opacity, and soft-delete metadata

## Typical user flow

1. Register or sign in at `/register` or `/login`.
2. Create a whiteboard from the home page.
3. Open the generated whiteboard and share its URL or invite code.
4. Draw on the canvas; strokes are persisted by the server and sent to other connected users.
5. Use undo, redo, or clear to update the shared canvas.

## Current implementation notes

- The repository currently has client linting and production-build commands, but no automated unit-test script yet.
- Socket connections are allowed without a JWT for public-session access. The `Stroke` schema still requires a `userId`, so anonymous users may need an authenticated token before their strokes can be persisted.
- Several server participant events currently use the field name `oderId`, while parts of the client expect `userId`. This should be aligned before relying on participant and cursor updates in production.
- Replace the development JWT fallback and configure a production MongoDB URI before deployment.

## Validation checklist

Before opening a pull request or deploying, run:

```bash
cd client
npm run lint
npm run build
```

Then start MongoDB and the server, verify `GET /health`, register a user, create a session, and test drawing from two browser windows.

## License

No license has been specified in the repository yet.
