import type {EditorState, Text, Transaction} from '@codemirror/state';
import type {SyntaxNode} from '@lezer/common';

import {completeSyntaxTree} from '../../../markup/codemirror/syntax-tree';
import type {ResourceRange} from '../controller.utils';
import type {ReplacementResource, ResourceSpecOverrides} from '../types';
import {defaultResourceUrls, isUrlResource} from '../urls';

import {collectReferenceDefinitions} from './builtins';
import {
    type CodeMirrorResourceHandler,
    type ResourceSyntaxMatch,
    resourceHandlers,
} from './handlers';
import type {CodeMirrorResourceReplacementOptions} from './options';
import {isCodeSyntaxNode} from './syntax-tree';

type Match = {syntax: ResourceSyntaxMatch; resource: ReplacementResource; isUrl: boolean};

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
    const tree = completeSyntaxTree(state, tr);
    const {resources} = options;
    const urls = options.urls ?? defaultResourceUrls;
    const handlers = state.facet(resourceHandlers);
    validateConfiguredHandlers(resources, handlers);
    const definitions = collectReferenceDefinitions(tree, doc, urls);
    const matches: Match[] = [];
    for (const range of ranges ?? [{from: 0, to: doc.length}])
        tree.iterate({
            from: range.from,
            to: range.to,
            enter({node}) {
                if (isCodeSyntaxNode(node)) return false;
                const selected = findResourceHandler(node, resources, handlers);
                if (!selected) return true;
                const {handler, description} = selected;
                if (node.from < range.from || node.to > range.to) return false;
                const match = handler.read({state, node, doc, definitions, urls});
                // Отказ первого выбранного обработчика окончателен, запасного чтения нет.
                if (!match) return false;
                const value = match.attrs[description.valueAttribute];
                const isUrl = isUrlResource(handler.nodeType, description);
                if (typeof value !== 'string' || (isUrl && !urls.validateLink(value))) return false;
                validateResourceMatch(match, doc, handler.nodeType);
                if (ranges && !isResourceFullyInserted(match, range, ranges)) return false;
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
            },
        });
    return matches;
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

function validateConfiguredHandlers(
    resources: ResourceSpecOverrides,
    handlers: readonly CodeMirrorResourceHandler[],
) {
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
}

function findResourceHandler(
    node: SyntaxNode,
    resources: ResourceSpecOverrides,
    handlers: readonly CodeMirrorResourceHandler[],
) {
    for (const handler of handlers) {
        const description = resources[handler.nodeType];
        if (
            description &&
            handler.valueAttribute === description.valueAttribute &&
            handler.syntaxNodes.includes(node.name)
        )
            return {handler, description};
    }
    return undefined;
}

function validateResourceMatch(match: ResourceSyntaxMatch, doc: Text, nodeType: string) {
    if (typeof match.serialize !== 'function')
        throw new Error(`Missing resource serializer: ${nodeType}`);
    if (
        !validRange(match.range, doc) ||
        !validRange(match.valueRange, doc) ||
        (match.reference
            ? !validRange(match.reference.definitionRange, doc) ||
              !Number.isInteger(match.reference.labelTo) ||
              match.reference.labelTo < match.range.from ||
              match.reference.labelTo > match.range.to
            : match.valueRange.from < match.range.from || match.valueRange.to > match.range.to)
    )
        throw new Error(`Invalid resource source range: ${nodeType}`);
}

function isResourceFullyInserted(
    match: ResourceSyntaxMatch,
    range: ResourceRange,
    inserted: readonly ResourceRange[],
) {
    // У ссылочного изображения определение может находиться в другом диапазоне этой вставки.
    const reference = match.reference;
    return (
        match.range.from >= range.from &&
        match.range.to <= range.to &&
        (!reference ||
            inserted.some(
                (part) =>
                    part.from <= reference.definitionRange.from &&
                    part.to >= reference.definitionRange.to,
            ))
    );
}
