import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { ChatSidebar } from './components/ChatSidebar';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { PrivateChat } from './components/PrivateChat';
import { useSocket } from './hooks/useSocket';
import { Hash, Users, Wifi, WifiOff } from 'lucide-react';

function App() {
  const {
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
  } = useSocket();

  const [activePrivateChat, setActivePrivateChat] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (username: string) => {
    authenticate(username);
  };

  const handlePrivateMessageClick = (userId: string) => {
    setActivePrivateChat(userId);
    getPrivateMessages(userId);
    setIsSidebarOpen(false);
  };

  const handlePrivateMessageSend = (text: string, file?: { url: string; filename: string }) => {
    if (activePrivateChat) {
      sendPrivateMessage(activePrivateChat, text, file);
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const currentRoomData = rooms.find(room => room.id === currentRoom);
  const currentPrivateUser = onlineUsers.find(u => u.id === activePrivateChat);
  const currentPrivateMessages = activePrivateChat 
    ? privateMessages[[user.id, activePrivateChat].sort().join('-')] || []
    : [];

  return (
    <div className="h-screen bg-slate-900 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:relative lg:block z-50 h-full transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <ChatSidebar
          rooms={rooms}
          currentRoom={currentRoom}
          user={user}
          onlineUsers={onlineUsers}
          onRoomChange={(roomId) => {
            joinRoom(roomId);
            setActivePrivateChat(null);
            setIsSidebarOpen(false);
          }}
          onPrivateMessageClick={handlePrivateMessageClick}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 text-slate-400 hover:text-white transition-colors lg:hidden"
              >
                <Users className="w-5 h-5" />
              </button>
              {activePrivateChat && currentPrivateUser ? (
                <div className="flex items-center space-x-2">
                  <img
                    src={currentPrivateUser.avatar}
                    alt={currentPrivateUser.username}
                    className="w-6 h-6 rounded-full"
                  />
                  <h1 className="text-xl font-semibold text-white">
                    {currentPrivateUser.username}
                  </h1>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Hash className="w-6 h-6 text-slate-400" />
                  <h1 className="text-xl font-semibold text-white">
                    {currentRoomData?.name || 'Chat'}
                  </h1>
                  {currentRoomData && (
                    <span className="text-sm text-slate-400">
                      ({currentRoomData.userCount} members)
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-green-500">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Connected</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-red-500">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm hidden sm:inline">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Content */}
        {activePrivateChat && currentPrivateUser ? (
          <PrivateChat
            user={currentPrivateUser}
            currentUser={user}
            messages={currentPrivateMessages}
            onSendMessage={handlePrivateMessageSend}
            onClose={() => setActivePrivateChat(null)}
            onTypingStart={() => startTyping(undefined, activePrivateChat)}
            onTypingStop={() => stopTyping(undefined, activePrivateChat)}
          />
        ) : (
          <>
            {/* Messages */}
            <MessageList
              messages={messages[currentRoom] || []}
              currentUser={user}
              typingUsers={typingUsers[currentRoom] || []}
              onReaction={addReaction}
            />

            {/* Message Input */}
            <MessageInput
              onSendMessage={sendMessage}
              onTypingStart={() => startTyping(currentRoom)}
              onTypingStop={() => stopTyping(currentRoom)}
              disabled={!isConnected}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;