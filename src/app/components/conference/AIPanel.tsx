import React, { useState, useCallback, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Loader2,
  FileText,
  GraduationCap,
  BarChart3,
  Users,
  MessageSquare,
  Clock,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { useToast } from '../ui/use-toast.ts';
import { sessionsApi } from '../../services/api';

interface AIQuestion {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  isLoading?: boolean;
}

interface EngagementMetric {
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  speakTime: number;
  messagesSent: number;
  handsRaised: number;
  attentionScore: number;
}

interface AIPanelProps {
  sessionId: string;
  isInstructor?: boolean;
  summary?: string;
  isSummaryLoading?: boolean;
  engagementMetrics?: EngagementMetric[];
  onGenerateSummary?: () => void;
  onAskQuestion?: (question: string) => Promise<string>;
  onGenerateQuiz?: () => Promise<{ quizId: string; url: string }>;
}

/**
 * AI Summary Section
 */
function SummarySection({
  summary,
  isLoading,
  onGenerate,
}: {
  summary?: string;
  isLoading?: boolean;
  onGenerate?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    toast({ title: 'Summary copied to clipboard' });
  }, [summary, toast]);

  if (isLoading) {
    return (
      <Card className="border-purple-100 bg-purple-50/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">Generating Summary...</p>
              <p className="text-xs text-purple-600">This may take a minute</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="border-dashed border-purple-200">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-purple-900 mb-1">Session Summary</p>
          <p className="text-xs text-muted-foreground mb-4">
            Generate an AI summary of the session transcript
          </p>
          <Button onClick={onGenerate} variant="outline" className="border-purple-200 text-purple-700">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayText = isExpanded ? summary : summary.slice(0, 300);
  const hasMore = summary.length > 300;

  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            AI Summary
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
              Copy
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onGenerate}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-sm text-purple-900/90 leading-relaxed whitespace-pre-wrap">
          {displayText}
          {!isExpanded && hasMore && '...'}
        </div>
        {hasMore && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto mt-2 text-purple-600"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Q&A Interface
 */
function QAInterface({
  questions,
  onAsk,
  isAsking,
}: {
  questions: AIQuestion[];
  onAsk: (question: string) => void;
  isAsking: boolean;
}) {
  const [input, setInput] = useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questions]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isAsking) return;
    onAsk(input.trim());
    setInput('');
  }, [input, isAsking, onAsk]);

  const suggestions = [
    'Summarize the key points',
    'Explain the main concepts',
    'What were the action items?',
    'Generate quiz questions',
  ];

  return (
    <div className="flex flex-col h-[350px]">
      {/* Q&A History */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-6">
              <Bot className="h-8 w-8 text-purple-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Ask the AI about this session</p>
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onAsk(s)}
                    className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full border border-purple-100 hover:bg-purple-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            questions.map((q) => (
              <div key={q.id} className="space-y-2">
                {/* Question */}
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">U</AvatarFallback>
                  </Avatar>
                  <div className="bg-accent rounded-lg px-3 py-2 text-sm max-w-[85%]">
                    {q.question}
                  </div>
                </div>

                {/* Answer */}
                <div className="flex gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-purple-100 text-purple-700">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-purple-50 text-purple-900 rounded-lg px-3 py-2 text-sm max-w-[85%]">
                    {q.isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Thinking...
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{q.answer}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question about the session..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1"
            disabled={isAsking}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isAsking}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Engagement Metrics
 */
function EngagementMetrics({ metrics }: { metrics: EngagementMetric[] }) {
  const sortedMetrics = useMemo(() => {
    return [...metrics].sort((a, b) => b.score - a.score);
  }, [metrics]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Engagement Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ScrollArea className="h-[250px]">
          <div className="space-y-3">
            {sortedMetrics.map((m) => (
              <div key={m.userId} className="p-2 rounded-lg bg-accent/30">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-6 w-6">
                    {m.avatar ? <img src={m.avatar} alt={m.name} /> : null}
                    <AvatarFallback className="text-[10px]">{m.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium flex-1 truncate">{m.name}</span>
                  <Badge variant={m.score >= 80 ? 'default' : m.score >= 50 ? 'secondary' : 'outline'} className="text-[10px]">
                    {m.score}%
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Engagement</span>
                    <span>{m.score}/100</span>
                  </div>
                  <Progress value={m.score} className="h-1.5" />
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(m.speakTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {m.messagesSent}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {m.handsRaised}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Quiz Generator
 */
function QuizGenerator({
  onGenerate,
  isGenerating,
  quizData,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
  quizData?: { quizId: string; url: string };
}) {
  const { toast } = useToast();

  const handleCopyLink = useCallback(() => {
    if (!quizData?.url) return;
    navigator.clipboard.writeText(quizData.url);
    toast({ title: 'Quiz link copied' });
  }, [quizData, toast]);

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">Generate Quiz from Transcript</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Create an interactive quiz based on the session content
            </p>

            {!quizData ? (
              <Button
                onClick={onGenerate}
                disabled={isGenerating}
                variant="outline"
                size="sm"
                className="mt-3 border-green-200 text-green-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </>
                )}
              </Button>
            ) : (
              <div className="mt-3 p-2 bg-green-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-900">Quiz ready!</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopyLink}>
                    Copy Link
                  </Button>
                  <Button variant="default" size="sm" className="h-7 text-xs" asChild>
                    <a href={quizData.url} target="_blank" rel="noopener noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AI Panel Component
 */
export function AIPanel({
  sessionId,
  isInstructor = false,
  summary,
  isSummaryLoading,
  engagementMetrics,
  onGenerateSummary,
  onAskQuestion,
  onGenerateQuiz,
}: AIPanelProps) {
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizData, setQuizData] = useState<{ quizId: string; url: string }>();
  const { toast } = useToast();

  const handleAsk = useCallback(async (question: string) => {
    const id = `q_${Date.now()}`;
    
    // Add question to list
    setQuestions(prev => [...prev, {
      id,
      question,
      answer: '',
      timestamp: new Date().toISOString(),
      isLoading: true,
    }]);
    setIsAsking(true);

    try {
      let answer: string;
      
      if (onAskQuestion) {
        answer = await onAskQuestion(question);
      } else {
        // Fallback to API
        const response = await sessionsApi.askAI(sessionId, question);
        answer = response.data.answer;
      }

      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, answer, isLoading: false } : q
      ));
    } catch (error) {
      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, answer: 'Sorry, I could not process your question.', isLoading: false } : q
      ));
      toast({
        title: 'Failed to get answer',
        variant: 'destructive',
      });
    } finally {
      setIsAsking(false);
    }
  }, [sessionId, onAskQuestion, toast]);

  const handleGenerateQuiz = useCallback(async () => {
    setIsGeneratingQuiz(true);
    try {
      let result: { quizId: string; url: string };
      
      if (onGenerateQuiz) {
        result = await onGenerateQuiz();
      } else {
        // Placeholder - would call actual API
        await new Promise(r => setTimeout(r, 2000));
        result = { quizId: 'quiz_' + Date.now(), url: `/quizzes/${Date.now()}` };
      }
      
      setQuizData(result);
      toast({ title: 'Quiz generated successfully!' });
    } catch (error) {
      toast({ title: 'Failed to generate quiz', variant: 'destructive' });
    } finally {
      setIsGeneratingQuiz(false);
    }
  }, [onGenerateQuiz, toast]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-card">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 border-b shrink-0">
          <Bot className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium">AI Assistant</span>
          <Badge variant="secondary" className="text-[10px]">GPT-4</Badge>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Summary */}
            <SummarySection
              summary={summary}
              isLoading={isSummaryLoading}
              onGenerate={onGenerateSummary}
            />

            {/* Q&A */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Ask Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <QAInterface
                  questions={questions}
                  onAsk={handleAsk}
                  isAsking={isAsking}
                />
              </CardContent>
            </Card>

            {/* Engagement Metrics (Instructor only) */}
            {isInstructor && engagementMetrics && engagementMetrics.length > 0 && (
              <EngagementMetrics metrics={engagementMetrics} />
            )}

            {/* Quiz Generator (Instructor only) */}
            {isInstructor && (
              <QuizGenerator
                onGenerate={handleGenerateQuiz}
                isGenerating={isGeneratingQuiz}
                quizData={quizData}
              />
            )}

            {/* AI Info */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/30 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                AI responses are generated based on the session transcript and course content.
                Always verify important information.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}

export default AIPanel;
