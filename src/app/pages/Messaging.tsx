import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, Send, Search, Plus, ArrowLeft, Paperclip, Smile, X, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { messagingApi } from '../services/api';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Initialise Reverb/Echo once (module-level singleton)
let echo: Echo<'reverb'> | null = null;
function getEcho(): Echo<'reverb'> {
  if (!echo) {
    (window as unknown as Record<string, unknown>).Pusher = Pusher;
    echo = new Echo({
      broadcaster:  'reverb',
      key:          import.meta.env.VITE_REVERB_APP_KEY    ?? 'local',
      wsHost:       import.meta.env.VITE_REVERB_HOST       ?? '127.0.0.1',
      wsPort:       Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      wssPort:      Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
      forceTLS:     (import.meta.env.VITE_REVERB_SCHEME    ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: '/broadcasting/auth',
      auth: { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` } },
    } as Parameters<typeof Echo>[0]);
  }
  return echo;
}

const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🎉','🔥','👏'];

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
}

export default function Messaging() {
  const { conversations, setConversations } = useApp() as unknown as {
    conversations: Record<string, unknown>[];
    setConversations: (fn: (prev: Record<string, unknown>[]) => Record<string, unknown>[]) => void;
  };
  const { user } = useAuth();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages]             = useState<ApiMessage[]>([]);
  const [messageText, setMessageText]       = useState('');
  const [search, setSearch]                 = useState('');
  const [showMobileConv, setShowMobileConv] = useState(false);
  const [sending, setSending]               = useState(false);
  const [emojiOpen, setEmojiOpen]           = useState(false);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers]       = useState<Set<string>>(new Set());
  const [filePreview, setFilePreview]       = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

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

    // Load message history
    messagingApi.messages(selectedConvId).then(res => {
      setMessages(res.data.data ?? res.data ?? []);
    });

    const echoInstance = getEcho();
    const channel = echoInstance.private(`conversation.${selectedConvId}`);

    channel.listen('.message.sent', (data: ApiMessage) => {
      setMessages(prev => [...prev, data]);
    });

    channel.listen('.reaction.added', (data: { message_id: string; reactions: Record<string, string[]> }) => {
      setMessages(prev =>
        prev.map(m => m.id === data.message_id ? { ...m, reactions: data.reactions } : m)
      );
    });

    return () => {
      echoInstance.leave(`conversation.${selectedConvId}`);
    };
  }, [selectedConvId]);

  // Presence channel for online status
  useEffect(() => {
    if (!user) return;
    const echoInstance = getEcho();
    const presence = echoInstance.join('online-users') as unknown as {
      here:   (fn: (members: { id: string }[]) => void) => unknown;
      joining:(fn: (member: { id: string }) => void)    => unknown;
      leaving:(fn: (member: { id: string }) => void)    => unknown;
    };
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
    const res = await messagingApi.react(messageId, emoji);
    const updated = res.data.data;
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, reactions: updated.reactions } : m)
    );
  };

  const isOnline = (participantId: unknown) =>
    typeof participantId === 'string' && onlineUsers.has(participantId);

  const initials = (name: unknown) =>
    String(name ?? '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

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
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input type="text" placeholder="Search messages..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No conversations</div>
          ) : filteredConvs.map(conv => {
            const participantName = String(conv.participantName ?? conv.participant_name ?? '');
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
                    {initials(participantName)}
                  </div>
                  {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{participantName}</p>
                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{lastTime}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{lastMsg}</p>
                  <span className="text-[10px] text-indigo-400">{participantRole}</span>
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
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
              <button onClick={() => setShowMobileConv(false)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                  {initials(selectedConv.participantName ?? selectedConv.participant_name)}
                </div>
                {isOnline(selectedConv.participant_user_id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{String(selectedConv.participantName ?? selectedConv.participant_name ?? '')}</p>
                <p className="text-xs text-gray-400">
                  {String(selectedConv.participantRole ?? selectedConv.participant_role ?? '')} ·{' '}
                  {isOnline(selectedConv.participant_user_id)
                    ? <span className="text-green-500 font-medium">Online</span>
                    : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
              {messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(msg.sender_name)}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                      {/* Bubble */}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm relative ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
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
                        {/* Reaction button */}
                        <button
                          onClick={() => setReactionTarget(reactionTarget === msg.id ? null : msg.id)}
                          className="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm"
                          style={isOwn ? { left: '-28px' } : { right: '-28px' }}>
                          <Smile className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>

                      {/* Emoji picker popup */}
                      {reactionTarget === msg.id && (
                        <div className={`flex gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 z-10 ${isOwn ? 'mr-1' : 'ml-1'}`}>
                          {EMOJI_LIST.map(emoji => (
                            <button key={emoji} onClick={() => handleReact(msg.id, emoji)}
                              className="text-base hover:scale-125 transition-transform">
                              {emoji}
                            </button>
                          ))}
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

                      <span className="text-[10px] text-gray-400 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

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

            {/* Input */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={e => setFilePreview(e.target.files?.[0] ?? null)} />
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-500 transition-colors flex-shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea value={messageText} onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send)"
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] max-h-24"
                  style={{ fieldSizing: 'content' } as React.CSSProperties} />
                <button onClick={handleSend} disabled={(!messageText.trim() && !filePreview) || sending}
                  className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${(messageText.trim() || filePreview) && !sending ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
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
