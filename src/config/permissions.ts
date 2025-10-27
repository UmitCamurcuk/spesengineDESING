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

export const PERMISSIONS = {
  CATALOG: {
    ITEMS: createCrudPermissionSet('catalog', 'items'),
    ITEM_TYPES: createCrudPermissionSet('catalog', 'itemTypes'),
    CATEGORIES: createCrudPermissionSet('catalog', 'categories'),
    FAMILIES: createCrudPermissionSet('catalog', 'families'),
    ATTRIBUTE_GROUPS: createCrudPermissionSet('catalog', 'attributeGroups'),
    ATTRIBUTES: createCrudPermissionSet('catalog', 'attributes'),
  },
  SYSTEM: {
    USERS: {
      ...createCrudPermissionSet('users', 'accounts'),
      ROLE_LIST: 'users.roles.list',
      ROLE_VIEW: 'users.roles.view',
      ROLE_ASSIGN: 'users.roles.assign',
      ROLE_HISTORY: 'users.roles.history',
    },
    SETTINGS: createCrudPermissionSet('settings', 'settings'),
    ROLES: createCrudPermissionSet('roles', 'roles'),
    PERMISSIONS: createCrudPermissionSet('auth', 'permissions'),
    PERMISSION_GROUPS: createCrudPermissionSet('auth', 'permissionGroups'),
    LOCALIZATIONS: createCrudPermissionSet('settings', 'localization'),
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
