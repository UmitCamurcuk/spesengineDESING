import React from 'react';
import { 
  Type, 
  Hash, 
  ToggleLeft, 
  Calendar, 
  Clock, 
  ChevronDown,
  List,
  File,
  Image,
  Paperclip,
  Box,
  Layers,
  Code,
  Calculator,
  Zap,
  LayoutGrid,
  Palette,
  FileText,
  Star,
  Scan,
  QrCode,
  Eye
} from 'lucide-react';
import { AttributeType } from '../../types';
import { cn } from '../../utils/cn';
import { useLanguage } from '../../contexts/LanguageContext';

interface AttributeTypeCardProps {
  type: AttributeType;
  selected?: boolean;
  onClick?: () => void;
}

export interface AttributeTypeMeta {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  translation: string;
}

export const ATTRIBUTE_TYPE_META: Record<AttributeType, AttributeTypeMeta> = {
  [AttributeType.TEXT]: { icon: Type, color: 'from-blue-500 to-blue-600', translation: 'text' },
  [AttributeType.NUMBER]: { icon: Hash, color: 'from-emerald-500 to-emerald-600', translation: 'number' },
  [AttributeType.BOOLEAN]: { icon: ToggleLeft, color: 'from-purple-500 to-purple-600', translation: 'boolean' },
  [AttributeType.DATE]: { icon: Calendar, color: 'from-orange-500 to-orange-600', translation: 'date' },
  [AttributeType.DATETIME]: { icon: Calendar, color: 'from-orange-500 to-red-500', translation: 'datetime' },
  [AttributeType.TIME]: { icon: Clock, color: 'from-cyan-500 to-cyan-600', translation: 'time' },
  [AttributeType.SELECT]: { icon: ChevronDown, color: 'from-indigo-500 to-indigo-600', translation: 'select' },
  [AttributeType.MULTISELECT]: { icon: List, color: 'from-indigo-500 to-purple-500', translation: 'multiselect' },
  [AttributeType.FILE]: { icon: File, color: 'from-gray-500 to-gray-600', translation: 'file' },
  [AttributeType.IMAGE]: { icon: Image, color: 'from-pink-500 to-pink-600', translation: 'image' },
  [AttributeType.ATTACHMENT]: { icon: Paperclip, color: 'from-gray-500 to-slate-600', translation: 'attachment' },
  [AttributeType.OBJECT]: { icon: Box, color: 'from-teal-500 to-teal-600', translation: 'object' },
  [AttributeType.ARRAY]: { icon: Layers, color: 'from-teal-500 to-cyan-500', translation: 'array' },
  [AttributeType.JSON]: { icon: Code, color: 'from-yellow-500 to-yellow-600', translation: 'json' },
  [AttributeType.FORMULA]: { icon: Calculator, color: 'from-green-500 to-green-600', translation: 'formula' },
  [AttributeType.EXPRESSION]: { icon: Zap, color: 'from-yellow-500 to-orange-500', translation: 'expression' },
  [AttributeType.TABLE]: { icon: LayoutGrid, color: 'from-slate-500 to-slate-600', translation: 'table' },
  [AttributeType.COLOR]: { icon: Palette, color: 'from-rose-500 to-pink-500', translation: 'color' },
  [AttributeType.RICH_TEXT]: { icon: FileText, color: 'from-violet-500 to-violet-600', translation: 'rich_text' },
  [AttributeType.RATING]: { icon: Star, color: 'from-amber-500 to-amber-600', translation: 'rating' },
  [AttributeType.BARCODE]: { icon: Scan, color: 'from-gray-600 to-gray-700', translation: 'barcode' },
  [AttributeType.QR]: { icon: QrCode, color: 'from-gray-600 to-slate-700', translation: 'qr' },
  [AttributeType.READONLY]: { icon: Eye, color: 'from-gray-400 to-gray-500', translation: 'readonly' },
};

export const getAttributeTypeInfo = (type: AttributeType, translate: (key: string) => string) => {
  if (ATTRIBUTE_TYPE_META[type]) {
    const config = ATTRIBUTE_TYPE_META[type];
    return {
      icon: config.icon,
      color: config.color,
      name: translate(`attributes.types.${config.translation}.name`),
      description: translate(`attributes.types.${config.translation}.description`),
    };
  }

  return {
    icon: Type,
    color: 'from-gray-500 to-gray-600',
    name: translate('attributes.types.unknown.name'),
    description: translate('attributes.types.unknown.description'),
  };
};

export const AttributeTypeCard: React.FC<AttributeTypeCardProps> = ({
  type,
  selected = false,
  onClick
}) => {
  const { t } = useLanguage();
  const info = getAttributeTypeInfo(type, t);
  const Icon = info.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-6 border-2 rounded-xl transition-all duration-200 text-left w-full hover:shadow-md',
        selected
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border hover:border-border hover:bg-muted'
      )}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${info.color} shadow-sm`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{info.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.description}</p>
        </div>
      </div>
    </button>
  );
};
