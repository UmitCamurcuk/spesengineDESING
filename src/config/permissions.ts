type CrudPermissionSet = {
  READ: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  HISTORY: string;
};

const createCrudPermissionSet = (resource: string): CrudPermissionSet => ({
  READ: `${resource}.read`,
  CREATE: `${resource}.create`,
  UPDATE: `${resource}.update`,
  DELETE: `${resource}.delete`,
  HISTORY: `${resource}.history`,
});

export const PERMISSIONS = {
  CATALOG: {
    ITEMS: createCrudPermissionSet('items'),
    ITEM_TYPES: createCrudPermissionSet('itemTypes'),
    CATEGORIES: createCrudPermissionSet('categories'),
    FAMILIES: createCrudPermissionSet('families'),
    ATTRIBUTE_GROUPS: createCrudPermissionSet('attributeGroups'),
    ATTRIBUTES: createCrudPermissionSet('attributes'),
  },
  SYSTEM: {
    USERS: createCrudPermissionSet('users'),
    SETTINGS: createCrudPermissionSet('settings'),
    ROLES: createCrudPermissionSet('roles'),
    PERMISSIONS: createCrudPermissionSet('permissions'),
    PERMISSION_GROUPS: createCrudPermissionSet('permissionGroups'),
    LOCALIZATIONS: createCrudPermissionSet('localizations'),
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
