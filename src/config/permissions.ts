type CrudPermissionSet = {
  LIST: string;
  VIEW: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  HISTORY: string;
  LOGO?: string;
};

const createCrudPermissionSet = (domain: string, resource: string): CrudPermissionSet => ({
  LIST: `${domain}.${resource}.list`,
  VIEW: `${domain}.${resource}.view`,
  CREATE: `${domain}.${resource}.create`,
  UPDATE: `${domain}.${resource}.update`,
  DELETE: `${domain}.${resource}.delete`,
  HISTORY: `${domain}.${resource}.history`,
});

const createFeaturePermissionSet = (domain: string, resource: string, feature: string) => ({
  VIEW: `${domain}.${resource}.${feature}.view`,
  EDIT: `${domain}.${resource}.${feature}.edit`,
});

export const PERMISSIONS = {
  CATALOG: {
    ITEMS: createCrudPermissionSet('items', 'item'),
    ITEM_TYPES: { ...createCrudPermissionSet('itemTypes', 'itemType'), LOGO: 'itemTypes.itemType.logo' },
    CATEGORIES: { ...createCrudPermissionSet('categories', 'category'), LOGO: 'categories.category.logo' },
    FAMILIES: { ...createCrudPermissionSet('families', 'family'), LOGO: 'families.family.logo' },
    ATTRIBUTE_GROUPS: { ...createCrudPermissionSet('attributeGroups', 'attributeGroup'), LOGO: 'attributeGroups.attributeGroup.logo' },
    ATTRIBUTES: { ...createCrudPermissionSet('attributes', 'attribute'), LOGO: 'attributes.attribute.logo' },
  },
  SYSTEM: {
    USERS: {
      ...createCrudPermissionSet('users', 'accounts'),
      ROLE_VIEW: 'users.roles.view',
      ROLE_ASSIGN: 'users.roles.assign',
    },
    SETTINGS: createCrudPermissionSet('settings', 'setting'),
    ROLES: { ...createCrudPermissionSet('roles', 'role'), LOGO: 'roles.role.logo' },
    PERMISSIONS: createCrudPermissionSet('permissions', 'permission'),
    PERMISSION_GROUPS: createCrudPermissionSet('permissionGroups', 'permissionGroup'),
    LOCALIZATIONS: createCrudPermissionSet('settings', 'localization'),
    PROFILE: createCrudPermissionSet('profile', 'profile'),
    ASSOCIATIONS: createCrudPermissionSet('associations', 'association'),
    NOTIFICATIONS: {
      RULES: {
        ...createCrudPermissionSet('notifications', 'rule'),
        STATISTICS: createFeaturePermissionSet('notifications', 'rule', 'statistics'),
        API: createFeaturePermissionSet('notifications', 'rule', 'api'),
        DOCUMENTATION: createFeaturePermissionSet('notifications', 'rule', 'documentation'),
        HISTORY: createFeaturePermissionSet('notifications', 'rule', 'history'),
      },
      CHANNELS: createCrudPermissionSet('notifications', 'channel'),
      TEMPLATES: createCrudPermissionSet('notifications', 'template'),
    },
  },
  AUTOMATION: {
    WORKFLOWS: createCrudPermissionSet('automation', 'workflow'),
    WORKFLOW_EXECUTIONS: {
      LIST: 'automation.execution.list',
      VIEW: 'automation.execution.view',
      CANCEL: 'automation.execution.cancel',
    },
    WORKFLOW_BOARDS: createCrudPermissionSet('automation', 'workflowBoard'),
    BOARD_TASKS: createCrudPermissionSet('automation', 'boardTask'),
  },
  CHATBOT: {
    CONFIG: createCrudPermissionSet('chatbot', 'config'),
    CONVERSATIONS: {
      LIST: 'chatbot.conversation.list',
      VIEW: 'chatbot.conversation.view',
      CREATE: 'chatbot.conversation.create',
      DELETE: 'chatbot.conversation.delete',
    },
    CHAT: 'chatbot.chat.use',
  },
} as const;

type PermissionCategoryMap = typeof PERMISSIONS;
type PermissionResourceMap = PermissionCategoryMap[keyof PermissionCategoryMap];
type PermissionSet = PermissionResourceMap[keyof PermissionResourceMap];

export type PermissionCategoryKey = keyof PermissionCategoryMap;
export type PermissionResourceKey<Category extends PermissionCategoryKey> =
  keyof PermissionCategoryMap[Category];
export type PermissionActionKey = keyof CrudPermissionSet;
export type PermissionCode = PermissionSet[keyof PermissionSet];
