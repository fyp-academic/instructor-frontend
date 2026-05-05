import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  Loader2,
  MoreHorizontal,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    isAI?: boolean;
    isSelf?: boolean;
  };
  text: string;
  timestamp: string;
  isAI?: boolean;
  replyTo?: {
    id: string;
    text: string;
    sender: string;
  };
  isDeleted?: boolean;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onAskAI?: (question: string) => void;
  isAIResponding?: boolean;
  aiTypingText?: string;
  
  // Optional actions
  onDeleteMessage?: (messageId: string) => void;
  onCopyMessage?: (text: string) => void;
}

/**
 * Format timestamp to relative time
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than a minute
  if (diff < 60000) return 'Just now';
  
  // Less than an hour
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  
  // Less than a day
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  // Default to time string
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * AI Typing Indicator
 */
function AITypingIndicator({ text }: { text?: string }) {
  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-purple-100 text-purple-700">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-purple-50 text-purple-900 rounded-lg px-4 py-3 text-sm max-w-[80%]">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="font-medium">AI Assistant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-purple-700">
            {text || 'Thinking...'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual message bubble
 */
function MessageBubble({
  message,
  isSelf,
  onDelete,
  onCopy,
}: {
  message: ChatMessage;
  isSelf: boolean;
  onDelete?: (id: string) => void;
  onCopy?: (text: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    onCopy?.(message.text);
    setTimeout(() => setCopied(false), 2000);
  }, [message.text, onCopy]);

  if (message.isDeleted) {
    return (
      <div className={cn(
        'flex gap-2',
        isSelf ? 'flex-row-reverse' : 'flex-row'
      )}>
        <div className="text-xs text-muted-foreground italic py-1">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex gap-2 group',
      isSelf ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Avatar */}
      <Avatar className="h-8 w-8 shrink-0">
        {message.sender.avatar ? (
          <AvatarImage src={message.sender.avatar} />
        ) : null}
        <AvatarFallback className={cn(
          'text-xs',
          message.isAI
            ? 'bg-purple-100 text-purple-700'
            : isSelf
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
        )}>
          {message.isAI ? <Bot className="h-4 w-4" /> : message.sender.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Message Content */}
      <div className={cn(
        'max-w-[75%] min-w-0',
        isSelf ? 'items-end' : 'items-start'
      )}>
        {/* Sender name */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className={cn(
            'text-xs font-medium',
            message.isAI ? 'text-purple-700' : 'text-muted-foreground'
          )}>
            {message.sender.name}
          </span>
          {message.isAI && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              AI
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {/* Reply reference */}
        {message.replyTo && (
          <div className={cn(
            'mb-1 px-3 py-1.5 rounded text-xs border-l-2',
            isSelf
              ? 'bg-primary/10 border-primary/30 text-primary-foreground/80'
              : 'bg-accent border-muted-foreground/30 text-muted-foreground'
          )}>
            <p className="font-medium">{message.replyTo.sender}</p>
            <p className="truncate">{message.replyTo.text}</p>
          </div>
        )}

        {/* Message bubble */}
        <div className={cn(
          'relative px-4 py-2.5 rounded-2xl text-sm',
          message.isAI
            ? 'bg-purple-50 text-purple-900 rounded-tl-sm border border-purple-100'
            : isSelf
              ? 'bg-primary text-primary-foreground rounded-tr-sm'
              : 'bg-accent rounded-tl-sm'
        )}>
          <p className="whitespace-pre-wrap break-words">{message.text}</p>

          {/* Actions dropdown */}
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity',
            isSelf ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isSelf ? 'end' : 'start'}>
                <DropdownMenuItem onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy'}
                </DropdownMenuItem>
                {isSelf && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(message.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick AI suggestions
 */
function AIQuickActions({ onSelect }: { onSelect: (text: string) => void }) {
  const suggestions = [
    'Summarize what was discussed',
    'Explain the key concepts',
    'Quiz me on this topic',
    'Provide examples',
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(`@AI ${suggestion}`)}
          className="flex-shrink-0 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
        >
          <Sparkles className="h-3 w-3 inline mr-1" />
          {suggestion}
        </button>
      ))}
    </div>
  );
}

/**
 * Chat Panel Component
 */
export function ChatPanel({
  messages,
  currentUserId,
  onSendMessage,
  onAskAI,
  isAIResponding = false,
  aiTypingText,
  onDeleteMessage,
  onCopyMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isAICommand, setIsAICommand] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAIResponding]);

  // Detect @AI command
  useEffect(() => {
    setIsAICommand(input.trim().startsWith('@AI'));
  }, [input]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const text = input.trim();
    
    // Check for AI command
    if (text.startsWith('@AI') && onAskAI) {
      const question = text.slice(3).trim();
      onAskAI(question);
      // Also send as regular message for context
      onSendMessage(text);
    } else {
      onSendMessage(text);
    }
    
    setInput('');
  }, [input, onSendMessage, onAskAI]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleQuickAction = useCallback((text: string) => {
    setInput(text);
    inputRef.current?.focus();
  }, []);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Chat</span>
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bot className="h-3.5 w-3.5 text-purple-500" />
                <span>Type @AI to ask</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Type @AI followed by your question</p>
              <p className="text-xs text-muted-foreground">Example: @AI summarize this topic</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-3 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <Send className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start the conversation or ask @AI a question
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isSelf={message.sender.id === currentUserId || message.sender.isSelf}
                  onDelete={onDeleteMessage}
                  onCopy={onCopyMessage}
                />
              ))
            )}
            
            {/* AI Typing Indicator */}
            {isAIResponding && <AITypingIndicator text={aiTypingText} />}
          </div>
        </ScrollArea>

        {/* Quick AI Actions */}
        {messages.length > 0 && !isAIResponding && (
          <div className="px-3 pt-2 border-t">
            <AIQuickActions onSelect={handleQuickAction} />
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t shrink-0">
          <div className={cn(
            'flex gap-2 items-end p-2 rounded-lg border transition-colors',
            isAICommand
              ? 'bg-purple-50/50 border-purple-200 focus-within:border-purple-400'
              : 'bg-accent/50 border-transparent focus-within:bg-accent focus-within:border-border'
          )}>
            <div className="flex-1 min-w-0">
              {isAICommand && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-purple-100 text-purple-700 border-purple-200">
                    <Bot className="h-3 w-3 mr-1" />
                    AI Mode
                  </Badge>
                  <span className="text-xs text-purple-600">Ask anything about this session</span>
                </div>
              )}
              <Input
                ref={inputRef}
                placeholder="Type a message... (@AI to ask AI)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  'border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 h-auto',
                  isAICommand && 'placeholder:text-purple-400'
                )}
              />
            </div>
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isAIResponding}
              className={cn(
                'h-9 w-9 shrink-0',
                isAICommand && 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              {isAIResponding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Input hints */}
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-[10px] text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
            {input.length > 0 && (
              <p className={cn(
                'text-[10px]',
                input.length > 500 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {input.length}/1000
              </p>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default ChatPanel;
