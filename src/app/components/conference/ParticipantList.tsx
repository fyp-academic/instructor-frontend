import React, { useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  MoreVertical,
  Crown,
  UserMinus,
  VolumeX,
  GraduationCap,
  User,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Progress } from '../ui/progress';
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

interface Participant {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isModerator?: boolean;
  isSelf?: boolean;
  
  // Status
  isMuted: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  
  // Engagement
  engagementScore: number; // 0-100
  joinTime: string;
  speakTime?: number; // seconds
  messagesSent?: number;
}

interface ParticipantListProps {
  participants: Participant[];
  role: 'instructor' | 'student' | 'moderator';
  currentUserId: string;
  
  // Actions (instructor only)
  onMuteParticipant?: (userId: string) => void;
  onKickParticipant?: (userId: string) => void;
  onPromoteParticipant?: (userId: string) => void;
  onAllowHand?: (userId: string) => void;
  onToggleParticipantVideo?: (userId: string) => void;
  
  // Global actions
  onMuteAll?: () => void;
  onLowerAllHands?: () => void;
}

/**
 * Engagement score bar with color coding
 */
function EngagementBar({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-blue-500';
    if (s >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-full">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Engagement</span>
            <span className={cn(
              'font-medium',
              score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
            )}>
              {score}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all duration-500', getColor(score))}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Engagement Score: {score}/100</p>
        <p className="text-xs text-muted-foreground">Based on participation, chat, and interactions</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Individual participant item
 */
function ParticipantItem({
  participant,
  isInstructor,
  currentUserId,
  onMute,
  onKick,
  onPromote,
  onAllowHand,
  onToggleVideo,
}: {
  participant: Participant;
  isInstructor: boolean;
  currentUserId: string;
  onMute?: (id: string) => void;
  onKick?: (id: string) => void;
  onPromote?: (id: string) => void;
  onAllowHand?: (id: string) => void;
  onToggleVideo?: (id: string) => void;
}) {
  const isSelf = participant.id === currentUserId;
  const canManage = isInstructor && !isSelf && !participant.isModerator;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg transition-colors',
      participant.isHandRaised && 'bg-yellow-50 dark:bg-yellow-950/20',
      isSelf && 'bg-primary/5'
    )}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.avatarUrl} />
          <AvatarFallback className={cn(
            'text-sm font-medium',
            participant.isModerator ? 'bg-amber-100 text-amber-700' : 'bg-muted'
          )}>
            {participant.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Role badge */}
        {participant.isModerator && (
          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center">
            <Crown className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            isSelf && 'text-primary'
          )}>
            {participant.displayName}
            {isSelf && <span className="ml-1.5 text-xs text-muted-foreground">(You)</span>}
          </span>
          
          {participant.isModerator && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              Host
            </Badge>
          )}
          
          {participant.isHandRaised && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-yellow-400 text-yellow-700 animate-pulse">
              <Hand className="h-2.5 w-2.5 mr-0.5" />
              Hand
            </Badge>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1 text-xs',
            participant.isMuted ? 'text-red-500' : 'text-green-500'
          )}>
            {participant.isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
          </div>
          <div className={cn(
            'flex items-center gap-1 text-xs',
            participant.isCameraOn ? 'text-green-500' : 'text-red-500'
          )}>
            {participant.isCameraOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
          </div>
          {participant.isScreenSharing && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
              Sharing
            </Badge>
          )}
        </div>

        {/* Engagement score */}
        {!participant.isModerator && (
          <EngagementBar score={participant.engagementScore} />
        )}
      </div>

      {/* Actions */}
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {participant.isHandRaised && (
              <DropdownMenuItem onClick={() => onAllowHand?.(participant.id)}>
                <Hand className="h-4 w-4 mr-2 text-yellow-500" />
                Allow to speak
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => onMute?.(participant.id)}>
              {participant.isMuted ? (
                <>
                  <Mic className="h-4 w-4 mr-2 text-green-500" />
                  Unmute
                </>
              ) : (
                <>
                  <MicOff className="h-4 w-4 mr-2 text-red-500" />
                  Mute
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onToggleVideo?.(participant.id)}>
              {participant.isCameraOn ? (
                <>
                  <VideoOff className="h-4 w-4 mr-2 text-red-500" />
                  Stop video
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2 text-green-500" />
                  Start video
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => onPromote?.(participant.id)}>
              <GraduationCap className="h-4 w-4 mr-2 text-amber-500" />
              Make co-host
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onKick?.(participant.id)}
              className="text-red-600 focus:text-red-600"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Remove from session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Self indicator */}
      {isSelf && !isInstructor && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          <User className="h-3 w-3 mr-1" />
          You
        </Badge>
      )}
    </div>
  );
}

/**
 * Participant List Component
 */
export function ParticipantList({
  participants,
  role,
  currentUserId,
  onMuteParticipant,
  onKickParticipant,
  onPromoteParticipant,
  onAllowHand,
  onToggleParticipantVideo,
  onMuteAll,
  onLowerAllHands,
}: ParticipantListProps) {
  const isInstructor = role === 'instructor';
  const raisedHandsCount = participants.filter(p => p.isHandRaised).length;

  // Sort: moderators first, then by hand raised, then alphabetically
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isModerator !== b.isModerator) return a.isModerator ? -1 : 1;
    if (a.isHandRaised !== b.isHandRaised) return a.isHandRaised ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Participants</span>
            <Badge variant="secondary" className="text-xs">
              {participants.length}
            </Badge>
          </div>
          
          {raisedHandsCount > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-700 animate-pulse">
              <Hand className="h-3 w-3 mr-1" />
              {raisedHandsCount} hand{raisedHandsCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Instructor Actions */}
        {isInstructor && (
          <div className="flex items-center gap-2 p-2 border-b bg-accent/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMuteAll}
              className="h-8 text-xs"
            >
              <VolumeX className="h-3.5 w-3.5 mr-1" />
              Mute All
            </Button>
            {raisedHandsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onLowerAllHands}
                className="h-8 text-xs"
              >
                <Hand className="h-3.5 w-3.5 mr-1" />
                Lower All
              </Button>
            )}
          </div>
        )}

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sortedParticipants.map((participant) => (
              <ParticipantItem
                key={participant.id}
                participant={participant}
                isInstructor={isInstructor}
                currentUserId={currentUserId}
                onMute={onMuteParticipant}
                onKick={onKickParticipant}
                onPromote={onPromoteParticipant}
                onAllowHand={onAllowHand}
                onToggleVideo={onToggleParticipantVideo}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export default ParticipantList;
