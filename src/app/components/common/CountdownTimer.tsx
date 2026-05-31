import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface TimeStatus {
  status: 'scheduled' | 'active' | 'closed';
  time_remaining_seconds: number | null;
  can_attempt?: boolean;
  can_join?: boolean;
  reason?: string;
}

interface CountdownTimerProps {
  timeStatus: TimeStatus;
  type: 'quiz' | 'session';
  showBadge?: boolean;
  showCountdown?: boolean;
  variant?: 'inline' | 'block';
}

/**
 * CountdownTimer Component
 * Displays countdown timers and time lock status for quizzes and sessions
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  timeStatus,
  type,
  showBadge = true,
  showCountdown = true,
  variant = 'inline',
}) => {
  const [displayTime, setDisplayTime] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number | null>(timeStatus.time_remaining_seconds);

  useEffect(() => {
    if (!timeLeft) return;

    const updateDisplay = () => {
      const current = Math.max(0, timeLeft - 1);
      setTimeLeft(current);
      setDisplayTime(formatTime(current));
    };

    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  useEffect(() => {
    setDisplayTime(formatTime(timeStatus.time_remaining_seconds || 0));
  }, [timeStatus.time_remaining_seconds]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds === 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getMessage = (): { text: string; type: 'info' | 'warning' | 'error' | 'success' } => {
    if (timeStatus.status === 'scheduled') {
      const typeLabel = type === 'quiz' ? 'Quiz' : 'Session';
      const timeText = displayTime ? ` in ${displayTime}` : '';
      return {
        text: `${typeLabel} starts${timeText}`,
        type: 'warning',
      };
    }

    if (timeStatus.status === 'closed') {
      const typeLabel = type === 'quiz' ? 'Quiz' : 'Session';
      return {
        text: `${typeLabel} has ended`,
        type: 'error',
      };
    }

    if (timeStatus.time_remaining_seconds && timeStatus.time_remaining_seconds > 0) {
      return {
        text: `${displayTime} remaining`,
        type: 'info',
      };
    }

    return {
      text: 'Active',
      type: 'success',
    };
  };

  const getIcon = () => {
    switch (timeStatus.status) {
      case 'scheduled':
        return <AlertCircle className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      case 'active':
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-800';
    }
  };

  const message = getMessage();

  if (!showBadge && !showCountdown) return null;

  if (variant === 'block') {
    return (
      <div className={`p-3 rounded-lg ${getColor(message.type)}`}>
        <div className="flex items-center gap-2 mb-1">
          {getIcon()}
          <span className="font-medium">{message.text}</span>
        </div>
        {timeStatus.reason === 'not_started' && (
          <p className="text-sm ml-6">Please wait until the start time to begin.</p>
        )}
        {timeStatus.reason === 'closed' && (
          <p className="text-sm ml-6">The submission window has closed.</p>
        )}
      </div>
    );
  }

  // inline variant (badge)
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getColor(message.type)}`}>
      {getIcon()}
      <span>{message.text}</span>
    </div>
  );
};

/**
 * TimeLockedOverlay Component
 * Shows why an activity is locked (for button disabled states)
 */
interface TimeLockedOverlayProps {
  timeStatus: TimeStatus;
  type: 'quiz' | 'session';
}

export const TimeLockReason: React.FC<TimeLockedOverlayProps> = ({ timeStatus, type }) => {
  if (timeStatus.can_attempt !== false && timeStatus.can_join !== false) {
    return null;
  }

  const typeLabel = type === 'quiz' ? 'Quiz' : 'Session';

  if (timeStatus.reason === 'not_started') {
    return (
      <div className="text-sm text-gray-600 mt-2">
        <AlertCircle className="w-4 h-4 inline mr-1" />
        {typeLabel} has not started yet. Please try again after {timeStatus.time_remaining_seconds ? `${Math.floor(timeStatus.time_remaining_seconds / 60)} minutes` : 'the scheduled time'}.
      </div>
    );
  }

  if (timeStatus.reason === 'closed') {
    return (
      <div className="text-sm text-gray-600 mt-2">
        <XCircle className="w-4 h-4 inline mr-1" />
        The {type} submission window has closed. No further submissions are allowed.
      </div>
    );
  }

  return null;
};

export default CountdownTimer;
