/**
 * Extracts ProseMirror node registrations from builder calls.
 */
export function extractAddNode(content) {
    const nodes = [];
    const re = /builder\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
    let match;
    while ((match = re.exec(content))) {
        nodes.push(match[3] || match[1] || match[2]);
    }

    const chainedRe = /\)\s*\.addNode\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,\s*(?:\(|$)/gm;
    while ((match = chainedRe.exec(content))) {
        nodes.push(match[3] || match[1] || match[2]);
    }

    return nodes;
}

/**
 * Extracts ProseMirror mark registrations from builder calls.
 */
export function extractAddMark(content) {
    const marks = [];
    const re = /builder\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
    let match;
    while ((match = re.exec(content))) {
        marks.push(match[3] || match[1] || match[2]);
    }

    const chainedRe = /\)\s*\n\s*\.addMark\(\s*\n?\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])\s*,/g;
    while ((match = chainedRe.exec(content))) {
        marks.push(match[3] || match[1] || match[2]);
    }

    return marks;
}

/**
 * Extracts node names from node spec registrations.
 */
export function extractNodeSpecs(content) {
    const nodes = [];
    const re = /\.addNodeSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let match;
    while ((match = re.exec(content))) {
        nodes.push(match[3] || match[1] || match[2]);
    }
    return nodes;
}

/**
 * Extracts mark names from mark spec registrations.
 */
export function extractMarkSpecs(content) {
    const marks = [];
    const re = /\.addMarkSpec\(\s*\{\s*name:\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let match;
    while ((match = re.exec(content))) {
        marks.push(match[3] || match[1] || match[2]);
    }
    return marks;
}

/**
 * Extracts editor action identifiers from builder calls.
 */
export function extractActions(content) {
    const actions = [];
    const re = /builder\s*\.addAction\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    let match;
    while ((match = re.exec(content))) {
        actions.push(match[3] || match[1] || match[2]);
    }

    const chainedRe = /\)\s*\.addAction\(\s*(?:(\w+\.\w+)|(\w+)|['"]([^'"]+)['"])/g;
    while ((match = chainedRe.exec(content))) {
        actions.push(match[3] || match[1] || match[2]);
    }

    return actions;
}

/**
 * Extracts ProseMirror plugin factory names.
 */
export function extractPlugins(content) {
    const plugins = [];
    const re = /\.addPlugin\(\s*(\w+)/g;
    let match;
    while ((match = re.exec(content))) {
        plugins.push(match[1]);
    }
    return plugins;
}

/**
 * Finds the next non-whitespace character index.
 */
function skipWhitespace(content, index) {
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
function readExpression(content, startIndex, stopChars) {
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
 * Splits content by top-level commas.
 */
function splitTopLevel(content) {
    const parts = [];
    let segmentStart = 0;
    let parenDepth = 0;
    let braceDepth = 0;
    let bracketDepth = 0;
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

        if (char === ',' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0) {
            parts.push(content.slice(segmentStart, index).trim());
            segmentStart = index + 1;
        }
    }

    const tail = content.slice(segmentStart).trim();
    if (tail) parts.push(tail);

    return parts;
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

        if (/^[A-Za-z_$][\w$]*$/.test(rawKey)) {
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
    const declarationRe = /(?:const|let|var)\s+(\w+)(?::[^=;]+)?=\s*\{/g;
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

    const staticComputedAssignmentRe = /(\w+)\s*\[\s*(?:'([^']+)'|"([^"]+)")\s*\]\s*=/g;
    while ((match = staticComputedAssignmentRe.exec(blockBody))) {
        const keys = knownObjects.get(match[1]) || [];
        keys.push(match[2] || match[3]);
        knownObjects.set(match[1], keys);
    }

    const staticMemberAssignmentRe = /(\w+)\.(\w+)\s*=/g;
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
    const re =
        /(?:markInputRule|textblockTypeInputRule|nodeInputRule|wrappingInputRule|inlineNodeInputRule)\s*\(\s*(?:\/([^/]+)\/|{[^}]*open:\s*'([^']*)'[^}]*close:\s*'([^']*)'[^}]*})/g;
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
    const re = /md\.use\(\s*(\w+)/g;
    let match;
    while ((match = re.exec(content))) {
        plugins.push(match[1]);
    }
    return plugins;
}

/**
 * Extracts exported extension options fields.
 */
export function extractOptionsType(content) {
    const fields = [];
    const re = /export\s+type\s+\w+Options\s*(?:=\s*(?:\w+\s*&\s*)?)?(?:\{([^}]*)\}|([^;]*))/gs;
    const match = re.exec(content);
    if (!match) return fields;

    const block = match[1] || match[2] || '';
    const fieldRe = /(\w+)\??\s*:\s*([^;]+)/g;
    let fieldMatch;

    while ((fieldMatch = fieldRe.exec(block))) {
        const name = fieldMatch[1].trim();
        const type = fieldMatch[2].trim().replace(/\s+/g, ' ');
        if (name && !name.startsWith('//')) {
            fields.push({name, type});
        }
    }

    return fields;
}

/**
 * Extracts markdown examples from serializer test helpers.
 */
export function extractTestExamples(content) {
    const examples = [];
    const singleQuoteRe = /same\(\s*'([^']+)'/g;
    let match;
    while ((match = singleQuoteRe.exec(content))) {
        examples.push(match[1]);
    }

    const templateRe = /same\(\s*`([^`]+)`/g;
    while ((match = templateRe.exec(content))) {
        examples.push(match[1]);
    }

    return examples;
}

/**
 * Extracts serializer output snippets.
 */
export function extractSerializerSyntax(content) {
    const snippets = [];
    const writeRe = /state\.write\(\s*[`'"]([^`'"]*)[`'"]/g;
    let match;
    while ((match = writeRe.exec(content))) {
        if (match[1].trim()) snippets.push(match[1]);
    }

    const textRe = /state\.text\(\s*[`'"]([^`'"]*)[`'"]/g;
    while ((match = textRe.exec(content))) {
        if (match[1].trim()) snippets.push(match[1]);
    }

    return snippets;
}
