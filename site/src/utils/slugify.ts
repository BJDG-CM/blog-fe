export function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]/g, '')
    .replace(/-+/g, '-');

  return normalized || `post-${Date.now()}`;
}

export function ensureUniqueSlug(base: string, existing: Set<string>): string {
  let slug = base;
  let counter = 2;
  while (existing.has(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}
