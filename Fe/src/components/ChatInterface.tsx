import React, { useState, useRef, useEffect } from "react";
import { FiPlus, FiMessageSquare, FiUser, FiLogOut, FiUpload, FiX, FiSend, FiPaperclip, FiTrash2 } from "react-icons/fi";

interface Message {
  id: string;
  user: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

const ChatInterface = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date()
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setUploadedFiles([]);
  };

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      name: file.name,
      size: formatFileSize(file.size)
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    let chatToUpdate = currentChat;
    if (!chatToUpdate) {
      createNewChat();
      chatToUpdate = chats[0];
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      user: "user",
      text: input || "[Files uploaded]",
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => 
      chat.id === (currentChatId || chats[0]?.id)
        ? { ...chat, messages: [...chat.messages, userMessage], title: chat.title === "New Chat" ? input.slice(0, 30) + "..." : chat.title }
        : chat
    ));
    
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          files: uploadedFiles.map(f => f.name),
        }),
      });

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        user: "bot",
        text: data.answer || "I've received your message and files. How can I help you analyze them?",
        timestamp: new Date()
      };

      setChats(prev => prev.map(chat => 
        chat.id === (currentChatId || chats[0]?.id)
          ? { ...chat, messages: [...chat.messages, botMessage] }
          : chat
      ));
    } catch (err) {
      console.error(err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        user: "bot",
        text: "I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === (currentChatId || chats[0]?.id)
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic here
    console.log("Logging out...");
  };

  return (
    <div className="chat-interface">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>
            <FiPlus /> New Chat
          </button>
        </div>
        
        <div className="chat-history">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <FiMessageSquare className="chat-icon" />
              <span className="chat-title">{chat.title}</span>
              <button 
                className="delete-chat-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <button 
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <FiUser /> Profile
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <h2 className="chat-title-header">{currentChat.title}</h2>
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <FiMessageSquare />
              </button>
            </div>

            {/* File Upload Area */}
            {uploadedFiles.length > 0 && (
              <div className="file-upload-area">
                <div className="uploaded-files">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="file-item">
                      <div className="file-info">
                        <FiPaperclip className="file-icon" />
                        <div className="file-details">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{file.size}</span>
                        </div>
                      </div>
                      <button 
                        className="remove-file-btn"
                        onClick={() => removeFile(file.id)}
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="messages-container">
              {currentChat.messages.length === 0 ? (
                <div className="empty-chat">
                  <div className="empty-chat-content">
                    <h3>Welcome to ContractAI</h3>
                    <p>Upload your contracts and start asking questions to get intelligent insights and analysis.</p>
                  </div>
                </div>
              ) : (
                currentChat.messages.map((message) => (
                  <div key={message.id} className={`message ${message.user}`}>
                    <div className="message-content">
                      <div className="message-avatar">
                        {message.user === 'user' ? <FiUser /> : '🤖'}
                      </div>
                      <div className="message-text">
                        {message.text}
                      </div>
                    </div>
                    <div className="message-timestamp">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="message bot">
                  <div className="message-content">
                    <div className="message-avatar">🤖</div>
                    <div className="message-text loading">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <div className="input-container">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input-hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
                <button 
                  className="file-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiPaperclip />
                </button>
                <input
                  type="text"
                  placeholder="Ask about your contracts..."
                  className="message-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                />
                <button 
                  className="send-btn"
                  onClick={sendMessage}
                  disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}
                >
                  <FiSend />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-content">
              <h2>Welcome to ContractAI</h2>
              <p>Select a chat from the sidebar or create a new one to get started.</p>
              <button className="primary-button" onClick={createNewChat}>
                <FiPlus /> Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header">
              <h3>User Profile</h3>
              <button onClick={() => setShowProfile(false)}>
                <FiX />
              </button>
            </div>
            <div className="profile-content">
              <div className="profile-avatar">
                <FiUser size={48} />
              </div>
              <div className="profile-info">
                <h4>John Doe</h4>
                <p>john.doe@company.com</p>
                <p>Legal Team</p>
              </div>
              <div className="profile-actions">
                <button className="secondary-button">Edit Profile</button>
                <button className="secondary-button">Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
