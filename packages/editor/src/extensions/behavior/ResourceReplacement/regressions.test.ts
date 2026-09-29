import {EditorState, Plugin, TextSelection} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, test, vi} from 'vitest';

import {ExtensionsManager} from '../../../core/ExtensionsManager';
import {ParserFacet} from '../../../core/utils/parser';
import type {ResourceReplacementRequest} from '../../../modules/resource-replacement/controller';
import {resourceKey} from '../../../modules/resource-replacement/controller.utils';
import {BaseSchemaSpecs} from '../../base/specs';
import {ImageSpecs} from '../../markdown/Image/ImageSpecs';
import {ListsSpecs} from '../../markdown/Lists/ListsSpecs';
import {collapseListsPlugin} from '../../markdown/Lists/plugins/CollapseListsPlugin';

import {isProseMirrorHistoryLocked} from './history-lock';
import {
    getResourceReplacementMeta,
    isResourceReplacementCleanupTransaction,
    remoteTransactionMeta,
    resolvedResourceMeta,
    resourceHistoryKey,
    setResourceReplacementMeta,
} from './meta';
import {resourceReplacementPlugin} from './plugin';
import {resourceReplacementKey} from './plugin-key';

const deps = new ExtensionsManager({
    extensions(builder) {
        builder.use(BaseSchemaSpecs, {}).use(ImageSpecs).use(ListsSpecs);
        builder.overrideNodeSpec('image', (spec) => ({
            ...spec,
            _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
        }));
    },
}).buildDeps();
const views: EditorView[] = [];
afterEach(() => views.splice(0).forEach((view) => view.destroy()));
const replacement = () => new Map([[resourceKey({kind: 'image', value: '/pasted'}), '/new']]);
function controller() {
    const requests: ResourceReplacementRequest[] = [];
    return {
        enabled: true,
        busy: false,
        requests,
        start: vi.fn((request: ResourceReplacementRequest) => {
            requests.push(request);
            return true;
        }),
    };
}
function pm(extra: Plugin[] = [], initial = '![old](/old)') {
    const control = controller();
    const view = new EditorView(document.createElement('div'), {
        state: EditorState.create({
            schema: deps.schema,
            doc: deps.markupParser.parse(initial),
            plugins: [
                ParserFacet.of(deps.markupParser),
                resourceReplacementPlugin({
                    controller: control,
                    shouldProcessTransaction: (tr) => tr.getMeta('paste') === true,
                }),
                ...extra,
            ],
        }),
    });
    views.push(view);
    const paste = () =>
        view.state.tr
            .insert(1, deps.schema.nodes.image.create({src: '/pasted', alt: 'pasted'}))
            .setMeta('paste', true);
    return {view, control, paste};
}
describe('PM cleanup contract', () => {
    test('all filters allow cleanup while preserving another operation and preliminary locks', () => {
        let blocked = false;
        const filters = [vi.fn(), vi.fn()];
        const t = pm(
            filters.map(
                (observe) =>
                    new Plugin({
                        filterTransaction(tr) {
                            observe(tr);
                            return isResourceReplacementCleanupTransaction(tr) || !blocked;
                        },
                    }),
            ),
        );
        const queued = t.view.state.apply(t.paste());
        expect(isProseMirrorHistoryLocked(queued)).toBe(true);
        expect(t.control.start).not.toHaveBeenCalled();
        t.view.updateState(queued);
        t.view.dispatch(t.paste());
        const state = t.view.state;
        const second = resourceReplacementKey.getState(state)?.[1];
        expect(second).toBeDefined();
        blocked = true;
        filters.forEach((observe) => observe.mockClear());
        t.control.requests[0].release();
        expect(resourceReplacementKey.getState(t.view.state)).toEqual([second]);
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);
        filters.forEach((observe) => expect(observe).toHaveBeenCalledTimes(1));
        t.control.requests[0].release();
        expect(resourceReplacementKey.getState(t.view.state)).toEqual([second]);
        expect(() => t.control.requests[1].apply(replacement())).toThrow(
            'Resource replacement was rejected',
        );
        t.control.requests[1].release();
        expect(resourceReplacementKey.getState(t.view.state)).toEqual([]);
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(false);
        expect(t.view.state.doc).toBe(state.doc);
        expect(t.view.state.selection).toBe(state.selection);
        expect(t.view.state.storedMarks).toBe(state.storedMarks);
    });

    test.each(['empty', 'declined', 'rejected-start'] as const)(
        'releases preliminary state after %s',
        (outcome) => {
            const t = pm([
                new Plugin({
                    filterTransaction(tr) {
                        if (isResourceReplacementCleanupTransaction(tr)) return true;
                        return (
                            getResourceReplacementMeta(tr)?.type !== 'release' &&
                            !(
                                outcome === 'rejected-start' &&
                                getResourceReplacementMeta(tr)?.type === 'start'
                            )
                        );
                    },
                    appendTransaction(trs, _old, state) {
                        return outcome === 'empty' && trs.some((tr) => tr.getMeta('paste'))
                            ? state.tr.delete(1, 2)
                            : null;
                    },
                }),
            ]);
            t.control.start.mockImplementation((request) => {
                expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);
                if (outcome === 'empty') expect(request.resources).toEqual([]);
                return false;
            });
            t.view.dispatch(t.paste());
            expect(t.control.start).toHaveBeenCalledTimes(outcome === 'rejected-start' ? 0 : 1);
            expect(resourceReplacementKey.getState(t.view.state)).toEqual([]);
            expect(isProseMirrorHistoryLocked(t.view.state)).toBe(false);
        },
    );

    test.each(['filter', 'dispatch'] as const)(
        'reports a %s contract violation without retrying or mutating state',
        (target) => {
            let rejectCleanup = false;
            const t = pm([
                new Plugin({
                    filterTransaction: (tr) =>
                        !(rejectCleanup && isResourceReplacementCleanupTransaction(tr)),
                }),
            ]);
            t.view.dispatch(t.paste());
            const state = t.view.state;
            const dispatch = vi.spyOn(t.view, 'dispatch');
            if (target === 'filter') rejectCleanup = true;
            else dispatch.mockImplementation(() => {});
            expect(() => t.control.requests[0].release()).toThrow(
                'filters and dispatch must accept cleanup transactions',
            );
            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(t.view.state).toBe(state);
            expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);
            dispatch.mockRestore();
        },
    );

    test('cleanup exemption cannot be used to bypass document, selection or history filters', () => {
        const t = pm();
        const cleanup = () =>
            setResourceReplacementMeta(t.view.state.tr, {type: 'release', id: 'batch'}).setMeta(
                'addToHistory',
                false,
            );
        expect(isResourceReplacementCleanupTransaction(cleanup())).toBe(true);
        for (const tr of [
            t.paste(),
            setResourceReplacementMeta(t.view.state.tr, {type: 'start', id: 'batch'}),
            cleanup().insertText('changed', 1),
            cleanup().setSelection(TextSelection.create(t.view.state.doc, 1)),
            cleanup().setStoredMarks([]),
            cleanup().scrollIntoView(),
            cleanup().setMeta('addToHistory', true),
            cleanup().setMeta(resourceHistoryKey!, {}),
        ])
            expect(isResourceReplacementCleanupTransaction(tr)).toBe(false);
    });

    test('cleanup may destroy the view during dispatch without a subsequent state read', () => {
        const t = pm();
        t.view.dispatch(t.paste());
        t.view.setProps({dispatchTransaction: () => t.view.destroy()});
        expect(() => t.control.requests[0].release()).not.toThrow();
        const dispatch = vi.spyOn(t.view, 'dispatch');
        t.control.requests[0].release();
        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe('remote history regression', () => {
    test.each([remoteTransactionMeta, 'rebased'])(
        'PM accepts %s history while queued and running',
        (meta) => {
            const t = pm();
            const queued = t.view.state.apply(t.paste());
            expect(t.control.start).not.toHaveBeenCalled();
            for (const state of [queued, t.view.state]) {
                t.control.busy = state === t.view.state;
                const tr = state.tr
                    .insertText('remote', 1)
                    .setMeta(resourceHistoryKey!, {})
                    .setMeta(meta, true)
                    .setMeta('paste', true);
                const accepted = state.applyTransaction(tr);
                expect(accepted.transactions).toContain(tr);
                expect(accepted.state.doc.textContent).toContain('remote');
                const local = accepted.state.tr.setMeta(resourceHistoryKey!, {});
                expect(accepted.state.applyTransaction(local).transactions).toEqual([]);
            }
            expect(t.control.start).not.toHaveBeenCalled();
        },
    );
});

describe('service acceptance regression', () => {
    test('PM accepts replacement followed by derived attribute normalization', () => {
        const t = pm([
            new Plugin({
                appendTransaction(trs, _old, state) {
                    if (!trs.some((tr) => tr.getMeta(resolvedResourceMeta))) return null;
                    return state.tr.setNodeAttribute(1, 'alt', 'derived');
                },
            }),
        ]);
        t.view.dispatch(t.paste());
        expect(() => t.control.requests[0].apply(replacement())).not.toThrow();
        expect(t.view.state.doc.nodeAt(1)?.attrs).toMatchObject({src: '/new', alt: 'derived'});
    });
    test('PM rejects service transaction filtered by another plugin', () => {
        const t = pm([new Plugin({filterTransaction: (tr) => !tr.getMeta(resolvedResourceMeta)})]);
        t.view.dispatch(t.paste());
        expect(() => t.control.requests[0].apply(replacement())).toThrow(
            'Resource replacement was rejected',
        );
        expect(t.view.state.doc.nodeAt(1)?.attrs.src).toBe('/pasted');
    });
});

describe('parent normalization regression', () => {
    test.each([false, true])(
        'parent replacement retains only inserted resources (remove=%s)',
        (remove) => {
            const t = pm([
                new Plugin({
                    appendTransaction(trs, _old, state) {
                        if (
                            !trs.some(
                                (tr) => tr.getMeta('paste') && !tr.getMeta('appendedTransaction'),
                            )
                        )
                            return null;
                        const paragraph = state.doc.firstChild!;
                        const children = paragraph.content.content.filter(
                            (node) => !remove || node.attrs.src !== '/pasted',
                        );
                        return state.tr.replaceWith(
                            0,
                            paragraph.nodeSize,
                            paragraph.type.create(paragraph.attrs, children),
                        );
                    },
                }),
            ]);
            t.view.dispatch(t.paste());
            const resources = t.control.requests.flatMap((request) => request.resources);
            expect(resources).toEqual(
                remove ? [] : [{kind: 'image', value: '/pasted', name: 'pasted'}],
            );
            expect(t.view.state.doc.firstChild!.childCount).toBe(remove ? 1 : 2);
        },
    );
    test('real CollapseListsPlugin retains pasted images without requesting the existing sibling', () => {
        const t = pm([collapseListsPlugin()]);
        const {paragraph, list_item: listItem, bullet_list: bulletList, image} = deps.schema.nodes;
        const old = image.create({src: '/old', alt: 'old'});
        const nested = bulletList.create(
            null,
            listItem.create(
                null,
                bulletList.create(null, listItem.create(null, paragraph.create(null, old))),
            ),
        );
        t.view.updateState(
            EditorState.create({
                schema: deps.schema,
                doc: deps.schema.nodes.doc.create(null, nested),
                plugins: t.view.state.plugins,
            }),
        );
        const tr = t.view.state.tr
            .insert(5, [
                image.create({src: '/pasted', alt: 'pasted'}),
                image.create({src: '/second', alt: 'second'}),
            ])
            .setMeta('paste', true);
        tr.setSelection(TextSelection.create(tr.doc, 5));
        t.view.dispatch(tr);
        expect(t.view.state.doc.firstChild!.firstChild!.firstChild!.type.name).toBe('paragraph');
        expect(t.control.requests.flatMap((request) => request.resources)).toEqual([
            {kind: 'image', value: '/pasted', name: 'pasted'},
            {kind: 'image', value: '/second', name: 'second'},
        ]);
        expect(t.control.start).toHaveBeenCalledTimes(1);
    });
});

describe('service dispatch contract', () => {
    test('PM rejects a discarded speculative application even when replacement text is published separately', () => {
        const t = pm();
        t.view.dispatch(t.paste());
        t.view.setProps({
            dispatchTransaction(tr) {
                const discarded = t.view.state.applyTransaction(tr).state;
                t.view.updateState(
                    EditorState.create({
                        schema: deps.schema,
                        doc: discarded.doc,
                        plugins: t.view.state.plugins,
                    }),
                );
            },
        });
        expect(() => t.control.requests[0].apply(replacement())).toThrow(
            'Resource replacement was rejected',
        );
    });
    test('PM confirms service dispatch once, including a following synchronous edit', () => {
        const applied = vi.fn();
        const t = pm([
            new Plugin({
                filterTransaction(tr) {
                    if (tr.getMeta(resolvedResourceMeta)) applied();
                    return true;
                },
            }),
        ]);
        t.view.dispatch(t.paste());
        t.view.setProps({
            dispatchTransaction(tr) {
                t.view.updateState(t.view.state.applyTransaction(tr).state);
                if (tr.getMeta(resolvedResourceMeta))
                    t.view.dispatch(t.view.state.tr.insertText('after', 1));
            },
        });
        expect(() => t.control.requests[0].apply(replacement())).not.toThrow();
        expect(applied).toHaveBeenCalledTimes(1);
        expect(t.view.state.doc.textContent).toContain('after');
    });
    test('should reject a PM dispatch that does not apply the transaction', () => {
        const t = pm();
        t.view.dispatch(t.paste());
        const original = t.view.dispatch;
        t.view.dispatch = vi.fn();
        try {
            expect(() => t.control.requests[0].apply(replacement())).toThrow(
                'Resource replacement was rejected',
            );
        } finally {
            t.view.dispatch = original;
        }
    });
    test('should preserve PM dispatch errors', () => {
        const t = pm();
        t.view.dispatch(t.paste());
        const original = t.view.dispatch;
        t.view.dispatch = () => {
            throw new Error('binding failed');
        };
        try {
            expect(() => t.control.requests[0].apply(replacement())).toThrow('binding failed');
        } finally {
            t.view.dispatch = original;
        }
    });
    test('should reject PM state changes during URL preparation', () => {
        const t = pm();
        t.view.dispatch(t.paste());
        const normalize = deps.markupParser.normalizeLink.bind(deps.markupParser);
        const spy = vi.spyOn(deps.markupParser, 'normalizeLink').mockImplementationOnce((value) => {
            t.view.dispatch(t.view.state.tr.insertText('edit', 1));
            return normalize(value);
        });
        try {
            expect(() => t.control.requests[0].apply(replacement())).toThrow(
                'Editor changed during resource transformation',
            );
        } finally {
            spy.mockRestore();
        }
    });
});

describe('normalization provenance', () => {
    test('resource collection follows normalization steps in the insertion transaction itself', () => {
        const t = pm();
        const tr = t.paste();
        const paragraph = tr.doc.firstChild!;
        tr.replaceWith(
            0,
            paragraph.nodeSize,
            paragraph.type.create(paragraph.attrs, paragraph.content),
        );
        t.view.dispatch(tr);
        expect(t.control.requests.flatMap((request) => request.resources)).toEqual([
            {kind: 'image', value: '/pasted', name: 'pasted'},
        ]);
        expect(t.control.start).toHaveBeenCalledTimes(1);
    });
    test('reads final values after relocation and attribute normalization in either order', () => {
        for (const attributesFirst of [true, false]) {
            const t = pm([
                new Plugin({
                    appendTransaction(trs, _old, state) {
                        if (
                            !trs.some(
                                (tr) => tr.getMeta('paste') && !tr.getMeta('appendedTransaction'),
                            )
                        )
                            return null;
                        const tr = state.tr;
                        if (attributesFirst) tr.setNodeAttribute(1, 'src', '/normalized');
                        const paragraph = tr.doc.firstChild!;
                        tr.replaceWith(
                            0,
                            paragraph.nodeSize,
                            paragraph.type.create(paragraph.attrs, paragraph.content),
                        );
                        if (!attributesFirst) tr.setNodeAttribute(1, 'src', '/normalized');
                        return tr;
                    },
                }),
            ]);
            t.view.dispatch(t.paste());
            expect(t.control.requests.flatMap((request) => request.resources)).toEqual([
                {kind: 'image', value: '/normalized', name: 'pasted'},
            ]);
            expect(t.control.start).toHaveBeenCalledTimes(1);
        }
    });
    test.each(['clone', 'duplicate', 'delete-duplicate'] as const)(
        'omits ambiguous or recreated resource identity: %s',
        (scenario) => {
            const t = pm([
                new Plugin({
                    appendTransaction(trs, _old, state) {
                        if (
                            !trs.some(
                                (tr) => tr.getMeta('paste') && !tr.getMeta('appendedTransaction'),
                            )
                        )
                            return null;
                        const paragraph = state.doc.firstChild!;
                        const first = paragraph.firstChild!;
                        const content =
                            scenario === 'clone'
                                ? [
                                      first.type.create({...first.attrs, src: '/normalized'}),
                                      paragraph.lastChild!,
                                  ]
                                : scenario === 'duplicate'
                                  ? [first, first, paragraph.lastChild!]
                                  : [paragraph.lastChild!];
                        return state.tr.replaceWith(
                            0,
                            paragraph.nodeSize,
                            paragraph.type.create(paragraph.attrs, content),
                        );
                    },
                }),
            ]);
            const tr = t.paste();
            if (scenario === 'delete-duplicate') tr.replaceWith(2, 3, tr.doc.nodeAt(1)!);
            t.view.dispatch(tr);
            expect(t.control.requests.flatMap((request) => request.resources)).toEqual([]);
        },
    );
});

test.each([remoteTransactionMeta, 'rebased'])(
    'PM remote %s insertion cannot start another resolve',
    (meta) => {
        const t = pm();
        t.view.dispatch(t.paste());
        t.view.dispatch(t.paste().setMeta(resourceHistoryKey!, {}).setMeta(meta, true));
        expect(t.view.state.doc.firstChild!.childCount).toBe(3);
        expect(t.control.start).toHaveBeenCalledTimes(1);
    },
);

test('PM paste replacing a selected resource with the same immutable node is still an insertion', () => {
    const t = pm();
    const image = t.view.state.doc.nodeAt(1);
    if (!image) throw new Error('Missing selected image');
    t.view.dispatch(t.view.state.tr.replaceWith(1, 2, image).setMeta('paste', true));
    expect(t.control.requests.flatMap((request) => request.resources)).toEqual([
        {kind: 'image', value: '/old', name: 'old'},
    ]);
});
