import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FiPlus, FiMessageSquare, FiUser, FiLogOut, FiUpload, FiX, FiSend, FiPaperclip, FiTrash2 } from "react-icons/fi";
import { useAuth } from '../contexts/AuthContext';
import chatService from '../services/chatService';
import type { Chat, Message, MessageResponse } from '../services/chatService';
import fileService from '../services/fileService';
// Removed mlService; server-side processing returns summaries automatically after upload
import type { FileUpload } from '../services/fileService';

interface ActiveFileContext {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  extractedText?: string;
}

interface DisplayMessage {
  id: string;
  user: "user" | "bot";
  text: string;
  timestamp: Date;
  files?: {
    id?: string;
    name: string;
    size: string;
    type: string;
  }[];
  severity?: 'red' | 'amber' | 'green';
  missingClauses?: Array<{ name: string; severity: 'red' | 'amber' | 'green'; reason?: string }>;
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
  const { user, logout, updateProfile } = useAuth();
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editFirstName, setEditFirstName] = useState<string>('');
  const [editLastName, setEditLastName] = useState<string>('');
  const [editCompany, setEditCompany] = useState<string>('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ChatFile | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Client-side analysis/summarization disabled per spec
  const [activeFileContext, setActiveFileContext] = useState<ActiveFileContext | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previousChatIdRef = useRef<string | null>(null);

  const currentChat = chats.find(chat => chat.id === currentChatId);

  // Load chats on component mount
  useEffect(() => {
    // Apply default sidebar behavior from settings
    const defaultSidebar = localStorage.getItem('defaultSidebarOpen');
    if (defaultSidebar === 'true' || defaultSidebar === 'false') {
      setSidebarOpen(defaultSidebar === 'true');
    }
    loadChats();
  }, []);

  // Load messages and files when current chat changes
  useEffect(() => {
    if (!currentChatId) {
      setChatFiles([]);
      setUploadedFiles([]);
      setActiveFileContext(null);
      return;
    }

    // Prevent fetching for stale/unknown chat IDs
    if (!chats.some(c => c.id === currentChatId)) {
      return;
    }
    
    // Clear uploaded files when switching chats (they're chat-specific)
    setUploadedFiles([]);
    
    // Always load fresh data from server for cross-device consistency
    loadChatFiles(currentChatId);
    loadChatMessages(currentChatId);

    try {
      const saved = sessionStorage.getItem(`chatCtx:${currentChatId}`);
      if (saved) {
        const parsed: ActiveFileContext = JSON.parse(saved);
        setActiveFileContext(parsed);
      } else {
        setActiveFileContext(null);
      }
    } catch {
      setActiveFileContext(null);
    }
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

  // Clear chat data when user changes (login/logout) - DISABLED to prevent cross-browser syncing
  // useEffect(() => {
  //   if (user) {
  //     // User logged in, reload chats for the new user
  //     loadChats();
  //   } else {
  //     // User logged out, clear all chat data
  //     setChats([]);
  //     setCurrentChatId(null);
  //     setChatFiles([]);
  //     setUploadedFiles([]);
  //     console.log('Cleared chat data due to user logout');
  //   }
  // }, [user]);

  // Real-time synchronization - poll for updates every 10 seconds for better responsiveness


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
      const displayMessages: DisplayMessage[] = messages.map((msg: any) => ({
        id: msg.id,
        user: msg.sender === 'user' ? 'user' : 'bot',
        text: msg.content,
        timestamp: new Date(msg.createdAt),
        files: Array.isArray(msg.files)
          ? msg.files.map((f: any) => ({
              id: f.id,
              name: f.filename || f.name || 'file',
              size: formatFileSize((f.size ?? 0) as number),
              type: f.type || f.mimeType || 'FILE',
            }))
          : undefined,
      }));
      
      console.log('Loaded fresh messages from server for chat:', chatId, displayMessages.length);
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: displayMessages }
          : chat
      ));
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 404) {
        // Chat no longer exists or not accessible: clear stale chatId and pick a valid one
        console.warn('Chat not found. Clearing stale currentChatId and selecting another if available.');
        localStorage.removeItem('currentChatId');
        setCurrentChatId(chats.length > 0 ? chats[0].id : null);
        return;
      }
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

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const createNewChat = async () => {
    try {
      if (isCreatingChat) return;
      setIsCreatingChat(true);
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
      const status = (error as any)?.response?.status;
      if (status === 429) {
        const retryAfter = (error as any)?.response?.headers?.['retry-after'];
        const message = retryAfter
          ? `You're creating chats too quickly. Please wait ${retryAfter} seconds and try again.`
          : 'Too many requests. Please slow down and try again shortly.';
        alert(message);
      }
      console.error('Failed to create new chat:', error);
    }
    finally {
      setIsCreatingChat(false);
    }
  };

  const [isDeletingChatId, setIsDeletingChatId] = useState<string | null>(null);

  const deleteChat = async (chatId: string) => {
    try {
      if (isDeletingChatId) return; // prevent concurrent deletes
      setIsDeletingChatId(chatId);
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      
      console.log('Deleted chat:', chatId);
      
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        setCurrentChatId(remainingChats.length > 0 ? remainingChats[0].id : null);
      }
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 429) {
        const retryAfter = (error as any)?.response?.headers?.['retry-after'];
        const message = retryAfter
          ? `You're performing actions too quickly. Please wait ${retryAfter} seconds and try again.`
          : 'Too many requests. Please slow down and try again shortly.';
        alert(message);
      }
      console.error('Failed to delete chat:', error);
    }
    finally {
      setIsDeletingChatId(null);
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

    // Upload files first if any and collect file IDs; server returns summaries automatically
    let uploadedFileIds: string[] = [];
    let contextSetThisBatch = false;
    const uploadedFileResponses: FileUpload[] = [];
    try {
      if (uploadedFiles.length > 0) {
        for (const uploadedFile of uploadedFiles) {
          const uploadResponse = await fileService.uploadFile(uploadedFile.file, targetChatId);
          uploadedFileIds.push(uploadResponse.id);

          // Set active context to the first uploaded file in this batch
          if (!contextSetThisBatch) {
            await applyActiveContext(uploadResponse, targetChatId, true);
            contextSetThisBatch = true;
          }

          // Defer summary message append until after the user file message,
          // so the summary appears below the uploaded file. Store response.
          uploadedFileResponses.push(uploadResponse);
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
      files: uploadedFiles.length > 0
        ? uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: file.file.type || 'FILE'
          }))
        : activeFileContext
        ? [{
            id: activeFileContext.id,
            name: activeFileContext.originalName,
            size: formatFileSize(activeFileContext.size),
            type: activeFileContext.mimeType
          }]
        : undefined
    };

    setChats(prev => prev.map(chat => {
      if (chat.id !== targetChatId) return chat;
      const shouldDeriveFromInput = chat.title === "New Chat" && input.trim().length > 0 && uploadedFileIds.length === 0;
      return {
        ...chat,
        messages: [...chat.messages, userMessage],
        title: shouldDeriveFromInput ? (input.slice(0, 30) + "...") : chat.title
      };
    }));

    // Append summaries (or generating indicator) below the uploaded file message
    if (uploadedFileResponses.length > 0) {
      // Show generating indicator only when summary is not yet available
      const needIndicator = uploadedFileResponses.some(r => !r.summary || r.summary.trim().length === 0);
      if (needIndicator) {
        setChats(prev => prev.map(chat => {
          if (chat.id !== targetChatId) return chat;
          const indicators: DisplayMessage[] = uploadedFileResponses
            .filter(r => !r.summary || r.summary.trim().length === 0)
            .map(r => ({
              id: `${r.id}-summary-pending`,
              user: 'bot',
              text: `⏳ Generating summary for ${r.originalName}…`,
              timestamp: new Date()
            }));
          return { ...chat, messages: [...chat.messages, ...indicators] };
        }));
      }

      // Now reload messages from server — summaries are persisted there
      await loadChatMessages(targetChatId);

      // Refresh the chat title from server (may have been generated from document)
      try {
        const info = await chatService.getChatTitleInfo(targetChatId);
        setChats(prev => prev.map(c => c.id === targetChatId ? { ...c, title: info.title || c.title } : c));
      } catch (e) {
        // non-blocking; ignore errors
      }
    }
    
    const messageContent = input;
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Send message to API. If user didn't type text and only uploaded files,
      // let the bot answer questions only when there is content; otherwise, skip.
      if (messageContent.trim().length > 0 || uploadedFileIds.length === 0) {
        const response = await chatService.sendMessage({
          chatId: targetChatId,
          content: messageContent || "",
          messageType: uploadedFiles.length > 0 || activeFileContext ? 'file' : 'text',
          files: uploadedFileIds.length > 0
            ? uploadedFileIds
            : activeFileContext
            ? [activeFileContext.id]
            : undefined
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
      }
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

  const openEditProfile = () => {
    setEditFirstName(user?.firstName || '');
    setEditLastName(user?.lastName || '');
    setEditCompany(user?.company || '');
    setShowEditProfile(true);
  };

  const saveProfile = async () => {
    if (savingProfile) return;
    try {
      setSavingProfile(true);
      const ok = await updateProfile({
        firstName: editFirstName,
        lastName: editLastName,
        company: editCompany
      });
      if (ok) {
        setShowEditProfile(false);
      } else {
        alert('Failed to update profile.');
      }
    } catch (e) {
      console.error('Failed to update profile', e);
      alert('Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDocumentClick = async (file: ChatFile) => {
    try {
      setSelectedDocument(file);
      setShowDocumentModal(true);
      setDocumentContent('Loading document content...');
      setPreviewUrl(null);

      if (file.mimeType === 'application/pdf') {
        // Authenticated download and object URL for iframe preview
        const blob = await fileService.downloadFile(file.id);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setDocumentContent('');
      } else {
        // Fetch extracted text for text/plain; other types show a download link
        const textData = await fileService.getFileText(file.id);
        setDocumentContent(textData.extractedText || 'No text content available for this file.');
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      setDocumentContent('Failed to load document preview.');
      setPreviewUrl(null);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setDocumentContent('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedDocument(null);
  };

  const applyActiveContext = async (file: FileUpload, chatId: string, announceSwitch = true) => {
    let extractedText: string | undefined;
    try {
      const textRes = await fileService.getFileText(file.id);
      extractedText = textRes.extractedText;
    } catch (err) {
      extractedText = undefined;
    }
    const newCtx: ActiveFileContext = {
      id: file.id,
      originalName: file.originalName,
      size: file.size,
      mimeType: file.mimeType,
      uploadedAt: file.uploadedAt,
      extractedText
    };
    setActiveFileContext(newCtx);
    sessionStorage.setItem(`chatCtx:${chatId}`, JSON.stringify(newCtx));

    // No bot announcement messages for context changes per UI spec
  };

  const clearActiveContext = (chatId: string) => {
    const prev = activeFileContext?.originalName;
    setActiveFileContext(null);
    sessionStorage.removeItem(`chatCtx:${chatId}`);
    // No bot announcement on clear per UI spec
  };

  const downloadSelectedDocument = async () => {
    if (!selectedDocument) return;
    try {
      const blob = await fileService.downloadFile(selectedDocument.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedDocument.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file.');
    }
  };

  // Client-side analyze/summarize functions removed

  return (
    <div className="chat-interface">
      {/* Chat Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat} disabled={isCreatingChat}>
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
                  disabled={isDeletingChatId === chat.id}
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
                <button
                  className="rename-chat-btn"
                  title="Rename chat"
                  onClick={async () => {
                    const newTitle = prompt('Enter new chat title', currentChat.title || '');
                    if (!newTitle) return;
                    try {
                      const updated = await chatService.updateChatTitle(currentChat.id, newTitle.trim());
                      setChats(prev => prev.map(c => c.id === currentChat.id ? { ...c, title: updated.title } : c));
                    } catch (e) {
                      alert('Failed to update chat title');
                    }
                  }}
                >✏️</button>
              </div>
              <div className="header-actions">
                <button
                  className="history-chat-btn"
                  title="Show naming history"
                  onClick={async () => {
                    try {
                      const info = await chatService.getChatTitleInfo(currentChat.id);
                      const lines = [
                        `Current: ${info.title}`,
                        info.generatedTitle ? `Generated: ${info.generatedTitle}` : undefined,
                        ...(info.history || []).map(h => `${new Date(h.at).toLocaleString()}: ${h.title} (${h.source})`)
                      ].filter(Boolean) as string[];
                      alert(lines.join('\n'));
                    } catch (e) {
                      alert('Failed to load naming history');
                    }
                  }}
                >🕘</button>
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



            {/* File Upload Area - placed before messages */}
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
                        {message.text && (
                          <div className="message-text-content">
                            <div className="markdown-content">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {message.text}
                              </ReactMarkdown>
                            </div>
                            {message.severity && (
                              <span
                                style={{
                                  marginLeft: '8px',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontSize: '12px',
                                  color: '#fff',
                                  backgroundColor:
                                    message.severity === 'red'
                                      ? '#d7263d'
                                      : message.severity === 'amber'
                                      ? '#f5a623'
                                      : '#2ecc71'
                                }}
                                title={`Overall severity: ${message.severity.toUpperCase()}`}
                              >
                                {message.severity.toUpperCase()}
                              </span>
                            )}
                          </div>
                        )}
                        {message.files && message.files.length > 0 && (
                          <div className="message-files">
                            {message.files.map((file, index) => {
                              const chatFile = file.id
                                ? chatFiles.find(cf => cf.id === file.id)
                                : chatFiles.find(cf => cf.originalName === file.name);
                              return (
                                <div key={index} className="file-card" onClick={() => chatFile && handleDocumentClick(chatFile)}>
                                  <div className="file-icon">
                                    <FiPaperclip />
                                  </div>
                                  <div className="file-details">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-type">{file.name.split('.').pop()?.toUpperCase() || 'FILE'}</div>
                                    <div className="file-preview-hint">Click to view content</div>
                                  </div>
                                </div>
                              );
                            })}
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

            {/* Input Area (unchanged position - below messages) */}
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
                <button className="secondary-button" onClick={openEditProfile}>Edit Profile</button>
                <button className="secondary-button" onClick={() => setShowSettings(true)}>Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header">
              <h3>Edit Profile</h3>
              <button onClick={() => setShowEditProfile(false)}><FiX /></button>
            </div>
            <div className="profile-content">
              <div className="profile-info" style={{ width: '100%' }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input className="secondary-input" placeholder="First name" value={editFirstName} onChange={(e)=>setEditFirstName(e.target.value)} />
                  <input className="secondary-input" placeholder="Last name" value={editLastName} onChange={(e)=>setEditLastName(e.target.value)} />
                  <input className="secondary-input" placeholder="Company" value={editCompany} onChange={(e)=>setEditCompany(e.target.value)} />
                </div>
              </div>
              <div className="profile-actions">
                <button className="secondary-button" onClick={saveProfile} disabled={savingProfile}>{savingProfile ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="profile-modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-header">
              <h3>Settings</h3>
              <button onClick={() => setShowSettings(false)}><FiX /></button>
            </div>
            <div className="profile-content">
              <div className="profile-info" style={{ width: '100%' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={sidebarOpen} onChange={(e)=>{
                    setSidebarOpen(e.target.checked);
                    localStorage.setItem('defaultSidebarOpen', e.target.checked ? 'true' : 'false');
                  }} />
                  Sidebar open by default
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="document-modal-overlay" onClick={closeDocumentModal}>
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="document-modal-header">
              <h3>{selectedDocument.originalName}</h3>
              <button onClick={closeDocumentModal}>
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
                {selectedDocument.mimeType === 'text/plain' && (
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {documentContent}
                  </pre>
                )}
                {selectedDocument.mimeType === 'application/pdf' && previewUrl && (
                  <iframe
                    src={previewUrl}
                    title="PDF Preview"
                    style={{ width: '100%', height: '70vh', border: 'none' }}
                  />
                )}
                {selectedDocument.mimeType !== 'text/plain' && selectedDocument.mimeType !== 'application/pdf' && (
                  <div>
                    <p>Preview not available for this file type. You can download it below.</p>
                    <button className="secondary-button" onClick={downloadSelectedDocument}>
                      Download File
                    </button>
                  </div>
                )}
                {/* Client-side analysis/summarization removed. Summary appears in chat after upload. */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
