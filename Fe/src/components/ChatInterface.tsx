import React, { useState, useRef, useEffect } from "react";
import { FiPlus, FiMessageSquare, FiUser, FiLogOut, FiUpload, FiX, FiSend, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import type { Chat, Message, MessageResponse } from '../services/chatService';
import fileService from '../services/fileService';
import type { FileUpload } from '../services/fileService';

interface DisplayMessage {
  id: string;
  user: "user" | "bot";
  text: string;
  timestamp: Date;
  files?: {
    name: string;
    size: number;
    type: string;
  }[];
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
  const [currentChatId, setCurrentChatId] = useState<string | null>(() => {
    // Restore current chat ID from localStorage
    const restored = localStorage.getItem('currentChatId');
    console.log('Restoring currentChatId from localStorage:', restored);
    return restored;
  });
  const [input, setInput] = useState(() => {
    // Restore input text from localStorage
    const restored = localStorage.getItem('chatInput') || "";
    console.log('Restoring chatInput from localStorage:', restored);
    return restored;
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [chatFiles, setChatFiles] = useState<ChatFile[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ChatFile | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousChatIdRef = useRef<string | null>(null);


  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages and files when current chat changes
  useEffect(() => {
    if (!currentChatId) {
      setChatFiles([]);
      setUploadedFiles([]);
      return;
    }
    
    // Clear uploaded files when switching chats (they're chat-specific)
    setUploadedFiles([]);
    
    // Always load fresh data from server for cross-device consistency
    loadChatFiles(currentChatId);
    loadChatMessages(currentChatId);
  }, [currentChatId]);

  // Clear input when manually switching between chats (not on initial load)
  useEffect(() => {
    // Only clear input if chats are loaded and we're switching to a different chat
    if (chats.length > 0 && currentChatId && !chatsLoading) {
      // Check if this is a manual chat switch (previous chat was different)
      if (previousChatIdRef.current && previousChatIdRef.current !== currentChatId) {
        setInput("");
      }
      // Update the previous chat ID reference
      previousChatIdRef.current = currentChatId;
    }
  }, [currentChatId, chats.length, chatsLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages]);

  // Persist current chat ID to localStorage for session continuity
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('currentChatId', currentChatId);
      console.log('Saved currentChatId to localStorage:', currentChatId);
    } else {
      localStorage.removeItem('currentChatId');
      console.log('Removed currentChatId from localStorage');
    }
  }, [currentChatId]);

  // Clear chat data when user changes (login/logout)
  useEffect(() => {
    if (user) {
      // User logged in, reload chats for the new user
      loadChats();
    } else {
      // User logged out, clear all chat data
      setChats([]);
      setCurrentChatId(null);
      setChatFiles([]);
      setUploadedFiles([]);
      console.log('Cleared chat data due to user logout');
    }
  }, [user]);

  // Real-time synchronization - poll for updates every 10 seconds for better responsiveness
  useEffect(() => {
    if (!user) return;

    console.log('🔄 Starting real-time sync for user:', user.email);
    
    const syncInterval = setInterval(async () => {
      try {
        console.log('🔄 Syncing data from server...');
        
        // Refresh chat list to catch new chats or title changes
        const apiChats = await chatService.getChats();
        const displayChats: DisplayChat[] = apiChats.map(chat => ({
          id: chat.id,
          title: chat.title,
          messages: chats.find(c => c.id === chat.id)?.messages || [],
          createdAt: new Date(chat.createdAt)
        }));
        
        // Only update if there are actual changes
        const hasChanges = displayChats.length !== chats.length || 
          displayChats.some(newChat => {
            const existingChat = chats.find(c => c.id === newChat.id);
            return !existingChat || existingChat.title !== newChat.title;
          });
        
        if (hasChanges) {
          setChats(displayChats);
          console.log('✅ Synchronized chat list from server - found', displayChats.length, 'chats');
        }
        
        // Refresh current chat messages if viewing a chat
        if (currentChatId) {
          const { messages } = await chatService.getChatById(currentChatId);
          const displayMessages: DisplayMessage[] = messages.map(msg => ({
            id: msg.id,
            user: msg.messageType === 'user' ? 'user' : 'bot',
            text: msg.content,
            timestamp: new Date(msg.createdAt)
          }));
          
          // Only update if message count changed
          const currentMessages = chats.find(c => c.id === currentChatId)?.messages || [];
          if (displayMessages.length !== currentMessages.length) {
            setChats(prev => prev.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: displayMessages }
                : chat
            ));
            console.log('✅ Synchronized messages for current chat from server - found', displayMessages.length, 'messages');
          }
        }
      } catch (error) {
        console.error('❌ Failed to sync data from server:', error);
        if (error.response?.status === 401) {
          console.log('🔐 Authentication error - user may need to log in again');
        }
      }
    }, 10000); // Poll every 10 seconds for better responsiveness

    return () => {
      console.log('🛑 Stopping real-time sync');
      clearInterval(syncInterval);
    };
  }, [user, currentChatId, chats]);

  // Persist input text to localStorage to retain drafts across page refreshes
  useEffect(() => {
    if (input.trim()) {
      localStorage.setItem('chatInput', input);
      console.log('Saved chatInput to localStorage:', input);
    } else {
      localStorage.removeItem('chatInput');
      console.log('Removed chatInput from localStorage');
    }
  }, [input]);

  // Clear persisted data when user logs out
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Keep the data when page is refreshed, but clear on actual navigation away
      // This is handled by the logout function
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const loadChats = async () => {
    try {
      setChatsLoading(true);
      const apiChats = await chatService.getChats();
      const displayChats: DisplayChat[] = apiChats.map(chat => ({
        id: chat.id,
        title: chat.title,
        messages: [], // Messages will be loaded separately when needed
        createdAt: new Date(chat.createdAt)
      }));
      setChats(displayChats);
      
      // Validate restored currentChatId against loaded chats
      const restoredChatId = localStorage.getItem('currentChatId');
      console.log('Validating restored chat ID:', restoredChatId, 'against loaded chats:', displayChats.map(c => c.id));
      if (restoredChatId && displayChats.some(chat => chat.id === restoredChatId)) {
        // Restored chat ID is valid, keep it
        console.log('Restored chat ID is valid, keeping it');
        if (currentChatId !== restoredChatId) {
          setCurrentChatId(restoredChatId);
        }
      } else if (displayChats.length > 0 && !currentChatId) {
        // No valid restored chat or no current chat, select first available
        console.log('No valid restored chat, selecting first available:', displayChats[0].id);
        setCurrentChatId(displayChats[0].id);
      } else if (restoredChatId && !displayChats.some(chat => chat.id === restoredChatId)) {
        // Restored chat ID is invalid (chat was deleted), clear it
        console.log('Restored chat ID is invalid, clearing and selecting new one');
        localStorage.removeItem('currentChatId');
        setCurrentChatId(displayChats.length > 0 ? displayChats[0].id : null);
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
      
      console.log('Loaded fresh messages from server for chat:', chatId, displayMessages.length);
      
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
      console.log('Loaded fresh files from server for chat:', chatId, files.length);
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
      // Clear input when creating new chat
      setInput("");
    } catch (error) {
       console.error('Failed to create new chat:', error);
     }
   };

  const deleteChat = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      console.log('Deleted chat:', chatId);
      
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

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      user: "user",
      text: input || "",
      timestamp: new Date(),
      files: uploadedFiles.length > 0 ? uploadedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })) : undefined
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

      // The API returns both userMessage and aiResponse
      const botMessage: DisplayMessage = {
        id: response.aiResponse.id,
        user: "bot",
        text: response.aiResponse.content,
        timestamp: new Date(response.aiResponse.createdAt)
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
    // Keep chat data persistent across login sessions
    // Only authentication data will be cleared by the logout function
    logout();
  };

  const handleDocumentClick = async (file: ChatFile) => {
    try {
      setSelectedDocument(file);
      setShowDocumentModal(true);
      // In a real implementation, you would fetch the document content
      // const content = await fileService.getFileContent(file.id);
      // setDocumentContent(content);
      setDocumentContent('Document preview functionality would be implemented here.');
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  return (
    <div className="chat-interface">
      {/* Chat Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>
            <FiPlus /> New chat
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
          {/* Profile and logout moved to header */}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              <h2 className="chat-title-header">{currentChat.title}</h2>
              <div className="header-actions">
                <div className="sync-status">
                  <span className="sync-indicator">🔄 Sync Active</span>
                  <span className="user-email">{user?.email}</span>
                </div>
                <div className="user-bubble">
                  <button 
                    className="profile-bubble-btn"
                    onClick={() => setShowProfile(!showProfile)}
                  >
                    <FiUser />
                  </button>
                  <button 
                    className="logout-bubble-btn" 
                    onClick={handleLogout}
                  >
                    <FiLogOut />
                  </button>
                </div>
                <button 
                  className="sidebar-toggle"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <FiMessageSquare />
                </button>
              </div>
            </div>



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
                        {message.text && <div className="message-text-content">{message.text}</div>}
                        {message.files && message.files.length > 0 && (
                          <div className="message-files">
                            {message.files.map((file, index) => (
                              <div key={index} className="file-card">
                                <div className="file-icon">
                                  <FiPaperclip />
                                </div>
                                <div className="file-details">
                                   <div className="file-name">{file.name}</div>
                                   <div className="file-type">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                                 </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

            {/* File Upload Area - Show when there are uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="file-upload-area">
                <div className="upload-header">
                  <h4>Ready to Upload</h4>
                  <span className="upload-count">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="uploaded-files">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="uploaded-file-item">
                      <div className="file-icon-container">
                        <FiPaperclip className="file-type-icon" />
                      </div>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <div className="file-meta">
                          <span className="file-size">{file.size}</span>
                          <span className="file-separator">•</span>
                          <span className="file-status">Ready to send</span>
                        </div>
                      </div>
                      <button 
                        className="remove-file-btn"
                        onClick={() => removeFile(file.id)}
                        title="Remove file"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready to Upload Area */}
            {uploadedFiles.length > 0 && (
              <div className="ready-to-upload-area">
                <div className="upload-header">
                  <span className="upload-label">Ready to upload</span>
                  <span className="upload-count">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="uploaded-files-list">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="uploaded-file-card">
                      <div className="file-icon">
                        <FiPaperclip />
                      </div>
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-type">{file.name.split('.').pop()?.toUpperCase()}</span>
                      </div>
                      <button 
                        className="remove-file-btn"
                        onClick={() => removeFile(file.id)}
                        title="Remove file"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input-hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
                <div className="input-actions">
                  <button 
                    className="file-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload files"
                  >
                    <FiPaperclip />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Ask about your documents..."
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  disabled={isLoading}
                />
                <button 
                  className="send-button"
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

      {/* Document Preview Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="document-modal-overlay" onClick={() => setShowDocumentModal(false)}>
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="document-modal-header">
              <h3>{selectedDocument.originalName}</h3>
              <button onClick={() => setShowDocumentModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="document-modal-content">
              <div className="document-info">
                <p><strong>Size:</strong> {formatFileSize(selectedDocument.size)}</p>
                <p><strong>Type:</strong> {selectedDocument.mimeType}</p>
                <p><strong>Uploaded:</strong> {formatDate(selectedDocument.uploadedAt)}</p>
              </div>
              <div className="document-preview">
                <p>{documentContent}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
