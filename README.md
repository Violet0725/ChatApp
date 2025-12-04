# Real-Time Chat Application

A full-stack real-time chat application built with modern technologies including **React**, **TypeScript**, **Socket.io**, **Node.js**, **Express**, and **MongoDB**.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## Features

### Core Features
- **Real-time messaging** with Socket.io
- **JWT Authentication** with secure password hashing (bcrypt)
- **Multi-channel support** - Create and join different chat rooms
- **Online presence** - See who's currently online globally
- **Typing indicators** - Know when someone is typing
- **Message persistence** - Messages stored in MongoDB
- **Responsive design** - Discord-inspired UI with TailwindCSS

### New Features ✨
- **Direct Messages (DMs)** - Private 1-on-1 conversations with any online user
- **Message Reactions** - React to messages with emojis (👍❤️😂😮😢🔥👏🎉)
- **File & Image Upload** - Share images and documents in chat
- **Message Search** - Search through message history
- **Guest Mode** - Quick join without registration for testing

### Technical Highlights
- **TypeScript** throughout client codebase
- **Zustand** for state management (lightweight Redux alternative)
- **Zod** for input validation on server
- **Unit Tests** with Jest & Supertest
- **Component-based architecture** with proper separation of concerns
- **Docker support** with multi-stage builds
- **CI/CD pipeline** with GitHub Actions
- **Health check endpoints** for monitoring
- **Graceful shutdown** handling

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 | UI Library |
| TypeScript | Type Safety |
| Vite | Build Tool |
| Zustand | State Management |
| TailwindCSS | Styling |
| Socket.io-client | Real-time Communication |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express 5 | Web Framework |
| Socket.io | Real-time Engine |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| Bcrypt | Password Hashing |
| Zod | Validation |

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Auth/      # Authentication UI
│   │   │   └── Chat/      # Chat UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API & Socket services
│   │   ├── store/         # Zustand state stores
│   │   ├── types/         # TypeScript types
│   │   └── config/        # Configuration
│   ├── Dockerfile
│   └── nginx.conf
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── socket/        # Socket.io handlers
│   └── Dockerfile
│
├── docker-compose.yml      # Production deployment
├── docker-compose.dev.yml  # Development (MongoDB only)
└── .github/workflows/      # CI/CD pipeline
```

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/chat-app.git
   cd chat-app
   ```

2. **Install dependencies**
   ```bash
   # Server
   cd server && npm install
   
   # Client
   cd ../client && npm install
   ```

3. **Configure environment variables**
   
   Create `server/.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017/chatapp
   JWT_SECRET=your-super-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret-key
   PORT=3001
   CLIENT_URL=http://localhost:5173
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Start MongoDB (if using Docker)
   docker-compose -f docker-compose.dev.yml up
   
   # Terminal 2 - Start backend
   cd server && npm run dev
   
   # Terminal 3 - Start frontend
   cd client && npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:5173`

## Docker Deployment

### Production
```bash
# Build and run all services
docker-compose up --build

# Access the app at http://localhost
```

### Development (MongoDB only)
```bash
docker-compose -f docker-compose.dev.yml up
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/channels` | Get all channels |
| POST | `/api/channels` | Create channel |
| GET | `/api/channels/:name/messages` | Get channel messages |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload single file |
| POST | `/api/upload/multiple` | Upload multiple files |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search?q=query` | Search messages |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Socket Events

### Client → Server
- `join_room` - Join a channel
- `send_message` - Send a message
- `create_channel` - Create new channel
- `typing` - Typing indicator
- `edit_message` - Edit a message
- `delete_message` - Delete a message
- `add_reaction` - Add/toggle emoji reaction
- `search_messages` - Search message history
- `start_dm` - Start direct message conversation
- `send_dm` - Send direct message
- `get_conversations` - Get user's DM conversations

### Server → Client
- `update_channels` - Channel list updated
- `load_messages` - Message history
- `receive_message` - New message
- `update_user_list` - Online users changed
- `display_typing` - User is typing
- `message_edited` - Message was edited
- `message_deleted` - Message was deleted
- `message_reaction_updated` - Reaction added/removed
- `search_results` - Search results returned
- `dm_started` - DM conversation opened
- `receive_dm` - New direct message
- `dm_notification` - DM notification for offline view
- `conversations_list` - User's conversations list

## Testing

```bash
# Run unit tests
cd server && npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Interview Talking Points

This project demonstrates:

1. **Full-stack development** with modern JavaScript/TypeScript
2. **Real-time systems** using WebSockets (Socket.io)
3. **Authentication & Security** - JWT tokens, password hashing, input validation
4. **State management** - Zustand for predictable client state
5. **Database design** - MongoDB schemas with proper indexing
6. **Code organization** - Clean architecture with separation of concerns
7. **DevOps practices** - Docker, CI/CD, health checks
8. **Type safety** - TypeScript for catch errors at compile time
9. **File handling** - Multer for file uploads with type validation
10. **Testing** - Jest unit tests for API endpoints and models

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

**Eric Zhou**

---

*Built with ❤️ using React, Node.js, and Socket.io*
