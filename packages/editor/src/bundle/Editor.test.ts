/// <reference types="jest" />
import {Transaction} from '@codemirror/state';

import {ReactRenderStorage} from '../extensions';
import {Logger2} from '../logger';
import {
    ResourceReplacementController,
    type ResourceReplacementResult,
    type ResourceSpecOverrides,
} from '../modules/resource-replacement';
import {resourceReplacementKey} from '../modules/resource-replacement/prosemirror/const';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl} from './Editor';
import {BundlePreset} from './wysiwyg-preset';

function createEditor(overrides: Partial<ConstructorParameters<typeof EditorImpl>[0]> = {}) {
    return new EditorImpl({
        logger: new Logger2(),
        renderStorage: new ReactRenderStorage(),
        preset: 'full',
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        pmTransformers: [],
        ...overrides,
    });
}

function createEditorWithPreview(
    overrides: Partial<ConstructorParameters<typeof EditorImpl>[0]> = {},
) {
    return createEditor({
        markupConfig: {renderPreview: () => null},
        ...overrides,
    });
}

describe('EditorImpl: changePreviewVisible', () => {
    it('should be a no-op when renderPreview is not configured', () => {
        const editor = createEditor();
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });

    it('should show preview and emit change-preview-visible event', () => {
        const editor = createEditorWithPreview();
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({visible: true});
    });

    it('should toggle preview when called without argument', () => {
        const editor = createEditorWithPreview();
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(); // false → true
        expect(editor.previewVisible).toBe(true);

        editor.changePreviewVisible(); // true → false
        expect(editor.previewVisible).toBe(false);

        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenNthCalledWith(1, {visible: true});
        expect(listener).toHaveBeenNthCalledWith(2, {visible: false});
    });

    it('should be a no-op when split mode is enabled', () => {
        const editor = createEditorWithPreview({
            initial: {splitModeEnabled: true},
            markupConfig: {renderPreview: () => null, splitMode: 'vertical'},
        });
        const listener = jest.fn();
        editor.on('change-preview-visible', listener);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('EditorImpl: changeSplitModeEnabled', () => {
    it('should enable split mode and emit change-split-mode-enabled event', () => {
        const editor = createEditor();
        const listener = jest.fn();
        editor.on('change-split-mode-enabled', listener);

        editor.changeSplitModeEnabled({splitModeEnabled: true});

        expect(editor.splitModeEnabled).toBe(true);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith({splitModeEnabled: true});
    });
});

describe('EditorImpl: mutual exclusion between preview and split mode', () => {
    it('should not show preview when split mode is active (changePreviewVisible is a no-op)', () => {
        const editor = createEditorWithPreview({
            initial: {splitModeEnabled: true},
            markupConfig: {renderPreview: () => null, splitMode: 'vertical'},
        });
        const splitListener = jest.fn();
        editor.on('change-split-mode-enabled', splitListener);

        expect(editor.splitModeEnabled).toBe(true);

        editor.changePreviewVisible(true);

        expect(editor.previewVisible).toBe(false);
        expect(editor.splitModeEnabled).toBe(true);
        // split-mode state did not change
        expect(splitListener).not.toHaveBeenCalled();
    });

    it('should not emit events when state does not change', () => {
        const editor = createEditorWithPreview();
        const previewListener = jest.fn();
        const splitListener = jest.fn();
        editor.on('change-preview-visible', previewListener);
        editor.on('change-split-mode-enabled', splitListener);

        // previewVisible already false
        editor.changePreviewVisible(false);
        // splitModeEnabled already false
        editor.changeSplitModeEnabled({splitModeEnabled: false});

        expect(previewListener).not.toHaveBeenCalled();
        expect(splitListener).not.toHaveBeenCalled();
    });
});

describe('EditorImpl: paste resource ownership', () => {
    test.each(['![label](/old.png)', '![label][ref]\n\n[ref]: /old.png'])(
        'Markdown resolves %s without initializing WYSIWYG',
        async (source) => {
            const extensions = jest.fn();
            let complete!: (result: ResourceReplacementResult) => void;
            const resolve = jest.fn(
                () =>
                    new Promise<ResourceReplacementResult>((done) => {
                        complete = done;
                    }),
            );
            const editor = createEditor({
                initial: {mode: 'markup', markup: 'before'},
                wysiwygConfig: {extensions},
                resourceReplacement: {
                    resources: {
                        image: {kind: 'picture', valueAttribute: 'src', nameAttribute: 'alt'},
                    },
                    triggers: ['paste'],
                    resolve,
                },
            });
            try {
                const view = editor.markupEditor.cm;
                expect(editor._wysiwygView).toBeUndefined();
                view.dispatch({selection: {anchor: view.state.doc.length}});
                const event = new Event('paste', {bubbles: true, cancelable: true});
                Object.defineProperty(event, 'clipboardData', {
                    value: {
                        types: ['text/yfm'],
                        files: [],
                        getData: (type: string) => (type === 'text/yfm' ? source : ''),
                    },
                });
                view.contentDOM.dispatchEvent(event);
                expect(resolve).toHaveBeenCalledWith(
                    [{kind: 'picture', value: '/old.png', name: 'label'}],
                    expect.any(Object),
                );
                expect(editor.getPendingResourceReplacements()).toHaveLength(1);
                complete({
                    replacements: [
                        {
                            kind: 'picture',
                            oldValue: '/old.png',
                            newValue: '/copied image.png?x=1&y=2',
                        },
                    ],
                });
                for (let i = 0; i < 5; i++) await Promise.resolve();
                expect(editor.getValue()).toContain('![label](/copied%20image.png?x=1&amp;y=2)');
                expect(editor.getPendingResourceReplacements()).toHaveLength(0);
                expect(editor._wysiwygView).toBeUndefined();
                expect(extensions).not.toHaveBeenCalled();
            } finally {
                editor.destroy();
            }
        },
    );

    test.each(['wysiwyg', 'markup'] as const)(
        'destroy cancels pending %s operations and ignores late results',
        async (mode) => {
            const signals: AbortSignal[] = [];
            const resolutions: Array<(result: ResourceReplacementResult) => void> = [];
            const events = jest.fn();
            const editor = createEditor({
                initial: {mode, markup: 'before'},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder.use(BundlePreset, {
                            preset: 'full',
                            searchPanel: false,
                            directiveSyntax: new DirectiveSyntaxContext('enabled'),
                            reactRenderer: new ReactRenderStorage(),
                        }),
                },
                resourceReplacement: {
                    resources: {
                        image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
                    },
                    triggers: ['paste'],
                    resolve: (_resources, {signal}) => {
                        signals.push(signal);
                        return new Promise((resolve) => resolutions.push(resolve));
                    },
                    onChange: events,
                },
            });
            try {
                const dom =
                    mode === 'wysiwyg'
                        ? editor.wysiwygEditor.dom
                        : editor.markupEditor.cm.contentDOM;
                for (let i = 0; i < 2; i++) {
                    const event = new Event('paste', {bubbles: true, cancelable: true});
                    Object.defineProperty(event, 'clipboardData', {
                        value: {
                            types: ['text/yfm'],
                            files: [],
                            getData: (type: string) =>
                                type === 'text/yfm' ? '![label](/old.png)' : '',
                        },
                    });
                    dom.dispatchEvent(event);
                }
                expect(editor.getPendingResourceReplacements()).toHaveLength(2);
                expect(signals).toHaveLength(2);
                editor.destroy();
                expect(signals.every((signal) => signal.aborted)).toBe(true);
                expect(editor.getPendingResourceReplacements()).toEqual([]);
                expect(events.mock.calls.map(([event]) => event.status)).toEqual([
                    'pending',
                    'pending',
                    'cancelled',
                    'cancelled',
                ]);
                for (const resolve of resolutions) {
                    resolve({
                        replacements: [{kind: 'image', oldValue: '/old.png', newValue: '/new.png'}],
                    });
                }
                for (let i = 0; i < 5; i++) await Promise.resolve();
                expect(events).toHaveBeenCalledTimes(4);
            } finally {
                editor.destroy();
            }
        },
    );
});

describe('EditorImpl: optional paste resources', () => {
    test.each([undefined, {}])(
        'works without a resolver with resourceReplacement=%p',
        (resourceReplacement) => {
            jest.useFakeTimers();
            const destroyController = jest.spyOn(
                ResourceReplacementController.prototype,
                'destroy',
            );
            const editor = createEditor({
                resourceReplacement,
                initial: {markup: 'before'},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder.use(BundlePreset, {
                            preset: 'full',
                            searchPanel: false,
                            directiveSyntax: new DirectiveSyntaxContext('enabled'),
                            reactRenderer: new ReactRenderStorage(),
                        }),
                },
            });
            try {
                expect(resourceReplacementKey.get(editor.wysiwygEditor.view.state)).toBeUndefined();
                expect(editor.getPendingResourceReplacements()).toEqual([]);
                expect(() => editor.cancelResourceReplacement('unknown')).not.toThrow();
                editor.replace('![label](/old.png)');
                for (const mode of ['markup', 'wysiwyg'] as const) {
                    editor.setEditorMode(mode);
                    jest.advanceTimersByTime(30);
                    expect(editor.getValue()).toContain('/old.png');
                    expect(editor.getPendingResourceReplacements()).toEqual([]);
                }
                editor.destroy();
                expect(destroyController).not.toHaveBeenCalled();
            } finally {
                editor.destroy();
                destroyController.mockRestore();
                jest.clearAllTimers();
                jest.useRealTimers();
            }
        },
    );
});

describe('EditorImpl: resource configuration from hook options', () => {
    const picture: ResourceSpecOverrides = {
        image: {kind: 'picture', valueAttribute: 'src', nameAttribute: 'alt'},
    };
    test('resource metadata is preserved without installing a resolver integration', () => {
        const editor = createEditor({
            resourceReplacement: {resources: picture, triggers: ['paste']},
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.use(BundlePreset, {
                        preset: 'full',
                        searchPanel: false,
                        directiveSyntax: new DirectiveSyntaxContext('enabled'),
                        reactRenderer: new ReactRenderStorage(),
                    }),
            },
        });
        try {
            const state = editor.wysiwygEditor.view.state;
            expect(state.schema.nodes.image.spec._resource).toEqual(picture.image);
            expect(resourceReplacementKey.getState(state)).toBeUndefined();
            expect(editor.getPendingResourceReplacements()).toEqual([]);
        } finally {
            editor.destroy();
        }
    });

    test('mode switching stays blocked when beforeEditorModeChange starts a resource operation', () => {
        const beforeEditorModeChange = jest.fn(() => {
            const view = editor.markupEditor.cm;
            view.dispatch({
                changes: {from: view.state.doc.length, insert: '![image](/old.png)'},
                annotations: Transaction.userEvent.of('input.paste'),
            });
            return undefined;
        });
        const editor: EditorImpl = createEditor({
            initial: {mode: 'markup', markup: 'before\n\n'},
            experimental: {beforeEditorModeChange},
            resourceReplacement: {
                resources: picture,
                triggers: ['paste'],
                resolve: () => new Promise(() => {}),
            },
        });
        try {
            editor.setEditorMode('wysiwyg');
            expect(beforeEditorModeChange).toHaveBeenCalledTimes(1);
            expect(editor.getPendingResourceReplacements()).toHaveLength(1);
            expect(editor.currentMode).toBe('markup');
            editor.setEditorMode('wysiwyg');
            expect(beforeEditorModeChange).toHaveBeenCalledTimes(1);
        } finally {
            editor.destroy();
        }
    });
    const cases: Array<{
        name: string;
        resources: ResourceSpecOverrides | undefined;
        triggers: readonly ('paste' | 'drop')[];
        expected: boolean;
    }> = [
        {
            name: 'custom kind',
            resources: picture,
            triggers: ['paste', 'drop'] as const,
            expected: true,
        },
        {
            name: 'disabled node',
            resources: {image: false} as const,
            triggers: ['paste'] as const,
            expected: false,
        },
        {name: 'empty triggers', resources: picture, triggers: [] as const, expected: false},
        {
            name: 'drop only ignores paste',
            resources: picture,
            triggers: ['drop'] as const,
            expected: false,
        },
        {
            name: 'no resources ignores extension metadata',
            resources: undefined,
            triggers: ['paste'] as const,
            expected: false,
        },
        {name: 'empty resources', resources: {}, triggers: ['paste'] as const, expected: false},
    ];
    describe.each(['wysiwyg', 'markup'] as const)('%s', (mode) => {
        test.each(
            cases.flatMap((entry) =>
                ['![label](/old.png)', '![label][ref]\n\n[ref]: /old.png'].map((source) => ({
                    ...entry,
                    source,
                })),
            ),
        )('$name ($source)', async ({resources, triggers, expected, source}) => {
            const kind = resources === picture ? 'picture' : 'extension-picture';
            const resolver = jest.fn(async () => ({
                replacements: [{kind, oldValue: '/old.png', newValue: '/new.png'}],
            }));
            const editor = createEditor({
                initial: {mode, markup: ''},
                resourceReplacement: {resources, triggers, resolve: resolver},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder
                            .use(BundlePreset, {
                                preset: 'full',
                                searchPanel: false,
                                directiveSyntax: new DirectiveSyntaxContext('enabled'),
                                reactRenderer: new ReactRenderStorage(),
                            })
                            .overrideNodeSpec('image', (spec) => ({
                                ...spec,
                                resource: {owner: 'other-extension'},
                                _resource: {
                                    kind: 'extension-picture',
                                    valueAttribute: 'src',
                                    nameAttribute: 'alt',
                                },
                            })),
                },
            });
            try {
                const dom =
                    mode === 'wysiwyg'
                        ? editor.wysiwygEditor.dom
                        : editor.markupEditor.cm.contentDOM;
                const event = new Event('paste', {bubbles: true, cancelable: true});
                Object.defineProperty(event, 'clipboardData', {
                    value: {
                        types: ['text/yfm'],
                        files: [],
                        getData: (type: string) => (type === 'text/yfm' ? source : ''),
                    },
                });
                dom.dispatchEvent(event);
                if (expected)
                    expect(resolver).toHaveBeenCalledWith(
                        [{kind, value: '/old.png', name: 'label'}],
                        expect.any(Object),
                    );
                else expect(resolver).not.toHaveBeenCalled();
                if (mode === 'wysiwyg') {
                    const spec = editor.wysiwygEditor.view.state.schema.nodes.image.spec;
                    expect(spec._resource).toEqual(resources?.image || undefined);
                    expect(spec.resource).toEqual({owner: 'other-extension'});
                }
                for (let i = 0; i < 5; i++) await Promise.resolve();
                expect(editor.getValue()).toContain(expected ? '/new.png' : '/old.png');
            } finally {
                editor.destroy();
            }
        });
    });
});
