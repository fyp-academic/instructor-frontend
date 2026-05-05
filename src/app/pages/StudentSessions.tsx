import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Play,
  Clock,
  Calendar,
  Bell,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Eye,
  ChevronRight,
  Search,
  Flame,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { useToast } from '../components/ui/use-toast';
import { SessionCard, Session } from '../components/sessions/SessionCard';
import { sessionsApi } from '../services/api';

interface Recording {
  id: string;
  title: string;
  courseName: string;
  thumbnail?: string;
  duration: number;
  recordedAt: string;
  views: number;
  url: string;
}

/**
 * Live Now Card - Prominent display
 */
function LiveNowCard({ session, onJoin }: { session: Session; onJoin: () => void }) {
  return (
    <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <Video className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                LIVE
              </div>
            </div>
            <div>
              <Badge variant="destructive" className="mb-2 animate-pulse">
                <Flame className="h-3 w-3 mr-1" />
                LIVE NOW
              </Badge>
              <h3 className="text-lg font-semibold">{session.title}</h3>
              <p className="text-sm text-muted-foreground">{session.courseName}</p>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Started {new Date(session.startedAt || session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="flex items-center gap-1">
                  <Video className="h-3.5 w-3.5" />
                  {session.participantCount} watching
                </span>
              </div>
            </div>
          </div>
          <Button onClick={onJoin} size="lg" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
            <Play className="h-5 w-5 mr-2" />
            Join Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Upcoming Session Item
 */
function UpcomingItem({
  session,
  onJoin,
  onRemind,
}: {
  session: Session;
  onJoin: () => void;
  onRemind: () => void;
}) {
  const scheduledDate = new Date(session.scheduledAt);
  const now = new Date();
  const isSoon = scheduledDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000; // Within 24 hours

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-14 h-14 rounded-lg flex flex-col items-center justify-center text-center',
          isSoon ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
        )}>
          <span className="text-xs font-medium uppercase">
            {scheduledDate.toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className="text-lg font-bold leading-none">
            {scheduledDate.getDate()}
          </span>
        </div>
        <div>
          <h4 className="font-medium">{session.title}</h4>
          <p className="text-sm text-muted-foreground">{session.courseName}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {session.duration} min
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSoon && session.status === 'live' && (
          <Button onClick={onJoin} size="sm" className="bg-green-600 hover:bg-green-700">
            Join
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onRemind}>
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Recording Card
 */
function RecordingCard({ recording }: { recording: Recording }) {
  return (
    <Card className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-muted">
        {recording.thumbnail ? (
          <img
            src={recording.thumbnail}
            alt={recording.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button variant="secondary" size="sm">
            <Play className="h-4 w-4 mr-2" />
            Watch
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {Math.floor(recording.duration / 60)}:{(recording.duration % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <CardContent className="p-3">
        <h4 className="font-medium text-sm line-clamp-1">{recording.title}</h4>
        <p className="text-xs text-muted-foreground">{recording.courseName}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{new Date(recording.recordedAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {recording.views}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Student Sessions Page
 */
export default function StudentSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch sessions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await sessionsApi.list();
        setSessions(res.data.data || []);

        // Mock recordings - would come from API
        const mockRecordings: Recording[] = [
          {
            id: 'rec_1',
            title: 'Introduction to AI - Week 1',
            courseName: 'CS101',
            duration: 3240,
            recordedAt: '2024-01-15T10:00:00Z',
            views: 45,
            url: '/recordings/1',
          },
          {
            id: 'rec_2',
            title: 'Machine Learning Basics',
            courseName: 'CS201',
            duration: 3600,
            recordedAt: '2024-01-10T14:00:00Z',
            views: 32,
            url: '/recordings/2',
          },
        ];
        setRecordings(mockRecordings);
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

  // Filter sessions
  const liveSession = useMemo(() => {
    return sessions.find(s => s.status === 'live');
  }, [sessions]);

  const upcomingSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'scheduled')
      .filter(s => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return s.title.toLowerCase().includes(query) || s.courseName.toLowerCase().includes(query);
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [sessions, searchQuery]);

  // Actions
  const handleJoin = (sessionId: string) => {
    window.location.href = `/conference/${sessionId}`;
  };

  const handleRemind = (sessionId: string) => {
    toast({ title: 'Reminder set!' });
  };

  const handleWatchRecording = (recordingId: string) => {
    window.location.href = `/recordings/${recordingId}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Sessions</h1>
        <p className="text-muted-foreground">Join live sessions and watch past recordings</p>
      </div>

      {/* Live Now - Prominent */}
      {liveSession && (
        <section>
          <h2 className="text-sm font-medium text-red-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Now
          </h2>
          <LiveNowCard session={liveSession} onJoin={() => handleJoin(liveSession.id)} />
        </section>
      )}

      {/* Upcoming */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Sessions
          </h2>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {upcomingSessions.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming sessions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for new sessions from your instructors
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcomingSessions.map(session => (
              <UpcomingItem
                key={session.id}
                session={session}
                onJoin={() => handleJoin(session.id)}
                onRemind={() => handleRemind(session.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past Recordings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Past Recordings
          </h2>
          <Button variant="link" size="sm">
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {recordings.length === 0 ? (
          <Card className="p-8 text-center">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recordings available</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recordings.map(recording => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
