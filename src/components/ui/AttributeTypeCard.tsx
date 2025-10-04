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

interface AttributeTypeCardProps {
  type: AttributeType;
  selected?: boolean;
  onClick?: () => void;
}

const getAttributeTypeInfo = (type: AttributeType) => {
  switch (type) {
    case AttributeType.TEXT:
      return {
        icon: Type,
        name: 'Text',
        description: 'Single line text input for names, titles, and short descriptions',
        color: 'from-blue-500 to-blue-600'
      };
    case AttributeType.NUMBER:
      return {
        icon: Hash,
        name: 'Number',
        description: 'Numeric values including integers and decimals',
        color: 'from-emerald-500 to-emerald-600'
      };
    case AttributeType.BOOLEAN:
      return {
        icon: ToggleLeft,
        name: 'Boolean',
        description: 'True/false or yes/no values',
        color: 'from-purple-500 to-purple-600'
      };
    case AttributeType.DATE:
      return {
        icon: Calendar,
        name: 'Date',
        description: 'Date picker for selecting specific dates',
        color: 'from-orange-500 to-orange-600'
      };
    case AttributeType.DATETIME:
      return {
        icon: Calendar,
        name: 'Date & Time',
        description: 'Combined date and time picker',
        color: 'from-orange-500 to-red-500'
      };
    case AttributeType.TIME:
      return {
        icon: Clock,
        name: 'Time',
        description: 'Time picker for hours and minutes',
        color: 'from-cyan-500 to-cyan-600'
      };
    case AttributeType.SELECT:
      return {
        icon: ChevronDown,
        name: 'Select',
        description: 'Dropdown with predefined options (single choice)',
        color: 'from-indigo-500 to-indigo-600'
      };
    case AttributeType.MULTISELECT:
      return {
        icon: List,
        name: 'Multi Select',
        description: 'Multiple choice selection from predefined options',
        color: 'from-indigo-500 to-purple-500'
      };
    case AttributeType.FILE:
      return {
        icon: File,
        name: 'File',
        description: 'File upload for documents and attachments',
        color: 'from-gray-500 to-gray-600'
      };
    case AttributeType.IMAGE:
      return {
        icon: Image,
        name: 'Image',
        description: 'Image upload with preview functionality',
        color: 'from-pink-500 to-pink-600'
      };
    case AttributeType.ATTACHMENT:
      return {
        icon: Paperclip,
        name: 'Attachment',
        description: 'General file attachment with metadata',
        color: 'from-gray-500 to-slate-600'
      };
    case AttributeType.OBJECT:
      return {
        icon: Box,
        name: 'Object',
        description: 'Complex nested object structure',
        color: 'from-teal-500 to-teal-600'
      };
    case AttributeType.ARRAY:
      return {
        icon: Layers,
        name: 'Array',
        description: 'List of multiple values or objects',
        color: 'from-teal-500 to-cyan-500'
      };
    case AttributeType.JSON:
      return {
        icon: Code,
        name: 'JSON',
        description: 'Raw JSON data structure',
        color: 'from-yellow-500 to-yellow-600'
      };
    case AttributeType.FORMULA:
      return {
        icon: Calculator,
        name: 'Formula',
        description: 'Calculated field based on other attributes',
        color: 'from-green-500 to-green-600'
      };
    case AttributeType.EXPRESSION:
      return {
        icon: Zap,
        name: 'Expression',
        description: 'Dynamic expression evaluation',
        color: 'from-yellow-500 to-orange-500'
      };
    case AttributeType.TABLE:
      return {
        icon: LayoutGrid,
        name: 'Table',
        description: 'Structured table data with rows and columns',
        color: 'from-slate-500 to-slate-600'
      };
    case AttributeType.COLOR:
      return {
        icon: Palette,
        name: 'Color',
        description: 'Color picker for hex, RGB, or HSL values',
        color: 'from-rose-500 to-pink-500'
      };
    case AttributeType.RICH_TEXT:
      return {
        icon: FileText,
        name: 'Rich Text',
        description: 'Formatted text editor with styling options',
        color: 'from-violet-500 to-violet-600'
      };
    case AttributeType.RATING:
      return {
        icon: Star,
        name: 'Rating',
        description: 'Star rating system (1-5 stars)',
        color: 'from-amber-500 to-amber-600'
      };
    case AttributeType.BARCODE:
      return {
        icon: Scan,
        name: 'Barcode',
        description: 'Barcode scanner and generator',
        color: 'from-gray-600 to-gray-700'
      };
    case AttributeType.QR:
      return {
        icon: QrCode,
        name: 'QR Code',
        description: 'QR code scanner and generator',
        color: 'from-gray-600 to-slate-700'
      };
    case AttributeType.READONLY:
      return {
        icon: Eye,
        name: 'Read Only',
        description: 'Display-only field that cannot be edited',
        color: 'from-gray-400 to-gray-500'
      };
    default:
      return {
        icon: Type,
        name: 'Unknown',
        description: 'Unknown attribute type',
        color: 'from-gray-500 to-gray-600'
      };
  }
};

export const AttributeTypeCard: React.FC<AttributeTypeCardProps> = ({
  type,
  selected = false,
  onClick
}) => {
  const info = getAttributeTypeInfo(type);
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
