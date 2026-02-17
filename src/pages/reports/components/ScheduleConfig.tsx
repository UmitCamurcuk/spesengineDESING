import React from 'react';
import type { ReportSchedule } from '../../../types';

interface Props {
  schedule: ReportSchedule | null;
  onChange: (schedule: ReportSchedule | null) => void;
}

const DEFAULT_SCHEDULE: ReportSchedule = {
  isEnabled: false,
  cronExpression: '0 9 * * 1',
  recipients: [],
  format: 'csv',
};

const PRESET_CRONS = [
  { label: 'Her gün 09:00', value: '0 9 * * *' },
  { label: 'Her Pazartesi 09:00', value: '0 9 * * 1' },
  { label: 'Her ayın 1\'i 09:00', value: '0 9 1 * *' },
];

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export const ScheduleConfig: React.FC<Props> = ({ schedule, onChange }) => {
  const sch = schedule ?? DEFAULT_SCHEDULE;

  const update = (patch: Partial<ReportSchedule>) => {
    onChange({ ...sch, ...patch });
  };

  const toggleEnabled = (enabled: boolean) => {
    if (enabled) {
      onChange({ ...DEFAULT_SCHEDULE, isEnabled: true });
    } else {
      onChange(null);
    }
  };

  const isEnabled = schedule !== null && schedule.isEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => toggleEnabled(!isEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
        <label className="text-sm font-medium text-foreground">
          Zamanlamayı Etkinleştir
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-3 pl-2 border-l-2 border-primary/30">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Zamanlama</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_CRONS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => update({ cronExpression: preset.value })}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    sch.cronExpression === preset.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={sch.cronExpression}
              onChange={(e) => update({ cronExpression: e.target.value })}
              placeholder="0 9 * * 1"
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Dışa Aktarma Formatı</label>
            <div className="flex gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update({ format: opt.value as ReportSchedule['format'] })}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    sch.format === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
