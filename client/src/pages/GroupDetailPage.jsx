import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  FileText,
  Bell,
  Users,
  Send,
  Upload,
  Download,
  Eye,
  Trash2,
  Lock,
  Globe,
  CheckCircle2,
  Clock,
  Pin,
  AlertCircle,
  Plus,
  UserX,
  Paperclip,
  Image as ImageIcon,
  FolderOpen,
  Filter,
  Sparkles,
  FileCode,
  FileArchive,
  Search,
  ExternalLink,
  X
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const QUICK_EMOJIS = ['👍', '🙏', '✅', '👀'];

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'assignments', 'files', 'announcements', 'members'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chat State
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatFile, setChatFile] = useState(null);
  const [chatSending, setChatSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatFileInputRef = useRef(null);

  // Anti-clutter detection
  const isFillerMessage = (text) => {
    const clean = text.trim().toLowerCase();
    const fillers = ['ok', 'okay', 'k', 'thanks', 'thx', 'thank you', 'cool', 'done', 'noted', 'noted sir', 'noted ma\'am', 'got it', 'yes', 'yep', 'great'];
    return fillers.includes(clean);
  };

  // Assignments State
  const [assignments, setAssignments] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadFaculty, setUploadFaculty] = useState('');
  const [uploadDeadline, setUploadDeadline] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Files & Media Library State
  const [groupFiles, setGroupFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [fileFilter, setFileFilter] = useState('all'); // 'all', 'document', 'image', 'code'
  const [fileSearch, setFileSearch] = useState('');
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [libTitle, setLibTitle] = useState('');
  const [libSubject, setLibSubject] = useState('');
  const [libFile, setLibFile] = useState(null);
  const [libUploading, setLibUploading] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('Normal');
  const [annPinned, setAnnPinned] = useState(false);

  // Lightbox / Image Preview Modal
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Load Group Details
  const loadGroup = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      setGroup(res.data.group);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  };

  // Load Messages
  const loadMessages = async () => {
    try {
      const res = await api.get(`/chat/${groupId}/messages`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  // Load Assignments
  const loadAssignments = async () => {
    try {
      const res = await api.get(`/assignments/group/${groupId}`);
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  // Load Group Files Library
  const loadGroupFiles = async () => {
    setFilesLoading(true);
    try {
      const res = await api.get(`/chat/${groupId}/files`);
      setGroupFiles(res.data.files || []);
    } catch (err) {
      console.error('Failed to load group files:', err);
    } finally {
      setFilesLoading(false);
    }
  };

  // Load Announcements
  const loadAnnouncements = async () => {
    try {
      const res = await api.get(`/announcements/group/${groupId}`);
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  useEffect(() => {
    loadGroup();
    loadMessages();
    loadAssignments();
    loadGroupFiles();
    loadAnnouncements();
  }, [groupId]);

  // Socket.IO Room Integration
  useEffect(() => {
    if (!socket || !groupId) return;

    socket.emit('join_group', groupId);

    const handleNewMessage = (msg) => {
      if (msg.groupId === groupId) {
        setMessages((prev) => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, { ...msg, isMine: msg.senderId === user?._id }];
        });
        // Also refresh files if message contains a file
        if (msg.fileUrl) {
          loadGroupFiles();
        }
      }
    };

    const handleReaction = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleUserTyping = ({ fullName }) => {
      setTypingUser(fullName);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
    };

    const handleUserStopTyping = () => {
      setTypingUser(null);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_reaction', handleReaction);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('new_message', handleNewMessage);
      socket.off('message_reaction', handleReaction);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, groupId, user]);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Send Message (Text + File upload)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() && !chatFile) return;

    setChatSending(true);
    try {
      if (chatFile) {
        // Use multipart upload
        const data = new FormData();
        data.append('file', chatFile);
        data.append('content', messageInput.trim());

        const res = await api.post(`/chat/${groupId}/messages`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setMessages((prev) => [...prev, { ...res.data.message, isMine: true }]);
        loadGroupFiles();
      } else {
        // Regular text message
        if (socket && socket.connected) {
          socket.emit('send_message', {
            groupId,
            content: messageInput.trim()
          });
          socket.emit('stop_typing', { groupId });
        } else {
          const res = await api.post(`/chat/${groupId}/messages`, { content: messageInput.trim() });
          setMessages((prev) => [...prev, { ...res.data.message, isMine: true }]);
        }
      }

      setMessageInput('');
      setChatFile(null);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setChatSending(false);
    }
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (socket) {
      socket.emit('typing', { groupId });
    }
  };

  // Toggle Message Reaction
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const res = await api.post(`/chat/${groupId}/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data.reactions } : m))
      );
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Upload Assignment Handler
  const handleUploadAssignment = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('title', uploadTitle);
    data.append('subject', uploadSubject || group.name);
    data.append('facultyName', uploadFaculty);
    data.append('deadline', uploadDeadline);
    data.append('description', uploadDescription);

    setUploadLoading(true);
    try {
      await api.post(`/assignments/group/${groupId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadModalOpen(false);
      setUploadTitle('');
      setUploadFaculty('');
      setUploadDeadline('');
      setUploadDescription('');
      setSelectedFile(null);
      loadAssignments();
      loadGroupFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Upload Directly to Group Library
  const handleUploadLibraryFile = async (e) => {
    e.preventDefault();
    if (!libFile) return;

    const data = new FormData();
    data.append('file', libFile);
    data.append('title', libTitle || libFile.name);
    data.append('subject', libSubject || group.name);

    setLibUploading(true);
    try {
      await api.post(`/chat/${groupId}/files`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLibraryModalOpen(false);
      setLibTitle('');
      setLibSubject('');
      setLibFile(null);
      loadGroupFiles();
      loadMessages();
    } catch (err) {
      alert(err.response?.data?.message || 'Upload to library failed.');
    } finally {
      setLibUploading(false);
    }
  };

  // Toggle Personal Completion
  const handleToggleComplete = async (assignmentId) => {
    try {
      const res = await api.post(`/assignments/${assignmentId}/toggle-complete`);
      setAssignments(prev =>
        prev.map(a => a._id === assignmentId ? { ...a, isCompleted: res.data.isCompleted } : a)
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await api.delete(`/assignments/${assignmentId}`);
      loadAssignments();
      loadGroupFiles();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/announcements/group/${groupId}`, {
        title: annTitle,
        content: annContent,
        priority: annPriority,
        isPinned: annPinned
      });
      setAnnouncementModalOpen(false);
      setAnnTitle('');
      setAnnContent('');
      loadAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish announcement.');
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${announcementId}`);
      loadAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  // Member Management
  const handleManageMember = async (memberId, action) => {
    try {
      await api.put(`/groups/${groupId}/members/${memberId}`, { action });
      loadGroup();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  // Leave Group
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await api.post(`/groups/${groupId}/leave`);
      navigate('/groups');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to leave group.');
    }
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filtered files for Library
  const filteredFiles = groupFiles.filter((f) => {
    if (fileFilter === 'document' && f.fileType !== 'document') return false;
    if (fileFilter === 'image' && f.fileType !== 'image') return false;
    if (fileFilter === 'code' && !f.fileName?.match(/\.(py|js|jsx|ts|tsx|html|css|zip|rar|7z|c|cpp|java)$/i)) return false;
    if (fileSearch) {
      const q = fileSearch.toLowerCase();
      return (
        f.title?.toLowerCase().includes(q) ||
        f.fileName?.toLowerCase().includes(q) ||
        f.subject?.toLowerCase().includes(q) ||
        f.uploadedBy?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-20 text-xs text-slate-400">Loading group...</div>;
  }

  if (error || !group) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertCircle size={32} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Cannot Access Group</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || 'Group not found.'}</p>
        <button
          onClick={() => navigate('/groups')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to My Groups
        </button>
      </div>
    );
  }

  const isAdmin = group.myRole === 'admin';

  return (
    <div className="space-y-6">
      {/* Group Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${group.iconBg || 'from-indigo-500 to-purple-600'} text-white font-extrabold text-2xl flex items-center justify-center flex-shrink-0 shadow-md`}>
              {group.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                  {group.category}
                </span>
                {group.isPrivate ? (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Lock size={12} /> Private Group {group.accessCode ? `(Code: ${group.accessCode})` : ''}
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Globe size={12} /> Open Public Group
                  </span>
                )}
                {isAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    Group Administrator
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {group.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {group.description || 'Welcome to this academic group.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <span className="text-xs text-slate-400 font-medium">
              {group.memberCount} members
            </span>
            <button
              onClick={handleLeaveGroup}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition-colors"
            >
              Leave Group
            </button>
          </div>
        </div>

        {/* 5 Distinct Tabs Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 overflow-x-auto pb-1">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare, badge: messages.length },
            { id: 'assignments', label: 'Assignments', icon: FileText, badge: assignments.length },
            { id: 'files', label: 'Files & Media', icon: FolderOpen, badge: groupFiles.length },
            { id: 'announcements', label: 'Announcements', icon: Bell, badge: announcements.length },
            { id: 'members', label: 'Members', icon: Users, badge: group.members?.length || group.memberCount }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: GROUP CHAT (Rich Media + File Upload + Anti-Clutter Guard) */}
      {/* ============================================================== */}
      {activeTab === 'chat' && (
        <div className="h-[600px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <MessageSquare size={32} className="text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No messages yet</p>
                <p>Start the discussion or share notes with your classmates.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isImage = msg.fileUrl && (msg.fileType === 'image' || msg.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i));
                return (
                  <div
                    key={msg._id || idx}
                    className={`flex items-start gap-3 group ${msg.isMine ? 'flex-row-reverse' : ''}`}
                  >
                    <img
                      src={msg.senderAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(msg.senderName || 'User')}
                      alt={msg.senderName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5 border border-slate-200 dark:border-slate-700"
                    />

                    <div className={`max-w-[75%] ${msg.isMine ? 'items-end text-right' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.isMine
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                        }`}
                      >
                        {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                        {/* File Attachment Card */}
                        {msg.fileUrl && (
                          <div className={`mt-2 pt-2 border-t ${msg.isMine ? 'border-indigo-400/30' : 'border-slate-200 dark:border-slate-700'}`}>
                            {isImage ? (
                              <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightboxUrl(msg.fileUrl)}>
                                <img
                                  src={msg.fileUrl}
                                  alt={msg.fileName || 'Attachment'}
                                  className="max-h-48 max-w-full rounded-xl object-cover hover:opacity-95 transition-opacity"
                                />
                                <div className="mt-1 flex items-center justify-between text-[10px] opacity-80">
                                  <span className="truncate max-w-[180px]">{msg.fileName}</span>
                                  <span>{formatBytes(msg.fileSize)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className={`flex items-center justify-between gap-3 p-2.5 rounded-xl ${
                                msg.isMine ? 'bg-indigo-700/60' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                              }`}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText size={18} className="shrink-0 text-indigo-400" />
                                  <div className="text-left overflow-hidden">
                                    <p className="text-[11px] font-bold truncate max-w-[180px]">
                                      {msg.fileName || 'Shared Document'}
                                    </p>
                                    <p className="text-[10px] opacity-70">
                                      {formatBytes(msg.fileSize)}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={msg.fileUrl}
                                  download={msg.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    msg.isMine ? 'hover:bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400'
                                  }`}
                                  title="Download"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Reactions & Quick Reaction Bar */}
                      <div className={`flex items-center gap-1.5 mt-1 flex-wrap ${msg.isMine ? 'justify-end' : 'justify-start'}`}>
                        {/* Display existing reaction pills */}
                        {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => {
                          if (!userIds || userIds.length === 0) return null;
                          const hasReacted = userIds.includes(user?._id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[11px] flex items-center gap-1 border transition-colors ${
                                hasReacted
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold text-[10px]">{userIds.length}</span>
                            </button>
                          );
                        })}

                        {/* Quick Reaction button bar on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded-full shadow-sm">
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className="hover:scale-125 transition-transform text-xs px-1"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {typingUser && (
              <p className="text-[11px] italic text-indigo-500 animate-pulse">
                {typingUser} is typing...
              </p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Anti-Clutter Guard Warning */}
          {isFillerMessage(messageInput) && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Anti-Clutter Guard:</strong> Consider reacting with emojis (👍, 🙏, ✅) on the message above instead of sending a one-word text to keep the study feed clean!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMessageInput('')}
                className="text-[11px] font-bold text-amber-900 dark:text-amber-100 hover:underline px-2 py-0.5"
              >
                Clear
              </button>
            </div>
          )}

          {/* Attached File Preview Chip */}
          {chatFile && (
            <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/50 border-t border-indigo-100 dark:border-indigo-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                <Paperclip size={14} />
                <span className="font-semibold truncate max-w-xs">{chatFile.name}</span>
                <span className="text-[10px] text-slate-400">({formatBytes(chatFile.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChatFile(null);
                  if (chatFileInputRef.current) chatFileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center gap-2"
          >
            {/* File attachment button */}
            <input
              type="file"
              ref={chatFileInputRef}
              onChange={(e) => setChatFile(e.target.files[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              title="Attach File or Image (Indexed to Files Tab)"
            >
              <Paperclip size={16} />
            </button>

            <input
              type="text"
              value={messageInput}
              onChange={handleTyping}
              placeholder={`Message ${group.name}...`}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={(!messageInput.trim() && !chatFile) || chatSending}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40"
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ASSIGNMENTS (Dedicated Upload & Personal Tracker) */}
      {/* ============================================================== */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Course Assignments
              </h2>
              <p className="text-xs text-slate-400">Formal assignments, lab manuals, and submission deliverables</p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-colors"
            >
              <Upload size={14} />
              <span>Create / Upload Assignment</span>
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No assignments uploaded in this group yet. Click "Create / Upload Assignment" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((item) => (
                <div
                  key={item._id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
                        {item.subject}
                      </span>
                      <button
                        onClick={() => handleToggleComplete(item._id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                          item.isCompleted
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Personal tracker"
                      >
                        <CheckCircle2 size={13} />
                        <span>{item.isCompleted ? 'Completed' : 'Mark Done'}</span>
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-y-1 gap-x-4 text-[11px] text-slate-400">
                      {item.facultyName && <span>Faculty: {item.facultyName}</span>}
                      {item.deadline && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                          <Clock size={12} /> Due: {new Date(item.deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <span>Shared by: {item.uploaderName}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                      {item.fileName}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={item.fileUrl}
                        download={item.fileName}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Download Document"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </a>
                      {item.canDelete && (
                        <button
                          onClick={() => handleDeleteAssignment(item._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: FILES & MEDIA (Unified Repository from Chat & Assignments) */}
      {/* ============================================================== */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Files & Media Library
              </h2>
              <p className="text-xs text-slate-400">
                All files, images, and notes shared in group chat and assignments
              </p>
            </div>
            <button
              onClick={() => setLibraryModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-colors"
            >
              <Upload size={14} />
              <span>Upload to Library</span>
            </button>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'document', label: 'Documents' },
                { id: 'image', label: 'Images' },
                { id: 'code', label: 'Code & Archives' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFileFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    fileFilter === f.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search file name or uploader..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Files Grid */}
          {filesLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">Loading library files...</div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              <FolderOpen size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              No files found in library matching filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredFiles.map((f) => {
                const isImg = f.fileType === 'image' || f.fileName?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);
                return (
                  <div
                    key={f.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div>
                      {/* Thumbnail or Icon */}
                      {isImg ? (
                        <div
                          className="h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                          onClick={() => setLightboxUrl(f.fileUrl)}
                        >
                          <img
                            src={f.fileUrl}
                            alt={f.fileName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-full rounded-xl bg-slate-50 dark:bg-slate-800/80 mb-3 flex items-center justify-center text-indigo-500">
                          {f.fileName?.match(/\.(py|js|jsx|ts|tsx|c|cpp|java|html|css)$/i) ? (
                            <FileCode size={28} />
                          ) : f.fileName?.match(/\.(zip|rar|7z|tar|gz)$/i) ? (
                            <FileArchive size={28} />
                          ) : (
                            <FileText size={28} />
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          f.source === 'assignment'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : f.source === 'chat'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {f.source === 'assignment' ? 'Assignment' : f.source === 'chat' ? 'Chat Media' : 'Library'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {f.subject}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate" title={f.title || f.fileName}>
                        {f.title || f.fileName}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                        {f.fileName}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="text-slate-400 text-[10px]">
                        <span>{formatBytes(f.fileSize)}</span> • <span>{f.uploadedBy}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {isImg && (
                          <button
                            onClick={() => setLightboxUrl(f.fileUrl)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Preview"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                        <a
                          href={f.fileUrl}
                          download={f.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Download size={12} />
                          <span>Save</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ANNOUNCEMENTS */}
      {/* ============================================================== */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Group Announcements
              </h2>
              <p className="text-xs text-slate-400">Important notices published by administrators</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setAnnouncementModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
              >
                <Plus size={14} />
                <span>Publish Announcement</span>
              </button>
            )}
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              No announcements published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className={`p-5 rounded-3xl border shadow-sm ${
                    ann.priority === 'Urgent'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="p-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center gap-0.5">
                          <Pin size={11} /> Pinned
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ann.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : ann.priority === 'Important'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {ann.priority}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(ann.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {ann.canDelete && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann._id)}
                        className="text-slate-400 hover:text-rose-500 text-xs"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-line">
                    {ann.content}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    Published by {ann.creatorName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: MEMBERS ROSTER */}
      {/* ============================================================== */}
      {activeTab === 'members' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Group Roster ({group.members?.length || 0})
            </h2>
            <p className="text-xs text-slate-400">Authorized students and administrators in this group</p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {group.members?.map((member) => (
              <div key={member._id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatarUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(member.fullName || 'User')}
                    alt={member.fullName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {member.fullName}
                      </p>
                      {member.role === 'admin' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.2 rounded-full">
                          Admin
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Member
                        </span>
                      )}
                      {member.batch && (
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.2 rounded">
                          Batch {member.batch}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      @{member.username} • {member.department || 'CSE'} Sem {member.semester || 'V'} {member.section || 'C'}
                    </p>
                  </div>
                </div>

                {isAdmin && member.userId !== user._id && (
                  <div className="flex items-center gap-2">
                    {member.role === 'admin' ? (
                      <button
                        onClick={() => handleManageMember(member._id, 'demote')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => handleManageMember(member._id, 'promote')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg"
                      >
                        Make Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleManageMember(member._id, 'remove')}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                      title="Remove from group"
                    >
                      <UserX size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPLOAD ASSIGNMENT MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setUploadModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Share Assignment or Lab Manual
            </h2>

            <form onSubmit={handleUploadAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Lab Manual Experiment 4"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course / Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    placeholder="e.g. React Lab"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={uploadFaculty}
                    onChange={(e) => setUploadFaculty(e.target.value)}
                    placeholder="Prof. Prathyusha R"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Submission Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={uploadDeadline}
                  onChange={(e) => setUploadDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="e.g. Submit by next lab session in spiral bound"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attach Document (PDF, DOCX, ZIP, Code) *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="w-1/3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="w-2/3 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {uploadLoading ? 'Uploading...' : 'Publish to Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD DIRECTLY TO LIBRARY MODAL */}
      {libraryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setLibraryModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add File to Group Resource Library
            </h2>

            <form onSubmit={handleUploadLibraryFile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={libTitle}
                  onChange={(e) => setLibTitle(e.target.value)}
                  placeholder="e.g. Module 3 Notes & Question Bank"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject / Category
                </label>
                <input
                  type="text"
                  value={libSubject}
                  onChange={(e) => setLibSubject(e.target.value)}
                  placeholder="e.g. AI Concepts & Practice"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select File *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setLibFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLibraryModalOpen(false)}
                  className="w-1/3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={libUploading}
                  className="w-2/3 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {libUploading ? 'Saving...' : 'Add to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {announcementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setAnnouncementModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              ×
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Publish Group Announcement
            </h2>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. CIE-2 Syllabus & Question Bank"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={annPriority}
                    onChange={(e) => setAnnPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent Alert</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={annPinned}
                    onChange={(e) => setAnnPinned(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="pinned" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pin Announcement
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Detailed instructions for group members..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAnnouncementModalOpen(false)}
                  className="w-1/3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
