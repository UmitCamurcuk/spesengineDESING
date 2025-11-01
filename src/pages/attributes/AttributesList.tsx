import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Package,
  Type,
  Hash as HashIcon,
  ToggleLeft,
  Calendar,
  Image,
  Paperclip,
  FileText,
  Code,
  List,
  CheckSquare,
  Table,
  Palette,
  Calculator,
  Braces,
  BarChart3,
  Clock,
  Calendar as CalendarIcon,
  Star,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Attribute, AttributeType } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { attributesService } from '../../api/services/attributes.service';

const getAttributeTypeIcon = (type: AttributeType, name?: string) => {
  if (name && name.toLowerCase().includes('rating')) {
    return Star;
  }

  switch (type) {
    case AttributeType.TEXT:
      return Type;
    case AttributeType.NUMBER:
      return HashIcon;
    case AttributeType.BOOLEAN:
      return ToggleLeft;
    case AttributeType.DATE:
      return Calendar;
    case AttributeType.IMAGE:
      return Image;
    case AttributeType.ATTACHMENT:
      return Paperclip;
    case AttributeType.JSON:
      return Code;
    case AttributeType.ARRAY:
      return List;
    case AttributeType.SELECT:
      return CheckSquare;
    case AttributeType.RICH_TEXT:
      return FileText;
    case AttributeType.TABLE:
      return Table;
    case AttributeType.COLOR:
      return Palette;
    case AttributeType.FORMULA:
      return Calculator;
    case AttributeType.OBJECT:
      return Braces;
    case AttributeType.BARCODE:
      return BarChart3;
    case AttributeType.TIME:
      return Clock;
    case AttributeType.DATETIME:
      return CalendarIcon;
    case AttributeType.EXPRESSION:
      return Code;
    default:
      return Type;
  }
};

const getAttributeTypeLabel = (type: AttributeType, t: (key: string) => string) => {
  switch (type) {
    case AttributeType.TEXT:
      return t('attributes.types.text');
    case AttributeType.NUMBER:
      return t('attributes.types.number');
    case AttributeType.BOOLEAN:
      return t('attributes.types.boolean');
    case AttributeType.DATE:
      return t('attributes.types.date');
    case AttributeType.IMAGE:
      return t('attributes.types.image');
    case AttributeType.ATTACHMENT:
      return t('attributes.types.attachment');
    case AttributeType.JSON:
      return t('attributes.types.json');
    case AttributeType.ARRAY:
      return t('attributes.types.array');
    case AttributeType.SELECT:
      return t('attributes.types.select');
    case AttributeType.RICH_TEXT:
      return t('attributes.types.rich_text');
    case AttributeType.TABLE:
      return t('attributes.types.table');
    case AttributeType.COLOR:
      return t('attributes.types.color');
    case AttributeType.FORMULA:
      return t('attributes.types.formula');
    case AttributeType.OBJECT:
      return t('attributes.types.object');
    case AttributeType.BARCODE:
      return t('attributes.types.barcode');
    case AttributeType.TIME:
      return t('attributes.types.time');
    case AttributeType.DATETIME:
      return t('attributes.types.datetime');
    case AttributeType.EXPRESSION:
      return t('attributes.types.expression');
    default:
      return type;
  }
};

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
};

export const AttributesList: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { hasPermission } = useAuth();
  const [items, setItems] = useState<Attribute[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateAttribute = hasPermission(PERMISSIONS.CATALOG.ATTRIBUTES.CREATE);

  useEffect(() => {
    let mounted = true;

    const fetchAttributes = async () => {
      try {
        setIsLoading(true);
        const data = await attributesService.list();
        if (!mounted) {
          return;
        }
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load attributes', err);
        if (mounted) {
          setError('Attribute listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAttributes();
    return () => {
      mounted = false;
    };
  }, [t]);

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: t('attributes.name'),
        sortable: true,
        render: (value: string, attribute: Attribute) => {
          const IconComponent = getAttributeTypeIcon(attribute.type, attribute.name);
          const typeLabel = getAttributeTypeLabel(attribute.type, t);

          return (
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs text-muted-foreground mt-1">{typeLabel}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                  {attribute.required && (
                    <Badge variant="error" size="sm">
                      {t('attributes.required')}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">ID: {attribute.id}</div>
              </div>
            </div>
          );
        },
      },
      {
        key: 'description',
        title: t('attributes.description'),
        render: (value?: string) => (
          <span className="text-sm text-muted-foreground line-clamp-2">{value ?? '—'}</span>
        ),
      },
      {
        key: 'options',
        title: t('attributes.options'),
        render: (value?: string[]) =>
          Array.isArray(value) && value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
              {value.length > 3 && (
                <span className="text-xs text-muted-foreground">+{value.length - 3}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        key: 'updatedAt',
        title: t('attributes.updated_at'),
        render: (value?: string) => <span className="text-sm text-muted-foreground">{formatDate(value)}</span>,
        sortable: true,
      },
    ],
    [t],
  );

  const handleRowClick = (attribute: Attribute) => {
    navigate(`/attributes/${attribute.id}`);
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={t('attributes.title')}
        subtitle={t('attributes.subtitle')}
        actions={
          canCreateAttribute
            ? [
                <Button key="create" onClick={() => navigate('/attributes/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('attributes.create_title')}
                </Button>,
              ]
            : undefined
        }
      />

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 mt-6">
        <DataTable<Attribute>
          data={items}
          columns={columns}
          loading={isLoading}
          searchPlaceholder="Search attributes..."
          onRowClick={handleRowClick}
          emptyState={{
            icon: <Package className="h-12 w-12" />,
            title: t('attributes.no_attributes'),
            description: t('attributes.create_new_attribute'),
            action: canCreateAttribute ? (
              <Button onClick={() => navigate('/attributes/create')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('attributes.create_title')}
              </Button>
            ) : undefined,
          }}
        />
      </div>
    </div>
  );
};

export default AttributesList;
