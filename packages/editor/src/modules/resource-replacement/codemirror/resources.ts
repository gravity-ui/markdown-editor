import type {EditorState, Text, Transaction} from '@codemirror/state';

import {type ResourceRange, resourceKey} from '../controller.utils';
import type {ReplacementResource} from '../types';
import {defaultResourceUrls, isUrlResource, validateResourceUrl} from '../urls';

import {collectReferenceDefinitions} from './builtins';
import {type ResourceSyntaxMatch, resourceHandlers} from './handlers';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {completeResourceTree} from './syntax-tree';

type Match = {syntax: ResourceSyntaxMatch; resource: ReplacementResource; isUrl: boolean};
const excluded = new Set(['FencedCode', 'CodeBlock', 'InlineCode', 'Monospace']);

/** Собирает целиком вставленные ресурсы в координатах нового документа. См. resources.md. */
export function collectInsertedMarkupResources(
    tr: Transaction,
    options: Pick<CodeMirrorResourceReplacementOptions, 'resources' | 'urls'>,
) {
    const inserted: ResourceRange[] = [];
    tr.changes.iterChanges((_from, _to, from, to) => {
        if (from < to) inserted.push({from, to});
    });
    return collectMarkupResources(tr.startState, options, tr, inserted).map(
        ({syntax, resource, isUrl}) => ({...syntax.range, resource, isUrl}),
    );
}

/** Читает ресурсы из дерева: в ranges при сборе вставки, во всём документе при замене. */
export function collectMarkupResources(
    state: EditorState,
    options: Pick<CodeMirrorResourceReplacementOptions, 'resources' | 'urls'>,
    tr?: Transaction,
    ranges?: readonly ResourceRange[],
) {
    const doc = tr?.newDoc ?? state.doc;
    if (ranges?.length === 0 || !Object.values(options.resources).some(Boolean)) return [];
    const tree = completeResourceTree(state, tr);
    const {resources} = options;
    const urls = options.urls ?? defaultResourceUrls;
    const handlers = state.facet(resourceHandlers);
    for (const [nodeType, description] of Object.entries(resources)) {
        if (!description) continue;
        if (!description.kind || !description.valueAttribute)
            throw new Error(`Invalid resource description: ${nodeType}`);
        if (
            !handlers.some(
                (handler) =>
                    handler.nodeType === nodeType &&
                    handler.valueAttribute === description.valueAttribute,
            )
        )
            throw new Error(
                `No CodeMirror resource handler registered for node: ${nodeType} (value attribute: ${description.valueAttribute})`,
            );
    }
    const definitions = collectReferenceDefinitions(tree, doc, urls);
    const matches: Match[] = [];
    for (const range of ranges ?? [{from: 0, to: doc.length}])
        tree.iterate({
            from: range.from,
            to: range.to,
            enter({node}) {
                if (excluded.has(node.name)) return false;
                // First registered handler wins, allowing consumers to override built-in syntax support.
                for (const handler of handlers) {
                    const description = resources[handler.nodeType];
                    if (
                        !description ||
                        handler.valueAttribute !== description.valueAttribute ||
                        !handler.syntaxNodes.includes(node.name)
                    )
                        continue;
                    if (node.from < range.from || node.to > range.to) return false;
                    const match = handler.read({state, node, doc, definitions, urls});
                    // Отказ выбранного обработчика окончателен: к следующему не переходим.
                    if (!match) return false;
                    const value = match.attrs[description.valueAttribute];
                    const isUrl = isUrlResource(handler.nodeType, description);
                    if (typeof value !== 'string' || (isUrl && !urls.validateLink(value)))
                        return false;
                    if (typeof match.serialize !== 'function')
                        throw new Error(`Missing resource serializer: ${handler.nodeType}`);
                    if (
                        !validRange(match.range, doc) ||
                        !validRange(match.valueRange, doc) ||
                        (match.reference
                            ? !validRange(match.reference.definitionRange, doc) ||
                              !Number.isInteger(match.reference.labelTo) ||
                              match.reference.labelTo < match.range.from ||
                              match.reference.labelTo > match.range.to
                            : match.valueRange.from < match.range.from ||
                              match.valueRange.to > match.range.to)
                    )
                        throw new Error(`Invalid resource source range: ${handler.nodeType}`);
                    const reference = match.reference;
                    // Для запуска resolve определение ссылочного изображения тоже должно
                    // входить во вставку. При поиске по всему документу ranges не передаётся.
                    if (
                        ranges &&
                        (match.range.from < range.from ||
                            match.range.to > range.to ||
                            (reference &&
                                !ranges.some(
                                    (inserted) =>
                                        inserted.from <= reference.definitionRange.from &&
                                        inserted.to >= reference.definitionRange.to,
                                )))
                    )
                        return false;
                    const name = description.nameAttribute
                        ? match.attrs[description.nameAttribute]
                        : undefined;
                    matches.push({
                        syntax: match,
                        isUrl,
                        resource: {
                            kind: description.kind,
                            value,
                            ...(typeof name === 'string' && name ? {name} : {}),
                        },
                    });
                    return false;
                }
                return true;
            },
        });
    return matches;
}

/**
 * Готовит изменения всего текущего документа, не применяя их. Подробности — в resources.md.
 * Values are prepared and serialized for every match before the caller dispatches.
 */
export function markupResourceChanges(
    state: EditorState,
    replacements: ReadonlyMap<string, string>,
    options: Pick<CodeMirrorResourceReplacementOptions, 'resources' | 'urls'>,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
) {
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key))
            urls.set(key, validateResourceUrl(options.urls ?? defaultResourceUrls, value));
    }
    const changes: Array<{from: number; to: number; insert: string}> = [];
    // Без ranges: ответ обновляет и вставленные, и ранее существовавшие совпадения.
    for (const {syntax, resource, isUrl} of collectMarkupResources(state, options)) {
        const key = resourceKey(resource);
        let value = replacements.get(key);
        if (value === undefined) continue;
        if (isUrl) {
            value =
                urls.get(key) ?? validateResourceUrl(options.urls ?? defaultResourceUrls, value);
            urls.set(key, value);
        }
        const reference = syntax.reference;
        const from = reference?.labelTo ?? syntax.valueRange.from;
        const to = reference ? syntax.range.to : syntax.valueRange.to;
        let insert = syntax.serialize(value);
        if (typeof insert !== 'string') throw new Error('Invalid resource serialization');
        if (reference) {
            // Заменяем [photo] у изображения на (новый URL "title"). Общее определение
            // не меняем, чтобы сохранить адрес обычных ссылок на ту же метку.
            const title = reference.title?.replace(
                /[&"\\\r\n]/g,
                (char) => '&#' + char.charCodeAt(0) + ';',
            );
            insert = '(' + insert + (title ? ' "' + title + '"' : '') + ')';
        }
        if (state.sliceDoc(from, to) !== insert) changes.push({from, to, insert});
    }
    // Все позиции относятся к state.doc: изменения применятся вместе, без ручного
    // сдвига координат и повторного поиска по новым адресам (каскадной замены).
    return changes;
}

function validRange(range: {from: number; to: number}, doc: Text) {
    return (
        Number.isInteger(range.from) &&
        Number.isInteger(range.to) &&
        range.from >= 0 &&
        range.to >= range.from &&
        range.to <= doc.length
    );
}
