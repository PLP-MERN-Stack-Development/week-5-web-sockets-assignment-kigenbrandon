export interface User {
  id: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen: Date;
  currentRoom: string;
}

export interface Message {
  id: string;
  text: string;
  user: User;
  timestamp: Date;
  roomId: string;
  file?: {
    url: string;
    filename: string;
  };
  reactions: Record<string, User[]>;
}

export interface PrivateMessage {
  id: string;
  text: string;
  sender: User;
  recipient: User;
  timestamp: Date;
  file?: {
    url: string;
    filename: string;
  };
}

export interface Room {
  id: string;
  name: string;
  description: string;
  users: User[];
  userCount: number;
}

export interface ChatState {
  user: User | null;
  currentRoom: string;
  rooms: Room[];
  messages: Record<string, Message[]>;
  privateMessages: Record<string, PrivateMessage[]>;
  typingUsers: Record<string, User[]>;
  onlineUsers: User[];
  isConnected: boolean;
}