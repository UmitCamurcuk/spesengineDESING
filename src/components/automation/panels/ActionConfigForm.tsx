import React from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import type { WorkflowNodeConfig, ActionType } from '../../../types';

interface ActionConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'Aksiyon seçiniz...' },
  { value: 'send_notification', label: 'Bildirim Gönder' },
  { value: 'update_field', label: 'Alan Güncelle' },
  { value: 'webhook', label: 'Webhook Gönder' },
  { value: 'create_item', label: 'Item Oluştur' },
  { value: 'update_item', label: 'Item Güncelle' },
  { value: 'delete_item', label: 'Item Sil' },
  { value: 'set_variable', label: 'Değişken Ata' },
  { value: 'log', label: 'Log Yaz' },
  { value: 'send_email', label: 'E-posta Gönder' },
  { value: 'http_request', label: 'HTTP İstek' },
  { value: 'transform_data', label: 'Veri Dönüştür' },
  { value: 'find_items', label: 'Item Ara' },
  { value: 'bulk_update_items', label: 'Toplu Item Güncelle' },
  { value: 'assign_attribute', label: 'Attribute Ata' },
];

const HTTP_METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

export const ActionConfigForm: React.FC<ActionConfigFormProps> = ({ config, onChange }) => {
  const actionType = config.actionType ?? '';
  const actionConfig = (config.actionConfig ?? {}) as Record<string, unknown>;

  const updateActionConfig = (key: string, value: unknown) => {
    onChange({
      ...config,
      actionConfig: { ...actionConfig, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Aksiyon Tipi</label>
        <Select
          value={actionType}
          onChange={(e) =>
            onChange({
              ...config,
              actionType: e.target.value as ActionType,
              actionConfig: {},
            })
          }
          options={ACTION_TYPE_OPTIONS}
        />
      </div>

      {actionType === 'send_notification' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Event Key</label>
            <Input
              value={(actionConfig.eventKey as string) ?? ''}
              onChange={(e) => updateActionConfig('eventKey', e.target.value)}
              placeholder="item.created"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ek Veri (JSON)</label>
            <Textarea
              value={(actionConfig.dataJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('dataJson', e.target.value)}
              rows={3}
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
      )}

      {actionType === 'update_field' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID</label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.itemId}}"
            />
            <p className="text-xs text-muted-foreground mt-1">Template değişkeni kullanılabilir.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute Key</label>
            <Input
              value={(actionConfig.attributeKey as string) ?? ''}
              onChange={(e) => updateActionConfig('attributeKey', e.target.value)}
              placeholder="status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Değer</label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="approved"
            />
          </div>
        </div>
      )}

      {actionType === 'webhook' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL</label>
            <Input
              value={(actionConfig.url as string) ?? ''}
              onChange={(e) => updateActionConfig('url', e.target.value)}
              placeholder="https://api.example.com/hook"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">HTTP Metodu</label>
            <Select
              value={(actionConfig.method as string) ?? 'POST'}
              onChange={(e) => updateActionConfig('method', e.target.value)}
              options={HTTP_METHOD_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Headers (JSON)</label>
            <Textarea
              value={(actionConfig.headersJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('headersJson', e.target.value)}
              rows={2}
              placeholder='{"Authorization": "Bearer ..."}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Body (JSON)</label>
            <Textarea
              value={(actionConfig.bodyJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('bodyJson', e.target.value)}
              rows={3}
              placeholder='{"message": "{{trigger.itemName}}"}'
            />
          </div>
        </div>
      )}

      {actionType === 'create_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Type ID</label>
            <Input
              value={(actionConfig.itemTypeId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemTypeId', e.target.value)}
              placeholder="Item tipi ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kategori ID (opsiyonel)</label>
            <Input
              value={(actionConfig.categoryId as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Family ID (opsiyonel)</label>
            <Input
              value={(actionConfig.familyId as string) ?? ''}
              onChange={(e) => updateActionConfig('familyId', e.target.value)}
            />
          </div>
        </div>
      )}

      {actionType === 'update_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID</label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.itemId}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kategori ID (opsiyonel)</label>
            <Input
              value={(actionConfig.categoryId as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Family ID (opsiyonel)</label>
            <Input
              value={(actionConfig.familyId as string) ?? ''}
              onChange={(e) => updateActionConfig('familyId', e.target.value)}
            />
          </div>
        </div>
      )}

      {actionType === 'delete_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID</label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.itemId}}"
            />
            <p className="text-xs text-muted-foreground mt-1">Template değişkeni kullanılabilir.</p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-warning font-medium">
              Bu aksiyon item kaydını kalıcı olarak siler. Dikkatli kullanın.
            </p>
          </div>
        </div>
      )}

      {actionType === 'set_variable' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değişken Adı</label>
            <Input
              value={(actionConfig.variableName as string) ?? ''}
              onChange={(e) => updateActionConfig('variableName', e.target.value)}
              placeholder="myVar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değer</label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="{{trigger.itemId}}"
            />
          </div>
        </div>
      )}

      {actionType === 'log' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Mesaj</label>
            <Textarea
              value={(actionConfig.message as string) ?? ''}
              onChange={(e) => updateActionConfig('message', e.target.value)}
              rows={2}
              placeholder="Item {{trigger.itemId}} işlendi."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Seviye</label>
            <Select
              value={(actionConfig.level as string) ?? 'info'}
              onChange={(e) => updateActionConfig('level', e.target.value)}
              options={[
                { value: 'info', label: 'Info' },
                { value: 'warn', label: 'Warning' },
                { value: 'error', label: 'Error' },
              ]}
            />
          </div>
        </div>
      )}

      {actionType === 'send_email' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Alıcı (To)</label>
            <Input
              value={(actionConfig.to as string) ?? ''}
              onChange={(e) => updateActionConfig('to', e.target.value)}
              placeholder="user@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">Birden fazla alıcı için virgül kullanın.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Konu</label>
            <Input
              value={(actionConfig.subject as string) ?? ''}
              onChange={(e) => updateActionConfig('subject', e.target.value)}
              placeholder="{{trigger.itemName}} güncellendi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gövde</label>
            <Textarea
              value={(actionConfig.body as string) ?? ''}
              onChange={(e) => updateActionConfig('body', e.target.value)}
              rows={4}
              placeholder="E-posta içeriği..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">CC (opsiyonel)</label>
            <Input
              value={(actionConfig.cc as string) ?? ''}
              onChange={(e) => updateActionConfig('cc', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">BCC (opsiyonel)</label>
            <Input
              value={(actionConfig.bcc as string) ?? ''}
              onChange={(e) => updateActionConfig('bcc', e.target.value)}
            />
          </div>
        </div>
      )}

      {actionType === 'http_request' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL</label>
            <Input
              value={(actionConfig.url as string) ?? ''}
              onChange={(e) => updateActionConfig('url', e.target.value)}
              placeholder="https://api.example.com/data"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">HTTP Metodu</label>
            <Select
              value={(actionConfig.method as string) ?? 'GET'}
              onChange={(e) => updateActionConfig('method', e.target.value)}
              options={HTTP_METHOD_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Auth Tipi</label>
            <Select
              value={(actionConfig.authType as string) ?? 'none'}
              onChange={(e) => updateActionConfig('authType', e.target.value)}
              options={[
                { value: 'none', label: 'Yok' },
                { value: 'bearer', label: 'Bearer Token' },
                { value: 'basic', label: 'Basic Auth' },
                { value: 'apiKey', label: 'API Key' },
              ]}
            />
          </div>
          {(actionConfig.authType as string) === 'bearer' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Token</label>
              <Input
                value={(actionConfig.authToken as string) ?? ''}
                onChange={(e) => updateActionConfig('authToken', e.target.value)}
                placeholder="Bearer token"
              />
            </div>
          )}
          {(actionConfig.authType as string) === 'basic' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Kullanıcı Adı</label>
                <Input
                  value={(actionConfig.authUsername as string) ?? ''}
                  onChange={(e) => updateActionConfig('authUsername', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Şifre</label>
                <Input
                  type="password"
                  value={(actionConfig.authPassword as string) ?? ''}
                  onChange={(e) => updateActionConfig('authPassword', e.target.value)}
                />
              </div>
            </>
          )}
          {(actionConfig.authType as string) === 'apiKey' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Header Adı</label>
                <Input
                  value={(actionConfig.apiKeyHeader as string) ?? ''}
                  onChange={(e) => updateActionConfig('apiKeyHeader', e.target.value)}
                  placeholder="X-API-Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">API Key Değeri</label>
                <Input
                  value={(actionConfig.apiKeyValue as string) ?? ''}
                  onChange={(e) => updateActionConfig('apiKeyValue', e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Headers (JSON, opsiyonel)</label>
            <Textarea
              value={(actionConfig.headersJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('headersJson', e.target.value)}
              rows={2}
              placeholder='{"X-Custom": "value"}'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Body (JSON, opsiyonel)</label>
            <Textarea
              value={(actionConfig.bodyJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('bodyJson', e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Retry Sayısı</label>
            <Input
              type="number"
              value={(actionConfig.retryCount as number) ?? 0}
              onChange={(e) => updateActionConfig('retryCount', parseInt(e.target.value, 10) || 0)}
              min={0}
              max={5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Timeout (ms)</label>
            <Input
              type="number"
              value={(actionConfig.timeout as number) ?? 30000}
              onChange={(e) => updateActionConfig('timeout', parseInt(e.target.value, 10) || 30000)}
              min={1000}
              max={60000}
            />
          </div>
        </div>
      )}

      {actionType === 'transform_data' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kaynak Expression</label>
            <Input
              value={(actionConfig.sourceExpression as string) ?? ''}
              onChange={(e) => updateActionConfig('sourceExpression', e.target.value)}
              placeholder="{{steps.find_items.items}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">İşlem</label>
            <Select
              value={(actionConfig.operation as string) ?? 'pick'}
              onChange={(e) => updateActionConfig('operation', e.target.value)}
              options={[
                { value: 'pick', label: 'Pick (Alan Seç)' },
                { value: 'filter', label: 'Filter (Filtrele)' },
                { value: 'flatten', label: 'Flatten (Düzleştir)' },
                { value: 'merge', label: 'Merge (Birleştir)' },
              ]}
            />
          </div>
          {(actionConfig.operation as string) === 'pick' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Alanlar (virgülle)</label>
              <Input
                value={(actionConfig.pickKeys as string) ?? ''}
                onChange={(e) => updateActionConfig('pickKeys', e.target.value)}
                placeholder="name, status, categoryId"
              />
            </div>
          )}
          {(actionConfig.operation as string) === 'filter' && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Filtre Alanı</label>
                <Input
                  value={(actionConfig.filterKey as string) ?? ''}
                  onChange={(e) => updateActionConfig('filterKey', e.target.value)}
                  placeholder="status"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Filtre Değeri</label>
                <Input
                  value={(actionConfig.filterValue as string) ?? ''}
                  onChange={(e) => updateActionConfig('filterValue', e.target.value)}
                  placeholder="active"
                />
              </div>
            </>
          )}
          {(actionConfig.operation as string) === 'merge' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Hedef Expression</label>
              <Input
                value={(actionConfig.targetExpression as string) ?? ''}
                onChange={(e) => updateActionConfig('targetExpression', e.target.value)}
                placeholder="{{steps.other_node.result}}"
              />
            </div>
          )}
        </div>
      )}

      {actionType === 'find_items' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Type ID</label>
            <Input
              value={(actionConfig.itemTypeId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemTypeId', e.target.value)}
              placeholder="Item tipi ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kategori ID'leri (opsiyonel)</label>
            <Input
              value={(actionConfig.categoryIds as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryIds', e.target.value)}
              placeholder="Virgülle ayırın"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Family ID'leri (opsiyonel)</label>
            <Input
              value={(actionConfig.familyIds as string) ?? ''}
              onChange={(e) => updateActionConfig('familyIds', e.target.value)}
              placeholder="Virgülle ayırın"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Limit</label>
            <Input
              type="number"
              value={(actionConfig.limit as number) ?? 50}
              onChange={(e) => updateActionConfig('limit', parseInt(e.target.value, 10) || 50)}
              min={1}
              max={500}
            />
          </div>
        </div>
      )}

      {actionType === 'bulk_update_items' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Type ID</label>
            <Input
              value={(actionConfig.itemTypeId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemTypeId', e.target.value)}
              placeholder="Item tipi ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kategori ID'leri (filtre, opsiyonel)</label>
            <Input
              value={(actionConfig.categoryIds as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryIds', e.target.value)}
              placeholder="Virgülle ayırın"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Family ID'leri (filtre, opsiyonel)</label>
            <Input
              value={(actionConfig.familyIds as string) ?? ''}
              onChange={(e) => updateActionConfig('familyIds', e.target.value)}
              placeholder="Virgülle ayırın"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Kategori ID (opsiyonel)</label>
            <Input
              value={(actionConfig.updateCategoryId as string) ?? ''}
              onChange={(e) => updateActionConfig('updateCategoryId', e.target.value)}
              placeholder="Hedef kategori ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Family ID (opsiyonel)</label>
            <Input
              value={(actionConfig.updateFamilyId as string) ?? ''}
              onChange={(e) => updateActionConfig('updateFamilyId', e.target.value)}
              placeholder="Hedef family ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Limit</label>
            <Input
              type="number"
              value={(actionConfig.limit as number) ?? 50}
              onChange={(e) => updateActionConfig('limit', parseInt(e.target.value, 10) || 50)}
              min={1}
              max={200}
            />
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-warning font-medium">
              Bu aksiyon birden fazla item'ı toplu olarak günceller. Dikkatli kullanın.
            </p>
          </div>
        </div>
      )}

      {actionType === 'assign_attribute' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID</label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.itemId}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute ID</label>
            <Input
              value={(actionConfig.attributeId as string) ?? ''}
              onChange={(e) => updateActionConfig('attributeId', e.target.value)}
              placeholder="Attribute ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değer</label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="Yeni değer"
            />
            <p className="text-xs text-muted-foreground mt-1">Template değişkeni kullanılabilir.</p>
          </div>
        </div>
      )}
    </div>
  );
};
