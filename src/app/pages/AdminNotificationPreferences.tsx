import { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Smartphone, Monitor, BellOff, RotateCcw, Loader2, CheckCircle, Volume2, Shield } from 'lucide-react';
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
  // Admin - Essential
  course_pending_review: 'Course Pending Review',
  system_error_job_fail: 'System Error / Job Fail',
  storage_threshold_hit: 'Storage Threshold Hit',
  user_reported: 'User Reported',
  high_server_load: 'High Server Load',
  new_support_ticket: 'New Support Ticket',
  bulk_enrollment_done: 'Bulk Enrollment Done',
  // Admin - Medium
  new_user_registered: 'New User Registered',
  audit_log_event: 'Audit Log Event',
  scheduled_maintenance: 'Scheduled Maintenance',
};

const NOTIFICATION_DESCRIPTIONS: Record<string, string> = {
  course_pending_review: 'When instructors submit courses for approval',
  system_error_job_fail: 'Critical system errors and failed background jobs',
  storage_threshold_hit: 'Alerts when storage usage exceeds limits',
  user_reported: 'When users are reported for violations',
  high_server_load: 'Server performance warnings',
  new_support_ticket: 'New support requests from users',
  bulk_enrollment_done: 'Completion of bulk enrollment operations',
  new_user_registered: 'When new users join the platform',
  audit_log_event: 'Important security and audit events',
  scheduled_maintenance: 'Upcoming system maintenance notifications',
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

export default function AdminNotificationPreferences() {
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
        'course_pending_review',
        'system_error_job_fail',
        'storage_threshold_hit',
        'user_reported',
        'high_server_load',
        'new_support_ticket',
        'bulk_enrollment_done',
      ].includes(type)
  );

  const mediumTypes = Object.keys(NOTIFICATION_LABELS).filter(
    (type) =>
      ['new_user_registered', 'audit_log_event', 'scheduled_maintenance'].includes(type)
  );

  const availableChannels: Array<'in_app' | 'email' | 'push' | 'sms'> = ['in_app', 'email', 'push', 'sms'];

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
    const Icon = type.includes('system') || type.includes('server') || type.includes('storage') ? Shield : Bell;

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
            style={{ backgroundColor: type.includes('system') || type.includes('server') ? '#fef3c7' : '#eef2ff' }}
          >
            <Icon size={18} color={type.includes('system') || type.includes('server') ? '#d97706' : '#4f46e5'} />
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
        <div className="flex items-center gap-2">
          <Shield size={28} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Notification Preferences
          </h1>
        </div>
        <p className="text-gray-600 mt-1">
          Configure how you receive critical system and administrative notifications.
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
              {globalMute ? 'All admin notifications are currently disabled' : 'Choose how you want to be notified'}
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
        className="flex items-center gap-6 mb-6 p-3 rounded-lg flex-wrap"
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Critical
          </span>
          <span className="text-sm text-gray-500">System-critical alerts requiring immediate attention</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {essentialTypes.map(renderPreferenceCard)}
        </div>
      </div>

      {/* Medium Priority Notifications */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Informational
          </span>
          <span className="text-sm text-gray-500">General system activity updates</span>
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
