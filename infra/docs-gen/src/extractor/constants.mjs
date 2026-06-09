import {readBalanced} from './regex.mjs';
import {
    CONST_REF_RE,
    ENUM_ENTRY_RE,
    ENUM_START_RE,
    IDENTIFIER_RE,
    IDENTIFIER_VALUE_RE,
    OBJECT_CONST_START_RE,
    STRING_CONST_RE,
    STRING_VALUE_RE,
} from './patterns.mjs';

/**
 * Resets shared global regex cursors.
 */
function resetConstantPatterns() {
    for (const pattern of [
        STRING_CONST_RE,
        ENUM_START_RE,
        ENUM_ENTRY_RE,
        OBJECT_CONST_START_RE,
        CONST_REF_RE,
    ]) {
        pattern.lastIndex = 0;
    }
}

/**
 * Extracts string-valued constants, enums, and scalar object members.
 */
export function extractConstants(content) {
    resetConstantPatterns();

    const names = new Map();
    let match;

    while ((match = STRING_CONST_RE.exec(content))) {
        names.set(match[1], match[2]);
    }

    while ((match = ENUM_START_RE.exec(content))) {
        const enumName = match[1];
        const block = readBalanced(content, content.indexOf('{', match.index), '{', '}');
        if (!block) continue;

        ENUM_ENTRY_RE.lastIndex = 0;
        const entries = block.body.matchAll(ENUM_ENTRY_RE);
        for (const entry of entries) {
            names.set(`${enumName}.${entry[1]}`, entry[2]);
        }

        ENUM_START_RE.lastIndex = block.endIndex + 1;
    }

    while ((match = OBJECT_CONST_START_RE.exec(content))) {
        const objName = match[1];
        const braceIndex = content.indexOf('{', match.index);
        const block = readBalanced(content, braceIndex, '{', '}');
        if (!block) continue;

        for (const [key, value] of extractTopLevelScalarProps(block.body)) {
            names.set(`${objName}.${key}`, value);
        }

        OBJECT_CONST_START_RE.lastIndex = block.endIndex + 1;
    }

    const refs = [];
    while ((match = CONST_REF_RE.exec(content))) {
        refs.push([match[1], match[2]]);
    }

    for (let pass = 0; pass < 3; pass++) {
        for (const [target, source] of refs) {
            if (!names.has(target) && names.has(source)) {
                names.set(target, names.get(source));
            }
        }

        for (const [key, value] of names) {
            if (typeof value === 'string' && names.has(value) && key !== value) {
                names.set(key, names.get(value));
            }
        }
    }

    return names;
}

/**
 * Resolves one raw identifier through the constants map.
 */
export function resolveConstant(raw, constants) {
    if (!raw) return raw;
    if (raw.startsWith("'") || raw.startsWith('"')) return raw.slice(1, -1);

    if (constants.has(raw)) {
        const value = constants.get(raw);
        return constants.has(value) ? constants.get(value) : value;
    }

    for (const [key, value] of constants) {
        if (key.endsWith(`.${raw}`) || key === raw) return value;
    }

    return raw;
}

/**
 * Resolves a list of raw identifiers and expands constant namespaces.
 */
export function resolveAllConstants(rawList, constants) {
    const resolved = [];

    for (const raw of rawList) {
        let value = resolveConstant(raw, constants);

        if (value === raw && raw.includes('.') && constants.has(raw)) {
            value = constants.get(raw);
        }

        let depth = 0;
        while (constants.has(value) && depth < 5) {
            value = constants.get(value);
            depth++;
        }

        if (value === raw && constants.size > 0) {
            const prefix = raw + '.';
            const members = [];
            for (const [key, memberValue] of constants) {
                if (!key.startsWith(prefix)) continue;

                let expandedValue = memberValue;
                let memberDepth = 0;
                while (constants.has(expandedValue) && memberDepth < 5) {
                    expandedValue = constants.get(expandedValue);
                    memberDepth++;
                }
                members.push(expandedValue);
            }

            if (members.length > 0) {
                resolved.push(...members);
                continue;
            }
        }

        resolved.push(value);
    }

    return [...new Set(resolved)];
}

/**
 * Yields scalar properties from top-level object literal segments.
 */
function* extractTopLevelScalarProps(body) {
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = null;
    let inLineComment = false;
    let inBlockComment = false;
    let segmentStart = 0;
    const segments = [];

    for (let index = 0; index < body.length; index++) {
        const char = body[index];
        const next = body[index + 1];

        if (inLineComment) {
            if (char === '\n') inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                index++;
            }
            continue;
        }
        if (quote) {
            if (char === '\\') {
                index++;
                continue;
            }
            if (char === quote) quote = null;
            continue;
        }
        if (char === '/' && next === '/') {
            inLineComment = true;
            index++;
            continue;
        }
        if (char === '/' && next === '*') {
            inBlockComment = true;
            index++;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;
        else if (char === '{') braceDepth++;
        else if (char === '}') braceDepth--;
        else if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;

        if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
            segments.push(body.slice(segmentStart, index));
            segmentStart = index + 1;
        }
    }

    const tail = body.slice(segmentStart);
    if (tail.trim()) segments.push(tail);

    for (const segment of segments) {
        const trimmed = segment.trim();
        if (!trimmed || trimmed.startsWith('...')) continue;

        const colon = trimmed.indexOf(':');
        if (colon === -1) continue;

        const rawKey = trimmed.slice(0, colon).trim();
        if (!rawKey || rawKey.startsWith('[') || !IDENTIFIER_RE.test(rawKey)) {
            continue;
        }

        const rawValue = trimmed.slice(colon + 1).trim();
        const stringMatch = rawValue.match(STRING_VALUE_RE);
        if (stringMatch) {
            yield [rawKey, stringMatch[1]];
            continue;
        }

        const identMatch = rawValue.match(IDENTIFIER_VALUE_RE);
        if (identMatch) {
            yield [rawKey, identMatch[1]];
        }
    }
}
