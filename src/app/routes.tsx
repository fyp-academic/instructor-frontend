import React, { useState, useEffect, useRef } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { Layout } from './components/Layout';
import { useApp } from './context/AppContext';
import { OnboardingTutorial } from './components/onboarding/OnboardingTutorial';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CreateCourse from './pages/CreateCourse';
import CourseView from './pages/CourseView';
import CategoryManagement from './pages/CategoryManagement';
import AIInsights from './pages/AIInsights';
import Administration from './pages/Administration';
import Notifications from './pages/Notifications';
import NotificationPreferences from './pages/NotificationPreferences';
import AdminNotificationPreferences from './pages/AdminNotificationPreferences';
import Messaging from './pages/Messaging';
import Profile from './pages/Profile';
import InstructorSessions from './pages/InstructorSessions';
import Conference from './pages/Conference';
import InstructorEngagement from './pages/InstructorEngagement';
import InstructorProctoring from './pages/InstructorProctoring';
import AdminLogs from './pages/AdminLogs';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Landing page: redirects to login if not authenticated, dashboard if authenticated
function LandingRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

// Root component rendered inside the Router — so useNavigate works here and in children
function RootWithOnboarding({ children }: { children?: React.ReactNode }) {
  const { showOnboarding, setShowOnboarding, onboardingCompleted } = useApp();
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(false);
  const autoStarted = useRef(false);

  // Auto-launch the guided tour on first login.
  useEffect(() => {
    if (onboardingCompleted || autoStarted.current) return;
    const timer = setTimeout(() => {
      if (!onboardingCompleted) {
        autoStarted.current = true;
        setShowOnboarding(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [onboardingCompleted, setShowOnboarding]);

  // Once the tour has been auto-started and then dismissed without finishing,
  // offer a subtle way back in instead of forcing it again.
  const showPrompt = showOnboardingPrompt && !onboardingCompleted && !showOnboarding;

  return (
    <>
      {children ?? <Outlet />}
      {showOnboarding && (
        <OnboardingTutorial
          onDismiss={() => {
            setShowOnboarding(false);
            if (!onboardingCompleted) setShowOnboardingPrompt(true);
          }}
        />
      )}
      {showPrompt && (
        <div className="fixed bottom-6 right-6 z-50 w-[19rem] max-w-[calc(100vw-3rem)] animate-[apes-prompt-in_.4s_ease]">
          <style>{`@keyframes apes-prompt-in { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }`}</style>
          <div className="relative bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
                  <span className="text-white text-lg">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">New here?</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Take the 60-second guided tour to learn your way around.</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setShowOnboarding(true); setShowOnboardingPrompt(false); }}
                      className="text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-500/25"
                    >
                      Take the tour
                    </button>
                    <button
                      onClick={() => setShowOnboardingPrompt(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                    >
                      Maybe later
                    </button>
                  </div>
                </div>
                <button onClick={() => setShowOnboardingPrompt(false)} className="text-gray-300 hover:text-gray-500 flex-shrink-0">
                  <span className="text-sm">✕</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Layout wrapper that includes onboarding and protected layout
function ProtectedLayout() {
  return (
    <RootWithOnboarding>
      <Outlet />
    </RootWithOnboarding>
  );
}

// Restrict a route to specific roles; redirect others to their home.
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user && roles.includes(user.role)) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
}

// Course-delivery pages belong to instructors only.
const instructorOnly = (el: React.ReactNode) => (
  <RequireRole roles={['instructor']}>{el}</RequireRole>
);

// Administration oversight pages belong to admins only.
const adminOnly = (el: React.ReactNode) => (
  <RequireRole roles={['admin']}>{el}</RequireRole>
);

export const router = createBrowserRouter([
  // Public routes - no layout
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/verify-email', element: <VerifyEmail /> },

  // Landing redirect
  { index: true, element: <LandingRedirect /> },

  // Protected routes with layout
  {
    path: '/',
    element: <ProtectedRoute><ProtectedLayout /></ProtectedRoute>,
    children: [
      { path: 'dashboard', element: <Layout><Dashboard /></Layout> },
      { path: 'courses', element: instructorOnly(<Layout><MyCourses /></Layout>) },
      { path: 'courses/create', element: instructorOnly(<Layout><CreateCourse /></Layout>) },
      { path: 'courses/:id', element: instructorOnly(<Layout><CourseView /></Layout>) },
      { path: 'categories', element: <Layout><CategoryManagement /></Layout> },
      { path: 'ai-insights', element: instructorOnly(<Layout><AIInsights /></Layout>) },
      { path: 'administration', element: <Layout><Administration /></Layout> },
      { path: 'logs', element: adminOnly(<Layout><AdminLogs /></Layout>) },
      { path: 'notifications', element: <Layout><Notifications /></Layout> },
      { path: 'admin/notifications', element: <Layout><Notifications /></Layout> },
      { path: 'messaging', element: <Layout><Messaging /></Layout> },
      { path: 'sessions', element: instructorOnly(<Layout><InstructorSessions /></Layout>) },
      { path: 'conference/:id', element: instructorOnly(<Conference />) },
      { path: 'profile', element: <Layout><Profile /></Layout> },
      { path: 'notification-preferences', element: <Layout><NotificationPreferences /></Layout> },
      { path: 'admin/notification-preferences', element: <Layout><AdminNotificationPreferences /></Layout> },
      { path: 'engagement', element: instructorOnly(<Layout><InstructorEngagement /></Layout>) },
      { path: 'proctoring', element: instructorOnly(<Layout><InstructorProctoring /></Layout>) },
    ],
  },

  // 404 catch-all - must be last
  {
    path: '*',
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <p className="text-gray-500 mt-4 text-lg font-medium">Page not found</p>
        <a href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">← Go to Login</a>
      </div>
    ),
  },
]);