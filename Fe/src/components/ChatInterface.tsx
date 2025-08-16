import React, { useState, useRef, useEffect } from "react";
import { FiPlus, FiMessageSquare, FiUser, FiLogOut, FiUpload, FiX, FiSend, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import type { Chat, Message } from '../services/chatService';
import fileService from '../services/fileService';
import type { FileUpload } from '../services/fileService';

interface DisplayMessage {
  id: string;
  user: "user" | "bot";
  text: string;
  timestamp: Date;
}

interface DisplayChat {
  id: string;
  title: string;
  messages: DisplayMessage[];
  createdAt: Date;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: string;
}

interface ChatFile {
  id: string;
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

const ChatInterface = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages and files when current chat changes
  useEffect(() => {
    if (currentChatId) {
      loadChatMessages(currentChatId);
      loadChatFiles(currentChatId);
    } else {
      setChatFiles([]);
    }
  }, [currentChatId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      const apiChats = await chatService.getChats();
      const displayChats: DisplayChat[] = apiChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [],
        createdAt: new Date(chat.createdAt)
      }));
      setChats(displayChats);
      if (displayChats.length > 0 && !currentChatId) {
        setCurrentChatId(displayChats[0].id);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setChatsLoading(false);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const { messages } = await chatService.getChatById(chatId);
      const displayMessages: DisplayMessage[] = messages.map(msg => ({
        id: msg.id,
        user: msg.messageType === 'user' ? 'user' : 'bot',
        text: msg.content,
        timestamp: new Date(msg.createdAt)
      }));
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: displayMessages }
          : chat
      ));
    } catch (error) {
       console.error('Failed to load chat messages:', error);
     }
   };

  const loadChatFiles = async (chatId: string) => {
    try {
      const files = await fileService.getChatFiles(chatId);
      setChatFiles(files);
    } catch (error) {
      console.error('Failed to load chat files:', error);
      setChatFiles([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const createNewChat = async () => {
    try {
      const newChat = await chatService.createChat({ title: "New Chat" });
      const displayChat: DisplayChat = {
        id: newChat.id,
        title: newChat.title,
        messages: [],
        createdAt: new Date(newChat.createdAt)
      };
      setChats(prev => [displayChat, ...prev]);
      setCurrentChatId(newChat.id);
      setUploadedFiles([]);
      setChatFiles([]);
    } catch (error) {
       console.error('Failed to create new chat:', error);
     }
   };

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      const validation = fileService.validateFile(file);
      if (validation.valid) {
        validFiles.push({
          id: Date.now().toString() + Math.random(),
          file,
          name: file.name,
          size: formatFileSize(file.size)
        });
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });
    
    if (errors.length > 0) {
      alert('Some files could not be uploaded:\n' + errors.join('\n'));
    }
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    
    let targetChatId = currentChatId;
    
    // Create new chat if none exists
    if (!targetChatId) {
      try {
        const newChat = await chatService.createChat({ title: input.slice(0, 30) || "New Chat" });
        const displayChat: DisplayChat = {
          id: newChat.id,
          title: newChat.title,
          messages: [],
          createdAt: new Date(newChat.createdAt)
        };
        setChats(prev => [displayChat, ...prev]);
        setCurrentChatId(newChat.id);
        targetChatId = newChat.id;
      } catch (error) {
        console.error('Failed to create chat:', error);
        return;
      }
    }

    // Upload files first if any
    try {
      if (uploadedFiles.length > 0) {
        for (const uploadedFile of uploadedFiles) {
          await fileService.uploadFile(uploadedFile.file, targetChatId);
        }
        // Reload chat files after successful upload
        await loadChatFiles(targetChatId);
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload some files. Please try again.');
      return;
    }

    // Add user message to UI immediately
    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      user: "user",
      text: input || "[Files uploaded]",
      timestamp: new Date()
    };

    setChats(prev => prev.map(chat => 
      chat.id === targetChatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage],
            title: chat.title === "New Chat" && input.trim() ? input.slice(0, 30) + "..." : chat.title 
          }
        : chat
    ));
    
    const messageContent = input;
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Send message to API
      const response = await chatService.sendMessage({
        chatId: targetChatId,
        content: messageContent || "Please analyze the uploaded files.",
        messageType: 'user'
      });

      // The API should return the bot's response
      const botMessage: DisplayMessage = {
        id: response.id,
        user: "bot",
        text: "I've received your message. Let me analyze it for you.",
        timestamp: new Date(response.createdAt)
      };

      setChats(prev => prev.map(chat => 
        chat.id === targetChatId
          ? { ...chat, messages: [...chat.messages, botMessage] }
          : chat
      ));
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage: DisplayMessage = {
        id: (Date.now() + 1).toString(),
        user: "bot",
        text: "I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date()
      };
      
      setChats(prev => prev.map(chat => 
        chat.id === targetChatId
          ? { ...chat, messages: [...chat.messages, errorMessage] }
          : chat
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="chat-interface">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={() => createNewChat()}>
            <FiPlus /> New Chat
          </button>
        </div>
        
        <div className="chat-history">
          {chatsLoading ? (
            <div className="loading-chats">
              <div className="loading-spinner-small"></div>
              <span>Loading chats...</span>
            </div>
          ) : chats.length === 0 ? (
            <div className="no-chats">
              <p>No chats yet. Start a new conversation!</p>
            </div>
          ) : (
            chats.map((chat) => (
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
            ))
          )}
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

            {/* Chat Files Area */}
            {chatFiles.length > 0 && (
              <div className="chat-files-area">
                <div className="chat-files-header">
                  <h4>Uploaded Files</h4>
                </div>
                <div className="chat-files">
                  {chatFiles.map((file) => (
                    <div key={file.id} className="chat-file-item">
                      <div className="file-info">
                        <FiPaperclip className="file-icon" />
                        <div className="file-details">
                          <span className="file-name">{file.originalName}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          <span className="file-date">{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
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
                <h4>{user?.firstName} {user?.lastName}</h4>
                <p>{user?.email}</p>
                {user?.company && <p>{user.company}</p>}
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
