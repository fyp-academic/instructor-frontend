import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Course, Category, Notification, Conversation, Section, Activity } from '../data/mockData';
import { coursesApi, categoriesApi, notificationsApi, messagingApi, activitiesApi, sectionsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface CurrentUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface AppContextType {
  // Edit mode
  editMode: boolean;
  toggleEditMode: () => void;

  // Current user
  currentUser: CurrentUser;
  isLoading: boolean;

  // Courses
  courses: Course[];
  addCourse: (course: Course) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  getCourse: (id: string) => Course | undefined;

  // Sections & Activities
  addSection: (courseId: string, title: string) => Promise<void>;
  updateSection: (courseId: string, sectionId: string, updates: Partial<Section>) => Promise<void>;
  deleteSection: (courseId: string, sectionId: string) => Promise<void>;
  addActivity: (courseId: string, sectionId: string, activity: Activity) => Promise<void>;
  updateActivity: (courseId: string, sectionId: string, activityId: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (courseId: string, sectionId: string, activityId: string) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Category) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

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
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [courses, setCourses]   = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(
    () => localStorage.getItem('onboarding_done') === '1'
  );
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch all base data on mount when authenticated
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    Promise.allSettled([
      coursesApi.list().then(r => {
        const courses = (r.data.data ?? r.data ?? []).map((c: any) => ({
          ...c,
          enrolledStudents: c.enrolled_students ?? c.enrolledStudents ?? 0,
          sections: (c.sections ?? [
            { id: 'sec_general', title: 'General', visible: true, activities: [] },
            { id: 'sec_topic1', title: 'Topic 1', visible: true, activities: [] },
          ]).map((s: any) => ({
            ...s,
            activities: (s.activities ?? []).map((a: any) => ({
              id: a.id,
              type: a.type,
              name: a.name,
              description: a.description || '',
              visible: a.visible ?? true,
              completionStatus: a.completion_status || 'none',
              settings: a.settings || {},
              gradeMax: a.grade_max,
              dueDate: a.due_date,
            })),
          })),
          instructor: typeof c.instructor === 'object' && c.instructor ? c.instructor.name : (c.instructor || c.instructor_name || 'Unknown'),
        }));
        setCourses(courses);
      }),
      categoriesApi.list().then(r => setCategories(r.data.data ?? r.data ?? [])),
      notificationsApi.list().then(r => setNotifications(r.data.data ?? r.data ?? [])),
      messagingApi.conversations().then(r => setConversations(
        (r.data.data ?? r.data ?? []).map((c: Record<string, unknown>) => ({
          ...c,
          messages:        [],
          participantName: c.participant_name ?? '',
          participantRole: c.participant_role ?? '',
          lastMessage:     c.last_message     ?? '',
          lastMessageTime: c.last_message_time ?? '',
          unreadCount:     c.unread_count      ?? 0,
        }))
      )),
    ]).finally(() => setIsLoading(false));
  }, [user]);

  const toggleEditMode = useCallback(() => setEditMode(prev => !prev), []);

  const addCourse = useCallback(async (course: Course): Promise<Course> => {
    const res = await coursesApi.create({
      name: course.name,
      short_name: course.shortName,
      description: course.description,
      category_id: course.categoryId,
      format: course.format,
      visibility: course.visibility,
      status: course.status, // Use the status passed from the component
      start_date: course.startDate,
      end_date: course.endDate,
      language: course.language,
      max_students: course.maxStudents,
      tags: course.tags,
      image: course.image,
    });
    const created = res.data.data ?? res.data;
    const newCourse: Course = {
      ...course,
      id: created.id,
      instructor: created.instructor_name ?? course.instructor,
      instructorId: created.instructor_id ?? course.instructorId,
      image: created.image ?? course.image,
    };
    setCourses(prev => [newCourse, ...prev]);
    return newCourse;
  }, []);

  const updateCourse = useCallback(async (id: string, updates: Partial<Course>) => {
    await coursesApi.update(id, {
      name: updates.name,
      short_name: updates.shortName,
      description: updates.description,
      category_id: updates.categoryId,
      format: updates.format,
      visibility: updates.visibility,
      status: updates.status,
      start_date: updates.startDate,
      end_date: updates.endDate,
      language: updates.language,
      max_students: updates.maxStudents,
      tags: updates.tags,
    });
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const deleteCourse = useCallback(async (id: string) => {
    await coursesApi.remove(id);
    setCourses(prev => prev.filter(c => c.id !== id));
  }, []);

  const getCourse = useCallback((id: string) => {
    return courses.find(c => c.id === id);
  }, [courses]);

  const addSection = useCallback(async (courseId: string, title: string) => {
    try {
      const res = await sectionsApi.create(courseId, { title, visible: true });
      const newSection = res.data.data ?? res.data;
      const section: Section = {
        id: newSection.id,
        title: newSection.title,
        visible: newSection.visible ?? true,
        activities: [],
      };
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, sections: [...c.sections, section] } : c));
    } catch (err) {
      console.error('Failed to add section:', err);
      // Fallback: add locally with temp ID
      const section: Section = {
        id: `sec_${Date.now()}`,
        title,
        visible: true,
        activities: [],
      };
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, sections: [...c.sections, section] } : c));
    }
  }, []);

  const updateSection = useCallback(async (courseId: string, sectionId: string, updates: Partial<Section>) => {
    try {
      await sectionsApi.update(sectionId, updates);
    } catch (err) {
      console.error('Failed to update section:', err);
    }
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, sections: c.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s) };
    }));
  }, []);

  const deleteSection = useCallback(async (courseId: string, sectionId: string) => {
    try {
      await sectionsApi.remove(sectionId);
    } catch (err) {
      console.error('Failed to delete section:', err);
    }
    setCourses(prev => prev.map(c => {
      if (c.id !== courseId) return c;
      return { ...c, sections: c.sections.filter(s => s.id !== sectionId) };
    }));
  }, []);

  const addActivity = useCallback(async (courseId: string, sectionId: string, activity: Activity) => {
    try {
      const res = await activitiesApi.create(sectionId, {
        type: activity.type,
        name: activity.name,
        description: activity.description,
        visible: activity.visible ?? true,
        grade_max: activity.gradeMax,
        due_date: activity.dueDate,
        settings: activity.settings,
      });
      const savedActivity = res.data.data ?? res.data;
      const act: Activity = {
        id: savedActivity.id,
        type: savedActivity.type,
        name: savedActivity.name,
        description: savedActivity.description || '',
        visible: savedActivity.visible ?? true,
        completionStatus: savedActivity.completion_status || 'none',
        settings: savedActivity.settings || {},
        gradeMax: savedActivity.grade_max,
        dueDate: savedActivity.due_date,
      };
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c, sections: c.sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, activities: [...s.activities, act] };
          })
        };
      }));
      return act;
    } catch (err) {
      console.error('Failed to add activity:', err);
      // Fallback: add locally
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        return {
          ...c, sections: c.sections.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, activities: [...s.activities, activity] };
          })
        };
      }));
      return activity;
    }
  }, []);

  const updateActivity = useCallback(async (courseId: string, sectionId: string, activityId: string, updates: Partial<Activity>) => {
    try {
      await activitiesApi.update(activityId, {
        name: updates.name,
        description: updates.description,
        visible: updates.visible,
        grade_max: updates.gradeMax,
        due_date: updates.dueDate,
        settings: updates.settings,
      });
    } catch (err) {
      console.error('Failed to update activity:', err);
    }
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

  const deleteActivity = useCallback(async (courseId: string, sectionId: string, activityId: string) => {
    try {
      await activitiesApi.remove(activityId);
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
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

  const addCategory = useCallback(async (category: Category) => {
    try {
      const res = await categoriesApi.create({
        name: category.name,
        description: category.description,
        parent_id: category.parentId,
        id_number: category.idNumber,
      });
      const newCat = res.data.data ?? res.data;
      setCategories(prev => [...prev, {
        id: newCat.id,
        name: newCat.name,
        description: newCat.description || '',
        parentId: newCat.parent_id,
        idNumber: newCat.id_number,
        courseCount: newCat.course_count ?? 0,
        childCount: newCat.child_count ?? 0,
      }]);
    } catch (err) {
      console.error('Failed to create category:', err);
      throw err;
    }
  }, []);

  const updateCategory = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      await categoriesApi.update(id, {
        name: updates.name,
        description: updates.description,
        parent_id: updates.parentId,
        id_number: updates.idNumber,
      });
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    } catch (err) {
      console.error('Failed to update category:', err);
      throw err;
    }
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await categoriesApi.delete(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete category:', err);
      throw err;
    }
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    const fd = new FormData();
    fd.append('content', content);
    const res = await messagingApi.sendMessage(conversationId, fd);
    const newMessage = res.data.data ?? res.data;
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;
      return {
        ...conv,
        messages: [...(conv.messages ?? []), {
          id:         newMessage.id,
          senderId:   newMessage.sender_id,
          senderName: newMessage.sender_name,
          content:    newMessage.content,
          timestamp:  newMessage.timestamp,
          read:       true,
        }],
        lastMessage:     content,
        lastMessageTime: 'Just now',
        unreadCount:     0,
      };
    }));
  }, []);

  const totalUnreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <AppContext.Provider value={{
      editMode, toggleEditMode,
      currentUser: user ?? { id: '', name: '' },
      isLoading,
      courses, addCourse, updateCourse, deleteCourse, getCourse,
      addSection, updateSection, deleteSection,
      addActivity, updateActivity, deleteActivity,
      categories, addCategory, updateCategory, deleteCategory,
      notifications, markNotificationRead, markAllRead, unreadCount,
      conversations, sendMessage, totalUnreadMessages,
      showOnboarding, setShowOnboarding,
      onboardingCompleted,
      setOnboardingCompleted: (v: boolean) => {
        setOnboardingCompleted(v);
        if (v) localStorage.setItem('onboarding_done', '1');
      },
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
