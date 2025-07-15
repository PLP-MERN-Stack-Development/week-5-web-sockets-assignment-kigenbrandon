import React, { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { Message, User } from '../types';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  typingUsers: User[];
  onReaction: (messageId: string, emoji: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  typingUsers,
  onReaction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isConsecutive = 
          index > 0 && 
          messages[index - 1].user.id === message.user.id &&
          new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() < 60000;

        return (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.user.id === currentUser?.id}
            showAvatar={!isConsecutive}
            onReaction={onReaction}
          />
        );
      })}
      
      {typingUsers.length > 0 && (
        <TypingIndicator users={typingUsers} />
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};