import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Globe, Languages, FileText } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, UserInfo } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader } from '../../components/ui/Card';
import { Localization } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

// Mock data
const mockLocalizations: Localization[] = [
  {
    id: '1',
    key: 'common.save',
    translations: {
      en: 'Save',
      tr: 'Kaydet',
      es: 'Guardar',
      fr: 'Enregistrer',
    },
    namespace: 'common',
    description: 'Save button text',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-25T10:30:00Z',
  },
  {
    id: '2',
    key: 'common.cancel',
    translations: {
      en: 'Cancel',
      tr: 'İptal',
      es: 'Cancelar',
      fr: 'Annuler',
    },
    namespace: 'common',
    description: 'Cancel button text',
    createdAt: '2024-01-02T09:15:00Z',
    updatedAt: '2024-01-24T15:45:00Z',
  },
  {
    id: '3',
    key: 'items.create_title',
    translations: {
      en: 'Create New Item',
      tr: 'Yeni Öğe Oluştur',
      es: 'Crear Nuevo Elemento',
      fr: 'Créer un Nouvel Élément',
    },
    namespace: 'items',
    description: 'Title for item creation page',
    createdAt: '2024-01-03T11:20:00Z',
    updatedAt: '2024-01-22T13:10:00Z',
  },
  {
    id: '4',
    key: 'validation.required',
    translations: {
      en: 'This field is required',
      tr: 'Bu alan zorunludur',
      es: 'Este campo es obligatorio',
      fr: 'Ce champ est obligatoire',
    },
    namespace: 'validation',
    description: 'Required field validation message',
    createdAt: '2024-01-04T15:30:00Z',
    updatedAt: '2024-01-21T10:20:00Z',
  },
];

const localizationSettings = [
  {
    id: 'supported-languages',
    feature: 'Supported Languages',
    category: 'Availability',
    description: 'Languages that are visible to end-users across the platform.',
    value: ['Türkçe', 'English', 'Deutsch', 'Français'],
    enabled: true,
    updatedAt: '2 hours ago',
  },
  {
    id: 'default-locale',
    feature: 'Default Locale',
    category: 'Behaviour',
    description: 'Language used for onboarding, emails, and guests until a preference is saved.',
    value: 'Türkçe',
    enabled: true,
    updatedAt: 'Yesterday',
  },
  {
    id: 'fallback-strategy',
    feature: 'Fallback Strategy',
    category: 'Behaviour',
    description: 'When a translation is missing, the system falls back to the selected language hierarchy.',
    value: ['User preference', 'Tenant default', 'System default'],
    enabled: true,
    updatedAt: '3 days ago',
  },
  {
    id: 'auto-machine-translate',
    feature: 'Auto Machine Translation',
    category: 'Automation',
    description: 'Automatically seed missing translations using machine translation providers.',
    value: 'DeepL + Google Translate',
    enabled: false,
    updatedAt: 'Last week',
  },
  {
    id: 'missing-key-alerts',
    feature: 'Missing Key Alerts',
    category: 'Quality',
    description: 'Notify system admins when a new translation key is required at runtime.',
    value: 'Slack #localization-alerts',
    enabled: true,
    updatedAt: '4 hours ago',
  },
];

export const LocalizationsList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const columns = [
    {
      key: 'key',
      title: 'Translation Key',
      sortable: true,
      render: (value: string, localization: Localization) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground font-mono">{value}</div>
            <div className="text-xs text-gray-500">ID: {localization.id}</div>
          </div>
        </div>
      ),
      mobileRender: (localization: Localization) => (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground font-mono">{localization.key}</div>
              <div className="text-xs text-gray-500">ID: {localization.id}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Namespace</div>
              <Badge variant="primary" size="sm">{localization.namespace}</Badge>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Languages</div>
              <div className="flex items-center space-x-1">
                <Languages className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{Object.keys(localization.translations).length}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
            <div className="text-sm text-gray-600">{localization.description}</div>
          </div>
          
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">English Translation</div>
            <div className="text-sm text-foreground italic">"{localization.translations.en}"</div>
          </div>
        </div>
      ),
    },
    {
      key: 'namespace',
      title: 'Namespace',
      sortable: true,
      render: (value: string) => (
        <Badge variant="primary" size="sm">{value}</Badge>
      ),
    },
    {
      key: 'translations',
      title: 'Languages',
      render: (value: Record<string, string>) => (
        <div className="flex items-center space-x-1">
          <Languages className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">{Object.keys(value).length}</span>
          <span className="text-xs text-gray-400">languages</span>
        </div>
      ),
    },
    {
      key: 'description',
      title: 'Description',
      render: (value: string) => (
        <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
      ),
    },
    {
      key: 'translations.en',
      title: 'English Text',
      render: (_: any, localization: Localization) => (
        <span className="text-sm text-foreground italic">"{localization.translations.en}"</span>
      ),
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      sortable: true,
      render: (value: string) => (
        <UserInfo
          name="System Admin"
          email="admin@company.com"
          date={value}
        />
      ),
    },
  ];

  const filters = [
    {
      key: 'namespace',
      label: 'All Namespaces',
      type: 'select' as const,
      options: [
        { value: 'common', label: 'Common' },
        { value: 'items', label: 'Items' },
        { value: 'validation', label: 'Validation' },
        { value: 'navigation', label: 'Navigation' },
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('localizations.title')}
        subtitle={t('localizations.subtitle')}
        action={
          <Button onClick={() => navigate('/localizations/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Translation
          </Button>
        }
      />
      
      <div className="flex-1 mt-6">
        <DataTable
          data={mockLocalizations}
          columns={columns}
          searchPlaceholder="Search translations..."
          filters={filters}
          onRowClick={(localization) => navigate(`/localizations/${localization.id}`)}
          emptyState={{
            icon: <Globe className="h-12 w-12" />,
            title: 'No translations found',
            description: 'Get started by creating your first translation',
            action: (
              <Button onClick={() => navigate('/localizations/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Translation
              </Button>
            )
          }}
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title={t('localizations.settings.title')}
          subtitle={t('localizations.settings.subtitle')}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left w-1/5">{t('localizations.settings.columns.feature')}</th>
                <th className="px-4 py-3 text-left w-2/5">{t('localizations.settings.columns.description')}</th>
                <th className="px-4 py-3 text-left w-1/5">{t('localizations.settings.columns.value')}</th>
                <th className="px-4 py-3 text-left w-1/5">{t('localizations.settings.columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {localizationSettings.map((setting) => (
                <tr key={setting.id}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{setting.feature}</div>
                        <div className="text-xs text-muted-foreground">{setting.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{setting.description}</td>
                  <td className="px-4 py-4">
                    {Array.isArray(setting.value) ? (
                      <div className="flex flex-wrap gap-2">
                        {setting.value.map((item) => (
                          <Badge key={item} variant="secondary" size="sm">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-foreground">{setting.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={setting.enabled ? 'success' : 'secondary'} size="sm">
                        {setting.enabled ? t('localizations.settings.enabled') : t('localizations.settings.disabled')}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {t('localizations.settings.manage')}
                      </Button>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {t('localizations.settings.updated', { value: setting.updatedAt })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
