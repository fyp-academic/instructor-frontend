import React, { useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Hand,
  ScreenShare,
  StopCircle,
  Users,
  MessageSquare,
  FileText,
  Bot,
  Settings,
  ChevronRight,
  ChevronLeft,
  Wifi,
  WifiOff,
  Clock,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

type PanelType = 'participants' | 'chat' | 'transcript' | 'ai' | 'settings' | null;
type NetworkQuality = 'good' | 'fair' | 'poor' | 'unknown';

interface ToolbarProps {
  // State
  isMuted: boolean;
  isCamOn: boolean;
  isHandRaised: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  sessionTime: number;
  networkQuality: NetworkQuality;
  activePanel: PanelType;
  participantCount: number;
  unreadMessages: number;
  
  // User role
  role: 'instructor' | 'student' | 'moderator';
  
  // Actions
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleHand: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onMuteAll: () => void;
  onTogglePanel: (panel: PanelType) => void;
  onLeave: () => void;
  onEndSession?: () => void;
}

/**
 * Format seconds to HH:MM:SS
 */
function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Network quality indicator component
 */
function NetworkIndicator({ quality }: { quality: NetworkQuality }) {
  const config = {
    good: { icon: Wifi, color: 'text-green-500', label: 'Good connection' },
    fair: { icon: Wifi, color: 'text-yellow-500', label: 'Fair connection' },
    poor: { icon: WifiOff, color: 'text-red-500', label: 'Poor connection' },
    unknown: { icon: Wifi, color: 'text-gray-400', label: 'Unknown' },
  };

  const { icon: Icon, color, label } = config[quality];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1 px-2 py-1 rounded', color)}>
          <Icon className="h-4 w-4" />
          {quality === 'poor' && <span className="text-xs">Poor</span>}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Toolbar Component
 * Custom control bar for Jitsi conference
 */
export function Toolbar({
  isMuted,
  isCamOn,
  isHandRaised,
  isScreenSharing,
  isRecording,
  sessionTime,
  networkQuality,
  activePanel,
  participantCount,
  unreadMessages,
  role,
  onToggleMute,
  onToggleCamera,
  onToggleHand,
  onToggleScreenShare,
  onToggleRecording,
  onMuteAll,
  onTogglePanel,
  onLeave,
  onEndSession,
}: ToolbarProps) {
  const isInstructor = role === 'instructor';

  const handlePanelToggle = useCallback((panel: PanelType) => {
    onTogglePanel(activePanel === panel ? null : panel);
  }, [activePanel, onTogglePanel]);

  return (
    <TooltipProvider>
      <div className="h-14 bg-card/95 backdrop-blur border-b flex items-center justify-between px-3 md:px-4 shrink-0">
        {/* Left Section - Session Info */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={cn(
                'bg-primary/10 text-primary font-mono text-xs',
                isRecording && 'animate-pulse bg-red-100 text-red-700 border-red-300'
              )}
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(sessionTime)}
            </Badge>
            
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                <StopCircle className="h-3 w-3 mr-1" />
                REC
              </Badge>
            )}
          </div>

          <NetworkIndicator quality={networkQuality} />

          {/* Mobile-only participant count */}
          <div className="lg:hidden flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount}</span>
          </div>
        </div>

        {/* Center Section - Main Controls */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Mute */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? 'destructive' : 'secondary'}
                size="icon"
                onClick={onToggleMute}
                className={cn('h-10 w-10 md:h-11 md:w-11', isMuted && 'ring-2 ring-destructive/50')}
              >
                {isMuted ? <MicOff className="h-4 w-4 md:h-5 md:w-5" /> : <Mic className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isMuted ? 'Unmute' : 'Mute'} (M)</p>
            </TooltipContent>
          </Tooltip>

          {/* Camera */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!isCamOn ? 'destructive' : 'secondary'}
                size="icon"
                onClick={onToggleCamera}
                className={cn('h-10 w-10 md:h-11 md:w-11', !isCamOn && 'ring-2 ring-destructive/50')}
              >
                {!isCamOn ? <VideoOff className="h-4 w-4 md:h-5 md:w-5" /> : <Video className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCamOn ? 'Stop camera' : 'Start camera'} (V)</p>
            </TooltipContent>
          </Tooltip>

          {/* Hand Raise (Students only can toggle, instructors see all) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHandRaised ? 'default' : 'secondary'}
                size="icon"
                onClick={onToggleHand}
                disabled={!isInstructor && isHandRaised}
                className={cn(
                  'h-10 w-10 md:h-11 md:w-11',
                  isHandRaised && 'ring-2 ring-primary/50'
                )}
              >
                <Hand className={cn('h-4 w-4 md:h-5 md:w-5', isHandRaised && 'animate-bounce')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isHandRaised ? 'Lower hand' : 'Raise hand'} (H)</p>
            </TooltipContent>
          </Tooltip>

          {/* Screen Share */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? 'default' : 'secondary'}
                size="icon"
                onClick={onToggleScreenShare}
                className={cn('h-10 w-10 md:h-11 md:w-11 hidden sm:flex', isScreenSharing && 'ring-2 ring-primary/50')}
              >
                <ScreenShare className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</p>
            </TooltipContent>
          </Tooltip>

          {/* More Actions Dropdown for mobile */}
          <div className="sm:hidden">
            {/* Mobile overflow menu could go here */}
          </div>

          {/* Instructor Recording */}
          {isInstructor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isRecording ? 'destructive' : 'secondary'}
                  size="icon"
                  onClick={onToggleRecording}
                  className={cn(
                    'h-10 w-10 md:h-11 md:w-11 hidden md:flex',
                    isRecording && 'ring-2 ring-destructive/50'
                  )}
                >
                  {isRecording ? <StopCircle className="h-4 w-4 md:h-5 md:w-5" /> : <StopCircle className="h-4 w-4 md:h-5 md:w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? 'Stop recording' : 'Start recording'}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Instructor Mute All */}
          {isInstructor && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={onMuteAll}
                  className="h-10 w-10 md:h-11 md:w-11 hidden lg:flex"
                >
                  <MicOff className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mute all participants</p>
              </TooltipContent>
            </Tooltip>
          )}

          <div className="w-px h-8 bg-border mx-1 hidden md:block" />

          {/* Leave / End Button */}
          {isInstructor ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={onEndSession}
                  className="h-10 md:h-11 px-3 md:px-4"
                >
                  <PhoneOff className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">End Session</span>
                  <span className="sm:hidden">End</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>End session for everyone</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={onLeave}
                  className="h-10 w-10 md:h-11 md:w-11"
                >
                  <PhoneOff className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Leave session</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Right Section - Panel Toggles */}
        <div className="flex items-center gap-1">
          {/* Participants */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'participants' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handlePanelToggle('participants')}
                className="h-10 w-10 hidden lg:flex"
              >
                <div className="relative">
                  <Users className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {participantCount}
                  </span>
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Participants</p>
            </TooltipContent>
          </Tooltip>

          {/* Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'chat' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handlePanelToggle('chat')}
                className="h-10 w-10 hidden lg:flex"
              >
                <div className="relative">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chat</p>
            </TooltipContent>
          </Tooltip>

          {/* Transcript */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'transcript' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handlePanelToggle('transcript')}
                className="h-10 w-10 hidden lg:flex"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Transcript</p>
            </TooltipContent>
          </Tooltip>

          {/* AI */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'ai' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handlePanelToggle('ai')}
                className="h-10 w-10 hidden lg:flex"
              >
                <Bot className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>AI Assistant</p>
            </TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'settings' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => handlePanelToggle('settings')}
                className="h-10 w-10"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          {/* Mobile Panel Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onTogglePanel(activePanel ? null : 'participants')}
            className="h-10 w-10 lg:hidden"
          >
            {activePanel ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>

          {/* Desktop Panel Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onTogglePanel(activePanel ? null : 'participants')}
                className="h-10 w-10 hidden lg:flex"
              >
                {activePanel ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{activePanel ? 'Close' : 'Open'} panel</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default Toolbar;
