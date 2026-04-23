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
    const enumRe = /(?:export\s+)?enum\s+(\w+)\s*\{([^}]+)\}/g;
    while ((m = enumRe.exec(content))) {
        const enumName = m[1];
        const entries = m[2].matchAll(/(\w+)\s*=\s*['"]([^'"]+)['"]/g);
        for (const e of entries) {
            names.set(`${enumName}.${e[1]}`, e[2]);
        }
    }

    // Object literal properties: const Obj = { Prop: 'val' | varRef }
    const objRe = /(?:export\s+)?const\s+(\w+)\s*=\s*\{([^}]+)\}/gs;
    while ((m = objRe.exec(content))) {
        const objName = m[1];
        const propRe = /(\w+)\s*:\s*(?:['"]([^'"]+)['"]|(\w+))/g;
        let pm;
        while ((pm = propRe.exec(m[2]))) {
            names.set(`${objName}.${pm[1]}`, pm[2] || pm[3]);
        }
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
