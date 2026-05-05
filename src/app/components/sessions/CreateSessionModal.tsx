import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Lock,
  Mic,
  MessageSquare,
  Hand,
  Monitor,
  Video,
  VolumeX,
  Bot,
  Shield,
  DoorOpen,
  Save,
  AlertCircle,
  Check,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';

interface Course {
  id: string;
  name: string;
  color?: string;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => Promise<void>;
  courses: Course[];
  defaultCourseId?: string;
}

export interface SessionFormData {
  title: string;
  courseId: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  maxParticipants: number;
  password?: string;
  description?: string;
  
  // Toggles
  recordingEnabled: boolean;
  chatEnabled: boolean;
  raiseHandEnabled: boolean;
  waitingRoom: boolean;
  screenShareAllowed: boolean;
  startMuted: boolean;
  startVideoOff: boolean;
  aiTranscription: boolean;
  lobbyEnabled: boolean;
}

interface FormError {
  field: string;
  message: string;
}

const defaultFormData: SessionFormData = {
  title: '',
  courseId: '',
  scheduledDate: '',
  scheduledTime: '',
  duration: 60,
  maxParticipants: 50,
  password: '',
  description: '',
  recordingEnabled: true,
  chatEnabled: true,
  raiseHandEnabled: true,
  waitingRoom: false,
  screenShareAllowed: true,
  startMuted: false,
  startVideoOff: false,
  aiTranscription: false,
  lobbyEnabled: false,
};

/**
 * Toggle Item Component
 */
function ToggleItem({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={cn(
          'p-2 rounded-md',
          checked ? 'bg-primary/10 text-primary' : 'bg-accent text-muted-foreground'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Create Session Modal
 */
export function CreateSessionModal({
  isOpen,
  onClose,
  onSubmit,
  courses,
  defaultCourseId,
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState<SessionFormData>(defaultFormData);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Set default course when modal opens
  useEffect(() => {
    if (isOpen && defaultCourseId) {
      setFormData(prev => ({ ...prev, courseId: defaultCourseId }));
    }
  }, [isOpen, defaultCourseId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormData);
      setErrors([]);
    }
  }, [isOpen]);

  const updateField = useCallback(<K extends keyof SessionFormData>(
    field: K,
    value: SessionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormError[] = [];

    // Required fields
    if (!formData.title.trim()) {
      newErrors.push({ field: 'title', message: 'Title is required' });
    }
    if (!formData.courseId) {
      newErrors.push({ field: 'courseId', message: 'Please select a course' });
    }
    if (!formData.scheduledDate) {
      newErrors.push({ field: 'scheduledDate', message: 'Date is required' });
    }
    if (!formData.scheduledTime) {
      newErrors.push({ field: 'scheduledTime', message: 'Time is required' });
    }

    // Future date validation
    if (formData.scheduledDate && formData.scheduledTime) {
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        newErrors.push({ field: 'scheduledDate', message: 'Session must be scheduled in the future' });
      }
    }

    // Min participants
    if (formData.maxParticipants < 2) {
      newErrors.push({ field: 'maxParticipants', message: 'Minimum 2 participants required' });
    }

    // Duration validation
    if (formData.duration < 15) {
      newErrors.push({ field: 'duration', message: 'Minimum duration is 15 minutes' });
    }
    if (formData.duration > 480) {
      newErrors.push({ field: 'duration', message: 'Maximum duration is 8 hours' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast({
        title: 'Please fix the errors',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast({ title: 'Session created successfully!' });
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to create session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validate, onSubmit, formData, onClose, toast]);

  const getError = useCallback((field: string): string | undefined => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Create New Session
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Basic Information</h4>
              
              <div className="space-y-2">
                <Label htmlFor="title">
                  Session Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Introduction to Machine Learning - Week 3"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className={cn(getError('title') && 'border-red-500')}
                />
                {getError('title') && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getError('title')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.courseId}
                  onValueChange={(v) => updateField('courseId', v)}
                >
                  <SelectTrigger className={cn(getError('courseId') && 'border-red-500')}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        <div className="flex items-center gap-2">
                          {course.color && (
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                          )}
                          {course.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getError('courseId') && (
                  <p className="text-xs text-red-500">{getError('courseId')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What will be covered in this session?"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Schedule</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => updateField('scheduledDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={cn(getError('scheduledDate') && 'border-red-500')}
                  />
                  {getError('scheduledDate') && (
                    <p className="text-xs text-red-500">{getError('scheduledDate')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => updateField('scheduledTime', e.target.value)}
                    className={cn(getError('scheduledTime') && 'border-red-500')}
                  />
                  {getError('scheduledTime') && (
                    <p className="text-xs text-red-500">{getError('scheduledTime')}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      min={15}
                      max={480}
                      value={formData.duration}
                      onChange={(e) => updateField('duration', parseInt(e.target.value) || 60)}
                      className={cn(getError('duration') && 'border-red-500')}
                    />
                  </div>
                  {getError('duration') && (
                    <p className="text-xs text-red-500">{getError('duration')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">
                    Max Participants <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="maxParticipants"
                      type="number"
                      min={2}
                      max={500}
                      value={formData.maxParticipants}
                      onChange={(e) => updateField('maxParticipants', parseInt(e.target.value) || 50)}
                      className={cn(getError('maxParticipants') && 'border-red-500')}
                    />
                  </div>
                  {getError('maxParticipants') && (
                    <p className="text-xs text-red-500">{getError('maxParticipants')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Security</h4>
              
              <div className="space-y-2">
                <Label htmlFor="password">Session Password (Optional)</Label>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Leave empty for no password"
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Features</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ToggleItem
                  icon={Mic}
                  label="Record Session"
                  description="Save session for later viewing"
                  checked={formData.recordingEnabled}
                  onChange={(v) => updateField('recordingEnabled', v)}
                />

                <ToggleItem
                  icon={MessageSquare}
                  label="Chat Enabled"
                  description="Allow participants to chat"
                  checked={formData.chatEnabled}
                  onChange={(v) => updateField('chatEnabled', v)}
                />

                <ToggleItem
                  icon={Hand}
                  label="Raise Hand"
                  description="Participants can raise hand"
                  checked={formData.raiseHandEnabled}
                  onChange={(v) => updateField('raiseHandEnabled', v)}
                />

                <ToggleItem
                  icon={DoorOpen}
                  label="Waiting Room"
                  description="Admit participants manually"
                  checked={formData.waitingRoom}
                  onChange={(v) => updateField('waitingRoom', v)}
                />

                <ToggleItem
                  icon={Monitor}
                  label="Screen Share"
                  description="Allow screen sharing"
                  checked={formData.screenShareAllowed}
                  onChange={(v) => updateField('screenShareAllowed', v)}
                />

                <ToggleItem
                  icon={VolumeX}
                  label="Start Muted"
                  description="Participants join muted"
                  checked={formData.startMuted}
                  onChange={(v) => updateField('startMuted', v)}
                />

                <ToggleItem
                  icon={Video}
                  label="Start Video Off"
                  description="Participants join with video off"
                  checked={formData.startVideoOff}
                  onChange={(v) => updateField('startVideoOff', v)}
                />

                <ToggleItem
                  icon={Bot}
                  label="AI Transcription"
                  description="Auto-transcribe with Whisper"
                  checked={formData.aiTranscription}
                  onChange={(v) => updateField('aiTranscription', v)}
                />

                <ToggleItem
                  icon={Shield}
                  label="Lobby Enabled"
                  description="Review participants before entry"
                  checked={formData.lobbyEnabled}
                  onChange={(v) => updateField('lobbyEnabled', v)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateSessionModal;
