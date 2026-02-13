import React, { useEffect, useState, useCallback } from 'react';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Bot,
  Brain,
  Shield,
  Settings,
  Palette,
  Code2,
  MessageSquare,
  Copy,
  Check,
  Info,
  X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Checkbox } from '../../components/ui/Checkbox';
import type { ChatbotConfig, FallbackRule, LLMProvider, WidgetSettings } from '../../types';
import { chatbotConfigService } from '../../api/services/chatbot.service';

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  position: 'bottom-right',
  primaryColor: '#6366f1',
  bubbleSize: 56,
  title: 'AI Asistan',
  subtitle: '',
  avatarUrl: '',
  showOnPages: 'all',
  customPages: [],
  embedEnabled: false,
  embedAllowedDomains: [],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const ChatbotSettings: React.FC = () => {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ChatbotConfig | null>(null);
  const [activeTab, setActiveTab] = useState('llm');
  const [copied, setCopied] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    llmSettings: {
      provider: 'openai' as LLMProvider,
      model: 'gpt-4o',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      baseUrl: '',
      apiKeyHeader: '',
    },
    knowledgeBaseScope: {
      includeItems: true,
      includeAttributes: true,
      includeCategories: true,
      includeFamilies: true,
      includeItemTypes: true,
      includeUsers: false,
      includeAssociations: false,
      customInstructions: '',
    },
    fallbackRules: [] as FallbackRule[],
    welcomeMessage: '',
    maxConversationLength: 50,
    responseLanguage: 'tr',
    widgetSettings: { ...DEFAULT_WIDGET_SETTINGS },
  });

  useEffect(() => {
    let cancelled = false;

    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const { items } = await chatbotConfigService.list();
        if (!cancelled) {
          setConfigs(items);
          if (items.length > 0) {
            const active = items.find((c) => c.isActive) ?? items[0];
            setSelectedConfig(active);
            populateForm(active);
          }
        }
      } catch (err: any) {
        console.error('Failed to load chatbot configs', err);
        addToast({ type: 'error', message: 'Chatbot ayarlari yuklenemedi' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchConfigs();
    return () => {
      cancelled = true;
    };
  }, []);

  const populateForm = useCallback((config: ChatbotConfig) => {
    setForm({
      name: config.name,
      description: config.description ?? '',
      isActive: config.isActive,
      llmSettings: {
        provider: config.llmSettings.provider,
        model: config.llmSettings.model,
        apiKey: config.llmSettings.apiKey,
        temperature: config.llmSettings.temperature ?? 0.7,
        maxTokens: config.llmSettings.maxTokens ?? 2048,
        systemPrompt: config.llmSettings.systemPrompt ?? '',
        baseUrl: config.llmSettings.baseUrl ?? '',
        apiKeyHeader: config.llmSettings.apiKeyHeader ?? '',
      },
      knowledgeBaseScope: { ...config.knowledgeBaseScope },
      fallbackRules: [...config.fallbackRules],
      welcomeMessage: config.welcomeMessage ?? '',
      maxConversationLength: config.maxConversationLength,
      responseLanguage: config.responseLanguage ?? 'tr',
      widgetSettings: {
        ...DEFAULT_WIDGET_SETTINGS,
        ...(config.widgetSettings ?? {}),
      },
    });
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (selectedConfig) {
        const updated = await chatbotConfigService.update(selectedConfig.id, form);
        setSelectedConfig(updated);
        // Update configs list so sidebar stays in sync
        setConfigs((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        addToast({ type: 'success', message: 'Ayarlar guncellendi' });
      } else {
        const created = await chatbotConfigService.create(form);
        setSelectedConfig(created);
        setConfigs((prev) => [...prev, created]);
        addToast({ type: 'success', message: 'Chatbot konfigurasyonu olusturuldu' });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        err?.message ??
        'Kaydetme basarisiz';
      addToast({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const addFallbackRule = () => {
    const newRule: FallbackRule = {
      id: crypto.randomUUID(),
      pattern: '',
      matchType: 'keyword',
      response: '',
      priority: form.fallbackRules.length,
      isActive: true,
    };
    setForm((prev) => ({
      ...prev,
      fallbackRules: [...prev.fallbackRules, newRule],
    }));
  };

  const updateRule = (index: number, updates: Partial<FallbackRule>) => {
    setForm((prev) => ({
      ...prev,
      fallbackRules: prev.fallbackRules.map((rule, i) =>
        i === index ? { ...rule, ...updates } : rule,
      ),
    }));
  };

  const removeRule = (index: number) => {
    setForm((prev) => ({
      ...prev,
      fallbackRules: prev.fallbackRules.filter((_, i) => i !== index),
    }));
  };

  const updateLLM = (key: string, value: unknown) => {
    setForm((p) => ({
      ...p,
      llmSettings: { ...p.llmSettings, [key]: value },
    }));
  };

  const updateWidget = (key: string, value: unknown) => {
    setForm((p) => ({
      ...p,
      widgetSettings: { ...p.widgetSettings, [key]: value },
    }));
  };

  const addAllowedDomain = () => {
    setForm((p) => ({
      ...p,
      widgetSettings: {
        ...p.widgetSettings,
        embedAllowedDomains: [...p.widgetSettings.embedAllowedDomains, ''],
      },
    }));
  };

  const updateAllowedDomain = (index: number, value: string) => {
    setForm((p) => ({
      ...p,
      widgetSettings: {
        ...p.widgetSettings,
        embedAllowedDomains: p.widgetSettings.embedAllowedDomains.map((d, i) =>
          i === index ? value : d,
        ),
      },
    }));
  };

  const removeAllowedDomain = (index: number) => {
    setForm((p) => ({
      ...p,
      widgetSettings: {
        ...p.widgetSettings,
        embedAllowedDomains: p.widgetSettings.embedAllowedDomains.filter((_, i) => i !== index),
      },
    }));
  };

  const embedCode = selectedConfig
    ? `<script src="${window.location.origin}/api/chatbot/widget.js" data-config-id="${selectedConfig.id}"></script>`
    : '';

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabItems = [
    { id: 'llm', label: 'LLM Ayarlari', icon: <Bot className="h-4 w-4" /> },
    { id: 'knowledge', label: 'Bilgi Tabani', icon: <Brain className="h-4 w-4" /> },
    { id: 'rules', label: 'Fallback Kurallari', icon: <Shield className="h-4 w-4" /> },
    { id: 'general', label: 'Genel', icon: <Settings className="h-4 w-4" /> },
    { id: 'appearance', label: 'Gorunum', icon: <Palette className="h-4 w-4" /> },
    { id: 'integration', label: 'Entegrasyon', icon: <Code2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot Ayarlari"
        subtitle="AI chatbot konfigurasyonunu yonetin"
        action={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        }
      />

      <Tabs
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />

      {/* LLM Settings Tab */}
      {activeTab === 'llm' && (
        <TabPanel>
          <Card>
            <CardHeader title="LLM Konfigurasyonu" subtitle="AI modeli ve baglanti ayarlari" />
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Config Ismi"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Varsayilan Chatbot"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Provider"
                    value={form.llmSettings.provider}
                    onChange={(e) => updateLLM('provider', e.target.value)}
                    options={[
                      { value: 'openai', label: 'OpenAI' },
                      { value: 'anthropic', label: 'Anthropic' },
                      { value: 'custom', label: 'Custom (Self-hosted)' },
                    ]}
                  />
                  <Input
                    label="Model"
                    value={form.llmSettings.model}
                    onChange={(e) => updateLLM('model', e.target.value)}
                    placeholder={form.llmSettings.provider === 'custom' ? 'llama3 / mistral / codellama' : 'gpt-4o / claude-sonnet-4-5-20250929'}
                  />
                </div>

                <Input
                  label={`API Key${form.llmSettings.provider === 'custom' ? ' (opsiyonel)' : ''}`}
                  type="password"
                  value={form.llmSettings.apiKey}
                  onChange={(e) => updateLLM('apiKey', e.target.value)}
                  placeholder={form.llmSettings.provider === 'custom' ? 'Bos birakilabilir (orn. Ollama)' : 'sk-...'}
                  helperText={form.llmSettings.provider === 'custom' ? 'Local LLM (Ollama vb.) kullaniyorsaniz bos birakabilirsiniz' : undefined}
                />

                {form.llmSettings.provider === 'custom' && (
                  <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Custom provider OpenAI-uyumlu bir API endpoint'i beklenmektedir.
                        Ollama, LM Studio, vLLM gibi araclar desteklenir.
                      </p>
                    </div>
                    <Input
                      label="Base URL"
                      value={form.llmSettings.baseUrl ?? ''}
                      onChange={(e) => updateLLM('baseUrl', e.target.value)}
                      placeholder="http://localhost:11434/v1"
                      helperText="OpenAI-uyumlu API endpoint URL'i (/chat/completions otomatik eklenir)"
                    />
                    <Input
                      label="API Key Header (opsiyonel)"
                      value={form.llmSettings.apiKeyHeader ?? ''}
                      onChange={(e) => updateLLM('apiKeyHeader', e.target.value)}
                      placeholder="Authorization"
                      helperText="Bos birakilirsa 'Authorization: Bearer <key>' kullanilir"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Temperature ({form.llmSettings.temperature})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={form.llmSettings.temperature}
                      onChange={(e) => updateLLM('temperature', Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Kesin</span>
                      <span>Yaratici</span>
                    </div>
                  </div>
                  <Input
                    label="Max Tokens"
                    type="number"
                    value={form.llmSettings.maxTokens}
                    onChange={(e) => updateLLM('maxTokens', Number(e.target.value))}
                  />
                </div>

                <Textarea
                  label="System Prompt"
                  value={form.llmSettings.systemPrompt}
                  onChange={(e) => updateLLM('systemPrompt', e.target.value)}
                  rows={5}
                  placeholder="Sen SpesEngine MDM sisteminin AI asistanisin..."
                />
              </div>
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <TabPanel>
          <Card>
            <CardHeader
              title="Bilgi Tabani Kapsami"
              subtitle="Chatbot'un hangi sistem verilerine erisebilecegini secin"
            />
            <CardContent>
              <div className="space-y-3">
                {([
                  ['includeItems', 'Items (Urunler)'],
                  ['includeAttributes', 'Attributes (Oznitelikler)'],
                  ['includeCategories', 'Categories (Kategoriler)'],
                  ['includeFamilies', 'Families (Aileler)'],
                  ['includeItemTypes', 'Item Types (Urun Tipleri)'],
                  ['includeUsers', 'Users (Kullanicilar)'],
                  ['includeAssociations', 'Associations (Iliskiler)'],
                ] as const).map(([key, label]) => (
                  <Checkbox
                    key={key}
                    label={label}
                    checked={form.knowledgeBaseScope[key]}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        knowledgeBaseScope: {
                          ...p.knowledgeBaseScope,
                          [key]: (e.target as HTMLInputElement).checked,
                        },
                      }))
                    }
                  />
                ))}

                <div className="pt-4">
                  <Textarea
                    label="Ozel Talimatlar"
                    value={form.knowledgeBaseScope.customInstructions}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        knowledgeBaseScope: {
                          ...p.knowledgeBaseScope,
                          customInstructions: e.target.value,
                        },
                      }))
                    }
                    rows={4}
                    placeholder="Chatbot'a ozel talimatlar ekleyin..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Fallback Rules Tab */}
      {activeTab === 'rules' && (
        <TabPanel>
          <Card>
            <CardHeader
              title="Fallback Kurallari"
              subtitle="AI cevap veremedigi durumlarda devreye girecek kural tabanli cevaplar"
              action={
                <Button size="sm" onClick={addFallbackRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Kural Ekle
                </Button>
              }
            />
            <CardContent>
              {form.fallbackRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Henuz fallback kurali eklenmemis.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {form.fallbackRules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Badge variant={rule.isActive ? 'success' : 'secondary'}>
                            {rule.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Oncelik: {rule.priority}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error"
                          onClick={() => removeRule(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Select
                          label="Eslesme Tipi"
                          value={rule.matchType}
                          onChange={(e) =>
                            updateRule(index, { matchType: e.target.value as any })
                          }
                          options={[
                            { value: 'keyword', label: 'Anahtar Kelime' },
                            { value: 'regex', label: 'Regex' },
                            { value: 'intent', label: 'Intent' },
                          ]}
                        />
                        <Input
                          label="Pattern"
                          value={rule.pattern}
                          onChange={(e) => updateRule(index, { pattern: e.target.value })}
                          placeholder="merhaba,selam,hey"
                        />
                        <Input
                          label="Oncelik"
                          type="number"
                          value={rule.priority}
                          onChange={(e) =>
                            updateRule(index, { priority: Number(e.target.value) })
                          }
                        />
                      </div>

                      <Textarea
                        label="Cevap"
                        value={rule.response}
                        onChange={(e) => updateRule(index, { response: e.target.value })}
                        rows={2}
                        placeholder="Kullaniciya verilecek cevap..."
                      />

                      <Checkbox
                        label="Aktif"
                        checked={rule.isActive}
                        onChange={(e) =>
                          updateRule(index, {
                            isActive: (e.target as HTMLInputElement).checked,
                          })
                        }
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* General Tab */}
      {activeTab === 'general' && (
        <TabPanel>
          <Card>
            <CardHeader title="Genel Ayarlar" subtitle="Chatbot temel konfigurasyonu" />
            <CardContent>
              <div className="space-y-4">
                <Input
                  label="Config Ismi"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />

                <Textarea
                  label="Aciklama"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="Bu konfigurasyonun amaci..."
                />

                <Textarea
                  label="Karsilama Mesaji"
                  value={form.welcomeMessage}
                  onChange={(e) => setForm((p) => ({ ...p, welcomeMessage: e.target.value }))}
                  rows={3}
                  placeholder="Merhaba! Size nasil yardimci olabilirim?"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Maks. Sohbet Uzunlugu"
                    type="number"
                    value={form.maxConversationLength}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        maxConversationLength: Number(e.target.value),
                      }))
                    }
                  />
                  <Select
                    label="Cevap Dili"
                    value={form.responseLanguage}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, responseLanguage: e.target.value }))
                    }
                    options={[
                      { value: 'tr', label: 'Turkce' },
                      { value: 'en', label: 'English' },
                      { value: 'de', label: 'Deutsch' },
                      { value: 'fr', label: 'Francais' },
                    ]}
                  />
                </div>

                <Checkbox
                  label="Aktif"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      isActive: (e.target as HTMLInputElement).checked,
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <TabPanel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader title="Widget Gorunumu" subtitle="Chatbot butonunun gorunum ayarlari" />
              <CardContent>
                <div className="space-y-4">
                  <Select
                    label="Konum"
                    value={form.widgetSettings.position}
                    onChange={(e) => updateWidget('position', e.target.value)}
                    options={[
                      { value: 'bottom-right', label: 'Sag Alt' },
                      { value: 'bottom-left', label: 'Sol Alt' },
                    ]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Ana Renk
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.widgetSettings.primaryColor}
                        onChange={(e) => updateWidget('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded-md border border-border cursor-pointer"
                      />
                      <Input
                        value={form.widgetSettings.primaryColor}
                        onChange={(e) => updateWidget('primaryColor', e.target.value)}
                        placeholder="#6366f1"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Input
                    label="Buton Boyutu (px)"
                    type="number"
                    value={form.widgetSettings.bubbleSize}
                    onChange={(e) => updateWidget('bubbleSize', Number(e.target.value))}
                    helperText="32 - 96 px arasi"
                  />

                  <Input
                    label="Baslik"
                    value={form.widgetSettings.title}
                    onChange={(e) => updateWidget('title', e.target.value)}
                    placeholder="AI Asistan"
                  />

                  <Input
                    label="Alt Baslik"
                    value={form.widgetSettings.subtitle}
                    onChange={(e) => updateWidget('subtitle', e.target.value)}
                    placeholder="Size nasil yardimci olabilirim?"
                  />

                  <Input
                    label="Avatar URL"
                    value={form.widgetSettings.avatarUrl}
                    onChange={(e) => updateWidget('avatarUrl', e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    helperText="Bos birakilirsa varsayilan ikon kullanilir"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader title="Onizleme" subtitle="Widget'in gorunumu" />
              <CardContent>
                <div className="relative bg-muted/30 rounded-lg border border-dashed border-border h-[400px] flex items-end p-6">
                  <div
                    className={`absolute bottom-6 ${
                      form.widgetSettings.position === 'bottom-right' ? 'right-6' : 'left-6'
                    }`}
                  >
                    {/* Preview chat panel */}
                    <div
                      className="mb-3 rounded-xl shadow-xl border border-border bg-card overflow-hidden"
                      style={{ width: 300 }}
                    >
                      <div
                        className="px-4 py-3 text-white flex items-center gap-2"
                        style={{ backgroundColor: form.widgetSettings.primaryColor }}
                      >
                        {form.widgetSettings.avatarUrl ? (
                          <img
                            src={form.widgetSettings.avatarUrl}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold">
                            {form.widgetSettings.title || 'AI Asistan'}
                          </p>
                          {form.widgetSettings.subtitle && (
                            <p className="text-xs opacity-80">{form.widgetSettings.subtitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="bg-muted rounded-lg p-2 text-xs text-foreground max-w-[80%]">
                          {form.welcomeMessage || 'Merhaba! Size nasil yardimci olabilirim?'}
                        </div>
                      </div>
                    </div>

                    {/* Preview bubble button */}
                    <button
                      className="rounded-full shadow-lg flex items-center justify-center text-white"
                      style={{
                        width: form.widgetSettings.bubbleSize,
                        height: form.widgetSettings.bubbleSize,
                        backgroundColor: form.widgetSettings.primaryColor,
                        marginLeft:
                          form.widgetSettings.position === 'bottom-right' ? 'auto' : undefined,
                        marginRight:
                          form.widgetSettings.position === 'bottom-left' ? 'auto' : undefined,
                        float:
                          form.widgetSettings.position === 'bottom-right' ? 'right' : 'left',
                      }}
                    >
                      {form.widgetSettings.avatarUrl ? (
                        <img
                          src={form.widgetSettings.avatarUrl}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <MessageSquare className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      )}

      {/* Integration Tab */}
      {activeTab === 'integration' && (
        <TabPanel>
          <Card>
            <CardHeader
              title="Entegrasyon"
              subtitle="Chatbot'u harici sayfalara gomulebilir sekilde yapilandirin"
            />
            <CardContent>
              <div className="space-y-6">
                <Checkbox
                  label="Embed'i etkinlestir"
                  checked={form.widgetSettings.embedEnabled}
                  onChange={(e) =>
                    updateWidget('embedEnabled', (e.target as HTMLInputElement).checked)
                  }
                  helperText="Etkinlestirildiginde chatbot harici sayfalara gomulecektir"
                />

                {form.widgetSettings.embedEnabled && (
                  <>
                    {/* Embed Code */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Embed Kodu
                      </label>
                      <div className="relative">
                        <pre className="rounded-lg border border-border bg-muted/50 p-4 text-xs font-mono text-foreground overflow-x-auto">
                          {embedCode || 'Oncelikle ayarlari kaydederek bir config ID olusturun.'}
                        </pre>
                        {embedCode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={copyEmbedCode}
                          >
                            {copied ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Bu kodu landing sayfanizin {'<body>'} etiketinin sonuna ekleyin.
                      </p>
                    </div>

                    {/* Allowed Domains */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          Izin Verilen Domain'ler
                        </label>
                        <Button size="sm" variant="outline" onClick={addAllowedDomain}>
                          <Plus className="h-3 w-3 mr-1" />
                          Ekle
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        Bos birakilirsa tum domain'lerden erisilebilir.
                      </p>

                      {form.widgetSettings.embedAllowedDomains.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          Tum domain'lere acik
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {form.widgetSettings.embedAllowedDomains.map((domain, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={domain}
                                onChange={(e) => updateAllowedDomain(index, e.target.value)}
                                placeholder="example.com"
                                className="flex-1"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error flex-shrink-0"
                                onClick={() => removeAllowedDomain(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabPanel>
      )}
    </div>
  );
};
