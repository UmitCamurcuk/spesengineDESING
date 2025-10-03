export interface HistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed' | 'exported' | 'imported';
  field?: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  id: string;
  entityType: string;
  entityId: string;
  onCreate: boolean;
  onUpdate: boolean;
  onDelete: boolean;
  onView: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  webhookUrl?: string;
  notificationChannels: string[];
  recipients: string[];
  customMessage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: APIParameter[];
  requestBody?: any;
  responseExample?: any;
  requiresAuth: boolean;
  permissions?: string[];
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  example?: any;
  enum?: string[];
}

export interface Statistics {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  createdThisMonth: number;
  updatedThisMonth: number;
  usageCount: number;
  lastUsed?: string;
  trends: {
    period: string;
    value: number;
    change: number;
  }[];
  topUsers: {
    userId: string;
    userName: string;
    count: number;
  }[];
}

export interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'markdown' | 'html' | 'text';
  lastUpdated: string;
  author: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  requiresEdit?: boolean;
  badge?: string | number;
}