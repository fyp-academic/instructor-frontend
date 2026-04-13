import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, BookOpen, Plus, Layout, HelpCircle, CheckCircle, Puzzle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router';

const steps = [
  {
    id: 1,
    title: 'Welcome to EduAI LMS! 🎉',
    description: 'This guided tutorial will walk you through the key features of your Learning Management System. You\'ll learn how to create courses, add content, and leverage AI insights.',
    icon: Puzzle,
    tip: 'You can exit this tutorial at any time and resume it from your profile.',
    image: null,
  },
  {
    id: 2,
    title: 'Navigate with the Top Bar',
    description: 'Everything is accessible from the top navigation. Use Dashboard, My Courses, AI Insights, and Administration. Click your profile avatar for account settings.',
    icon: Layout,
    tip: 'The top navigation is always visible — no sidebar needed!',
    highlight: 'header',
  },
  {
    id: 3,
    title: 'Create Your First Course',
    description: 'Click "My Courses" → "New Course" to create a course. Fill in the course name, short name, category, and dates. Courses can be saved as drafts before publishing.',
    icon: BookOpen,
    tip: 'Organize courses using categories — create them first under Category Management.',
    action: { label: 'Go to My Courses', path: '/courses' },
  },
  {
    id: 4,
    title: 'Enable Edit Mode',
    description: 'Before adding activities, enable "Edit Mode" using the toggle in the top navigation or on the course page. Edit mode lets you add, edit, and rearrange course content.',
    icon: Plus,
    tip: 'Edit mode shows an amber banner at the top to remind you it\'s active.',
  },
  {
    id: 5,
    title: 'Add Activities & Resources',
    description: 'Within each course section, click "+ Add activity or resource" to choose from: Quiz, Assignment, Forum, Workshop, H5P, SCORM, URL, File, Page, and more.',
    icon: Plus,
    tip: 'Quizzes support 8 question types including multiple choice, matching, and essay.',
  },
  {
    id: 6,
    title: 'Create a Quiz',
    description: 'Quizzes have comprehensive settings: timing, grade boundaries, security (Safe Exam Browser), question behavior, and review options. Add questions after creating the quiz.',
    icon: HelpCircle,
    tip: 'Use the AI Insights page to auto-generate quiz questions based on your course topic!',
    action: { label: 'Explore AI Insights', path: '/ai-insights' },
  },
  {
    id: 7,
    title: 'Manage Participants & Grades',
    description: 'Each course has tabs for Participants (enroll users, assign roles, track progress) and Grades (full gradebook with per-student and per-activity views).',
    icon: CheckCircle,
    tip: 'You can manually override grades by clicking on any grade cell in the gradebook.',
  },
  {
    id: 8,
    title: 'Use AI Insights',
    description: 'The AI Insights page uses GPT-o4 to analyze student performance, identify at-risk students, suggest content improvements, and generate quiz questions automatically.',
    icon: Puzzle,
    tip: 'Check AI Insights weekly to stay ahead of student performance trends.',
    action: { label: 'Open AI Insights', path: '/ai-insights' },
  },
];

interface OnboardingTutorialProps {
  onDismiss: () => void;
}

export function OnboardingTutorial({ onDismiss }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { setOnboardingCompleted } = useApp();
  const navigate = useNavigate();

  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleComplete = () => {
    setOnboardingCompleted(true);
    onDismiss();
  };

  const handleAction = (path: string) => {
    navigate(path);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-indigo-600 w-4' : i < currentStep ? 'bg-indigo-300' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-1">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Close tutorial">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <step.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{step.title}</h2>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">{step.description}</p>
            </div>
          </div>

          {step.tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 mb-4">
              <span className="text-amber-500 flex-shrink-0">💡</span>
              <p className="text-sm text-amber-800">{step.tip}</p>
            </div>
          )}

          {step.action && (
            <div className="mb-4">
              <button
                onClick={() => handleAction(step.action!.path)}
                className="flex items-center gap-2 text-sm text-indigo-600 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-50 font-medium"
              >
                {step.action.label} →
              </button>
            </div>
          )}
        </div>

        {/* Step overview */}
        <div className="mx-6 mb-4 bg-gray-50 rounded-xl p-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Tutorial Progress</p>
          <div className="grid grid-cols-4 gap-1.5">
            {steps.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`text-center py-2 rounded-lg cursor-pointer transition-all ${
                  i === currentStep ? 'bg-indigo-600 text-white' :
                  i < currentStep ? 'bg-green-100 text-green-700' :
                  'bg-white text-gray-400 hover:bg-gray-100'
                }`}
              >
                <p className="text-[10px] font-medium truncate px-1">
                  {i < currentStep ? '✓' : s.id}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-5">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={isFirst}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-colors ${
              isFirst ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <button
            onClick={() => setCurrentStep(prev => Math.min(steps.length - 1, prev + 1))}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl transition-colors ${isLast ? 'hidden' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>

          {isLast && (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700"
            >
              <CheckCircle className="w-4 h-4" /> Complete Tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
