import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  Users,
  FileText,
  Settings,
  Bot,
  MoreVertical,
  ScreenShare,
  StopCircle,
  Circle,
  Hand,
  ChevronRight,
  ChevronLeft,
  X,
  Send,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useToast } from '../ui/use-toast';
import useJitsiScript from '../../hooks/useJitsiScript';
import useJitsiRoom from '../../hooks/useJitsiRoom';

type TabValue = 'participants' | 'chat' | 'transcript' | 'ai' | 'settings';

interface JitsiRoomProps {
  sessionId: string;
  roomName: string;
  jwt?: string;
  role: 'instructor' | 'student' | 'moderator';
  userInfo: {
    displayName: string;
    email?: string;
    avatar?: string;
  };
  onClose: () => void;
  courseName?: string;
  sessionTitle?: string;
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
 * Full-screen Jitsi Conference Component
 * Custom toolbar + side panel with tabs
 */
export function JitsiRoom({
  sessionId,
  roomName,
  jwt,
  role,
  userInfo,
  onClose,
  courseName,
  sessionTitle,
}: JitsiRoomProps) {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<TabValue>('participants');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const { toast } = useToast();

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load Jitsi script
  const { loaded: scriptLoaded, error: scriptError } = useJitsiScript();

  // Initialize Jitsi room
  const {
    api,
    participants,
    isMuted,
    isCamOn,
    isRecording,
    isScreenSharing,
    isHandRaised,
    chatMessages,
    transcriptLines,
    sessionTime,
    error: roomError,
    isLoading,
    toggleMute,
    toggleCamera,
    toggleHand,
    toggleShareScreen,
    startRecording,
    stopRecording,
    sendMessage,
    hangUp,
  } = useJitsiRoom({
    roomName,
    jwt,
    containerRef: jitsiContainerRef,
    role,
    userInfo,
    scriptLoaded,
  });

  // Handle errors
  useEffect(() => {
    if (scriptError) {
      toast({
        title: 'Failed to load Jitsi',
        description: scriptError.message,
        variant: 'destructive',
      });
    }
    if (roomError) {
      toast({
        title: 'Conference Error',
        description: roomError.message,
        variant: 'destructive',
      });
    }
  }, [scriptError, roomError, toast]);

  // Send chat message
  const handleSendMessage = useCallback(() => {
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  }, [chatInput, sendMessage]);

  // Handle AI question
  const handleAskAI = useCallback(async () => {
    if (!aiQuestion.trim()) return;

    const question = aiQuestion.trim();
    setAiQuestion('');
    setIsAiTyping(true);

    // Send message with @AI prefix to trigger backend
    sendMessage(`@AI ${question}`);

    // The AI response will come through chatMessages via socket
    setTimeout(() => setIsAiTyping(false), 2000);
  }, [aiQuestion, sendMessage]);

  // Hang up and close
  const handleHangUp = useCallback(() => {
    hangUp();
    onClose();
  }, [hangUp, onClose]);

  // Toggle recording (instructor only)
  const handleToggleRecording = useCallback(() => {
    if (role !== 'instructor') {
      toast({
        title: 'Permission Denied',
        description: 'Only instructors can record sessions.',
        variant: 'destructive',
      });
      return;
    }

    if (isRecording) {
      stopRecording();
      toast({ title: 'Recording Stopped', description: 'Session recording has been stopped.' });
    } else {
      startRecording();
      toast({ title: 'Recording Started', description: 'Session is now being recorded.' });
    }
  }, [isRecording, startRecording, stopRecording, role, toast]);

  // Render participant list
  const renderParticipants = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-2 border-b">
        <span className="text-sm text-muted-foreground">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </span>
        {role === 'instructor' && (
          <Button variant="outline" size="sm" onClick={() => api?.executeCommand('muteEveryone', 'audio')}>
            <MicOff className="h-3 w-3 mr-1" />
            Mute All
          </Button>
        )}
      </div>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-2 py-2">
          {participants.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
              <Avatar className="h-8 w-8">
                <AvatarImage src={p.avatarUrl} />
                <AvatarFallback>{p.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.displayName}</p>
                <p className="text-xs text-muted-foreground">{p.isModerator ? 'Host' : 'Participant'}</p>
              </div>
              {p.isModerator && <Badge variant="secondary" className="text-xs">Host</Badge>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  // Render chat
  const renderChat = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 py-2">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2',
                msg.sender.id === 'local' ? 'flex-row-reverse' : 'flex-row'
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className={cn(
                  'text-xs',
                  msg.isAI ? 'bg-purple-100 text-purple-700' : 'bg-primary text-primary-foreground'
                )}>
                  {msg.isAI ? <Bot className="h-3 w-3" /> : msg.sender.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                msg.isAI
                  ? 'bg-purple-50 text-purple-900'
                  : msg.sender.id === 'local'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent'
              )}>
                <p className="text-xs font-medium mb-1 opacity-80">{msg.sender.name}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
          {isAiTyping && (
            <div className="flex gap-2">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                  <Bot className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-purple-50 text-purple-900 rounded-lg px-3 py-2 text-sm">
                <p className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI is thinking...
                </p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="flex gap-2 pt-2 mt-2 border-t">
        <Input
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1"
        />
        <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render transcript
  const renderTranscript = () => (
    <div className="h-full">
      <ScrollArea className="h-[calc(100vh-240px)]">
        <div className="space-y-3 py-2">
          {transcriptLines.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Transcription will appear here</p>
              <p className="text-xs mt-1">AI transcription must be enabled for this session</p>
            </div>
          ) : (
            transcriptLines.map((line) => (
              <div key={line.id} className="p-2 rounded bg-accent/50">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{line.speaker.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{line.speaker}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(line.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm pl-7">{line.text}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Render AI panel
  const renderAI = () => (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Assistant</span>
            </div>
            <p className="text-xs text-purple-700">
              Ask questions about the session content. The AI can answer based on the transcript and course material.
            </p>
          </div>

          {/* AI Chat Messages */}
          <div className="space-y-3">
            {chatMessages
              .filter((m) => m.isAI || m.text.startsWith('@AI'))
              .map((msg, idx) => (
                <div key={`${msg.id}-${idx}`} className="flex gap-2">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={msg.isAI ? 'bg-purple-100 text-purple-700' : 'bg-primary text-primary-foreground'}>
                      {msg.isAI ? <Bot className="h-3 w-3" /> : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                    msg.isAI ? 'bg-purple-50 text-purple-900' : 'bg-accent'
                  )}>
                    <p className="text-xs font-medium mb-1">{msg.isAI ? 'AI Assistant' : 'You'}</p>
                    <p>{msg.isAI ? msg.text : msg.text.replace('@AI ', '')}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </ScrollArea>

      <div className="pt-2 mt-2 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask AI a question..."
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleAskAI} disabled={!aiQuestion.trim() || isAiTyping}>
            {isAiTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Press Enter to ask the AI assistant</p>
      </div>
    </div>
  );

  // Render settings
  const renderSettings = () => (
    <div className="space-y-4 py-2">
      <div className="p-3 rounded-lg bg-accent/50">
        <h4 className="text-sm font-medium mb-2">Session Info</h4>
        <div className="space-y-1 text-sm">
          <p><span className="text-muted-foreground">Room:</span> {roomName}</p>
          {courseName && <p><span className="text-muted-foreground">Course:</span> {courseName}</p>}
          {sessionTitle && <p><span className="text-muted-foreground">Title:</span> {sessionTitle}</p>}
          <p><span className="text-muted-foreground">Role:</span> {role}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Keyboard Shortcuts</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p><kbd className="px-1 bg-accent rounded">M</kbd> Toggle mute</p>
          <p><kbd className="px-1 bg-accent rounded">V</kbd> Toggle video</p>
          <p><kbd className="px-1 bg-accent rounded">H</kbd> Raise/lower hand</p>
        </div>
      </div>

      {role === 'instructor' && (
        <div className="pt-2 border-t">
          <h4 className="text-sm font-medium mb-2">Recording</h4>
          <Button
            variant={isRecording ? 'destructive' : 'default'}
            className="w-full"
            onClick={handleToggleRecording}
          >
            {isRecording ? (
              <>
                <StopCircle className="h-4 w-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 mr-2 fill-red-500 text-red-500" />
                Start Recording
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );

  // Side panel content
  const panelContent = (
    <Tabs value={activePanel} onValueChange={(v) => setActivePanel(v as TabValue)} className="h-full flex flex-col">
      <TabsList className="grid grid-cols-5 w-full">
        <TabsTrigger value="participants" className="px-1">
          <Users className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="chat" className="px-1">
          <MessageSquare className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="transcript" className="px-1">
          <FileText className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="ai" className="px-1">
          <Bot className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="settings" className="px-1">
          <Settings className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-hidden p-3">
        <TabsContent value="participants" className="h-full m-0">
          {renderParticipants()}
        </TabsContent>
        <TabsContent value="chat" className="h-full m-0">
          {renderChat()}
        </TabsContent>
        <TabsContent value="transcript" className="h-full m-0">
          {renderTranscript()}
        </TabsContent>
        <TabsContent value="ai" className="h-full m-0">
          {renderAI()}
        </TabsContent>
        <TabsContent value="settings" className="h-full m-0">
          {renderSettings()}
        </TabsContent>
      </div>
    </Tabs>
  );

  if (scriptError || roomError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to join session</h2>
          <p className="text-muted-foreground mb-4">
            {(scriptError || roomError)?.message || 'An error occurred while initializing the video conference.'}
          </p>
          <Button onClick={onClose}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Custom Toolbar - 56px height */}
      <div className="h-14 bg-card border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Clock className="h-3 w-3 mr-1" />
              {formatDuration(sessionTime)}
            </Badge>
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <StopCircle className="h-3 w-3 mr-1" />
                REC
              </Badge>
            )}
          </div>
          <div className="hidden md:block">
            <h3 className="text-sm font-medium truncate max-w-xs">{sessionTitle || roomName}</h3>
            {courseName && <p className="text-xs text-muted-foreground">{courseName}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Panel Button (Mobile) */}
          {isMobile && (
            <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Session Panel</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100vh-80px)]">
                  {panelContent}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Main Controls */}
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10"
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            variant={!isCamOn ? 'destructive' : 'secondary'}
            size="icon"
            onClick={toggleCamera}
            className="h-10 w-10"
          >
            {!isCamOn ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>

          <Button
            variant={isHandRaised ? 'default' : 'secondary'}
            size="icon"
            onClick={toggleHand}
            className="h-10 w-10"
          >
            <Hand className={cn('h-4 w-4', isHandRaised && 'animate-bounce')} />
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenSharing ? 'default' : 'secondary'}
            size="icon"
            onClick={toggleShareScreen}
            className="h-10 w-10 hidden sm:flex"
          >
            <ScreenShare className="h-4 w-4" />
          </Button>

          {role === 'instructor' && (
            <Button
              variant={isRecording ? 'destructive' : 'secondary'}
              size="icon"
              onClick={handleToggleRecording}
              className="h-10 w-10 hidden sm:flex"
            >
              {isRecording ? <StopCircle className="h-4 w-4" /> : <Circle className="h-4 w-4 fill-red-500 text-red-500" />}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            onClick={handleHangUp}
            className="h-10 w-10"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>

          {/* Toggle Panel (Desktop) */}
          {!isMobile && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="h-10 w-10 ml-2"
            >
              {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Jitsi Iframe Container */}
        <div
          ref={jitsiContainerRef}
          className={cn(
            'flex-1 bg-black relative',
            isPanelOpen && !isMobile && 'mr-[300px]'
          )}
        >
          {/* Loading State */}
          {(isLoading || !scriptLoaded) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  {!scriptLoaded ? 'Loading Jitsi...' : 'Joining session...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Side Panel (Desktop) */}
        {!isMobile && isPanelOpen && (
          <div className="w-[300px] bg-card border-l flex flex-col absolute right-0 top-14 bottom-0">
            {panelContent}
          </div>
        )}
      </div>
    </div>
  );
}

export default JitsiRoom;
