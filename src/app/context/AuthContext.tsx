import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';

interface DegreeProgramme {
  id: string;
  name: string;
  code: string;
  college_id: string;
  college?: {
    id: string;
    name: string;
    code: string;
  };
  duration_years?: number;
}

interface AuthPermissions {
  can_manage_colleges: boolean;
  can_manage_degree_programmes: boolean;
  can_manage_courses: boolean;
  can_manage_categories: boolean;
  can_manage_instructors: boolean;
  can_manage_students: boolean;
  can_view_students: boolean;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  initials?: string;
  department?: string;
  institution?: string;
  country?: string;
  timezone?: string;
  language?: string;
  bio?: string;
  degree_programme_id?: string;
  registration_number?: string;
  year_of_study?: number;
  education_level?: string;
  nationality?: string;
}

interface AuthData {
  user: AuthUser;
  permissions: AuthPermissions;
  assigned_programme_ids?: string[];
  assigned_programmes?: DegreeProgramme[];
  degree_programme?: DegreeProgramme;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: AuthPermissions | null;
  assignedProgrammes: DegreeProgramme[];
  isAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (data: Record<string, unknown>) => Promise<void>;
  resendVerification: (email?: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AuthPermissions | null>(null);
  const [assignedProgrammes, setAssignedProgrammes] = useState<DegreeProgramme[]>([]);

  const isAdmin = user?.role === 'admin';
  const isInstructor = user?.role === 'instructor';
  const isStudent = user?.role === 'student';

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    const storedPerms = localStorage.getItem('auth_permissions');
    const storedProgrammes = localStorage.getItem('auth_programmes');

    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    if (storedPerms) {
      try { setPermissions(JSON.parse(storedPerms)); } catch { /* ignore */ }
    }
    if (storedProgrammes) {
      try { setAssignedProgrammes(JSON.parse(storedProgrammes)); } catch { /* ignore */ }
    }

    if (token) {
      authApi.me()
        .then((res) => {
          const u = res.data.data ?? res.data;
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
        })
        .catch(() => {
          setToken(null);
          setUser(null);
          setPermissions(null);
          setAssignedProgrammes([]);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_permissions');
          localStorage.removeItem('auth_programmes');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res  = await authApi.login(email, password);
    const data = res.data;
    const t    = data.token ?? data.access_token;
    const u    = data.user  ?? data.data;
    const perms = data.permissions ?? null;
    const programmes = data.assigned_programmes ?? [];

    localStorage.setItem('auth_token', t);
    localStorage.setItem('auth_user',  JSON.stringify(u));
    if (perms) {
      localStorage.setItem('auth_permissions', JSON.stringify(perms));
    }
    if (programmes?.length) {
      localStorage.setItem('auth_programmes', JSON.stringify(programmes));
    }

    setToken(t);
    setUser(u);
    setPermissions(perms);
    setAssignedProgrammes(programmes);
  };

  const register = async (data: Record<string, unknown>) => {
    const res = await authApi.register(data);
    return res.data;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_permissions');
    localStorage.removeItem('auth_programmes');
    setToken(null);
    setUser(null);
    setPermissions(null);
    setAssignedProgrammes([]);
  };

  const forgotPassword = async (email: string) => {
    await authApi.forgotPassword(email);
  };

  const resetPassword = async (data: Record<string, unknown>) => {
    await authApi.resetPassword(data);
  };

  const resendVerification = async (email?: string) => {
    await authApi.resendVerification(email);
  };

  const verifyEmailCode = async (email: string, code: string) => {
    await authApi.verifyEmailCode(email, code);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!token, isLoading,
      permissions, assignedProgrammes,
      isAdmin, isInstructor, isStudent,
      login, register, logout,
      forgotPassword, resetPassword, resendVerification, verifyEmailCode
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
