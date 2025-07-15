import React, { useState } from 'react';
import { Hash, Users, MessageSquare, Settings, Search, UserPlus } from 'lucide-react';
import { Room, User } from '../types';

interface ChatSidebarProps {
  rooms: Room[];
  currentRoom: string;
  user: User | null;
  onlineUsers: User[];
  onRoomChange: (roomId: string) => void;
  onPrivateMessageClick: (userId: string) => void;
  onLogout: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  rooms,
  currentRoom,
  user,
  onlineUsers,
  onRoomChange,
  onPrivateMessageClick,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'users'>('rooms');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = onlineUsers.filter(u => 
    u.id !== user?.id && u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <img 
            src={user?.avatar} 
            alt={user?.username}
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-medium truncate">{user?.username}</h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-slate-400">Online</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Logout"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'rooms'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4 inline mr-2" />
          Rooms
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            activeTab === 'users'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rooms' ? (
          <div className="p-2 space-y-1">
            {filteredRooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomChange(room.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  currentRoom === room.id
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4" />
                  <span className="font-medium">{room.name}</span>
                  <span className="text-xs opacity-75">({room.userCount})</span>
                </div>
                <p className="text-xs opacity-75 mt-1 truncate">{room.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => onPrivateMessageClick(user.id)}
                className="w-full text-left p-3 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.username}</p>
                    <p className="text-xs text-slate-400">Online</p>
                  </div>
                  <MessageSquare className="w-4 h-4 opacity-75" />
                </div>
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};