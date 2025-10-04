import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number');
export const urlSchema = z.string().url('Invalid URL');

// User schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Item schemas
export const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  family: z.string().min(1, 'Family is required'),
  status: z.enum(['active', 'draft', 'inactive']),
  attributes: z.record(z.any()).optional(),
});

export const itemTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  attributes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Category schemas
export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const categoryTreeSchema = z.object({
  id: z.string(),
  name: z.string(),
  children: z.array(z.lazy(() => categoryTreeSchema)).optional(),
});

// Family schemas
export const familySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().optional(),
});

// Attribute schemas
export const attributeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['text', 'number', 'boolean', 'date', 'select', 'multiselect', 'table', 'file', 'image']),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  isUnique: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.any()).optional(),
  groupId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const attributeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  attributes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Association schemas
export const associationSchema = z.object({
  sourceId: z.string().min(1, 'Source is required'),
  targetId: z.string().min(1, 'Target is required'),
  type: z.string().min(1, 'Type is required'),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// Localization schemas
export const localizationSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  language: z.string().min(2, 'Language code is required'),
  namespace: z.string().min(1, 'Namespace is required'),
  isActive: z.boolean().optional(),
});

// Role schemas
export const roleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Permission schemas
export const permissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
  isActive: z.boolean().optional(),
});

export const permissionGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.instanceof(File, 'File is required'),
  type: z.string().optional(),
  description: z.string().optional(),
});

// Settings schemas
export const settingsSchema = z.object({
  language: z.string().min(2, 'Language is required'),
  theme: z.enum(['light', 'dark', 'system']),
  darkVariant: z.enum(['slate', 'navy', 'true-black']).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  autoSave: z.boolean().optional(),
  defaultPageSize: z.number().min(5).max(100).optional(),
});

// Form validation helpers
export const createFormSchema = <T extends z.ZodType>(schema: T) => schema;

export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type ItemFormData = z.infer<typeof itemSchema>;
export type ItemTypeFormData = z.infer<typeof itemTypeSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type FamilyFormData = z.infer<typeof familySchema>;
export type AttributeFormData = z.infer<typeof attributeSchema>;
export type AttributeGroupFormData = z.infer<typeof attributeGroupSchema>;
export type AssociationFormData = z.infer<typeof associationSchema>;
export type LocalizationFormData = z.infer<typeof localizationSchema>;
export type RoleFormData = z.infer<typeof roleSchema>;
export type PermissionFormData = z.infer<typeof permissionSchema>;
export type PermissionGroupFormData = z.infer<typeof permissionGroupSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type SettingsFormData = z.infer<typeof settingsSchema>;
