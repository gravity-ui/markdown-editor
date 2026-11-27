/**
 * Converts a string to a URL-friendly slug (lowercase, alphanumeric, hyphens).
 * @param str
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
