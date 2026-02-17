import type { DocumentationSection, APIEndpoint, Statistics } from './common';

export enum AttributeType {
  // Basic (Temel) Types
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  MONEY = 'money',
  REFERENCE = 'reference',
  GEOPOINT = 'geopoint',

  // Enum / Seçilebilir Değerler
  SELECT = 'select',
  MULTISELECT = 'multiselect',

  // Dosya / Medya Tipleri
  FILE = 'file',
  IMAGE = 'image',
  ATTACHMENT = 'attachment',

  // Kompozit / Gelişmiş Tipler
  OBJECT = 'object',
  ARRAY = 'array',
  JSON = 'json',
  FORMULA = 'formula',
  EXPRESSION = 'expression',
  TABLE = 'table',

  // UI / Görsel Bileşen Tipleri
  COLOR = 'color',
  RICH_TEXT = 'rich_text',
  RATING = 'rating',
  BARCODE = 'barcode',
  QR = 'qr',

  // Special Types
  READONLY = 'readonly',
}

export interface Attribute {
  id: string;
  key?: string;
  name: string;
  type: AttributeType;
  required: boolean;
  unique?: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: Record<string, any> | null;
  description?: string;
  helpText?: string | null;
  tags?: string[];
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  attributeGroups?: AttributeGroupSummary[];
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
  localization?: {
    nameLocalizationId: string;
    descriptionLocalizationId?: string | null;
    helpTextLocalizationId?: string | null;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    helpTextTranslations?: Record<string, string>;
  };
  uiSettings?: Record<string, unknown> | null;
}

export interface AttributeGroup {
  id: string;
  key?: string;
  name: string;
  description?: string;
  note?: string | null;
  attributeIds?: string[];
  attributeCount?: number;
  attributes: Attribute[];
  order: number;
  tags?: string[];
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  localization?: {
    nameLocalizationId: string;
    descriptionLocalizationId?: string | null;
    noteLocalizationId?: string | null;
    nameTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    noteTranslations?: Record<string, string>;
  };
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AttributeGroupSummary {
  id: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  logoUrl?: string | null;
}

export interface UserReference {
  id: string;
  email: string;
  name: string;
  profilePhotoUrl?: string;
  role?: {
    id?: string;
    name?: string | null;
    isSystemRole?: boolean;
  };
}

export interface AttributeGroupBinding {
  id: string;
  attributeGroupId: string;
  inherited: boolean;
  required: boolean;
}

export interface Family {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  parentFamilyId?: string | null;
  hierarchyPath: string[];
  categoryId?: string | null;
  isSystemFamily: boolean;
  isAbstract: boolean;
  allowItemCreation: boolean;
  logoUrl?: string | null;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface Category {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  parentCategoryId?: string | null;
  hierarchyPath: string[];
  defaultItemTypeId?: string | null;
  linkedItemTypeIds: string[];
  linkedFamilyIds: string[];
  isSystemCategory: boolean;
  allowItemCreation: boolean;
  logoUrl?: string | null;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface ItemType {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  categoryIds: string[];
  linkedFamilyIds: string[];
  lifecycleStatus: 'draft' | 'active' | 'deprecated';
  isSystemItemType: boolean;
  showInNavbar: boolean;
  version: number;
  logoUrl?: string | null;
  attributeGroupIds: string[];
  attributeGroupBindings: AttributeGroupBinding[];
  attributeGroupCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export type ColumnAlignment = 'start' | 'center' | 'end';
export type ItemTypeColumnSource = 'attribute' | 'meta' | 'association' | 'computed';

export interface ItemTypeColumnDefinition {
  key: string;
  source: ItemTypeColumnSource;
  labelLocalizationId?: string;
  visible: boolean;
  order: number;
  width?: number;
  alignment?: ColumnAlignment;
  options?: Record<string, unknown>;
}

export interface ItemTypeColumnConfig {
  id?: string;
  itemTypeId?: string;
  context: 'list' | 'detail' | 'navbar';
  columns: ItemTypeColumnDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export type AssociationColumnSource = 'attribute' | 'meta' | 'relationship' | 'computed';

export interface AssociationColumnDefinition {
  key: string;
  source: AssociationColumnSource;
  labelLocalizationId?: string;
  visible: boolean;
  order: number;
  width?: number;
  alignment?: ColumnAlignment;
  options?: Record<string, unknown>;
}

export interface AssociationColumnConfig {
  id?: string;
  associationTypeId?: string;
  role: 'source' | 'target';
  columns: AssociationColumnDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssociationTypeItemRef {
  id: string;
  key: string;
  nameLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  categoryIds?: string[];
  linkedFamilyIds?: string[];
  attributeGroupIds?: string[];
  attributeGroupBindings?: AttributeGroupBinding[];
  attributeGroupCount?: number;
}

export interface ItemTypeSummaryRef {
  id: string;
  key: string;
  nameLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
}

export interface HierarchyNode {
  id: string;
  key: string;
  nameLocalizationId?: string | null;
  name: string;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
}

export interface CategoryFamilySummary extends HierarchyNode {
  hierarchy: HierarchyNode[];
  fullPath: string;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
}

export interface Item {
  id: string;
  itemTypeId: string | null;
  categoryId?: string | null;
  familyId?: string | null;
  name: string;
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  description?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
  itemTypeSummary?: ItemTypeSummaryRef | null;
  categorySummary?: CategoryFamilySummary | null;
  familySummary?: CategoryFamilySummary | null;
  attributeValues?: ItemAttributeValue[];
  attributeValueMap?: Record<string, unknown>;
}

export interface LocalizedAttributeValue {
  language: string;
  value: unknown;
}

export interface ItemAttributeValue {
  id: string;
  attributeId: string;
  value: unknown;
  localizedValues?: LocalizedAttributeValue[];
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  lastCalculatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemAttributeGroupSummary {
  id: string;
  key?: string;
  name: string;
  description?: string | null;
  note?: string | null;
  required: boolean;
  inherited: boolean;
  attributeCount: number;
  displayOrder?: number;
  tags?: string[];
  attributes: Attribute[];
}

export interface ItemHierarchyNode {
  id: string;
  key?: string | null;
  name: string | null;
}

export interface ItemAssociationSummary {
  id: string;
  associationTypeId: string | null;
  associationTypeName: string | null;
  associationTypeKey: string | null;
  associationTypeNameLocalizationId?: string | null;
  direction: 'source' | 'target';
  counterpartItemId: string | null;
  counterpartItemName: string | null;
  counterpartItemCategoryId?: string | null;
  counterpartItemCategoryName?: string | null;
  counterpartItemFamilyId?: string | null;
  counterpartItemFamilyName?: string | null;
  counterpartItemItemTypeName?: string | null;
  counterpartItemAttributeValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  orderIndex?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ItemDetails {
  item: Item;
  itemType?: ItemType | null;
  category?: Category | null;
  family?: Family | null;
  hierarchy: {
    categoryPath: ItemHierarchyNode[];
    familyPath: ItemHierarchyNode[];
  };
  attributeGroups: ItemAttributeGroupSummary[];
  attributeValues: Record<string, ItemAttributeValue>;
  associations: {
    source: ItemAssociationSummary[];
    target: ItemAssociationSummary[];
  };
  statistics: Statistics;
  documentationSections: DocumentationSection[];
  apiEndpoints: APIEndpoint[];
}

export interface Association {
  id: string;
  associationTypeId: string | null;
  sourceItemId: string | null;
  targetItemId: string | null;
  metadata?: Record<string, any> | null;
  orderIndex?: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AssociationType {
  id: string;
  tenantId?: string;
  key: string;
  nameLocalizationId: string;
  descriptionLocalizationId?: string | null;
  name: string;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  sourceItemTypeId?: string | null;
  targetItemTypeId?: string | null;
  sourceItemType?: AssociationTypeItemRef | null;
  targetItemType?: AssociationTypeItemRef | null;
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  isRequired: boolean;
  direction: 'directed' | 'undirected';
  metadataSchema?: Record<string, unknown> | null;
  sourceCategories?: CategoryFamilySummary[];
  targetCategories?: CategoryFamilySummary[];
  sourceFamilies?: CategoryFamilySummary[];
  targetFamilies?: CategoryFamilySummary[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface AssociationRule {
  id: string;
  tenantId?: string;
  associationTypeId?: string | null;
  appliesTo: 'source' | 'target';
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  name?: string | null;
  nameLanguage?: string | null;
  description?: string | null;
  descriptionLanguage?: string | null;
  sourceCategoryIds: string[];
  sourceFamilyIds: string[];
  targetCategoryIds: string[];
  targetFamilyIds: string[];
  minTargets: number;
  maxTargets?: number | null;
  metadataSchema?: Record<string, unknown> | null;
  sourceCategories?: CategoryFamilySummary[];
  targetCategories?: CategoryFamilySummary[];
  sourceFamilies?: CategoryFamilySummary[];
  targetFamilies?: CategoryFamilySummary[];
  createdAt: string;
  updatedAt: string;
  createdBy?: UserReference | string | null;
  updatedBy?: UserReference | string | null;
}

export interface ItemAssociation {
  id: string;
  associationId: string;
  sourceItemId: string;
  targetItemId: string;
  quantity?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissionGroups: string[];
  permissions: string[];
  isSystem: boolean;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Localization {
  id: string;
  key: string;
  translations: Record<string, string>;
  namespace: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Automation / Workflow                                               */
/* ------------------------------------------------------------------ */

export type WorkflowNodeType = 'trigger' | 'condition' | 'action' | 'delay' | 'script' | 'loop' | 'switch' | 'note';
export type TriggerType = 'event' | 'schedule' | 'manual' | 'webhook';
export type ActionType =
  | 'send_notification'
  | 'update_field'
  | 'webhook'
  | 'create_item'
  | 'update_item'
  | 'delete_item'
  | 'set_variable'
  | 'log'
  | 'send_email'
  | 'http_request'
  | 'transform_data'
  | 'find_items'
  | 'bulk_update_items'
  | 'assign_attribute'
  | 'create_board_task'
  | 'update_board_task'
  | 'move_board_task'
  | 'assign_board_task'
  | 'archive_board_task'
  | 'clone_item'
  | 'fire_event';
export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';

export interface SwitchCase {
  label: string;
  handleId: string;
  value: string;
}

export interface WorkflowNodeConfig {
  eventKey?: string;
  cronExpression?: string;
  webhookSecret?: string;
  // Trigger filter config — narrow when an event trigger should run
  itemCategoryKey?: string;
  itemFamilyKey?: string;
  itemTypeKey?: string;
  attributeKey?: string;
  attributeNewValue?: string;
  attributePreviousValue?: string;
  filterExpression?: string;
  // Condition
  conditionExpression?: string;
  actionType?: ActionType;
  actionConfig?: Record<string, unknown>;
  delayMs?: number;
  delayExpression?: string;
  scriptCode?: string;
  scriptTimeout?: number;
  loopExpression?: string;
  loopItemVariable?: string;
  loopIndexVariable?: string;
  loopMaxIterations?: number;
  switchExpression?: string;
  switchCases?: SwitchCase[];
  switchDefaultHandle?: string;
  noteContent?: string;
  noteColor?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  position: { x: number; y: number };
  config: WorkflowNodeConfig;
  metadata?: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  label?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  nameLocalizationId?: string | null;
  descriptionLocalizationId?: string | null;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  variables?: Record<string, unknown>;
  tags?: string[];
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface ExecutionStepLog {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: StepStatus;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  input?: Record<string, unknown> | null;
  output?: Record<string, unknown> | null;
  error?: string | null;
}

export interface WorkflowExecution {
  id: string;
  tenantId: string;
  workflowId: string;
  workflowVersion: number;
  status: ExecutionStatus;
  triggerType: string;
  triggerData?: Record<string, unknown> | null;
  variables: Record<string, unknown>;
  steps: ExecutionStepLog[];
  currentNodeId?: string | null;
  startedAt: string;
  completedAt?: string | null;
  durationMs?: number | null;
  error?: string | null;
  triggeredBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Chatbot                                                            */
/* ------------------------------------------------------------------ */

export type LLMProvider = 'openai' | 'anthropic' | 'custom';

export interface LLMSettings {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  baseUrl?: string;
  apiKeyHeader?: string;
}

export interface WidgetSettings {
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  bubbleSize: number;
  title: string;
  subtitle: string;
  avatarUrl: string;
  showOnPages: 'all' | 'custom';
  customPages: string[];
  embedEnabled: boolean;
  embedAllowedDomains: string[];
}

export interface KnowledgeBaseScope {
  includeItems: boolean;
  includeAttributes: boolean;
  includeCategories: boolean;
  includeFamilies: boolean;
  includeItemTypes: boolean;
  includeUsers: boolean;
  includeAssociations: boolean;
  customInstructions?: string;
}

export interface FallbackRule {
  id: string;
  pattern: string;
  matchType: 'keyword' | 'regex' | 'intent';
  response: string;
  responseLocalizationId?: string | null;
  priority: number;
  isActive: boolean;
}

export interface ChatbotConfig {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  llmSettings: LLMSettings;
  knowledgeBaseScope: KnowledgeBaseScope;
  fallbackRules: FallbackRule[];
  welcomeMessage?: string;
  welcomeMessageLocalizationId?: string | null;
  maxConversationLength: number;
  responseLanguage?: string;
  widgetSettings?: WidgetSettings;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageSource = 'ai' | 'rule' | 'system';
export type ConversationStatus = 'active' | 'closed' | 'archived';

export interface ConversationMessage {
  id: string;
  role: MessageRole;
  content: string;
  source: MessageSource;
  matchedRuleId?: string | null;
  tokens?: { prompt: number; completion: number } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  tenantId: string;
  userId: string;
  chatbotConfigId: string;
  title?: string;
  status: ConversationStatus;
  messages: ConversationMessage[];
  context?: Record<string, unknown>;
  totalTokens: number;
  lastMessageAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Workflow Boards                                                    */
/* ------------------------------------------------------------------ */

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
  wipLimit?: number;
}

export interface WorkflowBoard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  prefix: string;
  taskCounter: number;
  columns: BoardColumn[];
  members: string[];
  taskTypes: string[];
  isArchived: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type TaskType = string;

export interface BoardTask {
  id: string;
  boardId: string;
  columnId: string;
  taskKey: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  type: TaskType;
  labels: string[];
  assigneeId?: string | null;
  reporterId?: string | null;
  order: number;
  dueDate?: string | null;
  estimatedHours?: number | null;
  loggedHours?: number | null;
  parentTaskId?: string | null;
  isArchived: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardActivity {
  id: string;
  boardId: string;
  taskId?: string | null;
  actorId: string;
  action: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export type AggregateFunction = 'none' | 'count' | 'sum' | 'avg' | 'min' | 'max';
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
export type JoinDirection = 'source' | 'target';
export type ReportVisualization = 'table' | 'bar' | 'pie' | 'line' | 'number';
export type ReportVisibility = 'private' | 'roles' | 'all';
export type ExecutionStatus = 'running' | 'completed' | 'failed';

export interface ReportColumn {
  id: string;
  alias: string;
  attributeId: string;
  attributeCode: string;
  label: string;
  aggregate: AggregateFunction;
}

export interface ReportFilter {
  id: string;
  alias: string;
  attributeId: string;
  attributeCode: string;
  operator: FilterOperator;
  value?: unknown;
}

export interface ReportJoin {
  alias: string;
  associationTypeId: string;
  targetItemTypeId: string;
  targetItemTypeName: string;
  direction: JoinDirection;
}

export interface ReportSchedule {
  isEnabled: boolean;
  cronExpression: string;
  recipients: { type: 'user' | 'role'; id: string }[];
  format: 'csv' | 'excel' | 'pdf';
  lastRunAt?: string | null;
  nextRunAt?: string | null;
}

export interface Report {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  primaryItemTypeId: string;
  primaryItemTypeName: string;
  joins: ReportJoin[];
  columns: ReportColumn[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: { alias: string; attributeCode: string; direction: 'asc' | 'desc' } | null;
  visualization: ReportVisualization;
  chartConfig: { xAxis?: string; yAxis?: string; colorField?: string };
  visibility: ReportVisibility;
  allowedRoles: string[];
  allowedUsers: string[];
  isTemplate: boolean;
  isFavorite: boolean;
  schedule: ReportSchedule | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResultColumn {
  key: string;
  label: string;
}

export interface ExecutionResult {
  columns: ResultColumn[];
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface ReportExecution {
  id: string;
  tenantId: string;
  reportId: string;
  status: ExecutionStatus;
  triggeredBy: 'manual' | 'scheduled';
  runtimeFilters: ReportFilter[];
  result: ExecutionResult | null;
  durationMs: number;
  exportUrl?: string | null;
  error?: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface ReportMetaItemType {
  id: string;
  key: string;
  name: string;
}

export interface ReportMetaAttribute {
  id: string;
  code: string;
  label: string;
  type: string;
}

export interface ReportMetaAssociation {
  id: string;
  key: string;
  name: string;
  sourceItemTypeId: string;
  targetItemTypeId: string;
}

// ─── Backup ───────────────────────────────────────────────────────────────────
export type BackupStatus = 'running' | 'success' | 'failed';
export type BackupTrigger = 'manual' | 'scheduled';

export interface Backup {
  id: string;
  tenantId: string;
  status: BackupStatus;
  trigger: BackupTrigger;
  triggeredBy?: string;
  targets: { database: boolean; uploadedFiles: boolean };
  destinations: { local: boolean; minio: boolean };
  localPath?: string;
  minioKey?: string;
  sizeBytes?: number;
  durationMs?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageLocalConfig {
  uploadPath: string;
  maxFileSizeMB: number;
}

export interface StorageMinioConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  publicUrl: string;
}

export interface StorageSettings {
  provider: 'local' | 'minio';
  local: StorageLocalConfig;
  minio: StorageMinioConfig;
}

export interface BackupScheduleSettings {
  enabled: boolean;
  cronExpression: string;
}

export interface BackupDestinationSettings {
  local: { enabled: boolean; path: string; keepLastN: number };
  minio: { enabled: boolean; bucket: string; prefix: string };
}

export interface BackupSettingsData {
  schedule: BackupScheduleSettings;
  targets: { database: boolean; uploadedFiles: boolean };
  destination: BackupDestinationSettings;
}

// Re-export common types
export * from './common';
