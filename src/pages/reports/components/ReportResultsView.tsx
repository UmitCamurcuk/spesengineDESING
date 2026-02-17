import React, { useState } from 'react';
import { Play, Download } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer,
} from 'recharts';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import type { Report, ReportExecution, ReportFilter } from '../../../types';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

interface Props {
  report: Report;
  execution: ReportExecution | null;
  executing: boolean;
  onExecute: (runtimeFilters?: ReportFilter[]) => void;
}

export const ReportResultsView: React.FC<Props> = ({ report, execution, executing, onExecute }) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const result = execution?.result;
  const rows = result?.rows ?? [];
  const columns = result?.columns ?? [];

  const handleExportCSV = () => {
    if (!result) return;
    const header = columns.map((c) => c.label).join(',');
    const body = rows.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        const str = val === null || val === undefined ? '' : String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    ).join('\n');
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tableColumns = columns.map((col) => ({
    key: col.key,
    title: col.label,
    render: (val: unknown) => (
      <span className="text-sm">{val === null || val === undefined ? '—' : String(val)}</span>
    ),
  }));

  const renderChart = () => {
    if (!result || rows.length === 0 || columns.length === 0) return null;
    const { chartConfig, visualization } = report;
    const xKey = chartConfig?.xAxis || columns[0]?.key;
    const yKey = chartConfig?.yAxis || columns[1]?.key;

    if (visualization === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill={CHART_COLORS[0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (visualization === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie data={rows} dataKey={yKey ?? columns[0]?.key} nameKey={xKey} cx="50%" cy="50%" outerRadius={120} label>
              {rows.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (visualization === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={yKey} stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (visualization === 'number' && rows.length > 0 && yKey) {
      const val = rows[0][yKey];
      return (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary">{val !== null && val !== undefined ? String(val) : '—'}</div>
            <div className="text-muted-foreground mt-2">{columns.find((c) => c.key === yKey)?.label}</div>
          </div>
        </div>
      );
    }

    return null;
  };

  const showChartToggle = ['bar', 'pie', 'line', 'number'].includes(report.visualization);

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {result && (
            <>
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{result.rowCount}</span> kayıt
              </span>
              {execution?.durationMs !== undefined && (
                <span className="text-sm text-muted-foreground">{execution.durationMs}ms</span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showChartToggle && result && (
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                Tablo
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'chart' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
              >
                Grafik
              </button>
            </div>
          )}
          {result && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          )}
          <Button size="sm" disabled={executing} onClick={() => onExecute()}>
            <Play className="h-4 w-4 mr-1" />
            {executing ? 'Çalışıyor...' : 'Çalıştır'}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!execution && !executing && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Play className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Raporu çalıştırmak için "Çalıştır" düğmesine basın.</p>
        </div>
      )}

      {executing && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {!executing && execution && viewMode === 'table' && (
        <DataTable
          columns={tableColumns}
          data={rows}
          emptyState={{ title: 'Sonuç bulunamadı' }}
        />
      )}

      {!executing && execution && viewMode === 'chart' && (
        <div className="border border-border rounded-lg p-4 bg-background">
          {renderChart() ?? <p className="text-center text-muted-foreground py-8">Grafik oluşturulamadı.</p>}
        </div>
      )}

      {execution?.status === 'failed' && execution.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <span className="font-medium">Hata: </span>{execution.error}
        </div>
      )}
    </div>
  );
};
