import {
    ADD_PLUGIN_RE,
    BUILDER_ADD_ACTION_RE,
    BUILDER_ADD_MARK_RE,
    BUILDER_ADD_NODE_RE,
    CHAINED_ADD_ACTION_RE,
    CHAINED_ADD_MARK_RE,
    CHAINED_ADD_NODE_RE,
    IDENTIFIER_RE,
    INPUT_RULE_RE,
    KEYMAP_OBJECT_DECL_RE,
    MARK_SPEC_RE,
    MD_PLUGIN_RE,
    NODE_SPEC_RE,
    STATE_TEXT_RE,
    STATE_WRITE_RE,
    STATIC_COMPUTED_ASSIGNMENT_RE,
    STATIC_MEMBER_ASSIGNMENT_RE,
} from './patterns.mjs';

/**
 * Resets a global regular expression before scanning.
 */
export function resetPattern(pattern) {
    pattern.lastIndex = 0;
    return pattern;
}

/**
 * Reads the first defined capture group from a match.
 */
function firstCapture(match) {
    return match[3] || match[1] || match[2];
}

/**
 * Extracts names from one or more regular expressions.
 */
function extractCapturedNames(content, patterns) {
    const names = [];

    for (const pattern of patterns) {
        let match;
        const re = resetPattern(pattern);
        while ((match = re.exec(content))) {
            names.push(firstCapture(match));
        }
    }

    return names;
}

/**
 * Extracts ProseMirror node registrations from builder calls.
 */
export function extractAddNode(content) {
    return extractCapturedNames(content, [BUILDER_ADD_NODE_RE, CHAINED_ADD_NODE_RE]);
}

/**
 * Extracts ProseMirror mark registrations from builder calls.
 */
export function extractAddMark(content) {
    return extractCapturedNames(content, [BUILDER_ADD_MARK_RE, CHAINED_ADD_MARK_RE]);
}

/**
 * Extracts node names from node spec registrations.
 */
export function extractNodeSpecs(content) {
    return extractCapturedNames(content, [NODE_SPEC_RE]);
}

/**
 * Extracts mark names from mark spec registrations.
 */
export function extractMarkSpecs(content) {
    return extractCapturedNames(content, [MARK_SPEC_RE]);
}

/**
 * Extracts editor action identifiers from builder calls.
 */
export function extractActions(content) {
    return extractCapturedNames(content, [BUILDER_ADD_ACTION_RE, CHAINED_ADD_ACTION_RE]);
}

/**
 * Extracts ProseMirror plugin factory names.
 */
export function extractPlugins(content) {
    const plugins = [];
    let match;
    const re = resetPattern(ADD_PLUGIN_RE);
    while ((match = re.exec(content))) {
        plugins.push(match[1]);
    }
    return plugins;
}

/**
 * Finds the next non-whitespace character index.
 */
export function skipWhitespace(content, index) {
    let cursor = index;
    while (cursor < content.length && /\s/.test(content[cursor])) {
        cursor++;
    }
    return cursor;
}

/**
 * Reads a balanced bracketed block while ignoring comments and strings.
 */
export function readBalanced(content, startIndex, openChar, closeChar) {
    let depth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = startIndex; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

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

        if (char === openChar) {
            depth++;
            continue;
        }

        if (char === closeChar) {
            depth--;
            if (depth === 0) {
                return {body: content.slice(startIndex + 1, index), endIndex: index};
            }
        }
    }

    return null;
}

/**
 * Reads an expression until a top-level stop character.
 */
export function readExpression(content, startIndex, stopChars) {
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = startIndex; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

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

        if (
            parenDepth === 0 &&
            braceDepth === 0 &&
            bracketDepth === 0 &&
            stopChars.includes(char)
        ) {
            return {body: content.slice(startIndex, index).trim(), endIndex: index};
        }
    }

    return {body: content.slice(startIndex).trim(), endIndex: content.length};
}

/**
 * Splits content by top-level separators.
 */
export function splitTopLevelBy(content, separators, {trackAngles = false} = {}) {
    const parts = [];
    let segmentStart = 0;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let angleDepth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = 0; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

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
        else if (trackAngles && char === '<') angleDepth++;
        else if (trackAngles && char === '>' && content[index - 1] !== '=' && angleDepth > 0) {
            angleDepth--;
        }

        if (
            separators.includes(char) &&
            parenDepth === 0 &&
            braceDepth === 0 &&
            bracketDepth === 0 &&
            angleDepth === 0
        ) {
            parts.push(content.slice(segmentStart, index).trim());
            segmentStart = index + 1;
        }
    }

    const tail = content.slice(segmentStart).trim();
    if (tail) parts.push(tail);

    return parts;
}

/**
 * Splits content by top-level commas.
 */
export function splitTopLevel(content) {
    return splitTopLevelBy(content, [',']);
}

/**
 * Finds a top-level arrow token.
 */
function findArrowIndex(content, startIndex) {
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = startIndex; index < content.length; index++) {
        const char = content[index];
        const next = content[index + 1];

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

        if (
            parenDepth === 0 &&
            braceDepth === 0 &&
            bracketDepth === 0 &&
            char === '=' &&
            next === '>'
        ) {
            return index;
        }
    }

    return -1;
}

/**
 * Extracts static keys from an object literal.
 */
function extractObjectLiteralKeys(content, knownObjects = new Map()) {
    let objectBody = content.trim();
    if (objectBody.startsWith('(') && objectBody.endsWith(')')) {
        objectBody = objectBody.slice(1, -1).trim();
    }
    if (objectBody.startsWith('{') && objectBody.endsWith('}')) {
        objectBody = objectBody.slice(1, -1);
    }

    const keys = [];
    for (const segment of splitTopLevel(objectBody)) {
        if (!segment) continue;

        if (segment.startsWith('...')) {
            const spreadName = segment.slice(3).trim();
            if (knownObjects.has(spreadName)) {
                keys.push(...knownObjects.get(spreadName));
            }
            continue;
        }

        const colonIndex = segment.indexOf(':');
        if (colonIndex === -1) continue;

        const rawKey = segment.slice(0, colonIndex).trim();
        if (!rawKey || rawKey.startsWith('[')) continue;

        if (
            (rawKey.startsWith('"') && rawKey.endsWith('"')) ||
            (rawKey.startsWith("'") && rawKey.endsWith("'"))
        ) {
            keys.push(rawKey.slice(1, -1));
            continue;
        }

        if (IDENTIFIER_RE.test(rawKey)) {
            keys.push(rawKey);
        }
    }

    return keys;
}

/**
 * Extracts named keymap objects declared inside a callback body.
 */
function extractKnownKeymapObjects(blockBody) {
    const knownObjects = new Map();
    const declarationRe = resetPattern(KEYMAP_OBJECT_DECL_RE);
    let match;

    while ((match = declarationRe.exec(blockBody))) {
        const objectStart = blockBody.indexOf('{', match.index);
        const objectLiteral = readBalanced(blockBody, objectStart, '{', '}');
        if (!objectLiteral) continue;

        knownObjects.set(
            match[1],
            extractObjectLiteralKeys(`{${objectLiteral.body}}`, knownObjects),
        );
        declarationRe.lastIndex = objectLiteral.endIndex + 1;
    }

    const staticComputedAssignmentRe = resetPattern(STATIC_COMPUTED_ASSIGNMENT_RE);
    while ((match = staticComputedAssignmentRe.exec(blockBody))) {
        const keys = knownObjects.get(match[1]) || [];
        keys.push(match[2] || match[3]);
        knownObjects.set(match[1], keys);
    }

    const staticMemberAssignmentRe = resetPattern(STATIC_MEMBER_ASSIGNMENT_RE);
    while ((match = staticMemberAssignmentRe.exec(blockBody))) {
        const keys = knownObjects.get(match[1]) || [];
        keys.push(match[2]);
        knownObjects.set(match[1], keys);
    }

    return new Map([...knownObjects.entries()].map(([name, keys]) => [name, [...new Set(keys)]]));
}

/**
 * Extracts static keys from a returned keymap expression.
 */
function extractReturnedKeys(blockBody) {
    const knownObjects = extractKnownKeymapObjects(blockBody);
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
    let quote = null;
    let inBlockComment = false;
    let inLineComment = false;

    for (let index = 0; index < blockBody.length; index++) {
        const char = blockBody[index];
        const next = blockBody[index + 1];

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

        if (parenDepth !== 0 || braceDepth !== 0 || bracketDepth !== 0) continue;
        if (!blockBody.startsWith('return', index)) continue;

        const before = blockBody[index - 1];
        const after = blockBody[index + 6];
        if ((before && /\w/.test(before)) || (after && /\w/.test(after))) continue;

        const cursor = skipWhitespace(blockBody, index + 6);
        const startChar = blockBody[cursor];

        if (startChar === '{') {
            const objectLiteral = readBalanced(blockBody, cursor, '{', '}');
            return objectLiteral
                ? extractObjectLiteralKeys(`{${objectLiteral.body}}`, knownObjects)
                : [];
        }

        if (startChar === '(' && blockBody[skipWhitespace(blockBody, cursor + 1)] === '{') {
            const expression = readBalanced(blockBody, cursor, '(', ')');
            return expression ? extractObjectLiteralKeys(`(${expression.body})`, knownObjects) : [];
        }

        const expression = readExpression(blockBody, cursor, [';']);
        return knownObjects.get(expression.body.trim()) || [];
    }

    return [];
}

/**
 * Extracts callback bodies passed to addKeymap.
 */
function extractKeymapCallbackBodies(content) {
    const bodies = [];
    let index = 0;

    while ((index = content.indexOf('.addKeymap(', index)) !== -1) {
        const arrowIndex = findArrowIndex(content, index + '.addKeymap('.length);
        if (arrowIndex === -1) {
            index += '.addKeymap('.length;
            continue;
        }

        const bodyStart = skipWhitespace(content, arrowIndex + 2);
        const startChar = content[bodyStart];

        if (startChar === '{') {
            const blockBody = readBalanced(content, bodyStart, '{', '}');
            if (blockBody) {
                bodies.push({type: 'block', body: blockBody.body});
                index = blockBody.endIndex + 1;
                continue;
            }
        }

        if (startChar === '(' && content[skipWhitespace(content, bodyStart + 1)] === '{') {
            const expressionBody = readBalanced(content, bodyStart, '(', ')');
            if (expressionBody) {
                bodies.push({type: 'expression', body: `(${expressionBody.body})`});
                index = expressionBody.endIndex + 1;
                continue;
            }
        }

        const expressionBody = readExpression(content, bodyStart, [',', ')']);
        bodies.push({type: 'expression', body: expressionBody.body});
        index = expressionBody.endIndex + 1;
    }

    return bodies;
}

/**
 * Extracts static key bindings from addKeymap callbacks.
 */
export function extractKeymaps(content) {
    const keymaps = [];

    for (const callbackBody of extractKeymapCallbackBodies(content)) {
        if (callbackBody.type === 'block') {
            keymaps.push(...extractReturnedKeys(callbackBody.body));
            continue;
        }

        if (callbackBody.body.startsWith('(') || callbackBody.body.startsWith('{')) {
            keymaps.push(...extractObjectLiteralKeys(callbackBody.body));
        }
    }

    return [...new Set(keymaps)];
}

/**
 * Extracts input-rule syntax patterns.
 */
export function extractInputRules(content) {
    const rules = [];
    const re = resetPattern(INPUT_RULE_RE);
    let match;

    while ((match = re.exec(content))) {
        if (match[1]) {
            rules.push(`/${match[1]}/`);
        } else if (match[2] && match[3]) {
            rules.push(`${match[2]}...${match[3]}`);
        }
    }

    return rules;
}

/**
 * Extracts markdown-it plugin registrations.
 */
export function extractMdPlugins(content) {
    const plugins = [];
    const re = resetPattern(MD_PLUGIN_RE);
    let match;
    while ((match = re.exec(content))) {
        plugins.push(match[1]);
    }
    return plugins;
}

/**
 * Extracts serializer output snippets.
 */
export function extractSerializerSyntax(content) {
    const snippets = [];
    const writeRe = resetPattern(STATE_WRITE_RE);
    let match;
    while ((match = writeRe.exec(content))) {
        if (match[1].trim()) snippets.push(match[1]);
    }

    const textRe = resetPattern(STATE_TEXT_RE);
    while ((match = textRe.exec(content))) {
        if (match[1].trim()) snippets.push(match[1]);
    }

    return snippets;
}
