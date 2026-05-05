import React, { useState, useCallback } from 'react';
import {
  BarChart3,
  Plus,
  X,
  Check,
  Loader2,
  Users,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { sessionsApi } from '../../services/api';

interface Poll {
  id: string;
  question: string;
  options: string[];
  isMultipleChoice: boolean;
  isActive: boolean;
}

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  role: 'instructor' | 'student';
  existingPolls: Poll[];
  onPollCreated?: (poll: Poll) => void;
  onVoteSubmitted?: (pollId: string, optionIndex: number) => void;
}

/**
 * Instructor Poll Creation
 */
function CreatePollForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: { question: string; options: string[]; isMultipleChoice: boolean }) => void;
  isSubmitting: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some(o => !o.trim())) return;
    onSubmit({ question, options, isMultipleChoice });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="poll-question">Question</Label>
        <Input
          id="poll-question"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mt-1"
        />
      </div>

      <div className="space-y-2">
        <Label>Options</Label>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Option ${index + 1}`}
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
            />
            {options.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeOption(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={options.length >= 10}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Option
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="multiple-choice">Allow multiple choices</Label>
        <Switch
          id="multiple-choice"
          checked={isMultipleChoice}
          onCheckedChange={setIsMultipleChoice}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!question.trim() || options.some(o => !o.trim()) || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <BarChart3 className="h-4 w-4 mr-2" />
            Create Poll
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * Student Voting Form
 */
function VoteForm({
  poll,
  onVote,
  hasVoted,
  isSubmitting,
}: {
  poll: Poll;
  onVote: (optionIndex: number) => void;
  hasVoted: boolean;
  isSubmitting: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([]);

  const toggleOption = (index: number) => {
    if (poll.isMultipleChoice) {
      setSelected(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setSelected([index]);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onVote(selected[0]); // For single choice, send first selected
    }
  };

  if (hasVoted) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-medium">Vote submitted!</p>
        <p className="text-sm text-muted-foreground">Waiting for results...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-medium">{poll.question}</p>
      <div className="space-y-2">
        {poll.options.map((option, index) => (
          <button
            key={index}
            onClick={() => toggleOption(index)}
            className={cn(
              'w-full p-3 rounded-lg border text-left transition-colors',
              selected.includes(index)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                selected.includes(index) ? 'border-primary' : 'border-muted'
              )}>
                {selected.includes(index) && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <span>{option}</span>
            </div>
          </button>
        ))}
      </div>
      <Button
        onClick={handleSubmit}
        disabled={selected.length === 0 || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          'Submit Vote'
        )}
      </Button>
    </div>
  );
}

/**
 * Poll Modal Component
 */
export function PollModal({
  isOpen,
  onClose,
  sessionId,
  role,
  existingPolls,
  onPollCreated,
  onVoteSubmitted,
}: PollModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'vote'>('create');

  const handleCreate = useCallback(async (data: { question: string; options: string[]; isMultipleChoice: boolean }) => {
    setIsSubmitting(true);
    try {
      const res = await sessionsApi.createPoll(sessionId, {
        question: data.question,
        options: data.options,
        is_multiple_choice: data.isMultipleChoice,
      });
      onPollCreated?.(res.data);
      onClose();
    } catch (error) {
      console.error('Failed to create poll:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, onPollCreated, onClose]);

  const handleVote = useCallback(async (pollId: string, optionIndex: number) => {
    setIsSubmitting(true);
    try {
      // Would use pollsApi here
      onVoteSubmitted?.(pollId, optionIndex);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onVoteSubmitted]);

  const activePoll = existingPolls.find(p => p.isActive);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {role === 'instructor' ? 'Create Poll' : 'Active Polls'}
          </DialogTitle>
        </DialogHeader>

        {role === 'instructor' ? (
          <CreatePollForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
        ) : activePoll ? (
          <VoteForm
            poll={activePoll}
            onVote={(idx) => handleVote(activePoll.id, idx)}
            hasVoted={false}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active polls</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PollModal;
