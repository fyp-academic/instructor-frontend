import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Search, Plus, ArrowLeft, Paperclip, Smile, X, Download, Trash2, Pin, Check, CheckCheck, BookOpen, GraduationCap, Users, MoreHorizontal } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { messagingApi } from '../services/api';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

// Initialise Reverb/Echo once (module-level singleton)
let echo: Echo<'reverb'> | null = null;
function getEcho(): Echo<'reverb'> {
  if (!echo) {
    (window as unknown as Record<string, unknown>).Pusher = Pusher;
    echo = new Echo({
      broadcaster:  'reverb',
      key:          import.meta.env.VITE_REVERB_APP_KEY,
      wsHost:       import.meta.env.VITE_REVERB_HOST,
      wsPort:       Number(import.meta.env.VITE_REVERB_PORT),
      wssPort:      Number(import.meta.env.VITE_REVERB_PORT),
      forceTLS:     true,
      enabledTransports: ['ws', 'wss'],
      authEndpoint: 'https://api.codagenz.com/broadcasting/auth',
      auth: { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` } },
    } as ConstructorParameters<typeof Echo>[0]);
  }
  return echo;
}

type ChatType = 'direct' | 'course' | 'programme';

interface ApiMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string | null;
  timestamp: string;
  read: boolean;
  reactions: Record<string, string[]> | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  deleted_at?: string | null;
  deletion_type?: 'me' | 'everyone';
  is_pinned?: boolean;
  message_type?: 'text' | 'question' | 'announcement' | 'resource';
}

interface TypingUser {
  user_id: string;
  user_name: string;
  is_typing: boolean;
}


export default function Messaging() {
  const { conversations, setConversations } = useApp() as unknown as {
    conversations: Record<string, unknown>[];
    setConversations: (fn: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void;
  };
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<ChatType>('direct');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages]             = useState<ApiMessage[]>([]);
  const [messageText, setMessageText]       = useState('');
  const [search, setSearch]                 = useState('');
  const [showMobileConv, setShowMobileConv] = useState(false);
  const [sending, setSending]               = useState(false);
  const [emojiOpen, setEmojiOpen]           = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers]       = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers]       = useState<TypingUser[]>([]);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  const [pinnedMessages, setPinnedMessages] = useState<ApiMessage[]>([]);
  const [showPinned, setShowPinned]         = useState(false);
  const [filePreview, setFilePreview]       = useState<File | null>(null);
  const [contextMenu, setContextMenu]       = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSentTypingRef = useRef(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const selectedConv = (conversations as Record<string, unknown>[]).find((c) => c.id === selectedConvId);

  const filteredConvs = (conversations as Record<string, unknown>[]).filter(c => {
    const name = String(c.participantName ?? c.participant_name ?? '').toLowerCase();
    const last = String(c.lastMessage    ?? c.last_message    ?? '').toLowerCase();
    return name.includes(search.toLowerCase()) || last.includes(search.toLowerCase());
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Subscribe to Reverb channel when conversation changes
  useEffect(() => {
    if (!selectedConvId) return;

    // Load message history and pinned messages
    messagingApi.messages(selectedConvId).then(res => {
      setMessages(res.data.data ?? res.data ?? []);
    });
    messagingApi.pinnedMessages?.(selectedConvId).then(res => {
      setPinnedMessages(res?.data?.data ?? []);
    }).catch(() => { /* pinned messages endpoint may not exist yet */ });

    const echoInstance = getEcho();
    const channel = echoInstance.private(`conversation.${selectedConvId}`);

    channel.listen('.message.sent', (data: ApiMessage) => {
      setMessages(prev => [...prev, data]);
      // Mark delivered immediately
      if (data.sender_id !== user?.id) {
        messagingApi.markDelivered?.(data.id).catch(() => {});
      }
    });

    channel.listen('.reaction.added', (data: { message_id: string; reactions: Record<string, string[]> }) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, reactions: data.reactions } : m)
      );
    });

    // Typing indicators
    channel.listen('.user.typing', (data: TypingUser) => {
      if (data.user_id !== user?.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.user_id !== data.user_id);
          return data.is_typing ? [...filtered, data] : filtered;
        });
      }
    });

    // Message delivery status
    channel.listen('.message.status', (data: { message_id: string; user_id: string; status: 'delivered' | 'read' }) => {
      if (data.user_id !== user?.id) {
        setMessageStatuses(prev => ({ ...prev, [data.message_id]: data.status }));
      }
    });

    // Message deleted
    channel.listen('.message.deleted', (data: { message_id: string; deletion_type: string }) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, deleted_at: new Date().toISOString(), content: null } : m)
      );
    });

    // Message pinned
    channel.listen('.message.pinned', (data: { message_id: string; is_pinned: boolean }) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, is_pinned: data.is_pinned } : m)
      );
      // Refresh pinned messages
      messagingApi.pinnedMessages?.(selectedConvId).then(res => {
        setPinnedMessages(res?.data?.data ?? []);
      }).catch(() => {});
    });

    return () => {
      echoInstance.leave(`conversation.${selectedConvId}`);
    };
  }, [selectedConvId, user?.id]);

  // Presence channel for online status
  useEffect(() => {
    if (!user) return;
    const echoInstance = getEcho();
    type PresenceChannel = {
      here:   (fn: (members: { id: string }[]) => void) => PresenceChannel;
      joining:(fn: (member: { id: string }) => void)    => PresenceChannel;
      leaving:(fn: (member: { id: string }) => void)    => PresenceChannel;
    };
    const presence = echoInstance.join('online-users') as unknown as PresenceChannel;
    presence
      .here((members) => setOnlineUsers(new Set(members.map(m => m.id))))
      .joining((member) => setOnlineUsers(prev => new Set([...prev, member.id])))
      .leaving((member) => setOnlineUsers(prev => { const s = new Set(prev); s.delete(member.id); return s; }));
    return () => { echoInstance.leave('online-users'); };
  }, [user]);

  const handleSend = useCallback(async () => {
    if ((!messageText.trim() && !filePreview) || !selectedConvId || sending) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (messageText.trim()) fd.append('content', messageText.trim());
      if (filePreview) fd.append('attachment', filePreview);

      const res = await messagingApi.sendMessage(selectedConvId, fd);
      const newMsg: ApiMessage = res.data.data ?? res.data;
      setMessages(prev => [...prev, newMsg]);
      setMessageText('');
      setFilePreview(null);
    } finally {
      setSending(false);
    }
  }, [messageText, filePreview, selectedConvId, sending]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedConvId) return;
    setReactionTarget(null);
    setShowEmojiPicker(false);
    setEmojiPickerMessageId(null);
    const res = await messagingApi.react(messageId, emoji);
    const updated = res.data.data;
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, reactions: updated.reactions } : m)
    );
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (emojiPickerMessageId) {
      handleReact(emojiPickerMessageId, emojiData.emoji);
    }
  };

  const toggleEmojiPicker = (messageId: string) => {
    if (showEmojiPicker && emojiPickerMessageId === messageId) {
      setShowEmojiPicker(false);
      setEmojiPickerMessageId(null);
    } else {
      setShowEmojiPicker(true);
      setEmojiPickerMessageId(messageId);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setEmojiPickerMessageId(null);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Typing indicator handler
  const handleInputChange = (value: string) => {
    setMessageText(value);
    if (!selectedConvId || !value.trim()) return;

    if (!hasSentTypingRef.current) {
      hasSentTypingRef.current = true;
      messagingApi.typing?.(selectedConvId, true).catch(() => {});
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      hasSentTypingRef.current = false;
      messagingApi.typing?.(selectedConvId, false).catch(() => {});
    }, 2000);
  };

  // Delete message handler
  const handleDeleteMessage = async (messageId: string, deletionType: 'me' | 'everyone') => {
    try {
      await messagingApi.deleteMessage?.(messageId, deletionType);
      if (deletionType === 'everyone') {
        setMessages(prev =>
          prev.map(m => m.id === messageId ? { ...m, deleted_at: new Date().toISOString(), content: null } : m)
        );
      }
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Pin message handler
  const handlePinMessage = async (messageId: string, isPinned: boolean) => {
    try {
      await messagingApi.pinMessage?.(messageId, isPinned);
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, is_pinned: isPinned } : m)
      );
      if (selectedConvId) {
        messagingApi.pinnedMessages?.(selectedConvId).then(res => {
          setPinnedMessages(res?.data?.data ?? []);
        }).catch(() => {});
      }
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to pin message:', err);
    }
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Mark messages as read
  const markMessagesRead = useCallback(async () => {
    if (!selectedConvId) return;
    const unreadMessages = messages.filter(m => m.sender_id !== user?.id && !m.read);
    for (const msg of unreadMessages) {
      await messagingApi.markMessageRead?.(msg.id).catch(() => {});
    }
  }, [messages, selectedConvId, user?.id]);

  useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  const isOnline = (participantId: unknown) =>
    typeof participantId === 'string' && onlineUsers.has(participantId);

  const initials = (name: unknown) =>
    String(name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Get conversation display name
  const getConversationName = (convo: Record<string, unknown>) => {
    const type = convo.type as ChatType | undefined;
    if (type === 'course' || type === 'programme') {
      return String(convo.title ?? convo.participant_name ?? 'Group Chat');
    }
    return String(convo.participant_name ?? 'Unknown');
  };

  // Get conversation icon based on type
  const getConversationIcon = (type: ChatType | undefined) => {
    switch (type) {
      case 'course': return <BookOpen size={14} className="text-blue-500" />;
      case 'programme': return <GraduationCap size={14} className="text-purple-500" />;
      default: return null;
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex flex-col ${showMobileConv ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Messages</h2>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="New message">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Type Tabs - Icons inline with text */}
          <div className="flex gap-1 mb-3 p-1 rounded-lg bg-gray-100">
            {(['direct', 'course', 'programme'] as ChatType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedConvId(null); }}
                className="flex-1 py-1.5 px-1 sm:px-2 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1"
                style={{
                  backgroundColor: activeTab === tab ? "white" : "transparent",
                  color: activeTab === tab ? "#4f46e5" : "#6b7280",
                  boxShadow: activeTab === tab ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {tab === 'direct' && <Users size={12} />}
                {tab === 'course' && <BookOpen size={12} />}
                {tab === 'programme' && <GraduationCap size={12} />}
                <span className="hidden sm:inline">{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                <span className="sm:hidden">{tab.charAt(0).toUpperCase()}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search messages..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No {activeTab} chats</div>
          ) : filteredConvs.map(conv => {
            const convType = conv.type as ChatType | undefined;
            const isGroupChat = convType === 'course' || convType === 'programme';
            const participantName = getConversationName(conv);
            const participantRole = String(conv.participantRole ?? conv.participant_role ?? '');
            const lastMsg         = String(conv.lastMessage     ?? conv.last_message    ?? '');
            const lastTime        = String(conv.lastMessageTime ?? conv.last_message_time ?? '');
            const unread          = Number(conv.unreadCount     ?? conv.unread_count    ?? 0);
            const participantId   = conv.participant_user_id;
            const online          = isOnline(participantId);
            return (
              <button key={String(conv.id)}
                onClick={() => { setSelectedConvId(String(conv.id)); setShowMobileConv(true); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left ${selectedConvId === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                    {isGroupChat
                      ? (convType === 'course' ? <BookOpen size={16} /> : <GraduationCap size={16} />)
                      : initials(participantName)}
                  </div>
                  {!isGroupChat && online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {getConversationIcon(convType)}
                      <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{participantName}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{lastTime}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{lastMsg}</p>
                  {!isGroupChat && <span className="text-[10px] text-indigo-400">{participantRole}</span>}
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{unread}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div className={`flex-1 flex flex-col ${!showMobileConv && 'hidden md:flex'}`}>
        {selectedConv ? (
          <>
            {/* Header - With back button and responsive text */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button onClick={() => setShowMobileConv(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                    {(selectedConv.type === 'course' || selectedConv.type === 'programme')
                      ? (selectedConv.type === 'course' ? <BookOpen size={16} /> : <GraduationCap size={16} />)
                      : initials(getConversationName(selectedConv))}
                  </div>
                  {selectedConv.type !== 'course' && selectedConv.type !== 'programme' && isOnline(selectedConv.participant_user_id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{getConversationName(selectedConv)}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {selectedConv.type === 'course' || selectedConv.type === 'programme'
                      ? (selectedConv.type === 'course' ? 'Course Chat' : 'Programme Chat')
                      : <>
                          {String(selectedConv.participantRole ?? selectedConv.participant_role ?? '')} ·{' '}
                          {isOnline(selectedConv.participant_user_id)
                            ? <span className="text-green-500 font-medium">Online</span>
                            : 'Offline'}
                        </>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pinnedMessages.length > 0 && (
                  <button
                    onClick={() => setShowPinned(!showPinned)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors"
                    style={{ backgroundColor: showPinned ? "#dbeafe" : "#f3f4f6", color: showPinned ? "#2563eb" : "#6b7280" }}
                  >
                    <Pin size={12} />
                    {pinnedMessages.length} pinned
                  </button>
                )}
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                  <MoreHorizontal size={17} />
                </button>
              </div>
            </div>

            {/* Pinned Messages Banner */}
            {showPinned && pinnedMessages.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 bg-indigo-50">
                <div className="flex items-center gap-2 mb-2">
                  <Pin size={12} className="text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600">Pinned Messages</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {pinnedMessages.map((msg) => (
                    <div key={msg.id} className="text-xs p-2 rounded-lg bg-white border border-gray-100">
                      <span className="font-medium text-gray-700">{msg.sender_name}:</span>{' '}
                      <span className="text-gray-500">{msg.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-1 border-b border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {typingUsers.map((u) => u.user_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </p>
              </div>
            )}

            {/* Messages - Responsive padding */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-gray-50">
              {messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                const isDeleted = msg.deleted_at != null;
                const status = messageStatuses[msg.id];
                const canDeleteEveryone = isOwn && !isDeleted && new Date(msg.timestamp).getTime() > Date.now() - 10 * 60 * 1000;

                return (
                  <div key={msg.id} className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(msg.sender_name)}
                      </div>
                    )}
                    <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div
                        onContextMenu={(e) => handleContextMenu(e, msg.id)}
                        className={`px-4 py-2.5 rounded-2xl text-sm relative ${isDeleted ? 'opacity-60 bg-gray-100 text-gray-400' : (isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm')}`}>
                        {/* Pin indicator */}
                        {msg.is_pinned && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center bg-yellow-400">
                            <Pin size={8} className="text-white" />
                          </div>
                        )}

                        {isDeleted ? (
                          <span className="italic">This message was deleted</span>
                        ) : (
                          <>
                            {msg.content && <span>{msg.content}</span>}
                            {msg.attachment_path && (
                              <div className={`mt-2 flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 ${isOwn ? 'bg-indigo-700' : 'bg-gray-100'}`}>
                                <Paperclip className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate max-w-[140px]">{msg.attachment_name}</span>
                                <a
                                  href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/storage/${msg.attachment_path}`}
                                  target="_blank" rel="noreferrer"
                                  className="ml-auto flex-shrink-0">
                                  <Download className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </>
                        )}
                        {/* Reaction button - only for non-deleted messages */}
                        {!isDeleted && (
                          <button
                            onClick={() => toggleEmojiPicker(msg.id)}
                            className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm"
                            style={isOwn ? { left: '-28px' } : { right: '-28px' }}>
                            <Smile className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                      </div>

                      {/* Emoji picker popup - only for non-deleted messages */}
                      {!isDeleted && showEmojiPicker && emojiPickerMessageId === msg.id && (
                        <div ref={emojiPickerRef} className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'}`} style={{ bottom: '100%', marginBottom: '8px' }}>
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme={Theme.LIGHT}
                            width={280}
                            height={350}
                            searchPlaceholder="Search emoji..."
                            skinTonesDisabled
                          />
                        </div>
                      )}

                      {/* Reactions display */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) =>
                            users.length > 0 ? (
                              <button key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${users.includes(user?.id ?? '') ? 'bg-indigo-100 border-indigo-300' : 'bg-gray-100 border-gray-200'}`}>
                                {emoji} <span>{users.length}</span>
                              </button>
                            ) : null
                          )}
                        </div>
                      )}

                      {/* Timestamp and delivery status */}
                      <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-gray-400 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Delivery status for own messages */}
                        {isOwn && !isDeleted && (
                          <span className="text-[10px] text-gray-400">
                            {status === 'read' ? <CheckCheck size={10} /> : status === 'delivered' ? <Check size={10} /> : '•'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
              <div
                className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]"
                style={{ left: contextMenu.x, top: contextMenu.y }}
                onClick={closeContextMenu}
              >
                {(() => {
                  const msg = messages.find((m) => m.id === contextMenu.messageId);
                  if (!msg) return null;
                  const isOwn = msg.sender_id === user?.id;
                  const isDeleted = msg.deleted_at != null;
                  const canDeleteEveryone = isOwn && !isDeleted && new Date(msg.timestamp).getTime() > Date.now() - 10 * 60 * 1000;

                  return (
                    <>
                      {!isDeleted && (
                        <>
                          <button
                            onClick={() => handlePinMessage(msg.id, !msg.is_pinned)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Pin size={14} />
                            {msg.is_pinned ? 'Unpin Message' : 'Pin Message'}
                          </button>
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={() => handleDeleteMessage(msg.id, 'me')}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-600 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete for Me
                          </button>
                          {canDeleteEveryone && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id, 'everyone')}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-500 flex items-center gap-2"
                            >
                              <Trash2 size={14} />
                              Delete for Everyone
                            </button>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* File preview bar */}
            {filePreview && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-sm text-gray-600">
                <Paperclip className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="truncate flex-1">{filePreview.name}</span>
                <button onClick={() => setFilePreview(null)} className="text-gray-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input - Responsive padding */}
            <div className="px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={e => setFilePreview(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-500 transition-colors flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea value={messageText} onChange={e => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] max-h-24"
                  style={{ fieldSizing: 'content' } as React.CSSProperties} />
                <button onClick={handleSend} disabled={(!messageText.trim() && !filePreview) || sending}
                  className={`p-2 sm:p-2.5 rounded-xl transition-colors flex-shrink-0 ${(messageText.trim() || filePreview) && !sending ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-700">Select a conversation</h3>
              <p className="text-sm text-gray-400 mt-1">Choose a conversation from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
