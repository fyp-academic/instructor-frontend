import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, MessageSquare, User, ChevronDown, Search, Settings,
  LogOut, Edit3, X, CheckCheck, Menu, BellRing,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

/**
 * Slim utility top bar. Primary navigation now lives in the Sidebar, so the
 * header only carries search and account-level actions on a clean light surface.
 */
export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();
  const {
    editMode, toggleEditMode, unreadCount, totalUnreadMessages, notifications,
    markNotificationRead, markAllRead, setGlobalSearch, globalSearch, currentUser, conversations,
  } = useApp();

  const handleLogout = async () => {
    await logout();
    window.location.href = import.meta.env.VITE_STUDENT_URL ?? 'https://apesudom.codagenz.com';
  };

  const [notifOpen, setNotifOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) setMsgOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconBtn = 'relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="h-14 flex items-center gap-3 px-4">
        {/* Hamburger — opens the sidebar drawer on mobile */}
        <button onClick={onMenuClick} className="lg:hidden p-2 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div
          data-tour="search"
          className={`flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 max-w-md transition-all ${searchFocused ? 'ring-2 ring-indigo-400 bg-white' : ''}`}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search courses, activities..."
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none w-full"
          />
          {globalSearch && (
            <button onClick={() => setGlobalSearch('')} className="text-gray-400 hover:text-gray-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Edit Mode */}
          <button
            data-tour="edit-mode"
            onClick={toggleEditMode}
            title="Toggle Edit Mode"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              editMode ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden lg:block">{editMode ? 'Editing' : 'Edit Mode'}</span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef} data-tour="notifications">
            <button onClick={() => { setNotifOpen(!notifOpen); setMsgOpen(false); setProfileOpen(false); }} className={iconBtn}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.slice(0, 6).map(n => (
                    <div
                      key={n.id}
                      onClick={() => { markNotificationRead(n.id); navigate(isAdmin ? '/admin/notifications' : '/notifications'); setNotifOpen(false); }}
                      className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${!n.read ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                        <div className="min-w-0">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 truncate">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{n.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { navigate(isAdmin ? '/admin/notifications' : '/notifications'); setNotifOpen(false); }} className="w-full py-2.5 text-sm text-indigo-600 hover:bg-gray-50 font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </div>

          {/* Messaging */}
          <div className="relative" ref={msgRef} data-tour="messages">
            <button onClick={() => { setMsgOpen(!msgOpen); setNotifOpen(false); setProfileOpen(false); }} className={iconBtn}>
              <MessageSquare className="w-5 h-5" />
              {totalUnreadMessages > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-green-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {totalUnreadMessages}
                </span>
              )}
            </button>
            {msgOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-800">Messages</span>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{totalUnreadMessages} unread</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => { navigate('/messaging'); setMsgOpen(false); }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 ${conv.unreadCount > 0 ? 'bg-green-50' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {conv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800 truncate">{conv.participantName}</p>
                          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{conv.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-green-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold flex-shrink-0">{conv.unreadCount}</span>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => { navigate('/messaging'); setMsgOpen(false); }} className="w-full py-2.5 text-sm text-indigo-600 hover:bg-gray-50 font-medium">
                  Open Messages
                </button>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef} data-tour="profile">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); setMsgOpen(false); }}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {currentUser.profile_image_url ? (
                <img src={currentUser.profile_image_url} alt={currentUser.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    {currentUser.profile_image_url ? (
                      <img src={currentUser.profile_image_url} alt={currentUser.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <span className="inline-block mt-2 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full capitalize">{currentUser.role}</span>
                </div>
                <div className="py-1">
                  <button onClick={() => { navigate('/profile'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4 text-gray-400" /> My Profile
                  </button>
                  <button onClick={() => { navigate(isAdmin ? '/admin/notification-preferences' : '/notification-preferences'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <BellRing className="w-4 h-4 text-gray-400" /> {isAdmin ? 'Admin Preferences' : 'Preferences'}
                  </button>
                  <button onClick={() => { navigate('/administration'); setProfileOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 text-gray-400" /> Administration
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
