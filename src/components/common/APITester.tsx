import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Code,
  Copy,
  Check,
  Globe,
  Key,
  Send,
  Plus,
  Trash2,
  Save,
  Shield,
} from 'lucide-react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Textarea } from '../ui/Textarea';
import { APIEndpoint } from '../../types/common';

interface APITesterProps {
  entityType: string;
  entityId: string;
  editMode?: boolean;
  endpoints?: APIEndpoint[];
  onEndpointsChange?: (endpoints: APIEndpoint[]) => Promise<void> | void;
}

const createDefaultEndpoints = (entityId: string): APIEndpoint[] => [
  {
    id: 'list-rules',
    method: 'GET',
    path: '/api/notifications/rules',
    description: 'Tenant içindeki tüm bildirim kurallarını listeler.',
    parameters: [
      { name: 'search', type: 'string', required: false, description: 'İsim veya event anahtarı ile arama' },
      { name: 'eventKey', type: 'string', required: false, description: 'Belirli event için filtre' },
      { name: 'isActive', type: 'boolean', required: false, description: 'Aktif/pasif filtre' },
    ],
    responseExample: {
      items: [
        {
          id: entityId,
          name: 'Örnek Bildirim Kuralı',
          eventKey: 'user.login',
          isActive: true,
        },
      ],
    },
    requiresAuth: true,
    permissions: ['notifications.rule.list'],
  },
  {
    id: 'get-rule',
    method: 'GET',
    path: '/api/notifications/rules/:id',
    description: 'Belirli bir bildirim kuralının ayrıntılarını döner.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Bildirim kuralı kimliği', example: entityId },
    ],
    responseExample: {
      id: entityId,
      name: 'Örnek Bildirim Kuralı',
      description: 'Giriş olaylarını Slack kanalına gönder',
      eventKey: 'user.login',
      isActive: true,
    },
    requiresAuth: true,
    permissions: ['notifications.rule.view'],
  },
  {
    id: 'update-rule',
    method: 'PUT',
    path: '/api/notifications/rules/:id',
    description: 'Bir bildirim kuralını günceller.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Bildirim kuralı kimliği', example: entityId },
    ],
    requestBody: {
      isActive: true,
      description: 'Giriş olaylarını hem Slack hem e-posta ile bildir',
    },
    responseExample: {
      id: entityId,
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
    requiresAuth: true,
    permissions: ['notifications.rule.update'],
  },
  {
    id: 'rule-statistics',
    method: 'GET',
    path: '/api/notifications/rules/:id/statistics',
    description: 'Bildirim kuralı için gönderim istatistiklerini döner.',
    parameters: [
      { name: 'id', type: 'string', required: true, description: 'Bildirim kuralı kimliği', example: entityId },
    ],
    responseExample: {
      totalEvents: 12,
      successCount: 11,
      failureCount: 1,
      lastTriggeredAt: new Date().toISOString(),
    },
    requiresAuth: true,
    permissions: ['notifications.rule.statistics.view'],
  },
];

const methodOptions: APIEndpoint['method'][] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const APITester: React.FC<APITesterProps> = ({
  entityType,
  entityId,
  editMode = false,
  endpoints: endpointsProp,
  onEndpointsChange,
}) => {
  const defaultEndpoints = useMemo(() => createDefaultEndpoints(entityId), [entityId]);
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>(endpointsProp?.length ? endpointsProp : defaultEndpoints);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(endpoints[0]?.id ?? null);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const canEdit = editMode && Boolean(onEndpointsChange);

  useEffect(() => {
    const initial = endpointsProp?.length ? endpointsProp : defaultEndpoints;
    setEndpoints(initial);
    setSelectedEndpointId(initial[0]?.id ?? null);
  }, [defaultEndpoints, endpointsProp]);

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === selectedEndpointId) ?? null,
    [endpoints, selectedEndpointId],
  );

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'primary';
      case 'PUT':
      case 'PATCH':
        return 'warning';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    if (!selectedEndpoint) {
      return;
    }

    setLoading(true);
    setResponse(null);

    setTimeout(() => {
      setResponse({
        status: 200,
        statusText: 'OK',
        data: selectedEndpoint.responseExample ?? { message: 'Success' },
        headers: {
          'content-type': 'application/json',
          'x-response-time': '42ms',
        },
      });
      setLoading(false);
    }, 800);
  };

  const handleEndpointUpdate = (endpointId: string, patch: Partial<APIEndpoint>) => {
    setEndpoints((prev) => {
      const next = prev.map((endpoint) =>
        endpoint.id === endpointId ? { ...endpoint, ...patch } : endpoint,
      );
      const updated = next.find((endpoint) => endpoint.id === endpointId) ?? null;
      if (updated) {
        setSelectedEndpointId(updated.id);
      }
      return next;
    });
  };

  const handlePermissionChange = (endpointId: string, value: string) => {
    const list = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    handleEndpointUpdate(endpointId, { permissions: list });
  };

  const handleAddEndpoint = () => {
    const newEndpoint: APIEndpoint = {
      id: `endpoint-${Date.now()}`,
      method: 'GET',
      path: `/api/notifications/rules/${entityId}`,
      description: 'Yeni endpoint açıklaması',
      requiresAuth: true,
      permissions: [],
    };
    setEndpoints((prev) => [...prev, newEndpoint]);
    setSelectedEndpointId(newEndpoint.id);
  };

  const handleDeleteEndpoint = (endpointId: string) => {
    setEndpoints((prev) => {
      const next = prev.filter((endpoint) => endpoint.id !== endpointId);
      if (selectedEndpointId === endpointId) {
        setSelectedEndpointId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleSaveEndpoints = async () => {
    if (!onEndpointsChange) {
      return;
    }
    const previous = endpointsProp?.length ? endpointsProp : defaultEndpoints;
    try {
      setSaving(true);
      setSaveError(null);
      await onEndpointsChange(endpoints);
    } catch (error: any) {
      setSaveError(error?.message ?? 'API referansı kaydedilirken bir hata oluştu');
      setEndpoints(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">API Testing</h3>
          <p className="text-sm text-muted-foreground">Bu {entityType} için kullanılabilir API uç noktaları</p>
        </div>
        <Badge variant="primary" size="sm">
          <Globe className="h-3 w-3 mr-1" />
          Live API
        </Badge>
      </div>

      {canEdit && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAddEndpoint}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Endpoint
            </Button>
            {saveError && <span className="text-sm text-error">{saveError}</span>}
          </div>
          <Button size="sm" onClick={handleSaveEndpoints} loading={saving}>
            <Save className="h-4 w-4 mr-2" />
            API Referansını Kaydet
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Available Endpoints" subtitle="Test etmek istediğiniz endpoint'i seçin" />
          <div className="space-y-2">
            {endpoints.map((endpoint) => {
              const isActive = endpoint.id === selectedEndpointId;
              return (
                <div
                  key={endpoint.id}
                  className={`border rounded-lg transition-all duration-200 ${
                    isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-border hover:bg-muted'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedEndpointId(endpoint.id)}
                    className="w-full text-left p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getMethodColor(endpoint.method) as any} size="sm">
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono text-foreground">
                          {endpoint.path.replace(':id', entityId)}
                        </code>
                        {endpoint.requiresAuth && <Shield className="h-3 w-3 text-amber-500" />}
                      </div>
                      {endpoint.requiresAuth && <Key className="h-4 w-4 text-amber-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </button>
                  {canEdit && (
                    <div className="border-t border-border p-3 space-y-2 bg-background">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground">HTTP Method</label>
                        <select
                          value={endpoint.method}
                          onChange={(event) => handleEndpointUpdate(endpoint.id, { method: event.target.value as APIEndpoint['method'] })}
                          className="w-full px-2 py-1 border border-input rounded-md bg-background text-sm"
                        >
                          {methodOptions.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground">Path</label>
                        <Input
                          value={endpoint.path}
                          onChange={(event) => handleEndpointUpdate(endpoint.id, { path: event.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground">Açıklama</label>
                        <Textarea
                          value={endpoint.description}
                          onChange={(event) => handleEndpointUpdate(endpoint.id, { description: event.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id={`requires-auth-${endpoint.id}`}
                          type="checkbox"
                          checked={endpoint.requiresAuth}
                          onChange={(event) => handleEndpointUpdate(endpoint.id, { requiresAuth: event.target.checked })}
                        />
                        <label htmlFor={`requires-auth-${endpoint.id}`} className="text-xs text-muted-foreground">Kimlik doğrulaması gerekli</label>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted-foreground">Gerekli Permissionlar (virgül ile ayırın)</label>
                        <Input
                          value={(endpoint.permissions ?? []).join(', ')}
                          onChange={(event) => handlePermissionChange(endpoint.id, event.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error"
                        onClick={() => handleDeleteEndpoint(endpoint.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Endpoint Sil
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title="Request Builder" subtitle="İstek yapılandırmasına ait örnek veriler" />
          {selectedEndpoint ? (
            <div className="space-y-4">
              <div className="p-3 bg-muted/60 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={getMethodColor(selectedEndpoint.method) as any} size="sm">
                    {selectedEndpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-foreground">
                    {selectedEndpoint.path.replace(':id', entityId)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(selectedEndpoint.path.replace(':id', entityId))}
                    className="p-1 hover:bg-muted rounded"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{selectedEndpoint.description}</p>
              </div>

              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Parameters</h4>
                  <div className="space-y-2">
                    {selectedEndpoint.parameters.map((param, index) => (
                      <div key={`${selectedEndpoint.id}-param-${index}`} className="flex items-center justify-between p-2 bg-muted/60 rounded">
                        <div>
                          <span className="text-sm font-medium text-foreground">{param.name}</span>
                          {param.required && <span className="text-error ml-1">*</span>}
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        </div>
                        <Badge variant="outline" size="sm">{param.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint.requestBody && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Request Body</label>
                  <Textarea
                    value={requestBody || JSON.stringify(selectedEndpoint.requestBody, null, 2)}
                    onChange={(event) => setRequestBody(event.target.value)}
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <Button onClick={handleTest} loading={loading} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Görüntülenecek endpoint bulunamadı.
            </div>
          )}
        </Card>
      </div>

      {response && (
        <Card>
          <CardHeader title="Response" subtitle={`${response.status} ${response.statusText}`} />
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Badge
                variant={response.status < 300 ? 'success' : response.status < 400 ? 'warning' : 'error'}
                size="sm"
              >
                {response.status} {response.statusText}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Response time: {response.headers['x-response-time']}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Response Headers</h4>
              <div className="bg-muted/60 rounded-lg p-3">
                <pre className="text-xs text-foreground">{JSON.stringify(response.headers, null, 2)}</pre>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Response Body</h4>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(response.data, null, 2))}
                  className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-muted rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-foreground">{JSON.stringify(response.data, null, 2)}</pre>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
