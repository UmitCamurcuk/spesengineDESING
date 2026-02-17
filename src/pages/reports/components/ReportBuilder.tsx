import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type {
  Report,
  ReportColumn,
  ReportFilter,
  ReportJoin,
  ReportVisualization,
  ReportVisibility,
  ReportSchedule,
  ReportMetaItemType,
  ReportMetaAttribute,
  ReportMetaAssociation,
} from '../../../types';
import { reportsService } from '../../../api/services/reports.service';
import { ColumnSelector } from './ColumnSelector';
import { FilterBuilder } from './FilterBuilder';
import { JoinConfigurator } from './JoinConfigurator';
import { ScheduleConfig } from './ScheduleConfig';
import type { ReportCreatePayload, ReportUpdatePayload } from '../../../api/services/reports.service';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailableField {
  alias: string;
  aliasLabel: string;
  attributeId: string;
  attributeCode: string;
  attributeLabel: string;
  type?: string;
}

interface BuilderState {
  name: string;
  description: string;
  primaryItemTypeId: string;
  joins: ReportJoin[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: { alias: string; attributeCode: string; direction: 'asc' | 'desc' } | null;
  visualization: ReportVisualization;
  chartConfig: { xAxis?: string; yAxis?: string; colorField?: string };
  visibility: ReportVisibility;
  allowedRoles: string[];
  allowedUsers: string[];
  isTemplate: boolean;
  schedule: ReportSchedule | null;
}

const STEPS = [
  { key: 'datasource', label: 'Veri Kaynağı' },
  { key: 'columns', label: 'Kolonlar' },
  { key: 'filters', label: 'Filtreler' },
  { key: 'visualization', label: 'Görünüm' },
  { key: 'settings', label: 'Ayarlar' },
] as const;

type StepKey = typeof STEPS[number]['key'];

const VIZ_OPTIONS: { value: ReportVisualization; label: string }[] = [
  { value: 'table', label: 'Tablo' },
  { value: 'bar', label: 'Çubuk Grafik' },
  { value: 'pie', label: 'Pasta Grafik' },
  { value: 'line', label: 'Çizgi Grafik' },
  { value: 'number', label: 'Sayı' },
];

const VISIBILITY_OPTIONS: { value: ReportVisibility; label: string }[] = [
  { value: 'private', label: 'Özel (Yalnızca Ben)' },
  { value: 'roles', label: 'Rollere Göre' },
  { value: 'all', label: 'Herkese Açık' },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type Props =
  | { mode: 'create'; report?: undefined; onSave: (payload: ReportCreatePayload) => Promise<void> }
  | { mode: 'edit'; report: Report; onSave: (payload: ReportUpdatePayload) => Promise<void> };

// ─── Component ────────────────────────────────────────────────────────────────

export const ReportBuilder: React.FC<Props> = ({ mode, report, onSave }) => {
  const [step, setStep] = useState<StepKey>('datasource');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Meta data
  const [itemTypes, setItemTypes] = useState<ReportMetaItemType[]>([]);
  const [attributes, setAttributes] = useState<ReportMetaAttribute[]>([]);
  const [associations, setAssociations] = useState<ReportMetaAssociation[]>([]);
  const [metaLoading, setMetaLoading] = useState(false);

  const [state, setState] = useState<BuilderState>(() => {
    if (report) {
      return {
        name: report.name,
        description: report.description ?? '',
        primaryItemTypeId: report.primaryItemTypeId,
        joins: report.joins,
        columns: report.columns,
        filters: report.filters,
        groupBy: report.groupBy,
        sortBy: report.sortBy,
        visualization: report.visualization,
        chartConfig: report.chartConfig,
        visibility: report.visibility,
        allowedRoles: report.allowedRoles,
        allowedUsers: report.allowedUsers,
        isTemplate: report.isTemplate,
        schedule: report.schedule,
      };
    }
    return {
      name: '',
      description: '',
      primaryItemTypeId: '',
      joins: [],
      columns: [],
      filters: [],
      groupBy: [],
      sortBy: null,
      visualization: 'table',
      chartConfig: {},
      visibility: 'private',
      allowedRoles: [],
      allowedUsers: [],
      isTemplate: false,
      schedule: null,
    };
  });

  // Load item types
  useEffect(() => {
    reportsService.getMetaItemTypes().then(setItemTypes).catch(console.error);
  }, []);

  // Load attributes + associations when primaryItemTypeId changes
  useEffect(() => {
    if (!state.primaryItemTypeId) {
      setAttributes([]);
      setAssociations([]);
      return;
    }
    setMetaLoading(true);
    Promise.all([
      reportsService.getMetaAttributes(state.primaryItemTypeId),
      reportsService.getMetaAssociations(state.primaryItemTypeId),
    ])
      .then(([attrs, assocs]) => {
        setAttributes(attrs);
        setAssociations(assocs);
      })
      .catch(console.error)
      .finally(() => setMetaLoading(false));
  }, [state.primaryItemTypeId]);

  const update = <K extends keyof BuilderState>(key: K, value: BuilderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  // Build available fields for columns/filters: primary + each join
  const buildAvailableFields = (): AvailableField[] => {
    const primaryTypeName = itemTypes.find((it) => it.id === state.primaryItemTypeId)?.name ?? 'Primary';
    const primaryFields: AvailableField[] = attributes.map((attr) => ({
      alias: 'primary',
      aliasLabel: primaryTypeName,
      attributeId: attr.id,
      attributeCode: attr.code,
      attributeLabel: attr.label,
      type: attr.type,
    }));

    const joinFields: AvailableField[] = state.joins.flatMap((join) => {
      return attributes.map((attr) => ({
        alias: join.alias,
        aliasLabel: join.targetItemTypeName,
        attributeId: attr.id,
        attributeCode: attr.code,
        attributeLabel: attr.label,
        type: attr.type,
      }));
    });

    return [...primaryFields, ...joinFields];
  };

  const availableFields = buildAvailableFields();
  const columnKeys = state.columns.map((c) => `${c.alias}__${c.attributeCode}`);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const payload: ReportCreatePayload = {
        name: state.name,
        description: state.description || undefined,
        primaryItemTypeId: state.primaryItemTypeId,
        joins: state.joins,
        columns: state.columns,
        filters: state.filters,
        groupBy: state.groupBy,
        sortBy: state.sortBy,
        visualization: state.visualization,
        chartConfig: state.chartConfig,
        visibility: state.visibility,
        allowedRoles: state.allowedRoles,
        allowedUsers: state.allowedUsers,
        isTemplate: state.isTemplate,
        schedule: state.schedule,
      };
      await onSave(payload as any);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error?.message ?? 'Rapor kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  const goNext = () => {
    const next = STEPS[currentStepIndex + 1];
    if (next) setStep(next.key);
  };
  const goPrev = () => {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev.key);
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, index) => {
          const isDone = index < currentStepIndex;
          const isActive = s.key === step;
          return (
            <React.Fragment key={s.key}>
              <button
                onClick={() => setStep(s.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'text-primary hover:bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs border ${
                  isDone ? 'bg-primary border-primary text-primary-foreground' : isActive ? 'border-primary-foreground text-primary-foreground' : 'border-muted-foreground'
                }`}>
                  {isDone ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {s.label}
              </button>
              {index < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-border mx-1 max-w-8" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="border border-border rounded-lg p-6 min-h-[300px]">
        {/* Step 1: Data source */}
        {step === 'datasource' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ana Veri Kaynağı *</label>
              <select
                value={state.primaryItemTypeId}
                onChange={(e) => {
                  update('primaryItemTypeId', e.target.value);
                  update('joins', []);
                  update('columns', []);
                  update('filters', []);
                }}
                className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">İtem tipi seçin...</option>
                {itemTypes.map((it) => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
            </div>

            {state.primaryItemTypeId && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  İlişkiler (Opsiyonel)
                </label>
                {metaLoading ? (
                  <div className="text-sm text-muted-foreground">Yükleniyor...</div>
                ) : (
                  <JoinConfigurator
                    primaryItemTypeId={state.primaryItemTypeId}
                    itemTypes={itemTypes}
                    associations={associations}
                    joins={state.joins}
                    onChange={(joins) => update('joins', joins)}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Columns */}
        {step === 'columns' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Rapora dahil etmek istediğiniz alanları seçin.</p>
            {metaLoading ? (
              <div className="text-sm text-muted-foreground">Yükleniyor...</div>
            ) : (
              <ColumnSelector
                availableFields={availableFields}
                columns={state.columns}
                onChange={(columns) => update('columns', columns)}
              />
            )}
          </div>
        )}

        {/* Step 3: Filters */}
        {step === 'filters' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Verileri filtrelemek için koşullar ekleyin.</p>
            <FilterBuilder
              availableFields={availableFields}
              filters={state.filters}
              onChange={(filters) => update('filters', filters)}
            />
          </div>
        )}

        {/* Step 4: Visualization */}
        {step === 'visualization' && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Görünüm Tipi</label>
              <div className="flex flex-wrap gap-2">
                {VIZ_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('visualization', opt.value)}
                    className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                      state.visualization === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {['bar', 'line', 'pie'].includes(state.visualization) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">X Ekseni</label>
                  <select
                    value={state.chartConfig.xAxis ?? ''}
                    onChange={(e) => update('chartConfig', { ...state.chartConfig, xAxis: e.target.value || undefined })}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none"
                  >
                    <option value="">Seçin...</option>
                    {state.columns.map((col) => (
                      <option key={col.id} value={`${col.alias}__${col.attributeCode}`}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Y Ekseni / Değer</label>
                  <select
                    value={state.chartConfig.yAxis ?? ''}
                    onChange={(e) => update('chartConfig', { ...state.chartConfig, yAxis: e.target.value || undefined })}
                    className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none"
                  >
                    <option value="">Seçin...</option>
                    {state.columns.map((col) => (
                      <option key={col.id} value={`${col.alias}__${col.attributeCode}`}>{col.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {state.visualization === 'number' && state.columns.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Gösterilecek Alan</label>
                <select
                  value={state.chartConfig.yAxis ?? ''}
                  onChange={(e) => update('chartConfig', { ...state.chartConfig, yAxis: e.target.value || undefined })}
                  className="w-full max-w-sm px-3 py-2 text-sm border border-border rounded bg-background text-foreground focus:outline-none"
                >
                  <option value="">Seçin...</option>
                  {state.columns.map((col) => (
                    <option key={col.id} value={`${col.alias}__${col.attributeCode}`}>{col.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Settings */}
        {step === 'settings' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Rapor Adı *</label>
                <input
                  type="text"
                  value={state.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Rapor adını girin..."
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Açıklama</label>
                <input
                  type="text"
                  value={state.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Opsiyonel açıklama..."
                  className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Görünürlük</label>
              <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update('visibility', opt.value)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      state.visibility === opt.value
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={state.isTemplate}
                onClick={() => update('isTemplate', !state.isTemplate)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  state.isTemplate ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${state.isTemplate ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <label className="text-sm font-medium text-foreground">Şablon Olarak Kaydet</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Zamanlama</label>
              <ScheduleConfig
                schedule={state.schedule}
                onChange={(schedule) => update('schedule', schedule)}
              />
            </div>
          </div>
        )}
      </div>

      {saveError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{saveError}</div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentStepIndex === 0}
          onClick={goPrev}
        >
          Geri
        </Button>

        <div className="flex gap-2">
          {currentStepIndex < STEPS.length - 1 ? (
            <Button
              onClick={goNext}
              disabled={step === 'datasource' && !state.primaryItemTypeId}
            >
              İleri
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving || !state.name || !state.primaryItemTypeId}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
