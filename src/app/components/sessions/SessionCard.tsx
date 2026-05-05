import React, { useMemo, useCallback } from 'react';
import {
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  Eye,
  Bell,
  Lock,
  Mic,
  FileText,
  MoreVertical,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

export type SessionStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

export interface Session {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  courseColor?: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  
  // Timing
  scheduledAt: string;
  duration: number; // minutes
  startedAt?: string;
  endedAt?: string;
  
  // Status
  status: SessionStatus;
  participantCount: number;
  maxParticipants?: number;
  
  // Settings
  recordingEnabled: boolean;
  hasRecording?: boolean;
  recordingUrl?: string;
  isPasswordProtected?: boolean;
  aiTranscription?: boolean;
}

interface SessionCardProps {
  session: Session;
  role: 'instructor' | 'student' | 'admin';
  onJoin: (sessionId: string) => void;
  onStart: (sessionId: string) => void;
  onWatchRecording: (sessionId: string) => void;
  onSetReminder: (sessionId: string) => void;
  onEdit?: (sessionId: string) => void;
  onCancel?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  onForceEnd?: (sessionId: string) => void;
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (diff < 0) return 'Started';
  if (minutes < 60) return `in ${minutes}m`;
  if (hours < 24) return `in ${hours}h`;
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
}

/**
 * Format duration
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Status badge configuration
 */
function getStatusConfig(status: SessionStatus) {
  switch (status) {
    case 'live':
      return {
        label: 'LIVE',
        variant: 'destructive' as const,
        icon: Video,
        animate: true,
      };
    case 'scheduled':
      return {
        label: 'Scheduled',
        variant: 'secondary' as const,
        icon: Calendar,
        animate: false,
      };
    case 'ended':
      return {
        label: 'Ended',
        variant: 'outline' as const,
        icon: CheckCircle,
        animate: false,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        variant: 'outline' as const,
        icon: AlertCircle,
        animate: false,
      };
  }
}

/**
 * Session Card Component
 */
export function SessionCard({
  session,
  role,
  onJoin,
  onStart,
  onWatchRecording,
  onSetReminder,
  onEdit,
  onCancel,
  onDelete,
  onForceEnd,
}: SessionCardProps) {
  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;
  const isInstructor = role === 'instructor';
  const isAdmin = role === 'admin';

  const canJoin = session.status === 'live';
  const canStart = isInstructor && session.status === 'scheduled';
  const canWatchRecording = session.status === 'ended' && session.hasRecording;
  const canSetReminder = role === 'student' && session.status === 'scheduled';

  const handleAction = useCallback(() => {
    if (canJoin) onJoin(session.id);
    else if (canStart) onStart(session.id);
    else if (canWatchRecording) onWatchRecording(session.id);
    else if (canSetReminder) onSetReminder(session.id);
  }, [canJoin, canStart, canWatchRecording, canSetReminder, session.id, onJoin, onStart, onWatchRecording, onSetReminder]);

  const actionButton = useMemo(() => {
    if (canJoin) {
      return (
        <Button onClick={handleAction} className="bg-green-600 hover:bg-green-700 animate-pulse">
          <Video className="h-4 w-4 mr-2" />
          Join Now
        </Button>
      );
    }
    if (canStart) {
      return (
        <Button onClick={handleAction} className="bg-primary hover:bg-primary/90">
          <Play className="h-4 w-4 mr-2" />
          Start Session
        </Button>
      );
    }
    if (canWatchRecording) {
      return (
        <Button onClick={handleAction} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          Watch Recording
        </Button>
      );
    }
    if (canSetReminder) {
      return (
        <Button onClick={handleAction} variant="ghost" size="sm">
          <Bell className="h-4 w-4 mr-2" />
          Remind Me
        </Button>
      );
    }
    return null;
  }, [canJoin, canStart, canWatchRecording, canSetReminder, handleAction]);

  return (
    <TooltipProvider>
      <Card className={cn(
        'transition-all hover:shadow-md',
        session.status === 'live' && 'ring-2 ring-destructive/50 shadow-lg'
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            {/* Course Badge */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge
                variant="secondary"
                className="shrink-0"
                style={{
                  backgroundColor: session.courseColor ? `${session.courseColor}20` : undefined,
                  color: session.courseColor,
                  borderColor: session.courseColor,
                }}
              >
                {session.courseName}
              </Badge>
              
              {/* Status Badge */}
              <Badge
                variant={statusConfig.variant}
                className={cn(
                  'text-xs shrink-0',
                  statusConfig.animate && 'animate-pulse'
                )}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>

              {/* Recording Badge */}
              {session.recordingEnabled && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-xs shrink-0 border-red-200 text-red-600">
                      <Mic className="h-3 w-3 mr-1" />
                      REC
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This session will be recorded</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Password Protected */}
              {session.isPasswordProtected && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Password protected</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Actions Menu */}
            {(isInstructor || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {session.status === 'scheduled' && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(session.id)}>
                      Edit Session
                    </DropdownMenuItem>
                  )}
                  {session.status === 'scheduled' && onCancel && (
                    <DropdownMenuItem onClick={() => onCancel(session.id)} className="text-orange-600">
                      Cancel Session
                    </DropdownMenuItem>
                  )}
                  {session.status === 'live' && isAdmin && onForceEnd && (
                    <DropdownMenuItem onClick={() => onForceEnd(session.id)} className="text-red-600">
                      Force End
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(session.id)} className="text-red-600">
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg mt-2 line-clamp-2">{session.title}</h3>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(session.scheduledAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(session.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {session.participantCount}
                {session.maxParticipants && `/${session.maxParticipants}`} participants
              </span>
            </div>
          </div>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-4">
            <Avatar className="h-6 w-6">
              <AvatarImage src={session.instructorAvatar} />
              <AvatarFallback className="text-xs">{session.instructorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{session.instructorName}</span>
            {session.aiTranscription && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 ml-auto">
                <FileText className="h-3 w-3 mr-1" />
                AI Transcript
              </Badge>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              {actionButton}
            </div>
            
            {session.status === 'scheduled' && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(session.scheduledAt)}
              </span>
            )}
            
            {session.status === 'ended' && session.hasRecording && (
              <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onWatchRecording(session.id)}>
                View Recording
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default SessionCard;
