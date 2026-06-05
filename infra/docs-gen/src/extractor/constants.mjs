import {readBalanced} from './regex.mjs';

/**
 * Extracts constant declarations, enums, and object literals from TypeScript source.
 * Returns a Map of name -> resolved string value.
 */
export function extractConstants(content) {
    const names = new Map();
    let m;

    // Simple const with string literal: const FOO = 'bar'
    const constRe = /(?:export\s+)?const\s+(\w+)\s*=\s*['"]([^'"]+)['"]/g;
    while ((m = constRe.exec(content))) {
        names.set(m[1], m[2]);
    }

    // Enum members: enum Foo { Bar = 'baz' }
    const enumRe = /(?:export\s+)?enum\s+(\w+)\s*\{/g;
    while ((m = enumRe.exec(content))) {
        const enumName = m[1];
        const block = readBalanced(content, content.indexOf('{', m.index), '{', '}');
        if (!block) continue;
        const entries = block.body.matchAll(/(\w+)\s*=\s*['"]([^'"]+)['"]/g);
        for (const e of entries) {
            names.set(`${enumName}.${e[1]}`, e[2]);
        }
        enumRe.lastIndex = block.endIndex + 1;
    }

    // Object literal properties: const Obj = { Prop: 'val' | varRef, Nested: { ... } }
    // Captures only top-level scalar properties; nested objects are skipped via balanced read.
    const objStartRe = /(?:export\s+)?const\s+(\w+)\s*=\s*\{/g;
    while ((m = objStartRe.exec(content))) {
        const objName = m[1];
        const braceIndex = content.indexOf('{', m.index);
        const block = readBalanced(content, braceIndex, '{', '}');
        if (!block) continue;
        for (const [key, value] of extractTopLevelScalarProps(block.body)) {
            names.set(`${objName}.${key}`, value);
        }
        objStartRe.lastIndex = block.endIndex + 1;
    }

    // Const-to-const references: const A = B
    const refs = [];
    const refRe = /(?:export\s+)?const\s+(\w+)\s*=\s*(\w+)\s*;/g;
    while ((m = refRe.exec(content))) {
        refs.push([m[1], m[2]]);
    }

    // Multi-pass resolution for chained references (A -> B -> 'value')
    for (let pass = 0; pass < 3; pass++) {
        for (const [target, source] of refs) {
            if (!names.has(target) && names.has(source)) {
                names.set(target, names.get(source));
            }
        }
        for (const [key, val] of names) {
            if (typeof val === 'string' && names.has(val) && key !== val) {
                names.set(key, names.get(val));
            }
        }
    }

    return names;
}

/**
 * Resolves a single raw name against the constants map.
 */
export function resolveConstant(raw, constants) {
    if (!raw) return raw;
    if (raw.startsWith("'") || raw.startsWith('"')) return raw.slice(1, -1);

    if (constants.has(raw)) {
        const val = constants.get(raw);
        if (constants.has(val)) return constants.get(val);
        return val;
    }

    // Try matching as Enum.Member suffix
    for (const [key, val] of constants) {
        if (key.endsWith(`.${raw}`) || key === raw) return val;
    }
    return raw;
}

/**
 * Resolves a list of raw names, expanding enum/object prefixes when needed.
 */
export function resolveAllConstants(rawList, constants) {
    const resolved = [];

    for (const raw of rawList) {
        let val = resolveConstant(raw, constants);

        // Try dotted reference directly
        if (val === raw && raw.includes('.') && constants.has(raw)) {
            val = constants.get(raw);
        }

        // Chase reference chains up to 5 levels deep
        let depth = 0;
        while (constants.has(val) && depth < 5) {
            val = constants.get(val);
            depth++;
        }

        // If still unresolved, try expanding all members of the prefix
        if (val === raw && constants.size > 0) {
            const prefix = raw + '.';
            const members = [];
            for (const [key, v] of constants) {
                if (key.startsWith(prefix)) {
                    let memberVal = v;
                    let md = 0;
                    while (constants.has(memberVal) && md < 5) {
                        memberVal = constants.get(memberVal);
                        md++;
                    }
                    members.push(memberVal);
                }
            }
            if (members.length > 0) {
                resolved.push(...members);
                continue;
            }
        }

        resolved.push(val);
    }

    return [...new Set(resolved)];
}

/**
 * Iterates top-level `key: 'value'` and `key: identifier` pairs from an object literal body.
 * Skips nested objects, arrays, and function calls so that callers see only direct scalar props.
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
        if (!rawKey || rawKey.startsWith('[') || !/^[A-Za-z_$][\w$]*$/.test(rawKey)) continue;

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
