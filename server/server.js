import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory storage (replace with database in production)
const users = new Map();
const rooms = new Map();
const messages = new Map();
const privateMessages = new Map();

// Initialize default rooms
rooms.set('general', {
  id: 'general',
  name: 'General',
  description: 'General discussion for everyone',
  users: new Set(),
  messages: []
});

rooms.set('random', {
  id: 'random',
  name: 'Random',
  description: 'Random conversations and fun topics',
  users: new Set(),
  messages: []
});

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl, filename: req.file.originalname });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User authentication
  socket.on('authenticate', (userData) => {
    const user = {
      id: socket.id,
      username: userData.username,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.username}&background=3B82F6&color=fff`,
      status: 'online',
      lastSeen: new Date(),
      currentRoom: 'general'
    };
    
    users.set(socket.id, user);
    socket.join('general');
    
    const room = rooms.get('general');
    room.users.add(socket.id);
    
    // Send user info back
    socket.emit('authenticated', user);
    
    // Send existing messages in general room
    socket.emit('room_messages', {
      roomId: 'general',
      messages: room.messages.slice(-50) // Send last 50 messages
    });
    
    // Notify others about new user
    socket.to('general').emit('user_joined', {
      user: user,
      roomId: 'general'
    });
    
    // Send updated user list
    const roomUsers = Array.from(room.users).map(userId => users.get(userId)).filter(Boolean);
    io.to('general').emit('users_updated', { roomId: 'general', users: roomUsers });
    
    // Send available rooms
    socket.emit('rooms_list', Array.from(rooms.values()).map(room => ({
      ...room,
      users: Array.from(room.users).map(userId => users.get(userId)).filter(Boolean),
      userCount: room.users.size
    })));
  });

  // Join room
  socket.on('join_room', (roomId) => {
    const user = users.get(socket.id);
    if (!user) return;

    // Leave current room
    const currentRoom = rooms.get(user.currentRoom);
    if (currentRoom) {
      socket.leave(user.currentRoom);
      currentRoom.users.delete(socket.id);
      socket.to(user.currentRoom).emit('user_left', {
        user: user,
        roomId: user.currentRoom
      });
    }

    // Join new room
    const newRoom = rooms.get(roomId);
    if (newRoom) {
      socket.join(roomId);
      newRoom.users.add(socket.id);
      user.currentRoom = roomId;
      
      // Send room messages
      socket.emit('room_messages', {
        roomId: roomId,
        messages: newRoom.messages.slice(-50)
      });
      
      // Notify others
      socket.to(roomId).emit('user_joined', {
        user: user,
        roomId: roomId
      });
      
      // Send updated user lists
      const oldRoomUsers = currentRoom ? Array.from(currentRoom.users).map(userId => users.get(userId)).filter(Boolean) : [];
      const newRoomUsers = Array.from(newRoom.users).map(userId => users.get(userId)).filter(Boolean);
      
      if (currentRoom) {
        io.to(user.currentRoom).emit('users_updated', { roomId: currentRoom.id, users: oldRoomUsers });
      }
      io.to(roomId).emit('users_updated', { roomId: roomId, users: newRoomUsers });
    }
  });

  // Send message
  socket.on('send_message', (messageData) => {
    const user = users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      text: messageData.text,
      user: user,
      timestamp: new Date(),
      roomId: messageData.roomId,
      file: messageData.file || null,
      reactions: {}
    };

    const room = rooms.get(messageData.roomId);
    if (room) {
      room.messages.push(message);
      io.to(messageData.roomId).emit('new_message', message);
    }
  });

  // Private message
  socket.on('send_private_message', (data) => {
    const sender = users.get(socket.id);
    const recipient = Array.from(users.values()).find(u => u.id === data.recipientId);
    
    if (!sender || !recipient) return;

    const message = {
      id: uuidv4(),
      text: data.text,
      sender: sender,
      recipient: recipient,
      timestamp: new Date(),
      file: data.file || null
    };

    const conversationId = [sender.id, recipient.id].sort().join('-');
    if (!privateMessages.has(conversationId)) {
      privateMessages.set(conversationId, []);
    }
    
    privateMessages.get(conversationId).push(message);
    
    // Send to both users
    socket.emit('new_private_message', message);
    socket.to(recipient.id).emit('new_private_message', message);
  });

  // Typing indicators
  socket.on('typing_start', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (data.roomId) {
      socket.to(data.roomId).emit('user_typing', {
        user: user,
        roomId: data.roomId
      });
    } else if (data.recipientId) {
      socket.to(data.recipientId).emit('user_typing_private', {
        user: user,
        recipientId: data.recipientId
      });
    }
  });

  socket.on('typing_stop', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    if (data.roomId) {
      socket.to(data.roomId).emit('user_stop_typing', {
        user: user,
        roomId: data.roomId
      });
    } else if (data.recipientId) {
      socket.to(data.recipientId).emit('user_stop_typing_private', {
        user: user,
        recipientId: data.recipientId
      });
    }
  });

  // Message reactions
  socket.on('add_reaction', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const room = rooms.get(data.roomId);
    if (room) {
      const message = room.messages.find(m => m.id === data.messageId);
      if (message) {
        if (!message.reactions[data.emoji]) {
          message.reactions[data.emoji] = [];
        }
        
        const existingIndex = message.reactions[data.emoji].findIndex(u => u.id === user.id);
        if (existingIndex === -1) {
          message.reactions[data.emoji].push(user);
        } else {
          message.reactions[data.emoji].splice(existingIndex, 1);
          if (message.reactions[data.emoji].length === 0) {
            delete message.reactions[data.emoji];
          }
        }
        
        io.to(data.roomId).emit('reaction_updated', {
          messageId: data.messageId,
          reactions: message.reactions
        });
      }
    }
  });

  // Get private messages
  socket.on('get_private_messages', (recipientId) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    const conversationId = [sender.id, recipientId].sort().join('-');
    const messages = privateMessages.get(conversationId) || [];
    
    socket.emit('private_messages', {
      recipientId: recipientId,
      messages: messages.slice(-50)
    });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Remove from current room
      const room = rooms.get(user.currentRoom);
      if (room) {
        room.users.delete(socket.id);
        socket.to(user.currentRoom).emit('user_left', {
          user: user,
          roomId: user.currentRoom
        });
        
        const roomUsers = Array.from(room.users).map(userId => users.get(userId)).filter(Boolean);
        io.to(user.currentRoom).emit('users_updated', { roomId: user.currentRoom, users: roomUsers });
      }
      
      users.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});