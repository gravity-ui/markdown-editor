import {IDENTIFIER_RE, SAME_CALL_RE, STRING_BINDING_RE} from './patterns.mjs';
import {
    readBalanced,
    readExpression,
    resetPattern,
    splitTopLevel,
    splitTopLevelBy,
} from './regex.mjs';

const STRING_ESCAPES = new Map([
    ['\\', '\\'],
    ["'", "'"],
    ['"', '"'],
    ['`', '`'],
    ['n', '\n'],
    ['r', '\r'],
    ['t', '\t'],
    ['b', '\b'],
    ['f', '\f'],
    ['v', '\v'],
]);

/**
 * Decodes simple JavaScript string escapes.
 */
function decodeStringEscapes(content) {
    return content.replace(/\\([\s\S])/gu, (_, char) => STRING_ESCAPES.get(char) ?? char);
}

/**
 * Resolves a quoted string literal.
 */
function resolveQuotedString(expression) {
    const trimmed = expression.trim();
    const quote = trimmed[0];
    if ((quote !== "'" && quote !== '"') || trimmed.at(-1) !== quote) return null;

    return decodeStringEscapes(trimmed.slice(1, -1));
}

/**
 * Applies a known string method to a value.
 */
function applyStringMethod(value, method) {
    if (method === 'trim') return value.trim();
    if (method === 'trimStart') return value.trimStart();
    if (method === 'trimEnd') return value.trimEnd();
    return value;
}

/**
 * Removes one trailing string method call.
 */
function peelStringMethod(expression) {
    const match = /^(?<base>[\s\S]+)\.(?<method>trim|trimStart|trimEnd)\(\)\s*$/u.exec(
        expression.trim(),
    );

    return match?.groups || null;
}

/**
 * Resolves chained string trim calls.
 */
function resolveStringMethodChain(expression, bindings) {
    const peeled = peelStringMethod(expression);
    if (!peeled) return null;

    const value = resolveStringExpression(peeled.base, bindings);
    return value === null ? null : applyStringMethod(value, peeled.method);
}

/**
 * Resolves a template literal expression.
 */
function resolveTemplateString(expression, bindings) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('`') || !trimmed.endsWith('`')) return null;

    let result = '';
    for (let index = 1; index < trimmed.length - 1; index++) {
        const char = trimmed[index];
        const next = trimmed[index + 1];

        if (char === '\\') {
            result += decodeStringEscapes(trimmed.slice(index, index + 2));
            index++;
            continue;
        }

        if (char === '$' && next === '{') {
            const interpolation = readBalanced(trimmed, index + 1, '{', '}');
            if (!interpolation) return null;

            const value = resolveStringExpression(interpolation.body, bindings);
            if (value === null) return null;

            result += value;
            index = interpolation.endIndex;
            continue;
        }

        result += char;
    }

    return result;
}

/**
 * Resolves an array join expression.
 */
function resolveArrayJoinExpression(expression, bindings) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('[')) return null;

    const arrayBody = readBalanced(trimmed, 0, '[', ']');
    if (!arrayBody) return null;

    const tail = trimmed.slice(arrayBody.endIndex + 1).trim();
    if (!tail.startsWith('.join(')) return null;

    const joinArgs = readBalanced(tail, '.join'.length, '(', ')');
    if (!joinArgs || joinArgs.endIndex !== tail.length - 1) return null;

    const delimiterExpression = joinArgs.body.trim() || "','";
    const delimiter = resolveStringExpression(delimiterExpression, bindings);
    if (delimiter === null) return null;

    const parts = splitTopLevel(arrayBody.body).map((part) =>
        resolveStringExpression(part, bindings),
    );
    if (parts.some((part) => part === null)) return null;

    return parts.join(delimiter);
}

/**
 * Resolves a concatenated string expression.
 */
function resolveStringConcatenation(expression, bindings) {
    const parts = splitTopLevelBy(expression, ['+']);
    if (parts.length < 2) return null;

    const values = parts.map((part) => resolveStringExpression(part, bindings));
    if (values.some((value) => value === null)) return null;

    return values.join('');
}

/**
 * Resolves a string identifier from known bindings.
 */
function resolveStringIdentifier(expression, bindings) {
    const trimmed = expression.trim();
    return IDENTIFIER_RE.test(trimmed) ? (bindings.get(trimmed) ?? null) : null;
}

/**
 * Removes wrapping parentheses from a string expression.
 */
function unwrapStringExpression(expression) {
    const trimmed = expression.trim();
    if (!trimmed.startsWith('(')) return trimmed;

    const body = readBalanced(trimmed, 0, '(', ')');
    if (!body || body.endIndex !== trimmed.length - 1) return trimmed;

    return unwrapStringExpression(body.body);
}

/**
 * Resolves supported string expressions.
 */
function resolveStringExpression(expression, bindings) {
    const trimmed = unwrapStringExpression(expression);

    return (
        resolveStringMethodChain(trimmed, bindings) ??
        resolveArrayJoinExpression(trimmed, bindings) ??
        resolveStringConcatenation(trimmed, bindings) ??
        resolveTemplateString(trimmed, bindings) ??
        resolveQuotedString(trimmed) ??
        resolveStringIdentifier(trimmed, bindings)
    );
}

/**
 * Collects resolvable local string bindings.
 */
function collectStringBindings(content) {
    const bindings = new Map();
    const re = resetPattern(STRING_BINDING_RE);
    let match;

    while ((match = re.exec(content))) {
        const expression = readExpression(content, re.lastIndex, [';']);
        const value = resolveStringExpression(expression.body, bindings);

        if (value !== null) {
            bindings.set(match[1], value);
        }

        re.lastIndex = expression.endIndex + 1;
    }

    return bindings;
}

/**
 * Extracts first arguments from same(...) calls.
 */
function extractSameFirstArguments(content) {
    const args = [];
    const re = resetPattern(SAME_CALL_RE);
    let match;

    while ((match = re.exec(content))) {
        const openIndex = content.indexOf('(', match.index);
        const callBody = readBalanced(content, openIndex, '(', ')');
        if (!callBody) continue;

        const [firstArg] = splitTopLevel(callBody.body);
        if (firstArg) {
            args.push({expression: firstArg, index: match.index});
        }

        re.lastIndex = callBody.endIndex + 1;
    }

    return args;
}

/**
 * Extracts markdown examples from serializer test helpers.
 */
export function extractTestExamples(content) {
    return extractSameFirstArguments(content)
        .map(({expression, index}) =>
            resolveStringExpression(expression, collectStringBindings(content.slice(0, index))),
        )
        .filter((example) => example !== null);
}
