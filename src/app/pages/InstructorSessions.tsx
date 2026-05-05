import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Video,
  Plus,
  Clock,
  Users,
  BarChart3,
  Calendar,
  Play,
  Eye,
  MoreVertical,
  ChevronRight,
  Filter,
  Search,
  Download,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ScrollArea } from '../components/ui/scroll-area';
import { useToast } from '../components/ui/use-toast';
import { SessionCard, Session } from '../components/sessions/SessionCard';
import { CreateSessionModal, SessionFormData } from '../components/sessions/CreateSessionModal';
import { sessionsApi, coursesApi } from '../services/api';

interface SessionStats {
  totalSessions: number;
  studentsReached: number;
  hoursLive: number;
  averageAttendance: number;
}

interface PastSession extends Session {
  recordingViews: number;
  averageWatchTime: number;
}

/**
 * Transform backend snake_case session to frontend camelCase Session
 */
function transformSession(raw: Record<string, unknown>): Session {
  const course = (raw.course as Record<string, unknown> | undefined);
  const instructor = (raw.instructor as Record<string, unknown> | undefined);
  
  // Extract course name from various possible sources (API returns name, show endpoint returns title)
  const courseName = course?.name || course?.title || raw.course_name || raw.course_title || 'Unnamed Course';
  
  return {
    id: String(raw.id),
    title: String(raw.title || ''),
    courseId: String(raw.course_id || course?.id || ''),
    courseName: String(courseName),
    courseColor: raw.course_color as string | undefined,
    instructorId: String(raw.instructor_id || instructor?.id || ''),
    instructorName: String(instructor?.name || raw.instructor_name || ''),
    instructorAvatar: (instructor?.profile_image || raw.instructor_avatar) as string | undefined,
    scheduledAt: String(raw.scheduled_at || ''),
    duration: Number(raw.duration || 60),
    startedAt: raw.started_at ? String(raw.started_at) : undefined,
    endedAt: raw.ended_at ? String(raw.ended_at) : undefined,
    status: String(raw.status || 'scheduled') as Session['status'],
    participantCount: Number(raw.participant_count || 0),
    maxParticipants: raw.max_participants ? Number(raw.max_participants) : undefined,
    recordingEnabled: Boolean(raw.recording_enabled),
    hasRecording: Boolean(raw.has_recording),
    recordingUrl: raw.recording_url as string | undefined,
    isPasswordProtected: Boolean(raw.password),
    aiTranscription: Boolean(raw.ai_transcription),
  };
}

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={cn(
                'text-xs mt-1',
                changeType === 'positive' && 'text-green-600',
                changeType === 'negative' && 'text-red-600',
                changeType === 'neutral' && 'text-muted-foreground'
              )}>
                {change}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Live Banner Component
 */
function LiveBanner({ session, onJoin }: { session: Session; onJoin: () => void }) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 bg-white rounded-full animate-ping absolute" />
            <div className="w-3 h-3 bg-white rounded-full relative" />
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              LIVE NOW
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {session.participantCount} participants
              </Badge>
            </p>
            <p className="text-sm text-white/90">{session.title}</p>
          </div>
        </div>
        <Button onClick={onJoin} variant="secondary" className="bg-white text-green-600 hover:bg-white/90">
          <Video className="h-4 w-4 mr-2" />
          Join Session
        </Button>
      </div>
    </div>
  );
}

/**
 * Past Sessions Table
 */
function PastSessionsTable({
  sessions,
  onViewRecording,
  onViewAnalytics,
}: {
  sessions: PastSession[];
  onViewRecording: (id: string) => void;
  onViewAnalytics: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-medium">Session</th>
            <th className="text-left p-3 font-medium">Date</th>
            <th className="text-left p-3 font-medium">Participants</th>
            <th className="text-left p-3 font-medium">Recording Views</th>
            <th className="text-left p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sessions.map(session => (
            <tr key={session.id} className="hover:bg-accent/50">
              <td className="p-3">
                <div>
                  <p className="font-medium">{session.title}</p>
                  <p className="text-xs text-muted-foreground">{session.courseName}</p>
                </div>
              </td>
              <td className="p-3 text-muted-foreground">
                {new Date(session.endedAt || session.scheduledAt).toLocaleDateString()}
              </td>
              <td className="p-3">{session.participantCount}</td>
              <td className="p-3">
                {session.recordingViews > 0 ? (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {session.recordingViews}
                    <span className="text-xs text-muted-foreground">
                      ({Math.round(session.averageWatchTime)}m avg)
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  {session.hasRecording && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewRecording(session.id)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Recording
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAnalytics(session.id)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Instructor Sessions Page
 */
export default function InstructorSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [stats, setStats] = useState<SessionStats>({
    totalSessions: 0,
    studentsReached: 0,
    hoursLive: 0,
    averageAttendance: 0,
  });
  const [courses, setCourses] = useState<Array<{ id: string; name: string; color?: string }>>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const { toast } = useToast();

  // Fetch sessions and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch sessions
        const [sessionsRes, coursesRes] = await Promise.all([
          sessionsApi.list(),
          coursesApi.list(),
        ]);
        
        setSessions((sessionsRes.data.data || []).map(transformSession));
        setCourses(coursesRes.data.data?.map((c: { id: string; name: string; color?: string }) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })) || []);

        // Mock stats for now - would come from API
        setStats({
          totalSessions: sessionsRes.data.data?.length || 0,
          studentsReached: 156,
          hoursLive: 42,
          averageAttendance: 78,
        });

        // Mock past sessions with analytics
        const mockPast = (sessionsRes.data.data || [])
          .map(transformSession)
          .filter((s: Session) => s.status === 'ended')
          .map((s: Session) => ({
            ...s,
            recordingViews: Math.floor(Math.random() * 50),
            averageWatchTime: Math.floor(Math.random() * 30) + 10,
          }));
        setPastSessions(mockPast);
      } catch (error) {
        toast({
          title: 'Failed to load sessions',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Find live session
  const liveSession = useMemo(() => {
    return sessions.find(s => s.status === 'live');
  }, [sessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.courseName.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [sessions, searchQuery]);

  const upcomingSessions = filteredSessions.filter(s => s.status === 'scheduled');
  const endedSessions = filteredSessions.filter(s => s.status === 'ended');

  // Actions
  const handleCreateSession = useCallback(async (formData: SessionFormData) => {
    const data = {
      title: formData.title,
      course_id: formData.courseId,
      scheduled_at: `${formData.scheduledDate}T${formData.scheduledTime}:00`,
      duration: formData.duration,
      max_participants: formData.maxParticipants,
      password: formData.password || undefined,
      recording_enabled: formData.recordingEnabled,
      chat_enabled: formData.chatEnabled,
      raise_hand_enabled: formData.raiseHandEnabled,
      waiting_room: formData.waitingRoom,
      screen_share_allowed: formData.screenShareAllowed,
      start_muted: formData.startMuted,
      start_video_off: formData.startVideoOff,
      ai_transcription: formData.aiTranscription,
    };
    await sessionsApi.create(data);

    // Refresh list
    const res = await sessionsApi.list();
    setSessions((res.data.data || []).map(transformSession));
  }, []);

  const handleJoin = useCallback((sessionId: string) => {
    // Navigate to conference
    window.location.href = `/conference/${sessionId}`;
  }, []);

  const handleStart = useCallback(async (sessionId: string) => {
    try {
      await sessionsApi.start(sessionId);
      toast({ title: 'Session started!' });
      // Refresh
      const res = await sessionsApi.list();
      setSessions((res.data.data || []).map(transformSession));
    } catch (error) {
      toast({ title: 'Failed to start session', variant: 'destructive' });
    }
  }, [toast]);

  const handleEdit = useCallback((sessionId: string) => {
    // TODO: Open edit modal
    toast({ title: 'Edit functionality coming soon' });
  }, [toast]);

  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    
    try {
      // Would call API to delete
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: 'Session deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete session', variant: 'destructive' });
    }
  }, [toast]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Sessions</h1>
          <p className="text-muted-foreground">Manage your video sessions and recordings</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sessions"
          value={stats.totalSessions.toString()}
          icon={Video}
          change="This semester"
        />
        <StatCard
          title="Students Reached"
          value={stats.studentsReached.toString()}
          icon={Users}
          change="+12 from last month"
          changeType="positive"
        />
        <StatCard
          title="Hours Live"
          value={stats.hoursLive.toString()}
          icon={Clock}
          change="This month"
        />
        <StatCard
          title="Avg. Attendance"
          value={`${stats.averageAttendance}%`}
          icon={BarChart3}
          change="+5% from last month"
          changeType="positive"
        />
      </div>

      {/* Live Banner */}
      {liveSession && (
        <LiveBanner session={liveSession} onJoin={() => handleJoin(liveSession.id)} />
      )}

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">My Sessions</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="settings">Default Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming sessions</p>
              <Button
                variant="link"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Create your first session
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingSessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  role="instructor"
                  onJoin={handleJoin}
                  onStart={handleStart}
                  onWatchRecording={() => {}}
                  onSetReminder={() => {}}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {pastSessions.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No past sessions</p>
            </div>
          ) : (
            <PastSessionsTable
              sessions={pastSessions}
              onViewRecording={(id) => toast({ title: 'Opening recording...' })}
              onViewAnalytics={(id) => toast({ title: 'Opening analytics...' })}
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Session Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure default settings for new sessions. These can be overridden when creating a session.
              </p>
              {/* TODO: Add default settings form */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSession}
        courses={courses}
      />
    </div>
  );
}
