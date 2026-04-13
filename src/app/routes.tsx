import React, { useState, useEffect } from 'react';
import { createBrowserRouter, Outlet } from 'react-router';
import { Layout } from './components/Layout';
import { useApp } from './context/AppContext';
import { OnboardingTutorial } from './components/onboarding/OnboardingTutorial';
import Dashboard from './pages/Dashboard';
import MyCourses from './pages/MyCourses';
import CreateCourse from './pages/CreateCourse';
import CourseView from './pages/CourseView';
import CategoryManagement from './pages/CategoryManagement';
import AIInsights from './pages/AIInsights';
import Administration from './pages/Administration';
import Notifications from './pages/Notifications';
import Messaging from './pages/Messaging';
import Profile from './pages/Profile';

function PageWrapper({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>;
}

// Root component rendered inside the Router — so useNavigate works here and in children
function RootWithOnboarding() {
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
      <Outlet />
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootWithOnboarding />,
    children: [
      { index: true, element: <PageWrapper><Dashboard /></PageWrapper> },
      { path: 'courses', element: <PageWrapper><MyCourses /></PageWrapper> },
      { path: 'courses/create', element: <PageWrapper><CreateCourse /></PageWrapper> },
      { path: 'courses/:id', element: <PageWrapper><CourseView /></PageWrapper> },
      { path: 'categories', element: <PageWrapper><CategoryManagement /></PageWrapper> },
      { path: 'ai-insights', element: <PageWrapper><AIInsights /></PageWrapper> },
      { path: 'administration', element: <PageWrapper><Administration /></PageWrapper> },
      { path: 'notifications', element: <PageWrapper><Notifications /></PageWrapper> },
      { path: 'messaging', element: <PageWrapper><Messaging /></PageWrapper> },
      { path: 'profile', element: <PageWrapper><Profile /></PageWrapper> },
      {
        path: '*',
        element: (
          <PageWrapper>
            <div className="text-center py-24">
              <p className="text-6xl font-bold text-gray-200">404</p>
              <p className="text-gray-500 mt-4 text-lg font-medium">Page not found</p>
              <a href="/" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium">← Go to Dashboard</a>
            </div>
          </PageWrapper>
        ),
      },
    ],
  },
]);