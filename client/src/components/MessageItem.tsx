import React, { useState } from 'react';
import { FileText, Image, MoreHorizontal, Download } from 'lucide-react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onReaction: (messageId: string, emoji: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar,
  onReaction
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const reactions = ['👍', '❤️', '😂', '😢', '😮', '😡'];

  const handleReaction = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactions(false);
  };

  const isImageFile = (filename: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-xl ${isOwn ? 'flex-row-reverse' : 'flex-row'} space-x-2`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <img
            src={message.user.avatar}
            alt={message.user.username}
            className="w-8 h-8 rounded-full mt-1"
          />
        )}
        {!showAvatar && !isOwn && <div className="w-8"></div>}

        {/* Message Content */}
        <div className={`relative ${isOwn ? 'mr-2' : 'ml-2'}`}>
          {/* Username and Time */}
          {showAvatar && (
            <div className={`flex items-center mb-1 space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <span className="text-sm font-medium text-slate-300">{message.user.username}</span>
              <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
            </div>
          )}

          {/* Message Bubble */}
          <div
            className={`relative rounded-2xl px-4 py-2 ${
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-slate-700 text-slate-100'
            }`}
          >
            {/* File Attachment */}
            {message.file && (
              <div className="mb-2">
                {isImageFile(message.file.filename) ? (
                  <img
                    src={`http://localhost:3001${message.file.url}`}
                    alt={message.file.filename}
                    className="max-w-xs rounded-lg cursor-pointer"
                    onClick={() => window.open(`http://localhost:3001${message.file.url}`, '_blank')}
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-black/20 rounded-lg">
                    <FileText className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{message.file.filename}</p>
                    </div>
                    <a
                      href={`http://localhost:3001${message.file.url}`}
                      download={message.file.filename}
                      className="p-1 hover:bg-black/20 rounded"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Message Text */}
            {message.text && (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            )}

            {/* Time for consecutive messages */}
            {!showAvatar && (
              <span className={`text-xs opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 ${
                isOwn ? 'left-2' : 'right-2'
              } text-slate-400`}>
                {formatTime(message.timestamp)}
              </span>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(message.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(message.reactions).map(([emoji, users]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center space-x-1 px-2 py-1 bg-slate-600 hover:bg-slate-500 rounded-full text-xs transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-slate-300">{users.length}</span>
                </button>
              ))}
            </div>
          )}

          {/* Reaction Button */}
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-600 hover:bg-slate-500 rounded-full ${
                isOwn ? 'left-2' : 'right-2'
              }`}
            >
              <MoreHorizontal className="w-4 h-4 text-white" />
            </button>

            {/* Reaction Picker */}
            {showReactions && (
              <div className={`absolute top-8 ${isOwn ? 'left-0' : 'right-0'} bg-slate-700 rounded-lg p-2 flex space-x-1 shadow-lg z-10 border border-slate-600`}>
                {reactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 hover:bg-slate-600 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};