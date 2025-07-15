import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, Message, PrivateMessage, Room } from '../types';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [privateMessages, setPrivateMessages] = useState<Record<string, PrivateMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, User[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);

  useEffect(() => {
    socketRef.current = io('http://localhost:3001');
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('authenticated', (userData: User) => {
      setUser(userData);
    });

    socket.on('rooms_list', (roomsList: Room[]) => {
      setRooms(roomsList);
    });

    socket.on('room_messages', (data: { roomId: string; messages: Message[] }) => {
      setMessages(prev => ({
        ...prev,
        [data.roomId]: data.messages
      }));
    });

    socket.on('new_message', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message]
      }));
      
      // Play notification sound
      if (message.user.id !== user?.id) {
        playNotificationSound();
      }
    });

    socket.on('new_private_message', (message: PrivateMessage) => {
      const conversationId = [message.sender.id, message.recipient.id].sort().join('-');
      setPrivateMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
      }));
      
      if (message.sender.id !== user?.id) {
        playNotificationSound();
      }
    });

    socket.on('private_messages', (data: { recipientId: string; messages: PrivateMessage[] }) => {
      const conversationId = [user?.id, data.recipientId].sort().join('-');
      setPrivateMessages(prev => ({
        ...prev,
        [conversationId]: data.messages
      }));
    });

    socket.on('users_updated', (data: { roomId: string; users: User[] }) => {
      setRooms(prev => prev.map(room => 
        room.id === data.roomId 
          ? { ...room, users: data.users, userCount: data.users.length }
          : room
      ));
      
      if (data.roomId === currentRoom) {
        setOnlineUsers(data.users);
      }
    });

    socket.on('user_typing', (data: { user: User; roomId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.roomId]: [...(prev[data.roomId] || []).filter(u => u.id !== data.user.id), data.user]
      }));
    });

    socket.on('user_stop_typing', (data: { user: User; roomId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.roomId]: (prev[data.roomId] || []).filter(u => u.id !== data.user.id)
      }));
    });

    socket.on('reaction_updated', (data: { messageId: string; reactions: Record<string, User[]> }) => {
      setMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(roomId => {
          newMessages[roomId] = newMessages[roomId].map(msg =>
            msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
          );
        });
        return newMessages;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYEJHfH8N2QQAoUXrTp66hVFApGn+DyvmweNjuP1vLLeSYE');
    audio.play().catch(() => {});
  };

  const authenticate = (username: string) => {
    if (socketRef.current) {
      socketRef.current.emit('authenticate', { username });
    }
  };

  const joinRoom = (roomId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join_room', roomId);
      setCurrentRoom(roomId);
    }
  };

  const sendMessage = (text: string, file?: { url: string; filename: string }) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('send_message', {
        text: text.trim(),
        roomId: currentRoom,
        file
      });
    }
  };

  const sendPrivateMessage = (recipientId: string, text: string, file?: { url: string; filename: string }) => {
    if (socketRef.current && text.trim()) {
      socketRef.current.emit('send_private_message', {
        recipientId,
        text: text.trim(),
        file
      });
    }
  };

  const startTyping = (roomId?: string, recipientId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { roomId, recipientId });
    }
  };

  const stopTyping = (roomId?: string, recipientId?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { roomId, recipientId });
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (socketRef.current) {
      socketRef.current.emit('add_reaction', {
        messageId,
        emoji,
        roomId: currentRoom
      });
    }
  };

  const getPrivateMessages = (recipientId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('get_private_messages', recipientId);
    }
  };

  return {
    isConnected,
    user,
    currentRoom,
    rooms,
    messages,
    privateMessages,
    typingUsers,
    onlineUsers,
    authenticate,
    joinRoom,
    sendMessage,
    sendPrivateMessage,
    startTyping,
    stopTyping,
    addReaction,
    getPrivateMessages
  };
};