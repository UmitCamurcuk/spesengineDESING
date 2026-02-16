import React, { useEffect, useState } from 'react';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import type { WorkflowNodeConfig, ActionType, ItemType, Attribute } from '../../../types';
import { AttributeType } from '../../../types';
import { itemTypesService } from '../../../api/services/item-types.service';
import { categoriesService } from '../../../api/services/categories.service';
import { familiesService } from '../../../api/services/families.service';
import { attributeGroupsService } from '../../../api/services/attribute-groups.service';
import type { Category, Family } from '../../../types';

interface ActionConfigFormProps {
  config: WorkflowNodeConfig;
  onChange: (config: WorkflowNodeConfig) => void;
}

/* ------------------------------------------------------------------ */
/*  Action Catalog                                                      */
/* ------------------------------------------------------------------ */

interface ActionDef {
  value: ActionType;
  label: string;
  category: string;
}

const ACTION_CATALOG: ActionDef[] = [
  // Item İşlemleri
  { value: 'create_item', label: 'Item Oluştur', category: 'item' },
  { value: 'update_item', label: 'Item Güncelle', category: 'item' },
  { value: 'delete_item', label: 'Item Sil', category: 'item' },
  { value: 'clone_item', label: 'Item Kopyala', category: 'item' },
  { value: 'find_items', label: 'Item Ara', category: 'item' },
  { value: 'bulk_update_items', label: 'Toplu Item Güncelle', category: 'item' },
  { value: 'update_field', label: 'Alan Güncelle (Hızlı)', category: 'item' },
  { value: 'assign_attribute', label: 'Attribute Ata', category: 'item' },
  // Board İşlemleri
  { value: 'create_board_task', label: 'Board Görevi Oluştur', category: 'board' },
  { value: 'update_board_task', label: 'Board Görevini Güncelle', category: 'board' },
  { value: 'move_board_task', label: 'Board Görevini Taşı', category: 'board' },
  { value: 'assign_board_task', label: 'Board Görevine Kişi Ata', category: 'board' },
  { value: 'archive_board_task', label: 'Board Görevini Arşivle', category: 'board' },
  // Bildirim & İletişim
  { value: 'send_notification', label: 'Bildirim Gönder', category: 'notification' },
  { value: 'send_email', label: 'E-posta Gönder', category: 'notification' },
  // Dış Sistem
  { value: 'webhook', label: 'Webhook Gönder', category: 'external' },
  { value: 'http_request', label: 'HTTP İstek', category: 'external' },
  // Veri İşleme
  { value: 'transform_data', label: 'Veri Dönüştür', category: 'data' },
  { value: 'set_variable', label: 'Değişken Ata', category: 'data' },
  { value: 'log', label: 'Log Yaz', category: 'data' },
  { value: 'fire_event', label: 'Event Fırlat', category: 'data' },
];

const CATEGORY_LABELS: Record<string, string> = {
  item: '📦 Item İşlemleri',
  board: '📋 Board İşlemleri',
  notification: '🔔 Bildirim & İletişim',
  external: '🌐 Dış Sistem',
  data: '⚙️ Veri İşleme',
};

const HTTP_METHOD_OPTIONS = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
];

/* ------------------------------------------------------------------ */
/*  Grouped Select Options                                              */
/* ------------------------------------------------------------------ */

function buildActionOptions() {
  const categories = ['item', 'board', 'notification', 'external', 'data'];
  const options: { value: string; label: string; disabled?: boolean }[] = [
    { value: '', label: 'Aksiyon seçiniz...' },
  ];

  categories.forEach((cat) => {
    const items = ACTION_CATALOG.filter((a) => a.category === cat);
    if (items.length === 0) return;
    options.push({ value: `__group_${cat}`, label: CATEGORY_LABELS[cat], disabled: true });
    items.forEach((a) => options.push({ value: a.value, label: `  ${a.label}` }));
  });

  return options;
}

const ACTION_OPTIONS = buildActionOptions();

/* ------------------------------------------------------------------ */
/*  Dynamic Item Form Data Hook                                         */
/* ------------------------------------------------------------------ */

function useItemFormData(itemTypeId: string, categoryId: string, familyId: string) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [requiredGroupIds, setRequiredGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all item types once
  useEffect(() => {
    itemTypesService
      .list({ limit: 200 })
      .then((res) => setItemTypes(res.items))
      .catch(() => {});
  }, []);

  // Load categories when itemTypeId changes
  useEffect(() => {
    if (!itemTypeId) {
      setCategories([]);
      return;
    }
    categoriesService
      .list({ itemTypeId, limit: 200 })
      .then((res) => setCategories(res.items))
      .catch(() => setCategories([]));
  }, [itemTypeId]);

  // Load families when categoryId changes
  useEffect(() => {
    if (!categoryId) {
      setFamilies([]);
      return;
    }
    familiesService
      .list({ categoryId, limit: 200 })
      .then((res) => setFamilies(res.items))
      .catch(() => setFamilies([]));
  }, [categoryId]);

  // Load attribute groups when itemTypeId/categoryId/familyId changes
  useEffect(() => {
    if (!itemTypeId) {
      setAttributes([]);
      setRequiredGroupIds([]);
      return;
    }
    setLoading(true);
    attributeGroupsService
      .resolve({
        itemTypeId: itemTypeId || undefined,
        categoryId: categoryId || undefined,
        familyId: familyId || undefined,
      })
      .then(({ attributeGroups, requiredAttributeGroupIds }) => {
        const allAttrs: Attribute[] = [];
        attributeGroups.forEach((g) => {
          (g.attributes ?? []).forEach((a) => {
            if (!allAttrs.find((x) => x.id === a.id)) {
              allAttrs.push(a);
            }
          });
        });
        setAttributes(allAttrs);
        setRequiredGroupIds(requiredAttributeGroupIds);
      })
      .catch(() => {
        setAttributes([]);
        setRequiredGroupIds([]);
      })
      .finally(() => setLoading(false));
  }, [itemTypeId, categoryId, familyId]);

  return { itemTypes, categories, families, attributes, requiredGroupIds, loading };
}

/* ------------------------------------------------------------------ */
/*  Attribute Input Renderer                                            */
/* ------------------------------------------------------------------ */

function renderAttrInput(
  attr: Attribute,
  value: string,
  onChange: (v: string) => void,
): React.ReactNode {
  if (attr.type === AttributeType.SELECT && attr.options?.length) {
    return (
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: '', label: 'Seçiniz veya template girin...' },
          ...attr.options.map((o) => ({ value: o, label: o })),
        ]}
      />
    );
  }

  if (attr.type === AttributeType.BOOLEAN) {
    return (
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: '', label: 'Seçiniz...' },
          { value: 'true', label: 'Evet' },
          { value: 'false', label: 'Hayır' },
        ]}
      />
    );
  }

  if (attr.type === AttributeType.RICH_TEXT) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder="Değer veya {{trigger.xxx}}"
      />
    );
  }

  const inputType =
    attr.type === AttributeType.DATE
      ? 'date'
      : attr.type === AttributeType.DATETIME
        ? 'datetime-local'
        : attr.type === AttributeType.TIME
          ? 'time'
          : 'text';

  const placeholder =
    attr.type === AttributeType.NUMBER || attr.type === AttributeType.MONEY
      ? '0 veya {{trigger.xxx}}'
      : '{{trigger.xxx}} veya statik değer';

  return <Input type={inputType} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

/* ------------------------------------------------------------------ */
/*  Attribute Fields Component                                          */
/* ------------------------------------------------------------------ */

interface AttributeFieldsProps {
  attributes: Attribute[];
  requiredGroupIds: string[];
  attributeGroups?: { id: string; attributeIds: string[] }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  loading?: boolean;
}

const AttributeFields: React.FC<AttributeFieldsProps> = ({
  attributes,
  requiredGroupIds,
  values,
  onChange,
  loading,
}) => {
  const [showOptional, setShowOptional] = useState(false);

  if (loading) {
    return <p className="text-xs text-muted-foreground">Attribute şeması yükleniyor...</p>;
  }

  if (attributes.length === 0) return null;

  // We can't distinguish required vs optional per attribute without binding info,
  // so show all attributes, with 'required' from attr.required field
  const required = attributes.filter((a) => a.required);
  const optional = attributes.filter((a) => !a.required);

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attribute Değerleri</p>

      {required.length > 0 && (
        <div className="space-y-2">
          {required.map((attr) => (
            <div key={attr.id}>
              <label className="block text-sm font-medium text-foreground mb-1">
                {attr.name}
                <span className="text-destructive ml-1">*</span>
                <span className="text-xs text-muted-foreground ml-2 font-normal">({attr.key})</span>
              </label>
              {renderAttrInput(attr, values[attr.key ?? ''] ?? '', (v) =>
                onChange(attr.key ?? attr.id, v),
              )}
              {attr.helpText && (
                <p className="text-xs text-muted-foreground mt-1">{attr.helpText}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {optional.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowOptional((s) => !s)}
            className="text-xs text-primary hover:underline"
          >
            {showOptional ? '▲' : '▼'} Opsiyonel Alanlar ({optional.length})
          </button>
          {showOptional && (
            <div className="space-y-2 mt-2">
              {optional.map((attr) => (
                <div key={attr.id}>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {attr.name}
                    <span className="text-xs text-muted-foreground ml-2 font-normal">({attr.key})</span>
                  </label>
                  {renderAttrInput(attr, values[attr.key ?? ''] ?? '', (v) =>
                    onChange(attr.key ?? attr.id, v),
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Değer olarak <code className="bg-muted px-1 rounded">{'{{trigger.xxx}}'}</code> template değişkenleri kullanabilirsiniz.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                      */
/* ------------------------------------------------------------------ */

export const ActionConfigForm: React.FC<ActionConfigFormProps> = ({ config, onChange }) => {
  const actionType = config.actionType ?? '';
  const actionConfig = (config.actionConfig ?? {}) as Record<string, unknown>;

  const updateActionConfig = (key: string, value: unknown) => {
    onChange({ ...config, actionConfig: { ...actionConfig, [key]: value } });
  };

  const updateAttrValue = (key: string, value: string) => {
    const existing = (actionConfig.attributes as Record<string, unknown>) ?? {};
    onChange({
      ...config,
      actionConfig: {
        ...actionConfig,
        attributes: { ...existing, [key]: value },
      },
    });
  };

  const attrValues = (actionConfig.attributes as Record<string, string>) ?? {};

  // Item form data for create_item and update_item
  const itemTypeId = (actionConfig.itemTypeId as string) ?? '';
  const categoryId = (actionConfig.categoryId as string) ?? '';
  const familyId = (actionConfig.familyId as string) ?? '';

  const { itemTypes, categories, families, attributes, requiredGroupIds, loading: attrLoading } =
    useItemFormData(
      actionType === 'create_item' || actionType === 'update_item' || actionType === 'clone_item'
        ? itemTypeId
        : '',
      categoryId,
      familyId,
    );

  const itemTypeOptions = [
    { value: '', label: 'Item tipi seçiniz...' },
    ...itemTypes.map((t) => ({ value: t.id, label: t.name })),
  ];

  const categoryOptions = [
    { value: '', label: 'Kategori seçiniz (opsiyonel)...' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const familyOptions = [
    { value: '', label: 'Aile seçiniz (opsiyonel)...' },
    ...families.map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <div className="space-y-4">
      {/* Action Type Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Aksiyon Tipi</label>
        <Select
          value={actionType}
          onChange={(e) => {
            const val = e.target.value;
            if (val.startsWith('__group_')) return;
            onChange({ ...config, actionType: val as ActionType, actionConfig: {} });
          }}
          options={ACTION_OPTIONS}
        />
      </div>

      {/* ---- create_item ---- */}
      {actionType === 'create_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Tipi <span className="text-destructive">*</span></label>
            <Select
              value={itemTypeId}
              onChange={(e) => {
                onChange({
                  ...config,
                  actionConfig: { itemTypeId: e.target.value, attributes: {} },
                });
              }}
              options={itemTypeOptions}
            />
          </div>

          {itemTypeId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Kategori</label>
              <Select
                value={categoryId}
                onChange={(e) =>
                  onChange({
                    ...config,
                    actionConfig: { ...actionConfig, categoryId: e.target.value, familyId: '', attributes: {} },
                  })
                }
                options={categoryOptions}
              />
            </div>
          )}

          {itemTypeId && categoryId && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Aile</label>
              <Select
                value={familyId}
                onChange={(e) =>
                  onChange({
                    ...config,
                    actionConfig: { ...actionConfig, familyId: e.target.value, attributes: {} },
                  })
                }
                options={familyOptions}
              />
            </div>
          )}

          {itemTypeId && (
            <AttributeFields
              attributes={attributes}
              requiredGroupIds={requiredGroupIds}
              values={attrValues}
              onChange={updateAttrValue}
              loading={attrLoading}
            />
          )}
        </div>
      )}

      {/* ---- update_item ---- */}
      {actionType === 'update_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.item.id}}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute şeması için Item Tipi (opsiyonel)</label>
            <Select
              value={itemTypeId}
              onChange={(e) => {
                onChange({
                  ...config,
                  actionConfig: { ...actionConfig, itemTypeId: e.target.value, attributes: {} },
                });
              }}
              options={itemTypeOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Hangi attribute'ların güncelleneceğini görmek için seçin.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Kategori (opsiyonel)</label>
            <Input
              value={(actionConfig.categoryId as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryId', e.target.value)}
              placeholder="{{trigger.item.categoryId}} veya ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Aile (opsiyonel)</label>
            <Input
              value={(actionConfig.familyId as string) ?? ''}
              onChange={(e) => updateActionConfig('familyId', e.target.value)}
              placeholder="{{trigger.item.familyId}} veya ID"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bumpVersion"
              checked={(actionConfig.bumpVersion as boolean) ?? false}
              onChange={(e) => updateActionConfig('bumpVersion', e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="bumpVersion" className="text-sm text-foreground">
              Versiyon numarasını artır
            </label>
          </div>

          {itemTypeId ? (
            <AttributeFields
              attributes={attributes}
              requiredGroupIds={requiredGroupIds}
              values={attrValues}
              onChange={updateAttrValue}
              loading={attrLoading}
            />
          ) : (
            <ManualAttributeEditor values={attrValues} onChange={updateAttrValue} />
          )}
        </div>
      )}

      {/* ---- delete_item ---- */}
      {actionType === 'delete_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.item.id}}"
            />
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
            <p className="text-xs text-warning font-medium">Bu aksiyon item kaydını kalıcı olarak siler.</p>
          </div>
        </div>
      )}

      {/* ---- clone_item ---- */}
      {actionType === 'clone_item' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kaynak Item ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.item.id}}"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute şeması için Item Tipi (opsiyonel)</label>
            <Select
              value={itemTypeId}
              onChange={(e) =>
                onChange({
                  ...config,
                  actionConfig: { ...actionConfig, itemTypeId: e.target.value, overrides: {} },
                })
              }
              options={itemTypeOptions}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Kopyada override etmek istediğiniz attribute değerleri için seçin.
            </p>
          </div>

          {itemTypeId ? (
            <OverrideAttributeFields
              attributes={attributes}
              loading={attrLoading}
              values={(actionConfig.overrides as Record<string, string>) ?? {}}
              onChange={(key, val) => {
                const existing = (actionConfig.overrides as Record<string, unknown>) ?? {};
                updateActionConfig('overrides', { ...existing, [key]: val });
              }}
            />
          ) : (
            <ManualAttributeEditor
              values={(actionConfig.overrides as Record<string, string>) ?? {}}
              onChange={(key, val) => {
                const existing = (actionConfig.overrides as Record<string, unknown>) ?? {};
                updateActionConfig('overrides', { ...existing, [key]: val });
              }}
              label="Üzerine Yazılacak Attribute'lar (opsiyonel)"
            />
          )}
        </div>
      )}

      {/* ---- find_items ---- */}
      {actionType === 'find_items' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Tipi</label>
            <Select
              value={(actionConfig.itemTypeId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemTypeId', e.target.value)}
              options={itemTypeOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kategori ID'leri (opsiyonel, virgülle ayırın)</label>
            <Input
              value={(actionConfig.categoryIds as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryIds', e.target.value)}
              placeholder="id1,id2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Aile ID'leri (opsiyonel, virgülle ayırın)</label>
            <Input
              value={(actionConfig.familyIds as string) ?? ''}
              onChange={(e) => updateActionConfig('familyIds', e.target.value)}
              placeholder="id1,id2"
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

      {/* ---- bulk_update_items ---- */}
      {actionType === 'bulk_update_items' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item Tipi <span className="text-destructive">*</span></label>
            <Select
              value={(actionConfig.itemTypeId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemTypeId', e.target.value)}
              options={itemTypeOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Filtre: Kategori ID'leri (opsiyonel)</label>
            <Input
              value={(actionConfig.categoryIds as string) ?? ''}
              onChange={(e) => updateActionConfig('categoryIds', e.target.value)}
              placeholder="id1,id2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Filtre: Aile ID'leri (opsiyonel)</label>
            <Input
              value={(actionConfig.familyIds as string) ?? ''}
              onChange={(e) => updateActionConfig('familyIds', e.target.value)}
              placeholder="id1,id2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Kategori ID (opsiyonel)</label>
            <Input
              value={(actionConfig.updateCategoryId as string) ?? ''}
              onChange={(e) => updateActionConfig('updateCategoryId', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Aile ID (opsiyonel)</label>
            <Input
              value={(actionConfig.updateFamilyId as string) ?? ''}
              onChange={(e) => updateActionConfig('updateFamilyId', e.target.value)}
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
            <p className="text-xs text-warning font-medium">Bu aksiyon birden fazla item'ı toplu günceller.</p>
          </div>
        </div>
      )}

      {/* ---- update_field ---- */}
      {actionType === 'update_field' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.item.id}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute Key <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.attributeKey as string) ?? ''}
              onChange={(e) => updateActionConfig('attributeKey', e.target.value)}
              placeholder="status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Değer <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="approved veya {{trigger.value}}"
            />
          </div>
          <p className="text-xs text-muted-foreground">Template değişkenleri kullanılabilir.</p>
        </div>
      )}

      {/* ---- assign_attribute ---- */}
      {actionType === 'assign_attribute' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Item ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.itemId as string) ?? ''}
              onChange={(e) => updateActionConfig('itemId', e.target.value)}
              placeholder="{{trigger.item.id}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Attribute ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.attributeId as string) ?? ''}
              onChange={(e) => updateActionConfig('attributeId', e.target.value)}
              placeholder="Attribute MongoDB ID'si"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değer <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="{{trigger.value}} veya statik değer"
            />
          </div>
        </div>
      )}

      {/* ---- create_board_task ---- */}
      {actionType === 'create_board_task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Board ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.boardId as string) ?? ''}
              onChange={(e) => updateActionConfig('boardId', e.target.value)}
              placeholder="{{trigger.boardId}} veya ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Başlık <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.title as string) ?? ''}
              onChange={(e) => updateActionConfig('title', e.target.value)}
              placeholder="{{trigger.item.name}} görevi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hedef Kolon ID (opsiyonel)</label>
            <Input
              value={(actionConfig.columnId as string) ?? ''}
              onChange={(e) => updateActionConfig('columnId', e.target.value)}
              placeholder="Boş bırakılırsa ilk kolona eklenir"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Açıklama (opsiyonel)</label>
            <Textarea
              value={(actionConfig.description as string) ?? ''}
              onChange={(e) => updateActionConfig('description', e.target.value)}
              rows={2}
              placeholder="Görev açıklaması..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Öncelik</label>
            <Select
              value={(actionConfig.priority as string) ?? ''}
              onChange={(e) => updateActionConfig('priority', e.target.value)}
              options={[
                { value: '', label: 'Seçiniz...' },
                { value: 'low', label: 'Düşük' },
                { value: 'medium', label: 'Orta' },
                { value: 'high', label: 'Yüksek' },
                { value: 'critical', label: 'Kritik' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Atanacak Kişi ID (opsiyonel)</label>
            <Input
              value={(actionConfig.assigneeId as string) ?? ''}
              onChange={(e) => updateActionConfig('assigneeId', e.target.value)}
              placeholder="{{trigger.assigneeId}} veya kullanıcı ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bitiş Tarihi (opsiyonel)</label>
            <Input
              value={(actionConfig.dueDate as string) ?? ''}
              onChange={(e) => updateActionConfig('dueDate', e.target.value)}
              placeholder="2024-12-31 veya {{trigger.dueDate}}"
            />
          </div>
        </div>
      )}

      {/* ---- update_board_task ---- */}
      {actionType === 'update_board_task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Görev ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.taskId as string) ?? ''}
              onChange={(e) => updateActionConfig('taskId', e.target.value)}
              placeholder="{{trigger.taskId}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Yeni Başlık (opsiyonel)</label>
            <Input
              value={(actionConfig.title as string) ?? ''}
              onChange={(e) => updateActionConfig('title', e.target.value)}
              placeholder="Güncellenmeyecekse boş bırakın"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Öncelik (opsiyonel)</label>
            <Select
              value={(actionConfig.priority as string) ?? ''}
              onChange={(e) => updateActionConfig('priority', e.target.value)}
              options={[
                { value: '', label: 'Değiştirilmeyecek' },
                { value: 'low', label: 'Düşük' },
                { value: 'medium', label: 'Orta' },
                { value: 'high', label: 'Yüksek' },
                { value: 'critical', label: 'Kritik' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bitiş Tarihi (opsiyonel)</label>
            <Input
              value={(actionConfig.dueDate as string) ?? ''}
              onChange={(e) => updateActionConfig('dueDate', e.target.value)}
              placeholder="2024-12-31 veya {{trigger.dueDate}}"
            />
          </div>
        </div>
      )}

      {/* ---- move_board_task ---- */}
      {actionType === 'move_board_task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Görev ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.taskId as string) ?? ''}
              onChange={(e) => updateActionConfig('taskId', e.target.value)}
              placeholder="{{trigger.taskId}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Hedef Kolon ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.targetColumnId as string) ?? ''}
              onChange={(e) => updateActionConfig('targetColumnId', e.target.value)}
              placeholder="Hedef kolon ID'si"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Kolon İçi Sıra (opsiyonel)</label>
            <Input
              type="number"
              value={(actionConfig.targetOrder as number) ?? ''}
              onChange={(e) => updateActionConfig('targetOrder', parseInt(e.target.value, 10) || 9999)}
              placeholder="Boş = sona ekle"
              min={1}
            />
          </div>
        </div>
      )}

      {/* ---- assign_board_task ---- */}
      {actionType === 'assign_board_task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Görev ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.taskId as string) ?? ''}
              onChange={(e) => updateActionConfig('taskId', e.target.value)}
              placeholder="{{trigger.taskId}}"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Atanacak Kişi ID</label>
            <Input
              value={(actionConfig.assigneeId as string) ?? ''}
              onChange={(e) => updateActionConfig('assigneeId', e.target.value)}
              placeholder="{{trigger.userId}} — boş bırakılırsa ataması kaldırılır"
            />
          </div>
        </div>
      )}

      {/* ---- archive_board_task ---- */}
      {actionType === 'archive_board_task' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Görev ID <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.taskId as string) ?? ''}
              onChange={(e) => updateActionConfig('taskId', e.target.value)}
              placeholder="{{trigger.taskId}}"
            />
          </div>
        </div>
      )}

      {/* ---- send_notification ---- */}
      {actionType === 'send_notification' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bildirim Event Key <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.eventKey as string) ?? ''}
              onChange={(e) => updateActionConfig('eventKey', e.target.value)}
              placeholder="item.approved"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bildirim sisteminde tanımlı event anahtarı (örn. item.created, item.approved).
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Alıcı Tipi</label>
            <Select
              value={(actionConfig.recipientType as string) ?? 'user'}
              onChange={(e) => updateActionConfig('recipientType', e.target.value)}
              options={[
                { value: 'user', label: 'Belirli Kullanıcı' },
                { value: 'role', label: 'Rol' },
                { value: 'expression', label: 'Template Expression' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Alıcı</label>
            <Input
              value={(actionConfig.recipient as string) ?? ''}
              onChange={(e) => updateActionConfig('recipient', e.target.value)}
              placeholder={
                (actionConfig.recipientType as string) === 'role'
                  ? 'admin'
                  : (actionConfig.recipientType as string) === 'expression'
                    ? '{{trigger.item.createdBy}}'
                    : 'Kullanıcı ID'
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ek Veri (JSON, opsiyonel)</label>
            <Textarea
              value={(actionConfig.dataJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('dataJson', e.target.value)}
              rows={2}
              placeholder='{"itemId": "{{trigger.item.id}}"}'
            />
          </div>
        </div>
      )}

      {/* ---- send_email ---- */}
      {actionType === 'send_email' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Alıcı (To) <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.to as string) ?? ''}
              onChange={(e) => updateActionConfig('to', e.target.value)}
              placeholder="{{trigger.item.createdByEmail}} veya user@example.com"
            />
            <p className="text-xs text-muted-foreground mt-1">Birden fazla için virgülle ayırın.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Konu <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.subject as string) ?? ''}
              onChange={(e) => updateActionConfig('subject', e.target.value)}
              placeholder="{{trigger.item.name}} güncellendi"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Gövde <span className="text-destructive">*</span></label>
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

      {/* ---- webhook ---- */}
      {actionType === 'webhook' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL <span className="text-destructive">*</span></label>
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
            <label className="block text-sm font-medium text-foreground mb-1">Headers (JSON, opsiyonel)</label>
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
              placeholder='{"itemId": "{{trigger.item.id}}"}'
            />
          </div>
        </div>
      )}

      {/* ---- http_request ---- */}
      {actionType === 'http_request' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL <span className="text-destructive">*</span></label>
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

      {/* ---- transform_data ---- */}
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

      {/* ---- set_variable ---- */}
      {actionType === 'set_variable' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değişken Adı <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.variableName as string) ?? ''}
              onChange={(e) => updateActionConfig('variableName', e.target.value)}
              placeholder="myVar"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Değer <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.value as string) ?? ''}
              onChange={(e) => updateActionConfig('value', e.target.value)}
              placeholder="{{trigger.item.id}} veya statik değer"
            />
          </div>
        </div>
      )}

      {/* ---- log ---- */}
      {actionType === 'log' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Mesaj <span className="text-destructive">*</span></label>
            <Textarea
              value={(actionConfig.message as string) ?? ''}
              onChange={(e) => updateActionConfig('message', e.target.value)}
              rows={2}
              placeholder="Item {{trigger.item.id}} işlendi."
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

      {/* ---- fire_event ---- */}
      {actionType === 'fire_event' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Event Key <span className="text-destructive">*</span></label>
            <Input
              value={(actionConfig.eventKey as string) ?? ''}
              onChange={(e) => updateActionConfig('eventKey', e.target.value)}
              placeholder="item.approved"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Bu event'i dinleyen başka otomasyonlar tetiklenecektir.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Ek Payload (JSON, opsiyonel)</label>
            <Textarea
              value={(actionConfig.payloadJson as string) ?? '{}'}
              onChange={(e) => updateActionConfig('payloadJson', e.target.value)}
              rows={3}
              placeholder='{"itemId": "{{trigger.item.id}}", "status": "approved"}'
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Manual Attribute Editor (for update_item without schema)           */
/* ------------------------------------------------------------------ */

interface ManualAttributeEditorProps {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  label?: string;
}

const ManualAttributeEditor: React.FC<ManualAttributeEditorProps> = ({
  values,
  onChange,
  label = 'Güncellenecek Attribute\'lar (opsiyonel)',
}) => {
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>(() =>
    Object.entries(values).map(([k, v]) => ({ key: k, value: String(v) })),
  );

  const commit = (updated: { key: string; value: string }[]) => {
    setPairs(updated);
    updated.forEach(({ key, value }) => {
      if (key.trim()) onChange(key.trim(), value);
    });
  };

  const addPair = () => commit([...pairs, { key: '', value: '' }]);

  const updatePair = (idx: number, field: 'key' | 'value', val: string) => {
    const next = pairs.map((p, i) => (i === idx ? { ...p, [field]: val } : p));
    commit(next);
  };

  const removePair = (idx: number) => commit(pairs.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      {pairs.map((pair, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <Input
            value={pair.key}
            onChange={(e) => updatePair(idx, 'key', e.target.value)}
            placeholder="attribute_key"
            className="flex-1"
          />
          <Input
            value={pair.value}
            onChange={(e) => updatePair(idx, 'value', e.target.value)}
            placeholder="değer veya {{trigger.xxx}}"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => removePair(idx)}
            className="text-destructive hover:text-destructive/80 text-sm font-medium"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addPair}
        className="text-xs text-primary hover:underline"
      >
        + Alan Ekle
      </button>
      <p className="text-xs text-muted-foreground">
        Item tipi seçerek attribute şemasını otomatik yükleyebilirsiniz.
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Override Attribute Fields (for clone_item)                         */
/* ------------------------------------------------------------------ */

interface OverrideAttributeFieldsProps {
  attributes: Attribute[];
  loading: boolean;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const OverrideAttributeFields: React.FC<OverrideAttributeFieldsProps> = ({
  attributes,
  loading,
  values,
  onChange,
}) => {
  if (loading) return <p className="text-xs text-muted-foreground">Yükleniyor...</p>;
  if (attributes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Override Edilecek Attribute'lar (opsiyonel)
      </p>
      {attributes.map((attr) => (
        <div key={attr.id}>
          <label className="block text-sm font-medium text-foreground mb-1">
            {attr.name}
            <span className="text-xs text-muted-foreground ml-2 font-normal">({attr.key})</span>
          </label>
          {renderAttrInput(attr, values[attr.key ?? ''] ?? '', (v) =>
            onChange(attr.key ?? attr.id, v),
          )}
        </div>
      ))}
    </div>
  );
};
