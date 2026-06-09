import {readBalanced} from './regex.mjs';

/**
 * Extracts string-valued constants, enums, and scalar object members.
 */
export function extractConstants(content) {
    const names = new Map();
    let match;

    const constRe = /(?:export\s+)?const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
    while ((match = constRe.exec(content))) {
        names.set(match[1], match[2]);
    }

    const enumRe = /(?:export\s+)?enum\s+(\w+)\s*\{/g;
    while ((match = enumRe.exec(content))) {
        const enumName = match[1];
        const block = readBalanced(content, content.indexOf('{', match.index), '{', '}');
        if (!block) continue;

        const entries = block.body.matchAll(/(\w+)\s*=\s*['"]([^'"]+)['"]/g);
        for (const entry of entries) {
            names.set(`${enumName}.${entry[1]}`, entry[2]);
        }

        enumRe.lastIndex = block.endIndex + 1;
    }

    const objStartRe = /(?:export\s+)?const\s+(\w+)\s*=\s*\{/g;
    while ((match = objStartRe.exec(content))) {
        const objName = match[1];
        const braceIndex = content.indexOf('{', match.index);
        const block = readBalanced(content, braceIndex, '{', '}');
        if (!block) continue;

        for (const [key, value] of extractTopLevelScalarProps(block.body)) {
            names.set(`${objName}.${key}`, value);
        }

        objStartRe.lastIndex = block.endIndex + 1;
    }

    const refs = [];
    const refRe = /(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g;
    while ((match = refRe.exec(content))) {
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
        if (!rawKey || rawKey.startsWith('[') || !/^[A-Za-z_$][\w$]*$/.test(rawKey)) {
            continue;
        }

        const rawValue = trimmed.slice(colon + 1).trim();
        const stringMatch = rawValue.match(/^['"]([^'"]*)['"]/);
        if (stringMatch) {
            yield [rawKey, stringMatch[1]];
            continue;
        }

        const identMatch = rawValue.match(/^([A-Za-z_$][\w$.]*)/);
        if (identMatch) {
            yield [rawKey, identMatch[1]];
        }
    }
}
