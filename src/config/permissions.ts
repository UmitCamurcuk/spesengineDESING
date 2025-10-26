type CrudPermissionSet = {
  READ: string;
  CREATE: string;
  UPDATE: string;
  DELETE: string;
  HISTORY: string;
};

const createCrudPermissionSet = (module: string, resource: string): CrudPermissionSet => ({
  READ: `${module}.${resource}.read`,
  CREATE: `${module}.${resource}.create`,
  UPDATE: `${module}.${resource}.update`,
  DELETE: `${module}.${resource}.delete`,
  HISTORY: `${module}.${resource}.history`,
});

export const PERMISSIONS = {
  CATALOG: {
    ITEMS: createCrudPermissionSet('catalog', 'items'),
    ITEM_TYPES: createCrudPermissionSet('catalog', 'itemtypes'),
    CATEGORIES: createCrudPermissionSet('catalog', 'categories'),
    FAMILIES: createCrudPermissionSet('catalog', 'families'),
    ATTRIBUTE_GROUPS: createCrudPermissionSet('catalog', 'attributegroups'),
    ATTRIBUTES: createCrudPermissionSet('catalog', 'attributes'),
  },
  SYSTEM: {
    SETTINGS: createCrudPermissionSet('system', 'settings'),
    ROLES: createCrudPermissionSet('system', 'roles'),
    PERMISSIONS: createCrudPermissionSet('system', 'permissions'),
    PERMISSION_GROUPS: createCrudPermissionSet('system', 'permissiongroups'),
    LOCALIZATIONS: createCrudPermissionSet('system', 'localizations'),
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
