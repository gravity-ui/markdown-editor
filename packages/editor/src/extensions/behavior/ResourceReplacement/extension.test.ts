import {closeHistory, history, redo, undo} from 'prosemirror-history';
import {EditorState, Plugin, TextSelection, type Transaction} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';
import {afterEach, describe, expect, test, vi} from 'vitest';

import {ExtensionsManager} from '../../../core/ExtensionsManager';
import {ParserFacet} from '../../../core/utils/parser';
import type {ResourceReplacementRequest} from '../../../modules/resource-replacement/controller';
import {resourceKey} from '../../../modules/resource-replacement/controller.utils';
import {BaseSchemaSpecs} from '../../base/specs';
import {CodeSpecs} from '../../markdown/Code/CodeSpecs';
import {ImageSpecs} from '../../markdown/Image/ImageSpecs';

import {isProseMirrorHistoryLocked} from './history-lock';
import {resolvedResourceMeta, resourceHistoryKey} from './meta';
import {resourceReplacementKey} from './plugin-key';

import {ResourceReplacement} from './index';

const views: EditorView[] = [];
afterEach(() => {
    for (const view of views.splice(0)) {
        if (!view.isDestroyed) view.destroy();
    }
});

function setup({
    initial = 'before',
    enabled = true,
    busy = false,
    acceptRequests = true,
    extraPlugins = [],
}: {
    initial?: string;
    enabled?: boolean;
    busy?: boolean;
    acceptRequests?: boolean;
    extraPlugins?: Plugin[];
} = {}) {
    const requests: ResourceReplacementRequest[] = [];
    const controller = {
        enabled,
        busy,
        start: vi.fn((request: ResourceReplacementRequest) => {
            requests.push(request);
            return acceptRequests;
        }),
    };
    const shouldProcessTransaction = vi.fn(
        (tr: Transaction) => tr.getMeta('paste') === true || tr.getMeta('uiEvent') === 'drop',
    );
    const {schema, plugins, markupParser} = new ExtensionsManager({
        extensions(builder) {
            builder.use(BaseSchemaSpecs, {}).use(ImageSpecs).use(CodeSpecs);
            builder.overrideNodeSpec('image', (spec) => ({
                ...spec,
                _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
            }));
            builder.use(ResourceReplacement, {controller, shouldProcessTransaction});
        },
    }).build();
    const state = EditorState.create({
        schema,
        doc: markupParser.parse(initial),
        plugins: [ParserFacet.of(markupParser), history(), ...plugins, ...extraPlugins],
    });
    const view = new EditorView(document.createElement('div'), {state});
    views.push(view);
    const pasteTransaction = (src = '/old.png') =>
        view.state.tr
            .insert(
                view.state.doc.content.size - 1,
                schema.nodes.image.create({src, alt: 'pasted'}),
            )
            .setMeta('paste', true);
    return {
        view,
        schema,
        controller,
        shouldProcessTransaction,
        requests,
        pasteTransaction,
        paste: (src?: string) => view.dispatch(pasteTransaction(src)),
        batches: () => resourceReplacementKey.getState(view.state) ?? [],
        indicators: () => view.dom.querySelectorAll('[data-resource-pending]'),
    };
}

function imagePaths(state: EditorState) {
    const paths: string[] = [];
    state.doc.descendants((node) => {
        if (node.type.name === 'image') paths.push(node.attrs.src);
    });
    return paths;
}

function replacements(from = '/old.png', to = '/new.png') {
    return new Map([[resourceKey({kind: 'image', value: from}), to]]);
}

describe('resourceReplacementPlugin: accepted state', () => {
    test('does not track resources already present when the view is created', () => {
        const t = setup({initial: '![existing](/old.png)'});
        expect(t.batches()).toEqual([]);
        expect(t.indicators()).toHaveLength(0);
        expect(t.controller.start).not.toHaveBeenCalled();
    });

    test('precomputes batches without requests and starts only after accepting the state', () => {
        const t = setup();
        const original = t.view.state;
        const tr = t.pasteTransaction();
        const prepared = original.applyTransaction(tr).state;
        const recomputed = original.applyTransaction(tr).state;
        expect(resourceReplacementKey.getState(prepared)).toEqual([
            expect.objectContaining({started: false, ranges: [{from: 7, to: 8}]}),
        ]);
        expect(resourceReplacementKey.getState(recomputed)).toHaveLength(1);
        expect(isProseMirrorHistoryLocked(prepared)).toBe(true);
        expect(isProseMirrorHistoryLocked(original)).toBe(false);
        expect(t.view.state).toBe(original);
        expect(t.controller.start).not.toHaveBeenCalled();

        t.controller.start.mockImplementationOnce((request) => {
            expect(imagePaths(t.view.state)).toEqual(['/old.png']);
            expect(t.batches()).toEqual([expect.objectContaining({started: true})]);
            expect(request.resources).toEqual([{kind: 'image', value: '/old.png', name: 'pasted'}]);
            // A synchronous editor update must not start this batch again.
            t.view.dispatch(t.view.state.tr.setMeta('notification', true));
            return true;
        });
        t.view.updateState(prepared);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
        expect(t.indicators()).toHaveLength(0);
    });

    test('nested starts and callbacks never restart another already accepted batch', () => {
        const t = setup();
        const first = t.view.state.apply(t.pasteTransaction('/first'));
        const second = first.apply(
            first.tr
                .insert(1, t.schema.nodes.image.create({src: '/second'}))
                .setMeta('paste', true),
        );
        t.controller.start.mockImplementation((request) => {
            t.requests.push(request);
            t.view.dispatch(t.view.state.tr.setMeta('notification', true));
            request.release();
            return true;
        });
        t.view.updateState(second);
        expect(t.controller.start).toHaveBeenCalledTimes(2);
        expect(
            t.requests.flatMap(({resources}) => resources.map(({value}) => value)).sort(),
        ).toEqual(['/first', '/second']);
        expect(t.batches()).toEqual([]);
    });

    test('callbacks may accept another paste without losing its operation', () => {
        const t = setup();
        t.controller.start.mockImplementationOnce((request) => {
            t.requests.push(request);
            t.paste('/second');
            request.release();
            return true;
        });
        t.paste();
        expect(t.controller.start).toHaveBeenCalledTimes(2);
        expect(t.batches()).toHaveLength(1);
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);
        t.requests[1].release();
        expect(t.batches()).toEqual([]);
    });

    test('a later transaction filter can reject a paste without starting a request', () => {
        const t = setup({
            extraPlugins: [new Plugin({filterTransaction: (tr) => !tr.getMeta('reject-paste')})],
        });
        const original = t.view.state;
        const tr = t.pasteTransaction().setMeta('reject-paste', true);
        t.view.dispatch(tr);
        expect(t.view.state).toBe(original);
        expect(t.batches()).toEqual([]);
        expect(t.controller.start).not.toHaveBeenCalled();

        t.view.dispatch(tr.setMeta('reject-paste', false));
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test('starts with resources from the final state after appended normalization', () => {
        const t = setup({
            extraPlugins: [
                new Plugin({
                    appendTransaction(transactions, _oldState, state) {
                        if (!transactions.some((tr) => tr.getMeta('paste'))) return null;
                        return state.tr.setNodeAttribute(
                            state.doc.content.size - 2,
                            'src',
                            '/normalized',
                        );
                    },
                }),
            ],
        });
        t.paste();
        expect(t.requests[0].resources).toEqual([
            {kind: 'image', value: '/normalized', name: 'pasted'},
        ]);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
        expect(t.batches()).toHaveLength(1);
    });

    test('collects one batch in final coordinates for a transaction with multiple steps', () => {
        const t = setup({initial: '![existing](/old.png)'});
        t.view.dispatch(t.pasteTransaction().insertText('prefix', 1));
        expect(t.batches()).toEqual([{id: expect.any(String), started: true}]);
        expect(t.requests[0].resources).toEqual([
            {kind: 'image', value: '/old.png', name: 'pasted'},
        ]);
        expect(t.indicators()).toHaveLength(0);
    });

    test('selection-only transactions preserve batch state', () => {
        const t = setup();
        t.paste();
        const batches = t.batches();
        t.view.dispatch(t.view.state.tr.setSelection(TextSelection.create(t.view.state.doc, 2)));
        expect(t.batches()).toBe(batches);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test.each(['disabled', 'untracked', 'text-only'] as const)(
        'does not create a batch for a %s change',
        (kind) => {
            const t = setup({enabled: kind !== 'disabled'});
            if (kind === 'untracked') t.shouldProcessTransaction.mockReturnValue(false);
            const tr =
                kind === 'text-only'
                    ? t.view.state.tr.insertText('plain', 1).setMeta('paste', true)
                    : t.pasteTransaction();
            t.view.dispatch(tr);
            expect(t.batches()).toEqual([]);
            expect(t.controller.start).not.toHaveBeenCalled();
            if (kind === 'disabled') expect(t.shouldProcessTransaction).not.toHaveBeenCalled();
        },
    );

    test.each(['paste', 'drop'] as const)(
        '%s respects the code context exception for drops',
        (event) => {
            const t = setup();
            t.view.dispatch(t.view.state.tr.setStoredMarks([t.schema.marks.code.create()]));
            const tr = t.pasteTransaction();
            if (event === 'drop') tr.setMeta('uiEvent', 'drop');
            t.view.dispatch(tr);
            expect(t.controller.start).toHaveBeenCalledTimes(event === 'drop' ? 1 : 0);
        },
    );
});

describe('resourceReplacementPlugin: editing and history', () => {
    test('shows resources normally and allows edits, marks, movement and deletion while pending', () => {
        const t = setup({initial: '![existing](/old.png)'});
        t.paste();
        const images = t.view.dom.querySelectorAll<HTMLImageElement>(
            'img:not(.ProseMirror-separator)',
        );
        expect(images).toHaveLength(2);
        expect(Array.from(images, (image) => [image.getAttribute('src'), image.alt])).toEqual([
            ['/old.png', 'existing'],
            ['/old.png', 'pasted'],
        ]);
        expect(t.view.dom.querySelector('[aria-hidden="true"]')).toBeNull();
        expect(t.indicators()).toHaveLength(0);
        t.view.dispatch(t.view.state.tr.setNodeAttribute(2, 'src', '/manual'));
        t.view.dispatch(t.view.state.tr.addMark(2, 3, t.schema.marks.code.create()));
        const moved = t.view.state.doc.nodeAt(2);
        if (!moved) throw new Error('Missing resource');
        t.view.dispatch(t.view.state.tr.delete(2, 3).insert(1, moved));
        t.view.dispatch(t.view.state.tr.insertText('prefix', 1));
        expect(imagePaths(t.view.state)).toEqual(['/manual', '/old.png']);
        expect(t.batches()).toEqual([{id: expect.any(String), started: true}]);
        t.view.dispatch(t.view.state.tr.delete(7, 8));
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);
        t.requests[0].apply(replacements());
        t.requests[0].release();
        expect(imagePaths(t.view.state)).toEqual(['/new.png']);
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(false);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test('a deleted resource is not restored by resolve; undo deletion can restore its old value', () => {
        const t = setup();
        t.paste();
        t.view.dispatch(t.view.state.tr.delete(7, 8));
        const deleted = t.view.state.doc;
        expect(t.batches()).toHaveLength(1);
        t.requests[0].apply(replacements());
        t.requests[0].release();
        expect(t.view.state.doc).toBe(deleted);
        undo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        redo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual([]);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test('a changed URL only matches its current response key, with no cascading replacements', () => {
        const t = setup();
        t.view.dispatch(
            t.pasteTransaction().insert(1, t.schema.nodes.image.create({src: '/other'})),
        );
        t.view.dispatch(t.view.state.tr.setNodeAttribute(8, 'src', '/other'));
        t.requests[0].apply(
            new Map([
                [resourceKey({kind: 'image', value: '/old.png'}), '/other'],
                [resourceKey({kind: 'image', value: '/other'}), '/final'],
            ]),
        );
        t.requests[0].release();
        expect(imagePaths(t.view.state)).toEqual(['/final', '/final']);
    });

    test('manual URL changes survive resolve and can be undone to their old values', () => {
        const t = setup();
        t.paste();
        t.view.dispatch(t.view.state.tr.setNodeAttribute(7, 'src', '/manual'));
        t.requests[0].apply(replacements());
        t.requests[0].release();
        expect(imagePaths(t.view.state)).toEqual(['/manual']);
        undo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test('moving a pending resource updates its current position; undo the move can restore its old value', () => {
        const t = setup();
        t.paste();
        const node = t.view.state.doc.nodeAt(7);
        if (!node) throw new Error('Missing resource');
        t.view.dispatch(closeHistory(t.view.state.tr).delete(7, 8).insert(1, node));
        t.requests[0].apply(replacements());
        t.requests[0].release();
        expect(t.view.state.doc.nodeAt(1)?.attrs.src).toBe('/new.png');
        undo(t.view.state, t.view.dispatch);
        expect(t.view.state.doc.nodeAt(7)?.attrs.src).toBe('/old.png');
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });

    test('checks requested URLs even after deleting every matching node', () => {
        const t = setup();
        t.paste();
        t.view.dispatch(t.view.state.tr.delete(7, 8));
        // eslint-disable-next-line no-script-url
        expect(() => t.requests[0].apply(replacements('/old.png', 'javascript:alert(1)'))).toThrow(
            'Invalid resource URL',
        );
        expect(imagePaths(t.view.state)).toEqual([]);
        t.requests[0].release();
        expect(isProseMirrorHistoryLocked(t.view.state)).toBe(false);
    });

    test.each(['queued batch', 'busy controller'] as const)(
        'blocks history even without document changes when there is a %s',
        (reason) => {
            if (!resourceHistoryKey) throw new Error('Missing history plugin key');
            const t = setup({busy: reason === 'busy controller'});
            const state =
                reason === 'queued batch' ? t.view.state.apply(t.pasteTransaction()) : t.view.state;
            const result = state.applyTransaction(state.tr.setMeta(resourceHistoryKey, {}));
            expect(result.state).toBe(state);
            expect(result.transactions).toEqual([]);
            expect(t.controller.start).not.toHaveBeenCalled();
        },
    );

    test('service replacements bypass the history transaction filter', () => {
        if (!resourceHistoryKey) throw new Error('Missing history plugin key');
        const t = setup();
        t.paste();
        t.controller.busy = true;
        const from = 7;
        // Inspect filtering directly: history metadata here is only a priority sentinel.
        const plugin = resourceReplacementKey.get(t.view.state);
        if (!plugin?.spec.filterTransaction) throw new Error('Missing resource replacement filter');
        const tr = t.view.state.tr
            .setNodeAttribute(from, 'src', '/resolved')
            .setMeta(resolvedResourceMeta, true)
            .setMeta(resourceHistoryKey, {});
        expect(plugin.spec.filterTransaction.call(plugin, tr, t.view.state)).toBe(true);
        t.requests[0].apply(replacements());
        expect(imagePaths(t.view.state)).toEqual(['/new.png']);
    });

    test('blocks pending undo and preserves resolved URLs through undo/redo without another request', () => {
        const t = setup({initial: '![existing](/old.png)'});
        t.paste();
        const pending = t.view.state;
        undo(t.view.state, t.view.dispatch);
        expect(t.view.state).toBe(pending);
        t.requests[0].apply(replacements());
        t.requests[0].release();
        expect(imagePaths(t.view.state)).toEqual(['/new.png', '/new.png']);

        undo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual(['/new.png']);
        redo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual(['/new.png', '/new.png']);
        expect(t.batches()).toEqual([]);
        expect(t.controller.start).toHaveBeenCalledTimes(1);
    });
});

describe('resourceReplacementPlugin: request lifecycle', () => {
    test.each([0, 1])(
        'releases only the completed batch when request %s responds first',
        (first) => {
            const t = setup({initial: '![existing](/old.png)'});
            t.paste();
            t.paste();
            const batches = t.batches();
            expect(t.controller.start).toHaveBeenCalledTimes(2);
            expect(t.indicators()).toHaveLength(0);

            t.requests[first].apply(replacements());
            expect(imagePaths(t.view.state)).toEqual(['/new.png', '/new.png', '/new.png']);
            expect(t.indicators()).toHaveLength(0);
            t.requests[first].release();
            expect(t.batches().map(({id}) => id)).toEqual([batches[1 - first].id]);
            expect(t.indicators()).toHaveLength(0);
            const pending = t.view.state;
            undo(t.view.state, t.view.dispatch);
            expect(t.view.state).toBe(pending);
            expect(isProseMirrorHistoryLocked(t.view.state)).toBe(true);

            t.requests[1 - first].apply(replacements('/old.png', '/late.png'));
            t.requests[1 - first].release();
            expect(imagePaths(t.view.state)).toEqual(['/new.png', '/new.png', '/new.png']);
            expect(t.batches()).toEqual([]);
            expect(t.indicators()).toHaveLength(0);
        },
    );

    test('releases the batch immediately when the controller declines to start', () => {
        const t = setup({acceptRequests: false});
        t.paste();
        expect(t.controller.start).toHaveBeenCalledTimes(1);
        expect(t.batches()).toEqual([]);
        expect(t.indicators()).toHaveLength(0);
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        undo(t.view.state, t.view.dispatch);
        expect(imagePaths(t.view.state)).toEqual([]);
    });

    test('can apply and release synchronously inside start without starting the batch twice', () => {
        const t = setup();
        t.controller.start.mockImplementationOnce((request) => {
            expect(t.batches()[0].started).toBe(true);
            request.apply(replacements());
            request.release();
            return true;
        });
        t.paste();
        expect(t.controller.start).toHaveBeenCalledTimes(1);
        expect(imagePaths(t.view.state)).toEqual(['/new.png']);
        expect(t.batches()).toEqual([]);
        expect(t.indicators()).toHaveLength(0);
    });

    test('release without a response keeps original URLs and unlocks history', () => {
        const t = setup();
        t.paste();
        const from = 7,
            to = 8;
        t.requests[0].release();
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        expect(t.indicators()).toHaveLength(0);
        t.view.dispatch(t.view.state.tr.delete(from, to));
        expect(imagePaths(t.view.state)).toEqual([]);
    });

    test('an empty response is allowed in a readonly view, but a document change fails', () => {
        const t = setup();
        t.paste();
        t.view.setProps({editable: () => false});
        expect(() => t.requests[0].apply(new Map())).not.toThrow();
        expect(() => t.requests[0].apply(replacements())).toThrow('Editor is no longer editable');
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        t.requests[0].release();
        expect(t.batches()).toEqual([]);
        expect(t.indicators()).toHaveLength(0);
    });

    test('reports a replacement rejected by another plugin and still allows release', () => {
        const t = setup({
            extraPlugins: [
                new Plugin({
                    filterTransaction: (tr) => !tr.getMeta(resolvedResourceMeta),
                }),
            ],
        });
        t.paste();
        expect(() => t.requests[0].apply(replacements())).toThrow(
            'Resource replacement was rejected',
        );
        expect(imagePaths(t.view.state)).toEqual(['/old.png']);
        expect(t.batches()).toHaveLength(1);
        t.requests[0].release();
        expect(t.batches()).toEqual([]);
        expect(t.indicators()).toHaveLength(0);
    });

    test.each(['view', 'plugin'] as const)(
        'late callbacks cannot apply or dispatch after destroying the %s',
        (target) => {
            const t = setup();
            t.paste();
            if (target === 'view') {
                t.view.destroy();
            } else {
                const plugin = resourceReplacementKey.get(t.view.state);
                t.view.updateState(
                    t.view.state.reconfigure({
                        plugins: t.view.state.plugins.filter((candidate) => candidate !== plugin),
                    }),
                );
                expect(t.view.isDestroyed).toBe(false);
                expect(t.indicators()).toHaveLength(0);
            }
            const dispatch = vi.spyOn(t.view, 'dispatch');
            try {
                expect(() => t.requests[0].apply(replacements())).toThrow('Editor was destroyed');
                expect(() => t.requests[0].release()).not.toThrow();
                expect(dispatch).not.toHaveBeenCalled();
            } finally {
                dispatch.mockRestore();
            }
        },
    );
});
