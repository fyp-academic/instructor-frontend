import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Download,
  Search,
  FileText,
  Clock,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useToast } from '../ui/use-toast';

interface TranscriptSegment {
  id: string;
  speaker: string;
  speakerId?: string;
  text: string;
  timestamp: string;
  startTime?: number; // seconds from start
  endTime?: number;
  confidence?: number;
}

interface TranscriptPanelProps {
  transcript: TranscriptSegment[];
  sessionTitle?: string;
  isLive?: boolean;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
  onSearch?: (query: string) => void;
  onDownload?: () => void;
  onJumpToTime?: (seconds: number) => void;
}

/**
 * Format seconds to MM:SS
 */
function formatTimestamp(seconds?: number): string {
  if (seconds === undefined) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Highlight search terms in text
 */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * Individual transcript segment
 */
function TranscriptSegmentItem({
  segment,
  searchQuery,
  isHighlighted,
  onClick,
}: {
  segment: TranscriptSegment;
  searchQuery: string;
  isHighlighted?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        isHighlighted ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'hover:bg-accent/50'
      )}
      onClick={onClick}
    >
      {/* Timestamp */}
      <div className="shrink-0 pt-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs font-mono text-muted-foreground tabular-nums">
              {formatTimestamp(segment.startTime)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formatRelativeTime(segment.timestamp)}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Avatar className="h-5 w-5">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {segment.speaker.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{segment.speaker}</span>
          {segment.confidence !== undefined && segment.confidence < 0.8 && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-yellow-400/50 text-yellow-600">
              Low confidence
            </Badge>
          )}
        </div>
        <p className="text-sm leading-relaxed">
          <HighlightText text={segment.text} query={searchQuery} />
        </p>
      </div>

      {/* Confidence indicator */}
      {segment.confidence !== undefined && (
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className={cn(
              'h-1 w-8 rounded-full',
              segment.confidence >= 0.9 ? 'bg-green-500' :
              segment.confidence >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
            )}
            title={`Confidence: ${Math.round(segment.confidence * 100)}%`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Speaker filter component
 */
function SpeakerFilter({
  speakers,
  selected,
  onChange,
}: {
  speakers: string[];
  selected: Set<string>;
  onChange: (speaker: string) => void;
}) {
  if (speakers.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5 p-2 border-b bg-accent/30">
      <span className="text-xs text-muted-foreground mr-1 flex items-center">
        <Filter className="h-3 w-3 mr-1" />
        Speakers:
      </span>
      {speakers.map((speaker) => (
        <button
          key={speaker}
          onClick={() => onChange(speaker)}
          className={cn(
            'px-2 py-0.5 text-[10px] rounded-full border transition-colors',
            selected.has(speaker)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary/50'
          )}
        >
          {speaker}
        </button>
      ))}
    </div>
  );
}

/**
 * Transcript Panel Component
 */
export function TranscriptPanel({
  transcript,
  sessionTitle,
  isLive = false,
  participants,
  onSearch,
  onDownload,
  onJumpToTime,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get unique speakers
  const speakers = useMemo(() => {
    const unique = new Set(transcript.map(t => t.speaker));
    return Array.from(unique);
  }, [transcript]);

  // Filter transcript
  const filteredTranscript = useMemo(() => {
    let filtered = transcript;

    // Filter by speakers
    if (selectedSpeakers.size > 0 && selectedSpeakers.size < speakers.length) {
      filtered = filtered.filter(t => selectedSpeakers.has(t.speaker));
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.text.toLowerCase().includes(query) ||
        t.speaker.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transcript, selectedSpeakers, speakers.length, searchQuery]);

  // Match count for search
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return filteredTranscript.length;
  }, [searchQuery, filteredTranscript]);

  // Toggle speaker filter
  const toggleSpeaker = useCallback((speaker: string) => {
    setSelectedSpeakers(prev => {
      const next = new Set(prev);
      if (next.has(speaker)) {
        next.delete(speaker);
      } else {
        next.add(speaker);
      }
      return next;
    });
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedSpeakers(new Set());
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  // Handle search navigation
  const navigateMatches = useCallback((direction: 'up' | 'down') => {
    if (matchCount === 0) return;
    
    setCurrentMatchIndex(prev => {
      if (direction === 'down') {
        return prev < matchCount - 1 ? prev + 1 : 0;
      } else {
        return prev > 0 ? prev - 1 : matchCount - 1;
      }
    });
  }, [matchCount]);

  // Download transcript as .txt
  const handleDownload = useCallback(() => {
    const lines = transcript.map(t =>
      `[${formatTimestamp(t.startTime)}] ${t.speaker}: ${t.text}`
    );
    const content = lines.join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle || 'session'}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Transcript downloaded',
      description: 'The transcript has been saved as a .txt file.',
    });

    onDownload?.();
  }, [transcript, sessionTitle, onDownload, toast]);

  // Auto-scroll to bottom when new segments arrive (live mode)
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript.length, isLive]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Transcript</span>
            {isLive && (
              <Badge variant="destructive" className="text-[10px] animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className={cn('h-4 w-4', showFilters && 'text-primary')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filter speakers</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDownload}
                  disabled={transcript.length === 0}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download transcript</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-20"
            />
            {searchQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {matchCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {currentMatchIndex + 1}/{matchCount}
                  </span>
                )}
                <button
                  onClick={() => navigateMatches('up')}
                  className="p-1 hover:bg-accent rounded"
                  disabled={matchCount === 0}
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => navigateMatches('down')}
                  className="p-1 hover:bg-accent rounded"
                  disabled={matchCount === 0}
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Speaker filters */}
        {showFilters && speakers.length > 1 && (
          <SpeakerFilter
            speakers={speakers}
            selected={selectedSpeakers}
            onChange={toggleSpeaker}
          />
        )}

        {/* Stats */}
        <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-b bg-accent/30">
          <span>{filteredTranscript.length} segments</span>
          <span>{transcript.length} total</span>
        </div>

        {/* Transcript list */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-2 space-y-1">
            {filteredTranscript.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {transcript.length === 0 ? 'Transcript will appear here' : 'No matches found'}
                </p>
                {searchQuery && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-2"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              filteredTranscript.map((segment, index) => (
                <TranscriptSegmentItem
                  key={segment.id}
                  segment={segment}
                  searchQuery={searchQuery}
                  isHighlighted={searchQuery ? index === currentMatchIndex : false}
                  onClick={() => segment.startTime && onJumpToTime?.(segment.startTime)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export default TranscriptPanel;
