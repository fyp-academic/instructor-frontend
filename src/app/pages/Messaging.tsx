import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Search, Plus, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Messaging() {
  const { conversations, sendMessage, currentUser } = useApp();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [showMobileConv, setShowMobileConv] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const filteredConvs = conversations.filter(c =>
    c.participantName.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedConvId) return;
    sendMessage(selectedConvId, messageText.trim());
    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex gap-0 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-gray-200 flex flex-col ${showMobileConv ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Messages</h2>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500" title="New message">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search messages..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm outline-none flex-1"
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="overflow-y-auto flex-1">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No conversations</div>
          ) : (
            filteredConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => { setSelectedConvId(conv.id); setShowMobileConv(true); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors text-left ${selectedConvId === conv.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {conv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{conv.participantName}</p>
                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{conv.lastMessageTime}</span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-700' : 'text-gray-400'}`}>{conv.lastMessage}</p>
                  <span className="text-[10px] text-indigo-400">{conv.participantRole}</span>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-indigo-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation panel */}
      <div className={`flex-1 flex flex-col ${!showMobileConv && 'hidden md:flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 bg-white">
              <button
                onClick={() => setShowMobileConv(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                {selectedConv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedConv.participantName}</p>
                <p className="text-xs text-gray-400">{selectedConv.participantRole} · Online now</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
              {selectedConv.messages.map(msg => {
                const isOwn = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {msg.senderName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 px-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="px-4 py-4 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send)"
                  rows={1}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] max-h-24"
                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim()}
                  className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${messageText.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
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
