export interface Course {
  id: string;
  name: string;
  shortName: string;
  description: string;
  categoryId: string;
  categoryName: string;
  instructor: string;
  instructorId: string;
  enrolledStudents: number;
  status: 'active' | 'draft' | 'archived';
  sections: Section[];
  startDate: string;
  endDate: string;
  image?: string;
  visibility: 'shown' | 'hidden';
  format: 'topics' | 'weekly' | 'social';
  maxStudents?: number;
  language: string;
  tags: string[];
}

export interface Section {
  id: string;
  title: string;
  summary?: string;
  activities: Activity[];
  visible: boolean;
  collapsed?: boolean;
}

export type ActivityType = 'quiz' | 'assignment' | 'forum' | 'url' | 'file' | 'h5p' | 'scorm' | 'workshop' | 'label' | 'page';

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  description?: string;
  dueDate?: string;
  visible: boolean;
  completionStatus?: 'completed' | 'incomplete' | 'none';
  settings?: Record<string, unknown>;
  gradeMax?: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  idNumber: string;
  courseCount: number;
  childCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  lastAccess: string;
  enrolledCourses: number;
  department?: string;
  country?: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'teaching_assistant' | 'observer';
  enrolledDate: string;
  lastAccess: string;
  progress: number;
  groups: string[];
}

export interface GradeItem {
  id: string;
  activityName: string;
  activityType: ActivityType;
  gradeMax: number;
  students: StudentGrade[];
}

export interface StudentGrade {
  studentId: string;
  studentName: string;
  grade: number | null;
  percentage: number | null;
  feedback?: string;
  submittedDate?: string;
  status: 'graded' | 'submitted' | 'not_submitted' | 'late';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
  courseId?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'matching' | 'short_answer' | 'numerical' | 'essay' | 'calculated' | 'drag_drop';
  questionText: string;
  category: string;
  defaultMark: number;
  answers?: QuizAnswer[];
  correctAnswer?: string;
  matchingPairs?: { question: string; answer: string }[];
  shuffleAnswers?: boolean;
  multipleAnswers?: boolean;
  hints?: string[];
  penalty?: number;
}

export interface QuizAnswer {
  id: string;
  text: string;
  grade: number;
  feedback?: string;
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

export const mockCategories: Category[] = [
  { id: 'cat1', name: 'Computer Science', description: 'CS and programming courses', idNumber: 'CS001', courseCount: 8, childCount: 2 },
  { id: 'cat2', name: 'Web Development', description: 'Frontend and backend development', parentId: 'cat1', idNumber: 'CS-WEB', courseCount: 4, childCount: 0 },
  { id: 'cat3', name: 'Data Science', description: 'ML and data analytics', parentId: 'cat1', idNumber: 'CS-DS', courseCount: 3, childCount: 0 },
  { id: 'cat4', name: 'Mathematics', description: 'Pure and applied mathematics', idNumber: 'MATH', courseCount: 5, childCount: 1 },
  { id: 'cat5', name: 'Calculus', description: 'Differential and integral calculus', parentId: 'cat4', idNumber: 'MATH-CALC', courseCount: 2, childCount: 0 },
  { id: 'cat6', name: 'Business', description: 'Business and management courses', idNumber: 'BUS', courseCount: 6, childCount: 0 },
  { id: 'cat7', name: 'Sciences', description: 'Natural sciences', idNumber: 'SCI', courseCount: 4, childCount: 0 },
];

export const mockCourses: Course[] = [
  {
    id: 'course1',
    name: 'Introduction to Python Programming',
    shortName: 'PYTH101',
    description: 'Learn Python from scratch with hands-on projects',
    categoryId: 'cat2',
    categoryName: 'Web Development',
    instructor: 'Dr. Sarah Johnson',
    instructorId: 'user1',
    enrolledStudents: 142,
    status: 'active',
    visibility: 'shown',
    format: 'topics',
    startDate: '2026-01-15',
    endDate: '2026-06-15',
    language: 'English',
    tags: ['python', 'programming', 'beginner'],
    sections: [
      {
        id: 'sec0', title: 'General', visible: true, activities: [
          { id: 'a1', type: 'forum', name: 'News and Announcements', visible: true, completionStatus: 'none' },
        ]
      },
      {
        id: 'sec1', title: 'Week 1: Introduction to Python', visible: true, activities: [
          { id: 'a2', type: 'page', name: 'Course Introduction & Setup', visible: true, completionStatus: 'completed' },
          { id: 'a3', type: 'file', name: 'Python Installation Guide.pdf', visible: true, completionStatus: 'completed' },
          { id: 'a4', type: 'quiz', name: 'Quiz 1: Python Basics', visible: true, dueDate: '2026-02-01', gradeMax: 100, completionStatus: 'completed' },
        ]
      },
      {
        id: 'sec2', title: 'Week 2: Control Flow', visible: true, activities: [
          { id: 'a5', type: 'url', name: 'Python Docs - Control Flow', visible: true, completionStatus: 'incomplete' },
          { id: 'a6', type: 'assignment', name: 'Assignment 1: FizzBuzz', visible: true, dueDate: '2026-02-08', gradeMax: 50, completionStatus: 'incomplete' },
          { id: 'a7', type: 'h5p', name: 'Interactive: Python Loops', visible: true, completionStatus: 'none' },
        ]
      },
      {
        id: 'sec3', title: 'Week 3: Functions & Modules', visible: true, activities: [
          { id: 'a8', type: 'quiz', name: 'Quiz 2: Functions', visible: true, dueDate: '2026-02-15', gradeMax: 100, completionStatus: 'none' },
          { id: 'a9', type: 'workshop', name: 'Workshop: Peer Code Review', visible: true, completionStatus: 'none' },
        ]
      },
      {
        id: 'sec4', title: 'Week 4: OOP Fundamentals', visible: true, activities: [
          { id: 'a10', type: 'scorm', name: 'OOP Concepts - SCORM Package', visible: true, completionStatus: 'none' },
        ]
      },
    ]
  },
  {
    id: 'course2',
    name: 'Advanced Machine Learning',
    shortName: 'ML401',
    description: 'Deep learning, neural networks, and model deployment',
    categoryId: 'cat3',
    categoryName: 'Data Science',
    instructor: 'Prof. Michael Chen',
    instructorId: 'user2',
    enrolledStudents: 89,
    status: 'active',
    visibility: 'shown',
    format: 'weekly',
    startDate: '2026-01-20',
    endDate: '2026-05-20',
    language: 'English',
    tags: ['ml', 'ai', 'deeplearning'],
    sections: [
      {
        id: 'sec0', title: 'General', visible: true, activities: [
          { id: 'b1', type: 'forum', name: 'Announcements', visible: true },
        ]
      },
      {
        id: 'sec1', title: 'Module 1: Foundations', visible: true, activities: [
          { id: 'b2', type: 'quiz', name: 'Pre-assessment Quiz', visible: true, gradeMax: 100 },
          { id: 'b3', type: 'assignment', name: 'Assignment: Linear Regression', visible: true, dueDate: '2026-02-10', gradeMax: 100 },
        ]
      },
      {
        id: 'sec2', title: 'Module 2: Neural Networks', visible: true, activities: [
          { id: 'b4', type: 'file', name: 'NN Architecture Reference.pdf', visible: true },
          { id: 'b5', type: 'quiz', name: 'Quiz: Neural Networks', visible: true, gradeMax: 100 },
        ]
      },
    ]
  },
  {
    id: 'course3',
    name: 'Business Management Fundamentals',
    shortName: 'BUS101',
    description: 'Core concepts in business strategy and management',
    categoryId: 'cat6',
    categoryName: 'Business',
    instructor: 'Dr. Emily Roberts',
    instructorId: 'user3',
    enrolledStudents: 215,
    status: 'active',
    visibility: 'shown',
    format: 'topics',
    startDate: '2026-01-10',
    endDate: '2026-05-10',
    language: 'English',
    tags: ['business', 'management', 'strategy'],
    sections: [
      { id: 'sec0', title: 'General', visible: true, activities: [{ id: 'c1', type: 'forum', name: 'Discussion Forum', visible: true }] },
      { id: 'sec1', title: 'Introduction to Management', visible: true, activities: [{ id: 'c2', type: 'quiz', name: 'Quiz 1', visible: true, gradeMax: 100 }] },
    ]
  },
  {
    id: 'course4',
    name: 'Calculus I: Differential Calculus',
    shortName: 'CALC101',
    description: 'Limits, derivatives, and applications',
    categoryId: 'cat5',
    categoryName: 'Calculus',
    instructor: 'Prof. Alan Turing',
    instructorId: 'user4',
    enrolledStudents: 178,
    status: 'draft',
    visibility: 'hidden',
    format: 'weekly',
    startDate: '2026-03-01',
    endDate: '2026-07-01',
    language: 'English',
    tags: ['math', 'calculus', 'derivatives'],
    sections: [
      { id: 'sec0', title: 'General', visible: true, activities: [] },
    ]
  },
  {
    id: 'course5',
    name: 'React & TypeScript Mastery',
    shortName: 'REACT301',
    description: 'Build modern web apps with React and TypeScript',
    categoryId: 'cat2',
    categoryName: 'Web Development',
    instructor: 'Dr. Sarah Johnson',
    instructorId: 'user1',
    enrolledStudents: 98,
    status: 'active',
    visibility: 'shown',
    format: 'topics',
    startDate: '2026-02-01',
    endDate: '2026-06-01',
    language: 'English',
    tags: ['react', 'typescript', 'frontend'],
    sections: [
      { id: 'sec0', title: 'General', visible: true, activities: [{ id: 'd1', type: 'forum', name: 'Q&A Forum', visible: true }] },
      { id: 'sec1', title: 'React Fundamentals', visible: true, activities: [{ id: 'd2', type: 'assignment', name: 'Build a Todo App', visible: true, gradeMax: 100 }] },
    ]
  },
];

export const mockParticipants: Participant[] = [
  { id: 'p1', name: 'Alice Thompson', email: 'alice@university.edu', role: 'student', enrolledDate: '2026-01-15', lastAccess: '2 hours ago', progress: 85, groups: ['Group A'] },
  { id: 'p2', name: 'Bob Martinez', email: 'bob@university.edu', role: 'student', enrolledDate: '2026-01-15', lastAccess: '1 day ago', progress: 62, groups: ['Group B'] },
  { id: 'p3', name: 'Carol White', email: 'carol@university.edu', role: 'student', enrolledDate: '2026-01-16', lastAccess: '3 hours ago', progress: 91, groups: ['Group A'] },
  { id: 'p4', name: 'David Kim', email: 'david@university.edu', role: 'student', enrolledDate: '2026-01-18', lastAccess: '5 days ago', progress: 23, groups: ['Group B'] },
  { id: 'p5', name: 'Emma Wilson', email: 'emma@university.edu', role: 'student', enrolledDate: '2026-01-20', lastAccess: 'Today', progress: 78, groups: ['Group A'] },
  { id: 'p6', name: 'Frank Lee', email: 'frank@university.edu', role: 'student', enrolledDate: '2026-01-20', lastAccess: '2 days ago', progress: 45, groups: ['Group C'] },
  { id: 'p7', name: 'Grace Chen', email: 'grace@university.edu', role: 'teaching_assistant', enrolledDate: '2026-01-14', lastAccess: 'Today', progress: 100, groups: [] },
  { id: 'p8', name: 'Henry Adams', email: 'henry@university.edu', role: 'student', enrolledDate: '2026-01-22', lastAccess: '1 week ago', progress: 12, groups: ['Group C'] },
];

export const mockGrades: GradeItem[] = [
  {
    id: 'g1', activityName: 'Quiz 1: Python Basics', activityType: 'quiz', gradeMax: 100,
    students: [
      { studentId: 'p1', studentName: 'Alice Thompson', grade: 92, percentage: 92, status: 'graded', submittedDate: '2026-02-01' },
      { studentId: 'p2', studentName: 'Bob Martinez', grade: 78, percentage: 78, status: 'graded', submittedDate: '2026-02-01' },
      { studentId: 'p3', studentName: 'Carol White', grade: 95, percentage: 95, status: 'graded', submittedDate: '2026-01-31' },
      { studentId: 'p4', studentName: 'David Kim', grade: null, percentage: null, status: 'not_submitted' },
      { studentId: 'p5', studentName: 'Emma Wilson', grade: 88, percentage: 88, status: 'graded', submittedDate: '2026-02-01' },
    ]
  },
  {
    id: 'g2', activityName: 'Assignment 1: FizzBuzz', activityType: 'assignment', gradeMax: 50,
    students: [
      { studentId: 'p1', studentName: 'Alice Thompson', grade: 48, percentage: 96, status: 'graded', feedback: 'Excellent work!', submittedDate: '2026-02-07' },
      { studentId: 'p2', studentName: 'Bob Martinez', grade: 35, percentage: 70, status: 'graded', submittedDate: '2026-02-08' },
      { studentId: 'p3', studentName: 'Carol White', grade: 50, percentage: 100, status: 'graded', submittedDate: '2026-02-06' },
      { studentId: 'p4', studentName: 'David Kim', grade: 22, percentage: 44, status: 'late', submittedDate: '2026-02-10' },
      { studentId: 'p5', studentName: 'Emma Wilson', grade: 43, percentage: 86, status: 'graded', submittedDate: '2026-02-07' },
    ]
  },
  {
    id: 'g3', activityName: 'Quiz 2: Functions', activityType: 'quiz', gradeMax: 100,
    students: [
      { studentId: 'p1', studentName: 'Alice Thompson', grade: null, percentage: null, status: 'not_submitted' },
      { studentId: 'p2', studentName: 'Bob Martinez', grade: null, percentage: null, status: 'not_submitted' },
      { studentId: 'p3', studentName: 'Carol White', grade: 89, percentage: 89, status: 'graded', submittedDate: '2026-02-15' },
      { studentId: 'p4', studentName: 'David Kim', grade: null, percentage: null, status: 'not_submitted' },
      { studentId: 'p5', studentName: 'Emma Wilson', grade: 76, percentage: 76, status: 'submitted', submittedDate: '2026-02-15' },
    ]
  },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Quiz Submission', message: 'Alice Thompson submitted Quiz 1: Python Basics', timestamp: '2 minutes ago', read: false, type: 'info' },
  { id: 'n2', title: 'Assignment Due Soon', message: 'Assignment 1: FizzBuzz is due in 24 hours', timestamp: '1 hour ago', read: false, type: 'warning' },
  { id: 'n3', title: 'New Enrollment', message: '5 new students enrolled in Introduction to Python', timestamp: '3 hours ago', read: false, type: 'success' },
  { id: 'n4', title: 'Forum Post', message: 'Bob Martinez posted a question in Discussion Forum', timestamp: '5 hours ago', read: true, type: 'info' },
  { id: 'n5', title: 'Grade Updated', message: 'Carol White\'s grade has been updated for Assignment 1', timestamp: '1 day ago', read: true, type: 'success' },
  { id: 'n6', title: 'Course Published', message: 'React & TypeScript Mastery is now published', timestamp: '2 days ago', read: true, type: 'success' },
  { id: 'n7', title: 'System Maintenance', message: 'Scheduled maintenance on Saturday, April 18, 2026', timestamp: '3 days ago', read: true, type: 'warning' },
];

export const mockConversations: Conversation[] = [
  {
    id: 'conv1', participantId: 'p1', participantName: 'Alice Thompson', participantRole: 'Student',
    lastMessage: 'Thank you for the feedback on my assignment!', lastMessageTime: '10:32 AM', unreadCount: 2,
    courseId: 'course1',
    messages: [
      { id: 'm1', senderId: 'user1', senderName: 'Dr. Sarah Johnson', content: 'Hi Alice, I reviewed your assignment. Great work overall!', timestamp: '10:15 AM', read: true },
      { id: 'm2', senderId: 'p1', senderName: 'Alice Thompson', content: 'Thank you so much! I worked really hard on it.', timestamp: '10:20 AM', read: true },
      { id: 'm3', senderId: 'p1', senderName: 'Alice Thompson', content: 'Could you elaborate on the feedback for section 3?', timestamp: '10:30 AM', read: false },
      { id: 'm4', senderId: 'p1', senderName: 'Alice Thompson', content: 'Thank you for the feedback on my assignment!', timestamp: '10:32 AM', read: false },
    ]
  },
  {
    id: 'conv2', participantId: 'p2', participantName: 'Bob Martinez', participantRole: 'Student',
    lastMessage: 'When is the next quiz scheduled?', lastMessageTime: 'Yesterday', unreadCount: 1,
    courseId: 'course1',
    messages: [
      { id: 'm5', senderId: 'p2', senderName: 'Bob Martinez', content: 'Professor, I have a question about this week\'s lecture.', timestamp: 'Yesterday 3:00 PM', read: true },
      { id: 'm6', senderId: 'user1', senderName: 'Dr. Sarah Johnson', content: 'Sure, what\'s your question?', timestamp: 'Yesterday 3:05 PM', read: true },
      { id: 'm7', senderId: 'p2', senderName: 'Bob Martinez', content: 'When is the next quiz scheduled?', timestamp: 'Yesterday 3:10 PM', read: false },
    ]
  },
  {
    id: 'conv3', participantId: 'user2', participantName: 'Prof. Michael Chen', participantRole: 'Instructor',
    lastMessage: 'Let\'s collaborate on the AI course materials', lastMessageTime: '2 days ago', unreadCount: 0,
    messages: [
      { id: 'm8', senderId: 'user2', senderName: 'Prof. Michael Chen', content: 'Hi Sarah, would you like to collaborate on some AI course materials?', timestamp: '2 days ago', read: true },
      { id: 'm9', senderId: 'user1', senderName: 'Dr. Sarah Johnson', content: 'That sounds great! Let\'s meet this week.', timestamp: '2 days ago', read: true },
      { id: 'm10', senderId: 'user2', senderName: 'Prof. Michael Chen', content: 'Let\'s collaborate on the AI course materials', timestamp: '2 days ago', read: true },
    ]
  },
];

export const mockUsers: User[] = [
  { id: 'user1', name: 'Dr. Sarah Johnson', email: 'sarah.johnson@university.edu', role: 'instructor', lastAccess: 'Today', enrolledCourses: 2, department: 'Computer Science', country: 'USA' },
  { id: 'user2', name: 'Prof. Michael Chen', email: 'm.chen@university.edu', role: 'instructor', lastAccess: 'Today', enrolledCourses: 1, department: 'Computer Science', country: 'USA' },
  { id: 'user3', name: 'Dr. Emily Roberts', email: 'e.roberts@university.edu', role: 'instructor', lastAccess: '2 days ago', enrolledCourses: 1, department: 'Business', country: 'UK' },
  { id: 'admin1', name: 'Admin User', email: 'admin@university.edu', role: 'admin', lastAccess: 'Today', enrolledCourses: 0, department: 'Administration', country: 'USA' },
  ...mockParticipants.map(p => ({ id: p.id, name: p.name, email: p.email, role: 'student' as const, lastAccess: p.lastAccess, enrolledCourses: 3, department: 'Various', country: 'USA' }))
];

export const mockCurrentUser = {
  id: 'user1',
  name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@university.edu',
  role: 'instructor' as const,
  initials: 'SJ',
  department: 'Computer Science',
  institution: 'University of Technology',
  country: 'United States',
  timezone: 'America/New_York',
  language: 'English',
  bio: 'Experienced instructor in Computer Science and Programming. PhD from MIT. 10+ years teaching experience.',
  joinDate: '2019-09-01',
};

export const activityTypeInfo: Record<ActivityType, { label: string; description: string; color: string; iconColor: string }> = {
  quiz: { label: 'Quiz', description: 'Multiple-choice, true/false, and other question types', color: 'bg-purple-100', iconColor: 'text-purple-600' },
  assignment: { label: 'Assignment', description: 'Upload files or submit text online', color: 'bg-blue-100', iconColor: 'text-blue-600' },
  forum: { label: 'Forum', description: 'Create discussion threads with students', color: 'bg-green-100', iconColor: 'text-green-600' },
  workshop: { label: 'Workshop', description: 'Peer assessment system', color: 'bg-orange-100', iconColor: 'text-orange-600' },
  h5p: { label: 'H5P', description: 'Upload and embed interactive content', color: 'bg-pink-100', iconColor: 'text-pink-600' },
  scorm: { label: 'SCORM', description: 'Upload SCORM 1.2 and 2004 packages', color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  url: { label: 'URL', description: 'Add a link to an external website', color: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  file: { label: 'File', description: 'Upload and display a file', color: 'bg-gray-100', iconColor: 'text-gray-600' },
  page: { label: 'Page', description: 'Create a page using the text editor', color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  label: { label: 'Label', description: 'Insert text or media between activities', color: 'bg-red-100', iconColor: 'text-red-600' },
};
