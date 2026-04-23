import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

// Attach Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: Record<string, unknown>) => api.post('/auth/reset-password', data),
  resendVerification: () => api.post('/auth/email/resend'),
  verifyEmail: (id: string, hash: string) => api.get(`/auth/verify-email/${id}/${hash}`),
};

// ─── Dashboards ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  adminOverview:      () => api.get('/dashboard/admin'),
  instructorSnapshot: (courseId?: string) =>
    api.get('/dashboard/instructor', { params: { course_id: courseId } }),
  studentHub:         () => api.get('/dashboard/student'),
};

// ─── Courses ─────────────────────────────────────────────────────────────────
export const coursesApi = {
  list:       (params?: Record<string, unknown>) => api.get('/courses', { params }),
  create:     (data: Record<string, unknown>)    => api.post('/courses', data),
  get:        (id: string)                        => api.get(`/courses/${id}`),
  update:     (id: string, data: Record<string, unknown>) => api.put(`/courses/${id}`, data),
  remove:     (id: string)                        => api.delete(`/courses/${id}`),
  participants:(id: string)                       => api.get(`/courses/${id}/participants`),
  enroll:     (id: string, data: Record<string, unknown>) => api.post(`/courses/${id}/enroll`, data),
  unenroll:   (id: string, userId: string)        => api.delete(`/courses/${id}/enroll/${userId}`),
  selfEnroll: (id: string)                        => api.post(`/courses/${id}/self-enroll`),
  leave:      (id: string)                        => api.delete(`/courses/${id}/self-enroll`),
};

// ─── Sections & Activities ───────────────────────────────────────────────────
export const sectionsApi = {
  list:   (courseId: string)                    => api.get(`/courses/${courseId}/sections`),
  create: (courseId: string, data: Record<string, unknown>) => api.post(`/courses/${courseId}/sections`, data),
  update: (id: string, data: Record<string, unknown>)       => api.put(`/sections/${id}`, data),
  remove: (id: string)                          => api.delete(`/sections/${id}`),
};

export const activitiesApi = {
  list:   (sectionId: string)                   => api.get(`/sections/${sectionId}/activities`),
  create: (sectionId: string, data: Record<string, unknown>) => api.post(`/sections/${sectionId}/activities`, data),
  update: (id: string, data: Record<string, unknown>)        => api.put(`/activities/${id}`, data),
  remove: (id: string)                          => api.delete(`/activities/${id}`),
};

// ─── Grades ───────────────────────────────────────────────────────────────────
export const gradesApi = {
  gradebook:   (courseId: string) => api.get(`/courses/${courseId}/gradebook`),
  getItem:     (id: string)       => api.get(`/grade-items/${id}`),
  submit:      (gradeItemId: string, data: Record<string, unknown>) =>
    api.post(`/grade-items/${gradeItemId}/grades`, data),
  studentGrades: (courseId: string) => api.get(`/courses/${courseId}/my-grades`),
};

// ─── Categories ──────────────────────────────────────────────────────────────
export const categoriesApi = {
  list:   ()                                     => api.get('/categories'),
  create: (data: Record<string, unknown>)        => api.post('/categories', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
  delete: (id: string)                           => api.delete(`/categories/${id}`),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        () => api.get('/notifications'),
  markRead:    (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  remove:      (id: string) => api.delete(`/notifications/${id}`),
};

// ─── Messaging ────────────────────────────────────────────────────────────────
export const messagingApi = {
  conversations: ()           => api.get('/conversations'),
  createConv:    (data: Record<string, unknown>) => api.post('/conversations', data),
  messages:      (convId: string) => api.get(`/conversations/${convId}/messages`),
  sendMessage:   (convId: string, formData: FormData) =>
    api.post(`/conversations/${convId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  markRead:      (convId: string) => api.patch(`/conversations/${convId}/messages/read`),
  react:         (messageId: string, emoji: string) =>
    api.post(`/messages/${messageId}/react`, { emoji }),
};

// ─── Users (Admin) ───────────────────────────────────────────────────────────
export const usersApi = {
  list:   () => api.get('/users'),
  create: (data: Record<string, unknown>) => api.post('/auth/register', data),
  adminStats: () => api.get('/dashboard/admin'),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get:               () => api.get('/profile'),
  update:            (data: Record<string, unknown>) => api.put('/profile', data),
  preferences:       () => api.get('/profile/preferences'),
  updatePreferences: (data: Record<string, unknown>) => api.put('/profile/preferences', data),
};

// ─── Quiz Questions ──────────────────────────────────────────────────────────
export const quizApi = {
  listQuestions:   (activityId: string)               => api.get(`/activities/${activityId}/questions`),
  createQuestion:  (activityId: string, data: Record<string, unknown>) =>
    api.post(`/activities/${activityId}/questions`, data),
  updateQuestion:  (id: string, data: Record<string, unknown>) =>
    api.put(`/questions/${id}`, data),
  deleteQuestion:  (id: string) => api.delete(`/questions/${id}`),
  listAnswers:     (questionId: string)               => api.get(`/questions/${questionId}/answers`),
  createAnswer:    (questionId: string, data: Record<string, unknown>) =>
    api.post(`/questions/${questionId}/answers`, data),
};

// ─── Lesson Pages ────────────────────────────────────────────────────────────
export const lessonApi = {
  listPages:   (activityId: string)               => api.get(`/activities/${activityId}/lesson-pages`),
  createPage:  (activityId: string, data: Record<string, unknown>) =>
    api.post(`/activities/${activityId}/lesson-pages`, data),
  updatePage:  (id: string, data: Record<string, unknown>) =>
    api.put(`/lesson-pages/${id}`, data),
  deletePage:  (id: string) => api.delete(`/lesson-pages/${id}`),
};

// ─── AI Insights ─────────────────────────────────────────────────────────────
export const aiApi = {
  snapshots:          (courseId: string) => api.get(`/ai/courses/${courseId}/performance-snapshots`),
  skillMetrics:       (courseId: string) => api.get(`/ai/courses/${courseId}/skill-metrics`),
  atRisk:             (courseId: string) => api.get(`/ai/courses/${courseId}/at-risk`),
  suggestions:        (courseId: string) => api.get(`/ai/courses/${courseId}/suggestions`),
  contentRecs:        (courseId: string) => api.get(`/ai/courses/${courseId}/content-recommendations`),
  generateQuestions:  (courseId: string, data: Record<string, unknown>) =>
    api.post(`/ai/courses/${courseId}/generate-questions`, data),
  generatedQuestions: (courseId: string) => api.get(`/ai/courses/${courseId}/generated-questions`),
  updateQuestion:     (id: string, status: string) =>
    api.patch(`/ai/generated-questions/${id}`, { status }),
  activityPerformance:(courseId: string) => api.get(`/ai/courses/${courseId}/activity-performance`),
  weeklyEngagement:   (courseId: string) => api.get(`/ai/courses/${courseId}/weekly-engagement`),
};

// ─── Learner Analytics Pipeline ───────────────────────────────────────────────
export const pipelineApi = {
  profile:      (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/profile`),
  setProfile:   (learnerId: string, courseId: string, data: Record<string, unknown>) =>
    api.post(`/pipeline/learners/${learnerId}/courses/${courseId}/profile`, data),
  behavioral:   (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/behavioral`),
  cognitive:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/cognitive`),
  emotional:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/emotional`),
  submitPulse:  (learnerId: string, courseId: string, data: Record<string, unknown>) =>
    api.post(`/pipeline/learners/${learnerId}/courses/${courseId}/pulse`, data),
  riskScore:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/risk`),
  allRisk:      (courseId: string) => api.get(`/pipeline/courses/${courseId}/risk`),
  interventions:(learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/interventions`),
  createIntervention: (learnerId: string, courseId: string, data: Record<string, unknown>) =>
    api.post(`/pipeline/learners/${learnerId}/courses/${courseId}/interventions`, data),
  driftLogs:    (learnerId: string, courseId: string) =>
    api.get(`/pipeline/learners/${learnerId}/courses/${courseId}/drift`),
};
