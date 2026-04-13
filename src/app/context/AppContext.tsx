import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Course, Category, Notification, Conversation, mockCourses, mockCategories, mockNotifications, mockConversations, mockCurrentUser, Section, Activity, ActivityType } from '../data/mockData';

interface AppContextType {
  // Edit mode
  editMode: boolean;
  toggleEditMode: () => void;

  // Current user
  currentUser: typeof mockCurrentUser;

  // Courses
  courses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;

  // Sections & Activities
  addSection: (courseId: string, title: string) => void;
  updateSection: (courseId: string, sectionId: string, updates: Partial<Section>) => void;
  deleteSection: (courseId: string, sectionId: string) => void;
  addActivity: (courseId: string, sectionId: string, activity: Activity) => void;
  updateActivity: (courseId: string, sectionId: string, activityId: string, updates: Partial<Activity>) => void;
  deleteActivity: (courseId: string, sectionId: string, activityId: string) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Notifications
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;

  // Conversations/Messaging
  conversations: Conversation[];
  sendMessage: (conversationId: string, content: string) => void;
  totalUnreadMessages: number;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  onboardingCompleted: boolean;
  setOnboardingCompleted: (v: boolean) => void;

  // Search
  globalSearch: string;
  setGlobalSearch: (v: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [editMode, setEditMode] = useState(false);
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const toggleEditMode = useCallback(() => setEditMode(prev => !prev), []);

  const addCourse = useCallback((course: Course) => {
    setCourses(prev => [course, ...prev]);
  }, []);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCourse = useCallback((id: string) => {
    return courses.find(c => c.id === id);
  }, [courses]);

  const addSection = useCallback((courseId: string, title: string) => {
    const newSection: Section = {
      id: `sec_${Date.now()}`,
      title,
      visible: true,
      activities: [],
    };
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, sections: [...c.sections, newSection] };
    }));
  }, []);

  const updateSection = useCallback((courseId: string, sectionId: string, updates: Partial<Section>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, sections: c.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s) };
    }));
  }, []);

  const deleteSection = useCallback((courseId: string, sectionId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, sections: c.sections.filter(s => s.id !== sectionId) };
    }));
  }, []);

  const addActivity = useCallback((courseId: string, sectionId: string, activity: Activity) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c, sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, activities: [...s.activities, activity] };
        })
      };
    }));
  }, []);

  const updateActivity = useCallback((courseId: string, sectionId: string, activityId: string, updates: Partial<Activity>) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c, sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, activities: s.activities.map(a => a.id === activityId ? { ...a, ...updates } : a) };
        })
      };
    }));
  }, []);

  const deleteActivity = useCallback((courseId: string, sectionId: string, activityId: string) => {
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return {
        ...c, sections: c.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, activities: s.activities.filter(a => a.id !== activityId) };
        })
      };
    }));
  }, []);

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const sendMessage = useCallback((conversationId: string, content: string) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      senderId: mockCurrentUser.id,
      senderName: mockCurrentUser.name,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;
      return { ...conv, messages: [...conv.messages, newMessage], lastMessage: content, lastMessageTime: 'Just now', unreadCount: 0 };
    }));
  }, []);

  const totalUnreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AppContext.Provider value={{
      editMode, toggleEditMode,
      currentUser: mockCurrentUser,
      courses, addCourse, updateCourse, deleteCourse, getCourse,
      addSection, updateSection, deleteSection,
      addActivity, updateActivity, deleteActivity,
      categories, addCategory, updateCategory, deleteCategory,
      notifications, markNotificationRead, markAllRead, unreadCount,
      conversations, sendMessage, totalUnreadMessages,
      showOnboarding, setShowOnboarding,
      onboardingCompleted, setOnboardingCompleted,
      globalSearch, setGlobalSearch,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
