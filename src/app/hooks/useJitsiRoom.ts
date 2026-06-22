import { useState, useEffect, useRef, useCallback } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { sessionsApi } from '../services/api';
import { getReverbConfig } from '../lib/reverb';

let _echoInstance: Echo<'reverb'> | null = null;
function getRoomEcho(): Echo<'reverb'> | null {
  const cfg = getReverbConfig();
  if (!cfg.key) return null;
  if (!_echoInstance) {
    (window as unknown as Record<string, unknown>).Pusher = Pusher;
    _echoInstance = new Echo({
      broadcaster: 'reverb',
      key: cfg.key,
      wsHost: cfg.wsHost,
      wsPort: cfg.wsPort,
      wssPort: cfg.wsPort,
      forceTLS: cfg.forceTLS,
      enabledTransports: cfg.enabledTransports,
      authEndpoint: 'https://api.codagenz.com/broadcasting/auth',
      auth: { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}` } },
    } as ConstructorParameters<typeof Echo>[0]);
  }
  return _echoInstance;
}

// Jitsi Meet External API types (minimal for TypeScript)
interface JitsiMeetExternalAPI {
  dispose: () => void;
  addListener: <E = unknown>(event: string, callback: (event: E) => void) => void;
  removeListener: <E = unknown>(event: string, callback: (event: E) => void) => void;
  removeAllListeners: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
  executeCommands: (commands: Record<string, unknown[]>) => void;
  getNumberOfParticipants: () => number;
  isAudioMuted: () => Promise<{ muted: boolean }>;
  isVideoMuted: () => Promise<{ muted: boolean }>;
  isRecordingActive: () => Promise<{ isRecording: boolean }>;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: {
        roomName: string;
        jwt?: string;
        parentNode: HTMLElement | null;
        configOverwrite?: Record<string, unknown>;
        interfaceConfigOverwrite?: Record<string, unknown>;
        userInfo?: {
          displayName?: string;
          email?: string;
        };
        devices?: {
          audioInput?: string;
          audioOutput?: string;
          videoInput?: string;
        };
      }
    ) => JitsiMeetExternalAPI;
  }
}

interface Participant {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isModerator?: boolean;
}

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    isAI?: boolean;
  };
  text: string;
  timestamp: string;
  isAI?: boolean;
  replyTo?: string;
}

interface TranscriptLine {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

interface UseJitsiRoomProps {
  sessionId?: string;
  roomName: string;
  jwt?: string;
  containerRef: React.RefObject<HTMLElement | null>;
  config?: Record<string, unknown>;
  role: 'instructor' | 'student' | 'moderator';
  userInfo?: {
    displayName: string;
    email?: string;
  };
  scriptLoaded?: boolean;
  aiTranscription?: boolean;
}

interface UseJitsiRoomResult {
  api: JitsiMeetExternalAPI | null;
  participants: Participant[];
  isMuted: boolean;
  isCamOn: boolean;
  isRecording: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  chatMessages: ChatMessage[];
  transcriptLines: TranscriptLine[];
  sessionTime: number;
  error: Error | null;
  isLoading: boolean;
  // Actions
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleHand: () => void;
  toggleShareScreen: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  sendMessage: (text: string) => void;
  hangUp: () => void;
}

/**
 * Hook to manage Jitsi room instance and state
 * Handles ALL event listeners and cleanup
 */
export function useJitsiRoom({
  sessionId,
  roomName,
  jwt,
  containerRef,
  config = {},
  role,
  userInfo,
  scriptLoaded = false,
  aiTranscription = false,
}: UseJitsiRoomProps): UseJitsiRoomResult {
  const [api, setApi] = useState<JitsiMeetExternalAPI | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard against double initialization
  const initializedRef = useRef(false);
  const sessionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiRef = useRef<JitsiMeetExternalAPI | null>(null);

  // Use refs for values that should NOT trigger re-initialization
  // config={} default creates new object on every render causing infinite loop
  const configRef = useRef(config);
  const roleRef = useRef(role);
  const userInfoRef = useRef(userInfo);
  useEffect(() => {
    configRef.current = config;
    roleRef.current = role;
    userInfoRef.current = userInfo;
  }, [config, role, userInfo]);

  const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.codagenz.com';

  // Initialize Jitsi API
  useEffect(() => {
    // Guard against double init
    if (initializedRef.current) return;
    if (!containerRef.current) return;
    if (!scriptLoaded) return;
    if (typeof window === 'undefined' || !window.JitsiMeetExternalAPI) return;

    initializedRef.current = true;
    setIsLoading(true);

    const currentConfig = configRef.current;
    const currentRole = roleRef.current;
    const currentUserInfo = userInfoRef.current;

    try {
      // Default config based on role
      const defaultConfig: Record<string, unknown> = {
        startWithAudioMuted: currentRole !== 'instructor',
        startWithVideoMuted: currentRole !== 'instructor',
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        disableDeepLinking: true,
        p2p: { enabled: false },
        channelLastN: 10,
        resolution: 360,
        constraints: {
          video: {
            height: { ideal: 360, max: 480 },
            frameRate: { max: 20 },
          },
        },
        disableSimulcast: false,
        enableLayerSuspension: true,
        enableNoisyMicDetection: false,
        startBitrate: 800,
        desktopSharingFrameRate: { min: 5, max: 15 },
        ...currentConfig,
      };

      // Interface config - hide default toolbar, we'll use custom
      const interfaceConfig: Record<string, unknown> = {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#1a1a1a',
        DEFAULT_LOGO_URL: '',
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        DISABLE_FOCUS_INDICATOR: true,
        DISABLE_DOMINANT_SPEAKER_INDICATOR: true,
        MOBILE_APP_PROMO: false,
        ENABLE_FEEDBACK_ANIMATION: false,
        HIDE_INVITE_MORE_HEADER: true,
      };

      const jitsiApi = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName,
        jwt,
        parentNode: containerRef.current,
        configOverwrite: defaultConfig,
        interfaceConfigOverwrite: interfaceConfig,
        userInfo: currentUserInfo || { displayName: 'Guest' },
      });

      apiRef.current = jitsiApi;
      setApi(jitsiApi);
      setIsLoading(false);

      // Attach ALL event listeners

      // 1. Video conference joined
      jitsiApi.addListener('videoConferenceJoined', (event: { id: string; displayName: string; avatarURL?: string }) => {
        console.log('Joined conference:', event);
        setParticipants(prev => {
          if (prev.find(p => p.id === event.id)) return prev;
          return [...prev, {
            id: event.id,
            displayName: event.displayName,
            avatarUrl: event.avatarURL,
            isModerator: currentRole === 'instructor',
          }];
        });
        
        // Get initial mute states
        jitsiApi.isAudioMuted().then(({ muted }) => setIsMuted(muted));
        jitsiApi.isVideoMuted().then(({ muted }) => setIsCamOn(!muted));
      });

      // 2. Participant joined
      jitsiApi.addListener('participantJoined', (event: { id: string; displayName: string; email?: string }) => {
        console.log('Participant joined:', event);
        setParticipants(prev => {
          if (prev.find(p => p.id === event.id)) return prev;
          return [...prev, {
            id: event.id,
            displayName: event.displayName,
            email: event.email,
          }];
        });
      });

      // 3. Participant left
      jitsiApi.addListener('participantLeft', (event: { id: string }) => {
        console.log('Participant left:', event);
        setParticipants(prev => prev.filter(p => p.id !== event.id));
      });

      // 4. Audio mute status changed
      jitsiApi.addListener('audioMuteStatusChanged', (event: { muted: boolean }) => {
        setIsMuted(event.muted);
      });

      // 5. Video mute status changed
      jitsiApi.addListener('videoMuteStatusChanged', (event: { muted: boolean }) => {
        setIsCamOn(!event.muted);
      });

      // 6. Recording status changed
      jitsiApi.addListener('recordingStatusChanged', (event: { isRecording: boolean; mode?: string }) => {
        setIsRecording(event.isRecording);
      });

      // 6a. Screen sharing status changed
      jitsiApi.addListener('screenSharingStatusChanged', (event: { on: boolean }) => {
        setIsScreenSharing(event.on);
      });

      // 7. Raise hand updated
      jitsiApi.addListener('raiseHandUpdated', (event: { id: string; raisedHand?: number }) => {
        if (event.id === 'local') {
          setIsHandRaised(!!event.raisedHand);
        }
      });

      // 8. Incoming message
      jitsiApi.addListener('incomingMessage', (event: { 
        from: string; 
        message: string; 
        nick?: string;
        privateMessage?: boolean;
      }) => {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: {
            id: event.from,
            name: event.nick || 'Unknown',
          },
          text: event.message,
          timestamp: new Date().toISOString(),
          isAI: event.from === 'ai-assistant',
        };
        setChatMessages(prev => [...prev, newMessage]);
      });

      // 9. Chat updated (for message sent confirmation)
      jitsiApi.addListener('chatUpdated', (event: { isOpen: boolean }) => {
        // Track if chat panel is open in Jitsi (we use custom UI)
      });

      // 10. Endpoint text message (for custom signaling)
      jitsiApi.addListener('endpointTextMessageReceived', (event: { 
        senderInfo: { id: string; displayName?: string }; 
        eventData: { text?: string };
      }) => {
        try {
          const data = JSON.parse(event.eventData.text || '{}');
          if (data.type === 'transcript') {
            setTranscriptLines(prev => [...prev, {
              id: data.id || `tr_${Date.now()}`,
              speaker: data.speaker || event.senderInfo.displayName || 'Unknown',
              text: data.text,
              timestamp: data.timestamp || new Date().toISOString(),
              segments: data.segments,
            }]);
          }
        } catch {
          // Not JSON, ignore
        }
      });

      // 11. Screen sharing status
      jitsiApi.addListener('screenSharingStatusChanged', (event: { on: boolean }) => {
        // Track screen sharing status if needed
      });

      // 12. Participant role changed
      jitsiApi.addListener('participantRoleChanged', (event: { id: string; role: string }) => {
        setParticipants(prev => prev.map(p => 
          p.id === event.id ? { ...p, isModerator: event.role === 'moderator' } : p
        ));
      });

      // 13. Display name change
      jitsiApi.addListener('displayNameChange', (event: { id: string; displayname: string }) => {
        setParticipants(prev => prev.map(p => 
          p.id === event.id ? { ...p, displayName: event.displayname } : p
        ));
      });

      // 14. Participant kicked
      jitsiApi.addListener('participantKicked', (event: { kicked: { local: boolean }; kicker: { displayName: string } }) => {
        if (event.kicked.local) {
          // Local user was kicked
          setError(new Error(`You were removed from the session by ${event.kicker.displayName}`));
        }
      });

      // 15. Conference left — record participation end for attendance
      jitsiApi.addListener('videoConferenceLeft', () => {
        if (sessionId) {
          sessionsApi.participantLeft(sessionId).catch(() => {/* silent */});
        }
      });

      // 16. Connection quality changed
      jitsiApi.addListener('connectionQualityChanged', (event: { quality: number; participantId: string }) => {
        // Could track connection quality per participant
      });

      // 17. Ready to close
      jitsiApi.addListener('readyToClose', () => {
        jitsiApi.dispose();
      });

      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize Jitsi'));
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      initializedRef.current = false;
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }

      if (apiRef.current) {
        try {
          apiRef.current.removeAllListeners();
          apiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi API:', e);
        }
        apiRef.current = null;
      }
    };
    // Re-initialize when roomName, jwt, or scriptLoaded changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, jwt, scriptLoaded]);

  // ── Audio capture for AI transcription ────────────────────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef   = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!aiTranscription || !sessionId || isLoading) return;

    let active = true;

    const startCapture = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        audioStreamRef.current = stream;

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e: BlobEvent) => {
          if (!active || e.data.size < 500) return;
          const form = new FormData();
          form.append('audio', e.data, 'chunk.webm');
          form.append('session_id', sessionId!);
          try {
            const res = await sessionsApi.transcribe(form);
            const { text, speaker, timestamp } = res.data as { text: string; speaker: string; timestamp: string };
            if (text) {
              setTranscriptLines(prev => [...prev, {
                id: `tr_${Date.now()}`,
                speaker: speaker || userInfoRef.current?.displayName || 'Me',
                text,
                timestamp: timestamp || new Date().toISOString(),
              }]);
            }
          } catch { /* silent — rate limit or consent error */ }
        };

        recorder.start(15000);
      } catch {
        // Microphone access denied or not available
      }
    };

    startCapture();

    return () => {
      active = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch { /* ignore */ }
      }
      audioStreamRef.current?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
      audioStreamRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTranscription, sessionId, isLoading]);

  // ── Echo subscription for other participants' transcripts ─────────────────
  useEffect(() => {
    if (!aiTranscription || !sessionId) return;
    const echo = getRoomEcho();
    if (!echo) return;

    const channel = echo.private(`session.${sessionId}`);
    channel.listen('.transcript.created', (data: { id: string; speaker: string; text: string; timestamp: string }) => {
      setTranscriptLines(prev => {
        if (prev.some(t => t.id === data.id)) return prev;
        return [...prev, { id: data.id, speaker: data.speaker, text: data.text, timestamp: data.timestamp }];
      });
    });

    return () => { echo.leave(`session.${sessionId}`); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTranscription, sessionId]);

  // Actions
  const toggleMute = useCallback(() => {
    if (api) {
      api.executeCommand('toggleAudio');
    }
  }, [api]);

  const toggleCamera = useCallback(() => {
    if (api) {
      api.executeCommand('toggleVideo');
    }
  }, [api]);

  const toggleHand = useCallback(() => {
    if (api) {
      api.executeCommand('toggleRaiseHand');
    }
  }, [api]);

  const toggleShareScreen = useCallback(() => {
    if (api) {
      api.executeCommand('toggleShareScreen');
    }
  }, [api]);

  const startRecording = useCallback(() => {
    if (api && role === 'instructor') {
      api.executeCommand('startRecording', {
        mode: 'file', // or 'stream' for live streaming
      });
    }
  }, [api, role]);

  const stopRecording = useCallback(() => {
    if (api) {
      api.executeCommand('stopRecording');
    }
  }, [api]);

  const sendMessage = useCallback((text: string) => {
    if (api) {
      api.executeCommand('sendChatMessage', text);
      
      // Also add to local state for immediate feedback
      const newMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender: {
          id: 'local',
          name: userInfo?.displayName || 'You',
        },
        text,
        timestamp: new Date().toISOString(),
        isAI: false,
      };
      setChatMessages(prev => [...prev, newMessage]);
    }
  }, [api, userInfo]);

  const hangUp = useCallback(() => {
    if (api) {
      api.executeCommand('hangup');
    }
  }, [api]);

  return {
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
    error,
    isLoading,
    toggleMute,
    toggleCamera,
    toggleHand,
    toggleShareScreen,
    startRecording,
    stopRecording,
    sendMessage,
    hangUp,
  };
}

export default useJitsiRoom;
