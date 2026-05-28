import React, { useEffect, useState } from 'react';
import { instructorAdaptationApi } from '@/app/services/api';
import { Switch } from '@/app/components/ui/switch';
import { Button } from '@/app/components/ui/button';
import { Slider } from '@/app/components/ui/slider';
import { toast } from 'sonner';
import { cn } from '@/app/components/ui/utils';
import { Shield, Lock } from 'lucide-react';

interface AdaptationSettingsPanelProps {
  courseId: string;
  topicId: string;
}

export const AdaptationSettingsPanel: React.FC<AdaptationSettingsPanelProps> = ({ courseId, topicId }) => {
  const [settings, setSettings] = useState({
    allow_simplification: true,
    allow_example_substitution: true,
    allow_analogies: true,
    lock_technical_definitions: true,
    prevent_assessment_rewrite: true,
    min_difficulty: 1,
    max_difficulty: 5,
    ai_confidence_threshold: 0.75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await instructorAdaptationApi.getSettings(courseId, topicId);
        const data = res.data?.data ?? res.data;
        if (data) {
          setSettings({
            allow_simplification: data.allow_simplification ?? true,
            allow_example_substitution: data.allow_example_substitution ?? true,
            allow_analogies: data.allow_analogies ?? true,
            lock_technical_definitions: data.lock_technical_definitions ?? true,
            prevent_assessment_rewrite: data.prevent_assessment_rewrite ?? true,
            min_difficulty: data.min_difficulty ?? 1,
            max_difficulty: data.max_difficulty ?? 5,
            ai_confidence_threshold: data.ai_confidence_threshold ?? 0.75,
          });
        }
      } catch {
        // Default settings already set
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, topicId]);

  const updateField = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await instructorAdaptationApi.updateSettings(courseId, topicId, settings);
      toast.success('Settings saved successfully.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const toggleRows = [
    {
      key: 'allow_simplification',
      label: 'Allow Simplification',
      locked: false,
    },
    {
      key: 'allow_example_substitution',
      label: 'Allow Example Substitution',
      locked: false,
    },
    {
      key: 'allow_analogies',
      label: 'Allow Analogies',
      locked: false,
    },
    {
      key: 'lock_technical_definitions',
      label: 'Lock Technical Definitions',
      locked: false,
      note: 'Protects academic integrity by keeping definitions exact',
    },
    {
      key: 'prevent_assessment_rewrite',
      label: 'Prevent Assessment Rewriting',
      locked: true,
      note: 'Always locked — assessments are never rewritten',
    },
  ] as { key: keyof typeof settings; label: string; locked: boolean; note?: string }[];

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border bg-card p-4">
        <div className="h-4 w-1/3 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">AI Adaptation Controls</h2>

      {/* Toggles */}
      <div className="space-y-3">
        {toggleRows.map((row) => (
          <div
            key={row.key}
            className={cn(
              'flex items-center justify-between rounded-lg border p-3',
              row.locked ? 'bg-muted/40 opacity-80' : 'bg-transparent'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{row.label}</span>
              {row.note && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  {row.locked ? <Lock className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                  {row.note}
                </span>
              )}
            </div>
            <Switch
              checked={!!settings[row.key]}
              onCheckedChange={(v) => !row.locked && updateField(row.key, v)}
              disabled={row.locked}
            />
          </div>
        ))}
      </div>

      {/* Difficulty Range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Difficulty Range</label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-1 text-xs text-muted-foreground">Min Depth</div>
            <input
              type="number"
              min={1}
              max={5}
              value={settings.min_difficulty}
              onChange={(e) => updateField('min_difficulty', Math.min(5, Math.max(1, Number(e.target.value))))}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="flex-1">
            <div className="mb-1 text-xs text-muted-foreground">Max Depth</div>
            <input
              type="number"
              min={1}
              max={5}
              value={settings.max_difficulty}
              onChange={(e) => updateField('max_difficulty', Math.min(5, Math.max(1, Number(e.target.value))))}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {/* AI Confidence Threshold */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          AI Confidence Threshold: {settings.ai_confidence_threshold.toFixed(2)}
        </label>
        <Slider
          value={[settings.ai_confidence_threshold]}
          onValueChange={([v]: number[]) => updateField('ai_confidence_threshold', v)}
          min={0.5}
          max={1.0}
          step={0.05}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Below this score, students see the original content.
        </p>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
