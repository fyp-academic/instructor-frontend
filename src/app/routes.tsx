import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!onboardingCompleted) setShowOnboardingPrompt(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onboardingCompleted]);

  return (
    <>
      {children ?? <Outlet />}
      {showOnboarding && (
        <OnboardingTutorial onDismiss={() => setShowOnboarding(false)} />
      )}
      {showOnboardingPrompt && !onboardingCompleted && !showOnboarding && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-indigo-200 rounded-2xl shadow-2xl p-4 max-w-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">👋</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">New to EduAI LMS?</p>
              <p className="text-xs text-gray-500 mt-0.5">Take the guided tutorial to get started quickly.</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { setShowOnboarding(true); setShowOnboardingPrompt(false); }}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-medium"
                >
                  Start Tutorial
                </button>
                <button
                  onClick={() => setShowOnboardingPrompt(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                >
                  Maybe later
                </button>
              </div>
            </div>
            <button onClick={() => setShowOnboardingPrompt(false)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <span className="text-sm">✕</span>
            </button>
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
      { path: 'courses', element: <Layout><MyCourses /></Layout> },
      { path: 'courses/create', element: <Layout><CreateCourse /></Layout> },
      { path: 'courses/:id', element: <Layout><CourseView /></Layout> },
      { path: 'categories', element: <Layout><CategoryManagement /></Layout> },
      { path: 'ai-insights', element: <Layout><AIInsights /></Layout> },
      { path: 'administration', element: <Layout><Administration /></Layout> },
      { path: 'notifications', element: <Layout><Notifications /></Layout> },
      { path: 'messaging', element: <Layout><Messaging /></Layout> },
      { path: 'profile', element: <Layout><Profile /></Layout> },
      { path: 'notification-preferences', element: <Layout><NotificationPreferences /></Layout> },
      { path: 'admin/notification-preferences', element: <Layout><AdminNotificationPreferences /></Layout> },
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