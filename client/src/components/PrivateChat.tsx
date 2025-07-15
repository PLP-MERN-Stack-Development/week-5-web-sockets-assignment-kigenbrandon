import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { User, PrivateMessage } from '../types';

interface PrivateChatProps {
  user: User;
  currentUser: User;
  messages: PrivateMessage[];
  onSendMessage: (text: string, file?: { url: string; filename: string }) => void;
  onClose: () => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export const PrivateChat: React.FC<PrivateChatProps> = ({
  user,
  currentUser,
  messages,
  onSendMessage,
  onClose,
  onTypingStart,
  onTypingStop
}) => {
  // Convert private messages to regular message format for MessageList
  const formattedMessages = messages.map(msg => ({
    ...msg,
    user: msg.sender,
    roomId: 'private',
    reactions: {}
  }));

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white transition-colors lg:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <h3 className="text-white font-medium">{user.username}</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-400">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors hidden lg:block"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <MessageList
        messages={formattedMessages}
        currentUser={currentUser}
        typingUsers={[]}
        onReaction={() => {}} // Private messages don't have reactions yet
      />

      {/* Input */}
      <MessageInput
        onSendMessage={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </div>
  );
};