export const resolveAssetUrl = (
  url?: string | null,
  base?: string | null
): string | undefined => {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const normalizedBase = (base || '').replace(/\/$/, '');
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (!normalizedBase) {
    return normalizedPath;
  }

  // /uploads/ paths are served from the API root (not under /api prefix).
  // Strip trailing /api so the path resolves correctly in all environments.
  if (trimmed.startsWith('/uploads/')) {
    const apiRoot = normalizedBase.replace(/\/api$/, '');
    return `${apiRoot}${trimmed}`;
  }

  return `${normalizedBase}${normalizedPath}`;
};
