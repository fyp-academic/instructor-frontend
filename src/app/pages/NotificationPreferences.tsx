import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Monitor, BellOff, RotateCcw, Loader2, CheckCircle, Volume2 } from 'lucide-react';
import { notificationPreferencesApi } from '../services/api';

interface Preference {
  id: number;
  user_id: number;
  notification_type: string;
  channel: 'in_app' | 'email' | 'push' | 'sms';
  enabled: boolean;
  digest_mode: 'instant' | 'daily' | 'weekly';
  quiet_start: string | null;
  quiet_end: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupedPreferences {
  [key: string]: Preference[];
}

const NOTIFICATION_LABELS: Record<string, string> = {
  // Instructor - Essential
  new_submission: 'New Submission',
  submission_deadline_hit: 'Submission Deadline Hit',
  ungraded_reminder: 'Ungraded Reminder',
  student_message: 'Student Message',
  grade_dispute_filed: 'Grade Dispute Filed',
  course_approved: 'Course Approved',
  course_rejected: 'Course Rejected',
  plagiarism_alert: 'Plagiarism Alert',
  discussion_flagged: 'Discussion Flagged',
  quiz_attempts_digest: 'Quiz Attempts Digest',
  // Instructor - Medium
  student_enrolled: 'Student Enrolled',
  student_dropped: 'Student Dropped',
  low_engagement_alert: 'Low Engagement Alert',
};

const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  new_submission: 'Get notified when students submit assignments',
  submission_deadline_hit: 'Alert when assignment deadline passes',
  ungraded_reminder: 'Reminders for pending grading tasks',
  student_message: 'When students send you direct messages',
  grade_dispute_filed: 'Alerts when students dispute grades',
  course_approved: 'Course approval notifications from admin',
  course_rejected: 'Course rejection notifications from admin',
  plagiarism_alert: 'Warnings about potential plagiarism',
  discussion_flagged: 'When discussions are flagged for review',
  quiz_attempts_digest: 'Summary of quiz attempts by students',
  student_enrolled: 'Notifications when students join your course',
  student_dropped: 'Alerts when students leave your course',
  low_engagement_alert: 'Warnings about low student engagement',
};

const CHANNEL_ICONS = {
  in_app: Monitor,
  email: Mail,
  push: Smartphone,
  sms: Bell,
};

const CHANNEL_LABELS = {
  in_app: 'In-App',
  email: 'Email',
  push: 'Push',
  sms: 'SMS',
};

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<GroupedPreferences>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await notificationPreferencesApi.getPreferences();
      setPreferences(response.data.data || {});
      setGlobalMute(response.data.global_mute || false);
    } catch (e) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = (
    type: string,
    channel: 'in_app' | 'email' | 'push' | 'sms',
    enabled: boolean
  ) => {
    setPreferences((prev) => {
      const typePrefs = prev[type] || [];
      const existingIndex = typePrefs.findIndex((p) => p.channel === channel);

      let updatedTypePrefs;
      if (existingIndex >= 0) {
        updatedTypePrefs = typePrefs.map((p, i) =>
          i === existingIndex ? { ...p, enabled } : p
        );
      } else {
        updatedTypePrefs = [
          ...typePrefs,
          {
            id: Date.now(),
            user_id: 0,
            notification_type: type,
            channel,
            enabled,
            digest_mode: 'instant' as const,
            quiet_start: null,
            quiet_end: null,
            created_at: '',
            updated_at: '',
          },
        ];
      }

      return {
        ...prev,
        [type]: updatedTypePrefs,
      };
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleGlobalMute = async (muted: boolean) => {
    try {
      await notificationPreferencesApi.setGlobalMute(muted);
      setGlobalMute(muted);
    } catch (e) {
      console.error('Failed to update global mute status', e);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Array<{
        type: string;
        channel: 'in_app' | 'email' | 'push' | 'sms';
        enabled: boolean;
        digest_mode: 'instant' | 'daily' | 'weekly';
        quiet_start: string | null;
        quiet_end: string | null;
      }> = [];

      Object.entries(preferences).forEach(([type, typePrefs]) => {
        typePrefs.forEach((pref) => {
          payload.push({
            type,
            channel: pref.channel,
            enabled: pref.enabled,
            digest_mode: pref.digest_mode,
            quiet_start: pref.quiet_start,
            quiet_end: pref.quiet_end,
          });
        });
      });

      await notificationPreferencesApi.updatePreferences({ preferences: payload });
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all notification preferences to defaults?')) return;
    setLoading(true);
    try {
      await notificationPreferencesApi.resetPreferences();
      await loadPreferences();
    } catch (e) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const isEnabled = (type: string, channel: string) => {
    const typePrefs = preferences[type] || [];
    const pref = typePrefs.find((p) => p.channel === channel);
    return pref?.enabled ?? false;
  };

  // Group notification types by priority
  const essentialTypes = Object.keys(NOTIFICATION_LABELS).filter(
    (type) =>
      [
        'new_submission',
        'submission_deadline_hit',
        'ungraded_reminder',
        'student_message',
        'grade_dispute_filed',
        'course_approved',
        'course_rejected',
        'plagiarism_alert',
        'discussion_flagged',
        'quiz_attempts_digest',
      ].includes(type)
  );

  const mediumTypes = Object.keys(NOTIFICATION_LABELS).filter(
    (type) =>
      ['student_enrolled', 'student_dropped', 'low_engagement_alert'].includes(type)
  );

  const availableChannels: Array<'in_app' | 'email' | 'push'> = ['in_app', 'email', 'push'];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  const renderPreferenceCard = (type: string) => {
    const label = NOTIFICATION_LABELS[type] || type;
    const description = NOTIFICATION_DESCRIPTIONS[type] || '';
    const Icon = Bell;

    return (
      <div
        key={type}
        className="p-4 rounded-xl border transition-all hover:border-indigo-200"
        style={{
          borderColor: '#e2e8f0',
          backgroundColor: globalMute ? '#f8fafc' : 'white',
          opacity: globalMute ? 0.6 : 1,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#eef2ff' }}
          >
            <Icon size={18} color="#4f46e5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <div className="flex items-center gap-2">
                {availableChannels.map((channel) => {
                  const ChannelIcon = CHANNEL_ICONS[channel];
                  const enabled = isEnabled(type, channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => !globalMute && handleToggle(type, channel, !enabled)}
                      disabled={globalMute}
                      className="p-2 rounded-md transition-all"
                      style={{
                        backgroundColor: enabled ? '#eef2ff' : 'transparent',
                        opacity: globalMute ? 0.4 : 1,
                      }}
                      title={CHANNEL_LABELS[channel]}
                    >
                      <ChannelIcon
                        size={16}
                        color={enabled ? '#4f46e5' : '#94a3b8'}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell size={24} className="text-indigo-600" />
          Notification Preferences
        </h1>
        <p className="text-gray-600 mt-1">
          Customize how and when you receive notifications about your courses and students.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <CheckCircle size={14} />
              Saved successfully
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <RotateCcw size={16} />
          Reset to Defaults
        </button>
      </div>

      {/* Global Mute Toggle */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-6"
        style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: globalMute ? '#fee2e2' : '#f0fdf4' }}
          >
            {globalMute ? <BellOff size={18} color="#dc2626" /> : <Volume2 size={18} color="#16a34a" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {globalMute ? 'Notifications Muted' : 'Notifications Active'}
            </p>
            <p className="text-xs text-gray-500">
              {globalMute ? 'All notifications are currently disabled' : 'Choose how you want to be notified'}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!globalMute}
            onChange={(e) => handleGlobalMute(!e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {/* Channel Legend */}
      <div
        className="flex items-center gap-6 mb-6 p-3 rounded-lg"
        style={{ backgroundColor: '#f8fafc' }}
      >
        {availableChannels.map((channel) => {
          const ChannelIcon = CHANNEL_ICONS[channel];
          return (
            <div key={channel} className="flex items-center gap-2">
              <ChannelIcon size={14} color="#64748b" />
              <span className="text-xs text-gray-500">{CHANNEL_LABELS[channel]}</span>
            </div>
          );
        })}
      </div>

      {/* Essential Notifications */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Essential
          </span>
          <span className="text-sm text-gray-500">Critical alerts about your courses and students</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialTypes.map(renderPreferenceCard)}
        </div>
      </div>

      {/* Medium Priority Notifications */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Optional
          </span>
          <span className="text-sm text-gray-500">Additional activity updates</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mediumTypes.map(renderPreferenceCard)}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all"
        style={{
          background: hasChanges
            ? 'linear-gradient(135deg, #4f46e5, #6366f1)'
            : 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
          cursor: hasChanges ? 'pointer' : 'not-allowed',
        }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </span>
        ) : (
          'Save Preferences'
        )}
      </button>
    </div>
  );
}
