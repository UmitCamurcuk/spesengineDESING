type CrudPermissionSet = {
  LIST: string;
  VIEW: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  HISTORY: string;
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
    ITEM_TYPES: createCrudPermissionSet('itemTypes', 'itemType'),
    CATEGORIES: createCrudPermissionSet('categories', 'category'),
    FAMILIES: createCrudPermissionSet('families', 'family'),
    ATTRIBUTE_GROUPS: createCrudPermissionSet('attributeGroups', 'attributeGroup'),
    ATTRIBUTES: createCrudPermissionSet('attributes', 'attribute'),
  },
  SYSTEM: {
    USERS: {
      ...createCrudPermissionSet('users', 'accounts'),
      ROLE_VIEW: 'users.roles.view',
      ROLE_ASSIGN: 'users.roles.assign',
    },
    SETTINGS: createCrudPermissionSet('settings', 'setting'),
    ROLES: createCrudPermissionSet('roles', 'role'),
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
} as const;

type PermissionCategoryMap = typeof PERMISSIONS;
type PermissionResourceMap = PermissionCategoryMap[keyof PermissionCategoryMap];
type PermissionSet = PermissionResourceMap[keyof PermissionResourceMap];

export type PermissionCategoryKey = keyof PermissionCategoryMap;
export type PermissionResourceKey<Category extends PermissionCategoryKey> =
  keyof PermissionCategoryMap[Category];
export type PermissionActionKey = keyof CrudPermissionSet;
export type PermissionCode = PermissionSet[keyof PermissionSet];
