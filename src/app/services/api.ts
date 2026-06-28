import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.codagenz.com/api/v1';

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

// Clear stale auth state on 401 so ProtectedRoute can redirect gracefully
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', {
      email,
      password,
      // Sent explicitly so device/browser/OS are captured even if a proxy
      // strips the User-Agent header before it reaches the API.
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }),
  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: Record<string, unknown>) => api.post('/auth/reset-password', data),
  resendVerification: (email?: string) => api.post('/auth/verify-email/resend', email ? { email } : {}),
  verifyEmailCode: (email: string, code: string) => api.post('/auth/verify-email-code', { email, code }),
  parseRegistration: (registrationNumber: string) =>
    api.post('/auth/parse-registration', { registration_number: registrationNumber }),
};

// ─── Dashboards ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  // Unified dashboard - returns data based on user's role
  getDashboard: () => api.get('/dashboard'),
  // Role-specific endpoints
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

  // Admin: Instructor Management
  eligibleInstructors: (id: string)              => api.get(`/courses/${id}/eligible-instructors`),
  assignInstructor:   (id: string, instructorId: string) => api.put(`/courses/${id}/instructor`, { instructor_id: instructorId }),
  removeInstructor:    (id: string)               => api.delete(`/courses/${id}/instructor`),
};

// ─── Sections & Activities ───────────────────────────────────────────────────
export const sectionsApi = {
  list:   (courseId: string)                    => api.get(`/courses/${courseId}/sections`),
  create: (courseId: string, data: Record<string, unknown>) => api.post(`/courses/${courseId}/sections`, data),
  update: (courseId: string, id: string, data: Record<string, unknown>) => api.put(`/courses/${courseId}/sections/${id}`, data),
  remove: (courseId: string, id: string)                                => api.delete(`/courses/${courseId}/sections/${id}`),
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
// ─── Assignments (Submissions & Grading) ──────────────────────────────────────
export const assignmentsApi = {
  getSubmissions: (activityId: string) => api.get(`/activities/${activityId}/submissions`),
  getSubmission:  (submissionId: string) => api.get(`/submissions/${submissionId}`),
  gradeSubmission: (submissionId: string, data: Record<string, unknown>) =>
    api.put(`/submissions/${submissionId}/grade`, data),
};
// ─── Practical Problem ───────────────────────────────────────────────────────
export const practicalApi = {
  submissions: (activityId: string) => api.get(`/activities/${activityId}/practical-submissions`),
  courseSubmissions: (courseId: string) => api.get(`/courses/${courseId}/practical-submissions`),
  submission:  (submissionId: string) => api.get(`/practical-submissions/${submissionId}`),
  grade: (submissionId: string, data: { grade: number; feedback?: string }) =>
    api.post(`/practical-submissions/${submissionId}/grade`, data),
};
// ─── Discussion ──────────────────────────────────────────────────────────────
export const discussionApi = {
  get:   (activityId: string) => api.get(`/activities/${activityId}/discussion`),
  react: (postId: string, value: 1 | -1) => api.post(`/posts/${postId}/react`, { value }),
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
  list:        () => api.get('/notifications', { params: { channel: 'in_app' } }),
  markRead:    (id: string) => api.patch(`/notifications/${id}/read`, { channel: 'in_app' }),
  markAllRead: () => api.post('/notifications/mark-all-read', { channel: 'in_app' }),
  remove:      (id: string) => api.delete(`/notifications/${id}`, { params: { channel: 'in_app' } }),
};

export const notificationPreferencesApi = {
  getPreferences:  () => api.get('/notifications/preferences'),
  updatePreferences: (data: Record<string, unknown>) => api.post('/notifications/preferences', data),
  resetPreferences:  () => api.post('/notifications/preferences/reset'),
  setGlobalMute:     (muted: boolean) => api.post('/notifications/mute', { muted }),
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
  // Structured chat features
  typing:        (convId: string, isTyping: boolean) =>
    api.post(`/conversations/${convId}/typing`, { is_typing: isTyping }),
  deleteMessage: (messageId: string, deletionType: 'me' | 'everyone') =>
    api.delete(`/messages/${messageId}`, { params: { deletion_type: deletionType } }),
  restoreMessage: (messageId: string) =>
    api.patch(`/messages/${messageId}/restore`),
  pinMessage:    (messageId: string, isPinned: boolean) =>
    api.post(`/messages/${messageId}/pin`, { is_pinned: isPinned }),
  markDelivered: (messageId: string) =>
    api.post(`/messages/${messageId}/delivered`),
  markMessageRead: (messageId: string) =>
    api.post(`/messages/${messageId}/read`),
  pinnedMessages: (convId: string) =>
    api.get(`/conversations/${convId}/pinned-messages`),
};

// ─── Structured Chat Access ───────────────────────────────────────────────────
export const chatAccessApi = {
  eligibleRecipients: (type?: string, courseId?: string, programmeId?: string) =>
    api.get('/chat/eligible-recipients', { params: { type, course_id: courseId, programme_id: programmeId } }),
  myChats:       () => api.get('/chat/my-chats'),
  availableCourses: () => api.get('/chat/available-courses'),
  availableProgrammes: () => api.get('/chat/available-programmes'),
};

// ─── Course Chat ───────────────────────────────────────────────────────────────
export const courseChatApi = {
  getOrCreate:   (courseId: string) => api.get(`/courses/${courseId}/chat`),
  participants:  (courseId: string) => api.get(`/courses/${courseId}/chat/participants`),
  syncParticipants: (courseId: string) => api.post(`/courses/${courseId}/chat/sync-participants`),
  postAnnouncement: (courseId: string, content: string) =>
    api.post(`/courses/${courseId}/chat/announcement`, { content }),
};

// ─── Programme Chat ───────────────────────────────────────────────────────────
export const programmeChatApi = {
  getOrCreate:   (programmeId: string) => api.get(`/degree-programmes/${programmeId}/chat`),
  participants:  (programmeId: string) => api.get(`/degree-programmes/${programmeId}/chat/participants`),
  syncParticipants: (programmeId: string) => api.post(`/degree-programmes/${programmeId}/chat/sync-participants`),
  postAnnouncement: (programmeId: string, content: string) =>
    api.post(`/degree-programmes/${programmeId}/chat/announcement`, { content }),
};

// ─── Chat Reports (Admin/Instructor Moderation) ──────────────────────────────
export const chatReportsApi = {
  list:       () => api.get('/chat/reports'),
  resolve:    (reportId: string, resolution: Record<string, unknown>) =>
    api.post(`/chat/reports/${reportId}/resolve`, resolution),
};

// ─── Users (Admin) ───────────────────────────────────────────────────────────
export const usersApi = {
  list:   () => api.get('/users'),
  create: (data: Record<string, unknown>) => api.post('/auth/register', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  adminStats: () => api.get('/dashboard/admin'),
};

// ─── Instructors (Admin) ───────────────────────────────────────────────────
export const instructorsApi = {
  list:   () => api.get('/instructors'),
  get:    (id: string) => api.get(`/instructors/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/instructors/${id}`, data),
  delete: (id: string) => api.delete(`/instructors/${id}`),
};

// ─── Activity Logs (admin) ────────────────────────────────────────────────────
export const logsApi = {
  list: (params?: Record<string, unknown>) => api.get('/admin/activity-logs', { params }),
};

// ─── Colleges & Degree Programmes ─────────────────────────────────────────────
export const collegesApi = {
  list:   () => api.get('/colleges'),
  create: (data: Record<string, unknown>) => api.post('/colleges', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/colleges/${id}`, data),
  delete: (id: string) => api.delete(`/colleges/${id}`),
};

export const degreeProgrammesApi = {
  list:   (collegeId?: string) => api.get('/degree-programmes', { params: collegeId ? { college_id: collegeId } : {} }),
  show:   (id: string) => api.get(`/degree-programmes/${id}`),
  create: (data: Record<string, unknown>) => api.post('/degree-programmes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/degree-programmes/${id}`, data),
  delete: (id: string) => api.delete(`/degree-programmes/${id}`),
  assignInstructors: (id: string, instructorIds: string[]) =>
    api.post(`/degree-programmes/${id}/instructors`, { instructor_ids: instructorIds }),
  students: (id: string) => api.get(`/degree-programmes/${id}/students`),
  courses:  (id: string) => api.get(`/degree-programmes/${id}/courses`),
  assignCourses: (id: string, courseIds: string[]) =>
    api.post(`/degree-programmes/${id}/courses`, { course_ids: courseIds }),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get:               () => api.get('/profile'),
  update:            (data: Record<string, unknown>) => api.put('/profile', data),
  uploadImage:       (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  removeImage:       () => api.delete('/profile/image'),
  uploadInstructorImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/profile/instructor/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
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
  questionBank:    (courseId: string) => api.get(`/courses/${courseId}/question-bank`),
  addFromBank:     (activityId: string, sourceQuestionId: string) =>
    api.post(`/activities/${activityId}/questions/from-bank`, { source_question_id: sourceQuestionId }),
};

// ─── AI Quiz Generator ───────────────────────────────────────────────────────
export const aiQuizApi = {
  generate: (courseId: string, data: {
    section_id: string;
    question_count?: number;
    question_types?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
  }) => api.post(`/courses/${courseId}/ai-quiz/generate`, data),

  publish: (courseId: string, data: {
    section_id: string;
    activity_name: string;
    description?: string;
    grade_max?: number;
    existing_activity_id?: string | null;
    questions: Array<{
      type: string;
      question_text: string;
      bloom_level?: string;
      difficulty?: string;
      explanation?: string;
      correct_answer?: string | null;
      answers?: Array<{ text: string; is_correct: boolean; feedback?: string }>;
    }>;
  }) => api.post(`/courses/${courseId}/ai-quiz/publish`, data),
};

// ─── Lesson Pages ────────────────────────────────────────────────────────────
export const lessonApi = {
  listPages:   (activityId: string)               => api.get(`/activities/${activityId}/lesson-pages`),
  createPage:  (activityId: string, data: Record<string, unknown>) =>
    api.post(`/activities/${activityId}/lesson-pages`, data),
  updatePage:  (id: string, data: Record<string, unknown>) =>
    api.put(`/lesson-pages/${id}`, data),
  deletePage:  (id: string) => api.delete(`/lesson-pages/${id}`),
  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/lesson-pages/media-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Video Uploads ───────────────────────────────────────────────────────────
export const videoApi = {
  upload: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post(`/activities/${activityId}/video-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (activityId: string) => api.delete(`/activities/${activityId}/video`),
};

// ─── File Uploads ────────────────────────────────────────────────────────────
export const fileApi = {
  upload: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/activities/${activityId}/file-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (activityId: string) => api.delete(`/activities/${activityId}/file`),
};

// ─── SCORM packages ────────────────────────────────────────────────────────────
export const scormApi = {
  upload: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/activities/${activityId}/scorm-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  remove: (activityId: string) => api.delete(`/activities/${activityId}/scorm`),
};

// ─── H5P interactive content ─────────────────────────────────────────────────────
export const h5pApi = {
  // Upload a pre-built .h5p package.
  upload: (activityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/activities/${activityId}/h5p-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Persist content authored inline with the H5P editor.
  saveContent: (activityId: string, data: { library: string; params: string }) =>
    api.post(`/activities/${activityId}/h5p/content`, data),
  // Open an authoring session; returns { editor_url } for the editor iframe.
  editorSession: (activityId?: string) =>
    api.post(`/h5p/editor-session${activityId ? `/${activityId}` : ''}`),
  remove: (activityId: string) => api.delete(`/activities/${activityId}/h5p`),
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

// ─── Chat Moderation — Admin/Instructor chat management ───────────────────────
export const chatModerationApi = {
  // Reports
  reports:      (params?: Record<string, unknown>) => api.get('/chat-moderation/reports', { params }),
  report:       (id: string) => api.get(`/chat-moderation/reports/${id}`),
  createReport: (data: Record<string, unknown>) => api.post('/chat-moderation/reports', data),
  resolveReport:(id: string, data: Record<string, unknown>) => api.post(`/chat-moderation/reports/${id}/resolve`, data),

  // Statistics
  statistics:   () => api.get('/chat-moderation/statistics'),

  // Conversations
  conversations:(params?: Record<string, unknown>) => api.get('/chat-moderation/conversations', { params }),
  toggleLock:   (id: string) => api.post(`/chat-moderation/conversations/${id}/toggle-lock`),

  // User blocking
  blockedUsers: (params?: Record<string, unknown>) => api.get('/chat-moderation/blocked-users', { params }),
  blockUser:    (data: Record<string, unknown>) => api.post('/chat-moderation/block-user', data),
  unblockUser:  (data: Record<string, unknown>) => api.post('/chat-moderation/unblock-user', data),
};

// ─── Video Sessions (Jitsi) ───────────────────────────────────────────────────
export const sessionsApi = {
  // Session CRUD
  list:       (params?: Record<string, unknown>) => api.get('/sessions', { params }),
  create:     (data: Record<string, unknown>) => api.post('/sessions', data),
  get:        (id: string) => api.get(`/sessions/${id}`),

  // Session lifecycle
  start:      (id: string) => api.patch(`/sessions/${id}/start`),
  end:        (id: string) => api.patch(`/sessions/${id}/end`),

  // Token generation
  getToken:   (id: string) => api.post(`/sessions/${id}/token`),

  // Recording
  startRecording: (id: string) => api.post(`/sessions/${id}/recording/start`),
  stopRecording:  (id: string) => api.post(`/sessions/${id}/recording/stop`),

  // Participants
  getParticipants: (id: string) => api.get(`/sessions/${id}/participants`),
  kickParticipant:   (id: string, userId: string) => api.post(`/sessions/${id}/kick/${userId}`),
  muteAll:           (id: string) => api.post(`/sessions/${id}/mute-all`),

  // AI features
  getTranscript: (id: string) => api.get(`/sessions/${id}/transcript`),
  getSummary:    (id: string) => api.get(`/sessions/${id}/summary`),
  askAI:         (id: string, question: string) => api.post(`/sessions/${id}/ask-ai`, { question }),

  // Recording download
  getRecordingUrl: (id: string) => api.get(`/recordings/${id}/url`),

  // Transcription upload
  transcribe:    (formData: FormData) => api.post('/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Participant lifecycle
  participantLeft:   (id: string) => api.post(`/sessions/${id}/participant-left`),
  updateMetrics:     (id: string, data: Record<string, unknown>) => api.post(`/sessions/${id}/update-metrics`, data),

  // Transcription consent
  grantTranscriptionConsent: (id: string) => api.post(`/sessions/${id}/transcription-consent`),

  // Polls
  getPolls:      (id: string) => api.get(`/sessions/${id}/polls`),
  createPoll:    (id: string, data: Record<string, unknown>) => api.post(`/sessions/${id}/polls`, data),

  // Certificate
  checkCertificateEligibility: (id: string) => api.get(`/sessions/${id}/certificate/eligibility`),
  generateCertificate: (id: string) => api.post(`/sessions/${id}/certificate`),

  // Quiz
  generateQuiz:  (id: string) => api.post(`/sessions/${id}/generate-quiz`),
};

// ─── Instructor Engagement ────────────────────────────────────────────────────
export const instructorEngagementApi = {
  courseOverview:  (courseId: string)                          => api.get(`/instructor/courses/${courseId}/engagement`),
  atRisk:          (courseId: string)                          => api.get(`/instructor/courses/${courseId}/engagement/at-risk`),
  learnerDetail:   (courseId: string, userId: string)          => api.get(`/instructor/courses/${courseId}/learners/${userId}/engagement`),
  nudge:           (courseId: string, userId: string, message?: string) =>
    api.post(`/instructor/courses/${courseId}/learners/${userId}/nudge`, message ? { message } : {}),
};

// ─── Course Activity Logs (Moodle-style student log) ──────────────────────────
export const courseLogsApi = {
  list:   (courseId: string, params?: Record<string, unknown>) =>
    api.get(`/instructor/courses/${courseId}/logs`, { params }),
  export: (courseId: string, params?: Record<string, unknown>) =>
    api.get(`/instructor/courses/${courseId}/logs/export`, { params, responseType: 'blob' }),
};

// ─── Instructor Proctoring ────────────────────────────────────────────────────
export const instructorProctoringApi = {
  sessions: (courseId: string, params?: { status?: string; flagged_only?: boolean }) =>
    api.get(`/proctoring/instructor/courses/${courseId}/sessions`, { params }),
  sessionDetail: (sessionId: string) =>
    api.get(`/proctoring/instructor/sessions/${sessionId}`),
};

export const pollsApi = {
  vote:       (pollId: string, optionIndex: number) => api.post(`/polls/${pollId}/vote`, { option_index: optionIndex }),
  getResults: (pollId: string) => api.get(`/polls/${pollId}/results`),
  endPoll:    (pollId: string) => api.post(`/polls/${pollId}/end`),
};

// ─── Adaptive Content (Instructor) ─────────────────────────────────────────
export const instructorAdaptationApi = {
  getSettings: (courseId: string, topicId: string) =>
    api.get(`/instructor/settings/${courseId}/${topicId}`),
  updateSettings: (courseId: string, topicId: string, data: Record<string, unknown>) =>
    api.put(`/instructor/settings/${courseId}/${topicId}`, data),
  auditLog: (params?: Record<string, unknown>) =>
    api.get('/instructor/adaptations', { params }),
  flag: (adaptationId: string) =>
    api.post(`/instructor/adaptations/${adaptationId}/flag`),
  unflag: (adaptationId: string) =>
    api.post(`/instructor/adaptations/${adaptationId}/unflag`),
  studentProfile: (studentId: string) =>
    api.get(`/instructor/students/${studentId}/profile`),
};

// ─── Groups Management ────────────────────────────────────────────────────────
export const groupsApi = {
  list:           (courseId: string) => api.get(`/courses/${courseId}/groups`),
  create:         (courseId: string, data: Record<string, unknown>) => api.post(`/courses/${courseId}/groups`, data),
  show:           (courseId: string, groupName: string) => api.get(`/courses/${courseId}/groups/${groupName}`),
  addStudent:     (courseId: string, groupName: string, data: Record<string, unknown>) =>
    api.post(`/courses/${courseId}/groups/${groupName}/add-student`, data),
  removeStudent:  (courseId: string, groupName: string, userId: string) =>
    api.delete(`/courses/${courseId}/groups/${groupName}/remove-student/${userId}`),
  delete:         (courseId: string, groupName: string) =>
    api.delete(`/courses/${courseId}/groups/${groupName}`),
  rename:         (courseId: string, groupName: string, data: Record<string, unknown>) =>
    api.put(`/courses/${courseId}/groups/${groupName}/rename`, data),
};

// ─── Essay Grading ────────────────────────────────────────────────────────────
export const essayGradingApi = {
  getEssayAttempts: (activityId: string) => api.get(`/activities/${activityId}/essay-attempts`),
  gradeResponse:    (responseId: string, data: Record<string, unknown>) =>
    api.put(`/quiz-attempt-responses/${responseId}/grade`, data),
};

