import type {Node} from 'prosemirror-model';
import type {EditorState, Transaction} from 'prosemirror-state';
import type {Mapping, StepMap} from 'prosemirror-transform';
import {Decoration, DecorationSet, type EditorView} from 'prosemirror-view';

import {getParserFromState} from '../../../core/utils/parser';
import {getReactRendererFromState} from '../../../extensions/behavior/ReactRenderer';
import {type ResourceRange, overlaps, resourceKey} from '../controller.utils';
import {createResourceIndicator, destroyResourceIndicator} from '../indicator';
import type {ReplacementResource} from '../types';
import {isUrlResource, validateResourceUrl} from '../urls';

import {remoteTransactionMeta, resolvedResourceMeta, resourceHistoryKey} from './const';
import type {ResourceBatch, ResourceReplacementMeta, ResourceReplacementState} from './types';

export function isHistoryTransaction(tr: Transaction) {
    return Boolean(resourceHistoryKey && tr.getMeta(resourceHistoryKey));
}

/** Ignore derived changes, collaboration updates and history replay. */
export function isOriginalLocalDocumentChange(tr: Transaction) {
    return (
        tr.docChanged &&
        !tr.getMeta('appendedTransaction') &&
        !tr.getMeta(resolvedResourceMeta) &&
        !tr.getMeta(remoteTransactionMeta) &&
        !tr.getMeta('rebased') &&
        !isHistoryTransaction(tr)
    );
}

export function isSelectionInCode(state: EditorState) {
    return (
        state.selection.$from.parent.type.spec.code ||
        (state.storedMarks ?? state.selection.$from.marks()).some((mark) => mark.type.spec.code)
    );
}

export function collectResourcesInRanges(state: EditorState, ranges: readonly ResourceRange[]) {
    const resources = new Map<number, ResourceRange & {resource: ReplacementResource}>();
    for (const range of ranges)
        state.doc.nodesBetween(range.from, range.to, (node, from) => {
            if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
            const description = describeResource(node);
            const to = from + node.nodeSize;
            if (
                description &&
                from >= range.from &&
                to <= range.to &&
                (!isUrlResource(node.type.name, description) ||
                    getParserFromState(state).validateLink(node.attrs[description.valueAttribute]))
            ) {
                const name = description.nameAttribute && node.attrs[description.nameAttribute];
                resources.set(from, {
                    from,
                    to,
                    resource: {
                        kind: description.kind,
                        value: node.attrs[description.valueAttribute],
                        ...(typeof name === 'string' && name ? {name} : {}),
                    },
                });
            }
            return true;
        });
    return [...resources.values()].sort((a, b) => a.from - b.from);
}

function stepOverlapsProtectedRanges(map: StepMap, ranges: readonly ResourceRange[]) {
    let overlapsProtectedRange = false;
    map.forEach((from, to) => {
        if (ranges.some((range) => overlaps(range, from, to))) overlapsProtectedRange = true;
    });
    return overlapsProtectedRange;
}

function stepChangesProtectedNodes(
    before: Node,
    after: Node,
    map: StepMap,
    ranges: readonly ResourceRange[],
) {
    // Attribute and mark steps can change a protected node without a changed range.
    return ranges.some(
        (range) => !after.nodeAt(map.map(range.from, 1))?.eq(before.nodeAt(range.from)!),
    );
}

export function changesProtectedResources(
    tr: Transaction,
    state: EditorState,
    batches: ResourceReplacementState,
) {
    let ranges = batches
        .filter((batch) => batch.started)
        .flatMap((batch) => collectResourcesInRanges(state, batch.ranges));

    for (let index = 0; index < tr.steps.length; index++) {
        const map = tr.mapping.maps[index];
        const overlapsProtectedRanges = stepOverlapsProtectedRanges(map, ranges);
        const changesProtectedNodes = stepChangesProtectedNodes(
            tr.docs[index],
            tr.docs[index + 1] ?? tr.doc,
            map,
            ranges,
        );
        if (overlapsProtectedRanges || changesProtectedNodes) return true;

        // The next step uses the document and positions produced by this step.
        ranges = ranges.map((range) => ({
            ...range,
            from: map.map(range.from, 1),
            to: map.map(range.to, -1),
        }));
    }
    return false;
}

export function mapBatchRanges(batches: ResourceReplacementState, mapping: Mapping) {
    return batches.map((batch) => ({
        ...batch,
        ranges: batch.ranges
            .map((range) => ({
                from: mapping.map(range.from, 1),
                to: mapping.map(range.to, -1),
            }))
            .filter((range) => range.from < range.to),
    }));
}

export function applyBatchMeta(batches: ResourceBatch[], meta?: ResourceReplacementMeta) {
    if (meta?.type === 'release') return batches.filter((batch) => batch.id !== meta.id);
    if (meta?.type === 'start')
        return batches.map((batch) => (batch.id === meta.id ? {...batch, started: true} : batch));
    return batches;
}

export function collectAddedRangesInFinalDocument(tr: Transaction) {
    const ranges: ResourceRange[] = [];
    tr.mapping.maps.forEach((map, index) =>
        map.forEach((_from, _to, from, to) => {
            // A step's new range must pass through all subsequent steps.
            const rest = tr.mapping.slice(index + 1);
            if (from < to) ranges.push({from: rest.map(from, 1), to: rest.map(to, -1)});
        }),
    );
    return ranges;
}

export function describeResource(node: Node) {
    const resource = node.type.spec._resource;
    return resource && typeof node.attrs[resource.valueAttribute] === 'string'
        ? resource
        : undefined;
}

export function resourceReplacementTransaction(
    state: EditorState,
    replacements: ReadonlyMap<string, string>,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
) {
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key))
            urls.set(key, validateResourceUrl(getParserFromState(state), value));
    }
    const tr = state.tr;
    state.doc.descendants((node, pos) => {
        if (node.type.spec.code || node.marks.some((mark) => mark.type.spec.code)) return false;
        const resource = describeResource(node);
        if (resource) {
            const key = resourceKey({
                kind: resource.kind,
                value: node.attrs[resource.valueAttribute],
            });
            let value = replacements.get(key);
            if (value !== undefined && isUrlResource(node.type.name, resource)) {
                const parser = getParserFromState(state);
                if (!parser.validateLink(node.attrs[resource.valueAttribute])) return true;
                value = urls.get(key) ?? validateResourceUrl(parser, value);
                urls.set(key, value);
            }
            if (value !== undefined && value !== node.attrs[resource.valueAttribute])
                tr.setNodeAttribute(pos, resource.valueAttribute, value);
        }
        return true;
    });
    return tr.docChanged
        ? tr.setMeta('addToHistory', false).setMeta(resolvedResourceMeta, true)
        : null;
}

function calculateIndicatorSize(
    node: Node,
    image: HTMLImageElement | null,
    rect: DOMRect | undefined,
    limit: number,
) {
    const dimension = (value: unknown, fallback: number) => {
        if (typeof value === 'string' && value.endsWith('%'))
            return (parseFloat(value) * limit) / 100 || fallback;
        return Number(value) > 0 ? Number(value) : fallback;
    };
    let width = rect?.width || dimension(node.attrs.width, image?.naturalWidth || 160);
    let height = rect?.height || dimension(node.attrs.height, image?.naturalHeight || 100);
    const scale = Math.min(1, limit / width, 700 / height);
    width *= scale;
    height *= scale;
    return {width, height};
}

function createPendingResourceIndicator(
    view: EditorView,
    state: EditorState,
    from: number,
    resource: ReplacementResource,
) {
    const node = state.doc.nodeAt(from)!;
    const dom = view.nodeDOM(from);
    const image = dom instanceof HTMLElement ? dom.querySelector('img') : null;
    const rect = dom instanceof HTMLElement ? (image ?? dom).getBoundingClientRect() : undefined;
    let renderer;
    try {
        renderer = getReactRendererFromState(view.state);
    } catch {
        /* Standalone editors may omit React. */
    }
    const limit = view.dom.clientWidth || 1600;
    const size = calculateIndicatorSize(node, image, rect, limit);
    return createResourceIndicator(
        resource,
        renderer,
        node.type.name === 'image' ? size : undefined,
    );
}

export function collectResourceDecorations(state: EditorState, batches: ResourceReplacementState) {
    const decorations: Decoration[] = [];
    for (const batch of batches) {
        for (const [index, {from, to, resource}] of collectResourcesInRanges(
            state,
            batch.ranges,
        ).entries()) {
            decorations.push(
                Decoration.node(from, to, {
                    style: 'display: none',
                    'aria-hidden': 'true',
                }),
            );
            decorations.push(
                Decoration.widget(
                    from,
                    (view) => createPendingResourceIndicator(view, state, from, resource),
                    {
                        key: `${batch.id}:${index}`,
                        side: -1,
                        destroy: (dom) => destroyResourceIndicator(dom as HTMLElement),
                    },
                ),
            );
        }
    }
    return DecorationSet.create(state.doc, decorations);
}
