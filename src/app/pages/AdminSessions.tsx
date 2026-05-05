import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Users,
  Server,
  Activity,
  AlertTriangle,
  Shield,
  Settings,
  Search,
  Filter,
  MoreVertical,
  StopCircle,
  Trash2,
  BarChart3,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  ChevronRight,
  Download,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useToast } from '../components/ui/use-toast';
import { Session } from '../components/sessions/SessionCard';
import { sessionsApi } from '../services/api';

// Recharts would be imported here
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface InfrastructureStatus {
  jitsiServer: 'online' | 'degraded' | 'offline';
  recordingServer: 'online' | 'degraded' | 'offline';
  websocketServer: 'online' | 'offline';
  aiService: 'online' | 'degraded' | 'offline';
  
  // Metrics
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  activeConnections: number;
  bandwidthUsage: number;
}

interface UsageData {
  date: string;
  sessions: number;
  participants: number;
  hours: number;
}

interface AdminSession extends Session {
  instructorEmail: string;
  jibriStatus?: string;
  recordingSize?: number;
}

/**
 * Status Badge
 */
function StatusBadge({ status }: { status: 'online' | 'degraded' | 'offline' }) {
  const config = {
    online: { color: 'bg-green-500', label: 'Online' },
    degraded: { color: 'bg-yellow-500', label: 'Degraded' },
    offline: { color: 'bg-red-500', label: 'Offline' },
  };

  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', config[status].color)} />
      {config[status].label}
    </Badge>
  );
}

/**
 * Metric Card
 */
function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {value}
              <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
          </div>
          <div className={cn('p-3 rounded-lg', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Infrastructure Panel
 */
function InfrastructurePanel({
  status,
  onRefresh,
  isRefreshing,
}: {
  status: InfrastructureStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Infrastructure Status
            </CardTitle>
            <CardDescription>Monitor Jitsi and supporting services</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Jitsi Server</span>
            </div>
            <StatusBadge status={status.jitsiServer} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Recording (Jibri)</span>
            </div>
            <StatusBadge status={status.recordingServer} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">WebSocket Server</span>
            </div>
            <StatusBadge status={status.websocketServer} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">AI Service</span>
            </div>
            <StatusBadge status={status.aiService} />
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Server Resources</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">CPU Usage</span>
              <span>{status.cpuUsage}%</span>
            </div>
            <Progress value={status.cpuUsage} className={cn(
              status.cpuUsage > 80 ? 'text-red-500' : status.cpuUsage > 60 ? 'text-yellow-500' : ''
            )} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Memory</span>
              <span>{status.memoryUsage}%</span>
            </div>
            <Progress value={status.memoryUsage} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Disk</span>
              <span>{status.diskUsage}%</span>
            </div>
            <Progress value={status.diskUsage} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-xs text-muted-foreground">Network Latency</p>
              <p className="text-lg font-semibold">{status.networkLatency}ms</p>
            </div>
            <div className="p-3 rounded-lg bg-accent">
              <p className="text-xs text-muted-foreground">Active Connections</p>
              <p className="text-lg font-semibold">{status.activeConnections}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Permission Toggle
 */
function PermissionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Usage Chart (Placeholder - would use Recharts)
 */
function UsageChart({ data }: { data: UsageData[] }) {
  // In production, this would use Recharts
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex items-end justify-between gap-2">
          {data.map((d, i) => {
            const height = Math.min((d.sessions / 20) * 100, 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Sessions</p>
            <p className="text-xl font-bold">{data.reduce((a, b) => a + b.sessions, 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Participants</p>
            <p className="text-xl font-bold">{data.reduce((a, b) => a + b.participants, 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hours Live</p>
            <p className="text-xl font-bold">{data.reduce((a, b) => a + b.hours, 0)}h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * All Sessions Table
 */
function AllSessionsTable({
  sessions,
  onForceEnd,
  onDelete,
}: {
  sessions: AdminSession[];
  onForceEnd: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="text-left p-3 font-medium">Session</th>
            <th className="text-left p-3 font-medium">Instructor</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Participants</th>
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
              <td className="p-3">
                <div>
                  <p className="text-sm">{session.instructorName}</p>
                  <p className="text-xs text-muted-foreground">{session.instructorEmail}</p>
                </div>
              </td>
              <td className="p-3">
                <Badge
                  variant={
                    session.status === 'live' ? 'destructive' :
                    session.status === 'scheduled' ? 'secondary' : 'outline'
                  }
                  className={session.status === 'live' ? 'animate-pulse' : ''}
                >
                  {session.status}
                </Badge>
              </td>
              <td className="p-3">{session.participantCount}</td>
              <td className="p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    {session.status === 'live' && (
                      <DropdownMenuItem
                        onClick={() => onForceEnd(session.id)}
                        className="text-red-600"
                      >
                        <StopCircle className="h-4 w-4 mr-2" />
                        Force End
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(session.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Admin Sessions Page
 */
export default function AdminSessions() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshingInfra, setIsRefreshingInfra] = useState(false);
  const { toast } = useToast();

  // Mock infrastructure status
  const [infraStatus, setInfraStatus] = useState<InfrastructureStatus>({
    jitsiServer: 'online',
    recordingServer: 'online',
    websocketServer: 'online',
    aiService: 'online',
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38,
    networkLatency: 24,
    activeConnections: 156,
    bandwidthUsage: 2.4,
  });

  // Mock usage data
  const usageData: UsageData[] = [
    { date: '2024-01-01', sessions: 12, participants: 89, hours: 8 },
    { date: '2024-01-02', sessions: 15, participants: 120, hours: 10 },
    { date: '2024-01-03', sessions: 8, participants: 56, hours: 5 },
    { date: '2024-01-04', sessions: 18, participants: 145, hours: 12 },
    { date: '2024-01-05', sessions: 20, participants: 167, hours: 15 },
    { date: '2024-01-06', sessions: 14, participants: 98, hours: 9 },
    { date: '2024-01-07', sessions: 10, participants: 76, hours: 7 },
  ];

  // Permission toggles
  const [permissions, setPermissions] = useState({
    allowRecording: true,
    allowAITranscription: true,
    allowScreenShare: true,
    allowBreakoutRooms: false,
    requirePassword: false,
  });

  // Fetch sessions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await sessionsApi.list();
        // Mock admin data
        const adminSessions: AdminSession[] = (res.data.data || []).map((s: Session) => ({
          ...s,
          instructorEmail: 'instructor@example.com',
        }));
        setSessions(adminSessions);
      } catch (error) {
        toast({ title: 'Failed to load sessions', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.instructorName.toLowerCase().includes(query) ||
        s.courseName.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    return filtered;
  }, [sessions, searchQuery, statusFilter]);

  // Actions
  const handleForceEnd = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to force end this session? All participants will be disconnected.')) return;
    
    try {
      await sessionsApi.end(sessionId);
      toast({ title: 'Session force ended' });
      // Refresh
      const res = await sessionsApi.list();
      setSessions(res.data.data || []);
    } catch (error) {
      toast({ title: 'Failed to end session', variant: 'destructive' });
    }
  }, [toast]);

  const handleDelete = useCallback(async (sessionId: string) => {
    if (!confirm('Delete this session permanently?')) return;
    
    try {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: 'Session deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete session', variant: 'destructive' });
    }
  }, [toast]);

  const handleRefreshInfra = useCallback(() => {
    setIsRefreshingInfra(true);
    setTimeout(() => {
      setInfraStatus(prev => ({
        ...prev,
        cpuUsage: Math.floor(Math.random() * 60) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 40,
      }));
      setIsRefreshingInfra(false);
    }, 1000);
  }, []);

  const liveCount = sessions.filter(s => s.status === 'live').length;
  const totalParticipants = sessions.reduce((a, s) => a + s.participantCount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Sessions Admin</h1>
          <p className="text-muted-foreground">Manage all video conferencing infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Video className="h-3 w-3 mr-1" />
              {liveCount} Live
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Sessions"
          value={liveCount}
          unit=""
          icon={Video}
          color="bg-red-500"
        />
        <MetricCard
          title="Total Participants"
          value={totalParticipants}
          unit=""
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Server CPU"
          value={infraStatus.cpuUsage}
          unit="%"
          icon={Cpu}
          color="bg-green-500"
        />
        <MetricCard
          title="Network"
          value={infraStatus.networkLatency}
          unit="ms"
          icon={Wifi}
          color="bg-purple-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sessions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sessions Table */}
          <AllSessionsTable
            sessions={filteredSessions}
            onForceEnd={handleForceEnd}
            onDelete={handleDelete}
          />
        </div>

        {/* Right Column - Infrastructure & Settings */}
        <div className="space-y-6">
          <InfrastructurePanel
            status={infraStatus}
            onRefresh={handleRefreshInfra}
            isRefreshing={isRefreshingInfra}
          />

          <UsageChart data={usageData} />

          {/* Global Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Global Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PermissionToggle
                label="Allow Recording"
                description="Enable session recording feature"
                checked={permissions.allowRecording}
                onChange={(v) => setPermissions(p => ({ ...p, allowRecording: v }))}
              />
              <PermissionToggle
                label="AI Transcription"
                description="Allow AI-powered live transcription"
                checked={permissions.allowAITranscription}
                onChange={(v) => setPermissions(p => ({ ...p, allowAITranscription: v }))}
              />
              <PermissionToggle
                label="Screen Sharing"
                description="Allow participants to share screen"
                checked={permissions.allowScreenShare}
                onChange={(v) => setPermissions(p => ({ ...p, allowScreenShare: v }))}
              />
              <PermissionToggle
                label="Breakout Rooms"
                description="Enable breakout room functionality"
                checked={permissions.allowBreakoutRooms}
                onChange={(v) => setPermissions(p => ({ ...p, allowBreakoutRooms: v }))}
              />
              <PermissionToggle
                label="Require Password"
                description="Require password for all sessions"
                checked={permissions.requirePassword}
                onChange={(v) => setPermissions(p => ({ ...p, requirePassword: v }))}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
