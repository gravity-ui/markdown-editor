import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {join} from 'node:path';

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(str) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Wraps a string in double quotes if it contains YAML special characters
 */
export function yamlQuote(str) {
    if (/[:#"'{}[\],&*?|>!%@`]/.test(str)) {
        return `"${str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return str;
}

/**
 * Reads a file as UTF-8 text
 */
export function readText(filePath) {
    return readFileSync(filePath, 'utf-8');
}

/**
 * Lists subdirectories starting with an uppercase letter
 */
export function listDirs(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir).filter((name) => {
        const full = join(dir, name);
        return statSync(full).isDirectory() && /^[A-Z]/.test(name);
    });
}

/**
 * Recursively finds files matching a regex pattern
 */
export function findFiles(dir, pattern) {
    const results = [];
    if (!existsSync(dir)) return results;
    for (const entry of readdirSync(dir, {recursive: true})) {
        if (pattern.test(entry)) {
            results.push(join(dir, entry));
        }
    }
    return results;
}

/**
 * Reads all .ts/.tsx files in a directory (recursive)
 */
export function readAllTsFiles(dir) {
    const files = findFiles(dir, /\.tsx?$/);
    return files.map((f) => ({path: f, content: readText(f)}));
}

/**
 * Strips YAML frontmatter from markdown content
 */
export function stripFrontmatter(content) {
    if (content.startsWith('---')) {
        const end = content.indexOf('---', 3);
        if (end !== -1) {
            return content.slice(end + 3).replace(/^\n+/, '');
        }
    }
    return content;
}

/**
 * Parses simple key-value YAML frontmatter into an object
 */
export function parseFrontmatter(content) {
    if (!content.startsWith('---')) return {};
    const end = content.indexOf('---', 3);
    if (end === -1) return {};
    const yaml = content.slice(3, end).trim();
    const result = {};
    for (const line of yaml.split('\n')) {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) result[match[1]] = match[2].trim();
    }
    return result;
}
