import {history as cmHistory, redo as cmRedo, undo as cmUndo} from '@codemirror/commands';
import {
    Annotation,
    Transaction as CMTransaction,
    Compartment,
    EditorSelection,
} from '@codemirror/state';
import {EditorView as CMEditorView} from '@codemirror/view';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import {redo, undo} from 'prosemirror-history';
import {DOMSerializer} from 'prosemirror-model';
import {Plugin, TextSelection} from 'prosemirror-state';

import {
    type ReplacementResource,
    ResourceReplacementController,
    type ResourceReplacementResult,
    createResourceReplacementHost,
} from '..';
import {BundlePreset} from '../../../bundle/wysiwyg-preset';
import {type Extension, WysiwygEditor} from '../../../core';
import {ReactRenderStorage} from '../../../extensions';
import {Logger2} from '../../../logger';
import {createCodemirror} from '../../../markup/codemirror/create';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import {codeMirrorResourceReplacement, pasteHistoryBoundary} from '../codemirror';
import {prepareMarkupResources} from '../codemirror/resources';
import {
    createCodeMirrorResourceIntegration,
    createProseMirrorResourceIntegration,
} from '../integration';
import {
    ResourceReplacement,
    type ResourceReplacementOptions,
    remoteTransactionMeta,
    resolvedResourceMeta,
} from '../prosemirror';
import {resourceReplacementKey} from '../prosemirror/key';
import {replaceResourceId, resourceKey} from '../tracking';

const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
};
const directiveSyntax = new DirectiveSyntaxContext('enabled');
const ownedControllers: ResourceReplacementController[] = [];

afterEach(() => {
    for (const controller of ownedControllers.splice(0)) controller.destroy();
});

function setup(
    extra?: Extension,
    enabled = true,
    options?: Partial<Pick<ResourceReplacementOptions, 'shouldTrack'>>,
) {
    const resolutions: Array<(result: ResourceReplacementResult) => void> = [];
    const callback = jest.fn(
        (_resources: readonly ReplacementResource[]) =>
            new Promise<ResourceReplacementResult>((done) => {
                resolutions.push(done);
            }),
    );
    const events = jest.fn();
    const controller = new ResourceReplacementController({
        resolve: enabled ? callback : undefined,
        onChange: events,
    });
    ownedControllers.push(controller);
    const host = createResourceReplacementHost(controller, 'wysiwyg');
    const editor = new WysiwygEditor({
        initialContent: 'before',
        extensions(builder) {
            builder.use(BundlePreset, {
                preset: 'full',
                searchPanel: false,
                directiveSyntax,
                reactRenderer: new ReactRenderStorage(),
            });
            // Standalone engine tests configure the schema explicitly, without the public hook.
            builder.overrideNodeSpec('image', (spec) => ({
                ...spec,
                resource: {kind: 'image', urlAttribute: 'src', nameAttribute: 'alt'},
            }));
            builder.overrideNodeSpec(FILE_TOKEN, (spec) => ({
                ...spec,
                resource: {kind: 'file', urlAttribute: 'href', nameAttribute: 'download'},
            }));
            if (extra) builder.use(extra);
            if (controller.enabled) {
                const replacementOptions = {
                    host,

                    ...options,
                };
                if (options?.shouldTrack) {
                    builder.use(ResourceReplacement, {
                        ...replacementOptions,
                        shouldTrack: options.shouldTrack,
                    });
                } else {
                    builder.use(
                        createProseMirrorResourceIntegration({
                            ...replacementOptions,
                            triggers: ['paste'],
                        }),
                    );
                }
            }
        },
    });
    return {
        editor,
        controller,
        callback,
        events,
        resolve: (result: ResourceReplacementResult, index = resolutions.length - 1) =>
            resolutions[index](result),
    };
}

function paste(dom: HTMLElement, formats: Record<string, string>) {
    const event = new Event('paste', {bubbles: true, cancelable: true});
    Object.defineProperty(event, 'clipboardData', {
        value: {
            types: Object.keys(formats),
            files: [],
            getData: (type: string) => formats[type] || '',
        },
    });
    dom.dispatchEvent(event);
}

test.each(['text/yfm', 'text/plain', 'text/html'])(
    'WYSIWYG inserts %s immediately; undo and redo do not resolve again',
    async (format) => {
        const test = setup();
        const {editor} = test;
        editor.view.dispatch(
            editor.view.state.tr.setSelection(TextSelection.create(editor.view.state.doc, 1, 7)),
        );
        paste(editor.dom, {
            [format]:
                format === 'text/html'
                    ? '<p>text <img src="/old.png" alt="label" title="title"></p>'
                    : 'text ![label](/old.png "title")',
        });
        expect(test.callback).toHaveBeenCalledTimes(1);
        expect(editor.getValue()).toContain('/old.png');
        expect(test.callback).toHaveBeenCalledTimes(1);
        test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(test.events.mock.calls.map(([event]) => event.status)).toEqual([
            'pending',
            'succeeded',
        ]);
        expect(editor.getValue()).toContain('/new.png');
        expect(editor.getValue()).toContain('label');
        undo(editor.view.state, editor.view.dispatch);
        expect(editor.view.state.doc.textContent).toBe('before');
        redo(editor.view.state, editor.view.dispatch);
        expect(editor.getValue()).toContain('/new.png');
        expect(test.callback).toHaveBeenCalledTimes(1);
        editor.destroy();
    },
);

test('WYSIWYG maps remote edits and skips a removed target', async () => {
    const test = setup();
    test.editor.moveCursor('end');
    paste(test.editor.dom, {'text/yfm': '![label](/old.png)'});
    test.editor.view.dispatch(
        test.editor.view.state.tr
            .insertText('remote ', 1)
            .setMeta(remoteTransactionMeta, true)
            .setMeta('addToHistory', false),
    );
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(test.editor.getValue()).toContain('remote before');
    expect(test.editor.getValue()).toContain('/new.png');
    test.editor.destroy();

    const removed = setup();
    removed.editor.view.dispatch(
        removed.editor.view.state.tr.setSelection(
            TextSelection.create(removed.editor.view.state.doc, 2, 4),
        ),
    );
    paste(removed.editor.dom, {'text/yfm': '![label](/old.png)'});
    removed.editor.view.dispatch(
        removed.editor.view.state.tr.delete(1, 7).setMeta(remoteTransactionMeta, true),
    );
    removed.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(removed.events.mock.calls.at(-1)[0].status).toBe('succeeded');
    expect(removed.editor.getValue()).not.toContain('/old.png');
    removed.editor.destroy();
});

test.each([
    'text **bold** ![alt](/old.png "title") and `/old.png` and [link](/old.png)',
    '- ![alt](/old.png)\n- {% file src="/file.pdf" name="report" %}',
    '| a | b |\n|---|---|\n| ![alt](/old.png) | text |',
    '![a](/old.png) ![b](/old.png)',
])('Markdown changes only resource URL spans: %s', (source) => {
    const test = setup();
    const prepared = prepareMarkupResources(source, test.editor.parser);
    const image = prepared.resources.find((resource) => resource.kind === 'image')!;
    expect(image).toBeDefined();
    const actual = prepared.replace(new Map([[resourceKey(image), '/new.png']]));
    expect(actual).toContain('/new.png');
    if (source.includes('`/old.png`')) expect(actual).toContain('`/old.png` and [link](/old.png)');
    expect(actual.replaceAll('/new.png', '/old.png')).toBe(source);
    test.editor.destroy();
});

function markup(test: ReturnType<typeof setup>, extensions: any[] = []) {
    return createCodemirror({
        doc: 'before',
        placeholder: '',
        logger: new Logger2(),
        onCancel() {},
        onSubmit() {},
        onChange() {},
        onDocChange() {},
        onScroll() {},
        reactRenderer: new ReactRenderStorage(),
        directiveSyntax,
        preserveEmptyRows: false,
        searchPanel: false,
        parseHtmlOnPaste: true,
        extensions: [
            ...extensions,
            ...(test.controller.enabled
                ? createCodeMirrorResourceIntegration({
                      host: createResourceReplacementHost(test.controller, 'markup'),
                      parser: () => test.editor.parser,

                      triggers: ['paste'],
                  })
                : []),
        ],
    });
}

test.each(['text/plain', 'text/yfm', 'text/html'])(
    'Markdown resolves %s and maintains undo/redo',
    async (format) => {
        const test = setup();
        const view = markup(test);
        view.dispatch({selection: EditorSelection.range(0, 6)});
        paste(view.contentDOM, {
            [format]:
                format === 'text/html'
                    ? '<p><img src="/old.png" alt="label"></p>'
                    : '![label](/old.png)',
        });
        expect(test.callback).toHaveBeenCalledTimes(1);
        expect(view.state.sliceDoc()).toContain('/old.png');
        test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(view.state.sliceDoc()).toContain('/new.png');
        cmUndo(view);
        expect(view.state.sliceDoc()).toBe('before');
        cmRedo(view);
        expect(view.state.sliceDoc()).toContain('/new.png');
        expect(test.callback).toHaveBeenCalledTimes(1);
        view.destroy();
        test.editor.destroy();
    },
);

test('Markdown accepts remote updates while resolving', async () => {
    const test = setup();
    const view = markup(test);
    view.dispatch({selection: {anchor: 6}});
    paste(view.contentDOM, {'text/yfm': '![label](/old.png)'});
    view.dispatch({
        changes: {from: 0, insert: 'remote '},
        annotations: CMTransaction.remote.of(true),
    });
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).toBe('remote before![label](/new.png)');
    view.destroy();
    test.editor.destroy();
});

test.each([
    '![alt](/old\\(1\\).png)',
    '![alt](</old image.png>)',
    '![alt](/old.png?a=1&amp;b=2)',
    '![alt][image]\n\n[image]: /old.png "title"',
    ':file[report](/file.pdf)',
    '{% file src="/file.pdf" name="report" %}',
])('Markdown source URL encodings and directives: %s', (source) => {
    const test = setup();
    const prepared = prepareMarkupResources(source, test.editor.parser);
    expect(prepared.resources.length).toBeGreaterThan(0);
    const actual = prepared.replace(
        new Map(prepared.resources.map((resource) => [resourceKey(resource), '/new.png'])),
    );
    expect(actual).toContain('/new.png');
    test.editor.destroy();
});

test('partial replacements preserve other resources and kind/path pairs cover repeated images', async () => {
    const test = setup();
    paste(test.editor.dom, {
        'text/yfm': '![a](/old.png) ![b](/old.png) {% file src="/file.pdf" name="report" %}',
    });
    expect(test.callback.mock.calls[0]).toBeDefined();
    const resources = (
        test.callback.mock.calls[0] as unknown as [Array<{path: string; kind: string}>]
    )[0];
    expect(resources).toEqual([
        {kind: 'image', path: '/old.png', name: 'a'},
        {kind: 'file', path: '/file.pdf', name: 'report'},
    ]);
    test.resolve({
        replacements: [
            {
                kind: 'file',
                oldPath: resources.find((resource) => resource.kind === 'file')!.path,
                newPath: '/new.pdf',
            },
        ],
    });
    await flush();
    expect(test.editor.getValue()).toContain('/new.pdf');
    expect(test.editor.getValue().match(/\/old.png/g)).toHaveLength(2);
    test.editor.destroy();
});

test.each(['wysiwyg', 'markup'])(
    'code and plain text paste bypass resolution in %s',
    async (mode) => {
        const test = setup();
        if (mode === 'wysiwyg') {
            test.editor.replace('```\ncode\n```');
            test.editor.moveCursor('end');
            paste(test.editor.dom, {'text/plain': '![alt](/old.png)'});
        } else {
            const view = markup(test);
            view.dispatch({
                changes: {from: 0, to: 6, insert: '```\ncode\n```'},
                selection: {anchor: 7},
            });
            paste(view.contentDOM, {'text/plain': '![alt](/old.png)'});
            view.destroy();
        }
        await flush();
        expect(test.callback).not.toHaveBeenCalled();
        test.editor.destroy();
    },
);

test('a readonly change prevents URL updates and retains the inserted resource', async () => {
    const test = setup();
    paste(test.editor.dom, {'text/yfm': '![alt](/old.png)'});
    test.editor.view.setProps({editable: () => false});
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(test.events.mock.calls.at(-1)[0].status).toBe('failed');
    expect(test.editor.view.editable).toBe(false);
    expect(test.editor.getValue()).toContain('/old.png');
    test.editor.destroy();
});

test('a rejected replacement reports failure and retains the initial paste', async () => {
    const test = setup((builder) =>
        builder.addPlugin(
            () => new Plugin({filterTransaction: (tr) => !tr.getMeta(resolvedResourceMeta)}),
        ),
    );
    paste(test.editor.dom, {'text/yfm': '![alt](/old.png)'});
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(test.events.mock.calls.at(-1)[0].status).toBe('failed');
    expect(test.editor.getValue()).toContain('/old.png');
    test.editor.destroy();
});

test('a normalizing appendTransaction is part of a successful paste', async () => {
    const test = setup((builder) =>
        builder.addPlugin(
            () =>
                new Plugin({
                    appendTransaction(transactions, _old, state) {
                        if (!transactions.some((tr) => tr.getMeta(resolvedResourceMeta)))
                            return null;
                        return state.tr.insertText('normalized ', 1);
                    },
                }),
        ),
    );
    paste(test.editor.dom, {'text/yfm': '![alt](/old.png)'});
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(test.events.mock.calls.at(-1)[0].status).toBe('succeeded');
    expect(test.editor.getValue()).toContain('normalized');
    expect(test.editor.getValue()).toContain('/new.png');
    test.editor.destroy();
});

for (const mode of ['wysiwyg', 'markup'] as const) {
    function context() {
        const test = setup();
        const cm = mode === 'markup' ? markup(test) : undefined;
        const dom = cm?.contentDOM ?? test.editor.dom;
        const value = () => cm?.state.doc.toString() ?? test.editor.getValue();
        const end = () =>
            cm
                ? cm.dispatch({selection: {anchor: cm.state.doc.length}})
                : test.editor.moveCursor('end');
        const insert = (text: string) =>
            cm
                ? cm.dispatch({changes: {from: 0, insert: text}})
                : test.editor.view.dispatch(test.editor.view.state.tr.insertText(text, 1));
        const undoPaste = () =>
            cm ? cmUndo(cm) : undo(test.editor.view.state, test.editor.view.dispatch);
        const redoPaste = () =>
            cm ? cmRedo(cm) : redo(test.editor.view.state, test.editor.view.dispatch);
        const destroy = () => {
            cm?.destroy();
            test.editor.destroy();
        };
        return {...test, cm, dom, value, end, insert, undoPaste, redoPaste, destroy};
    }

    test(`${mode}: edits remain available and identical URLs outside the paste are untouched`, async () => {
        const t = context();
        t.insert(mode === 'markup' ? '![existing](/old.png) ' : 'existing ');
        if (!t.cm) t.editor.insert('![existing](/old.png)');
        t.end();
        paste(t.dom, {'text/yfm': '![pasted](/old.png)'});
        expect(t.value()).toContain('pasted');
        expect(t.value()).not.toContain('/new.png');
        t.insert('editable ');
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.value()).toContain('editable');
        expect(t.value().match(/\/old.png/g)).toHaveLength(1);
        expect(t.value().match(/\/new.png/g)).toHaveLength(1);
        t.destroy();
    });

    test(`${mode}: overlapping requests can finish in reverse order`, async () => {
        const t = context();
        t.end();
        paste(t.dom, {'text/yfm': '![first](/old.png)'});
        t.end();
        paste(t.dom, {'text/yfm': '![second](/old.png)'});
        expect(t.controller.getPendingResourceReplacements()).toHaveLength(2);
        t.resolve(
            {replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/second.png'}]},
            1,
        );
        await flush();
        expect(t.value()).toContain('/old.png');
        expect(t.value()).toContain('/second.png');
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/first.png'}]}, 0);
        await flush();
        expect(t.value()).toContain('/first.png');
        expect(t.value()).toContain('/second.png');
        expect(t.value()).not.toContain('/old.png');
        t.destroy();
    });

    test(`${mode}: undo during resolution keeps the result for redo without inserting content`, async () => {
        const t = context();
        t.end();
        paste(t.dom, {'text/yfm': '![pasted](/old.png)'});
        t.undoPaste();
        expect(t.value()).not.toContain('/old.png');
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.value()).not.toContain('/new.png');
        t.redoPaste();
        expect(t.value()).toContain('/new.png');
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.destroy();
    });

    test(`${mode}: editing a URL protects it, editing a label preserves replacement`, async () => {
        const t = context();
        t.end();
        paste(t.dom, {'text/yfm': '![first](/old.png) ![second](/old.png)'});
        if (t.cm) {
            let source = t.cm.state.doc.toString();
            const url = source.indexOf('/old.png');
            t.cm.dispatch({
                changes: {from: url, to: url + '/old.png'.length, insert: '/manual.png'},
            });
            source = t.cm.state.doc.toString();
            const label = source.indexOf('second');
            t.cm.dispatch({changes: {from: label, to: label + 6, insert: 'changed'}});
        } else {
            const positions: number[] = [];
            t.editor.view.state.doc.descendants((node, pos) => {
                if (node.type.name === 'image') positions.push(pos);
            });
            t.editor.view.dispatch(
                t.editor.view.state.tr
                    .setNodeAttribute(positions[0], 'src', '/manual.png')
                    .setNodeAttribute(positions[1], 'alt', 'changed'),
            );
        }
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.value()).toContain('/manual.png');
        expect(t.value()).toContain('/new.png');
        expect(t.value()).toContain('changed');
        t.destroy();
    });

    test(`${mode}: cancellation keeps the immediate insertion and ignores the late result`, async () => {
        const t = context();
        t.end();
        paste(t.dom, {'text/yfm': '![pasted](/old.png)'});
        t.controller.cancelResourceReplacement(
            t.controller.getPendingResourceReplacements()[0].operationId,
        );
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.value()).toContain('/old.png');
        expect(t.value()).not.toContain('/new.png');
        t.destroy();
    });
}

test.each(['markup', 'wysiwyg'] as const)(
    'pending resources survive switching to %s and back',
    async (destination) => {
        const t = setup();
        const cm = markup(t);
        if (destination === 'markup') {
            t.editor.moveCursor('end');
            paste(t.editor.dom, {'text/yfm': '![pasted](/old.png)'});
            const snapshot = t.controller.snapshot();
            cm.dispatch({changes: {from: 0, to: cm.state.doc.length, insert: t.editor.getValue()}});
            t.controller.activate('markup', snapshot);
            cm.dispatch({changes: {from: 0, insert: 'typed '}});
        } else {
            cm.dispatch({selection: {anchor: cm.state.doc.length}});
            paste(cm.contentDOM, {'text/yfm': '![pasted](/old.png)'});
            const snapshot = t.controller.snapshot();
            t.editor.replace(cm.state.doc.toString());
            t.controller.activate('wysiwyg', snapshot);
            t.editor.view.dispatch(t.editor.view.state.tr.insertText('typed ', 1));
        }
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        const value = destination === 'markup' ? cm.state.doc.toString() : t.editor.getValue();
        expect(value).toContain('/new.png');
        expect(value).toContain('typed');
        expect(value).not.toContain('__replaceResourceId');
        cm.destroy();
        t.editor.destroy();
    },
);

test('Markdown history preserves edits made after paste and redo of both operations', async () => {
    const t = setup();
    const view = markup(t);
    view.dispatch({selection: {anchor: 6}});
    paste(view.contentDOM, {'text/yfm': '![pasted](/old.png)'});
    view.dispatch({changes: {from: 0, insert: 'typed '}, userEvent: 'input.type'});
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    cmUndo(view);
    expect(view.state.doc.toString()).toBe('before![pasted](/new.png)');
    cmUndo(view);
    expect(view.state.doc.toString()).toBe('before');
    cmRedo(view);
    expect(view.state.doc.toString()).toBe('before![pasted](/new.png)');
    cmRedo(view);
    expect(view.state.doc.toString()).toBe('typed before![pasted](/new.png)');
    view.destroy();
    t.editor.destroy();
});

test('Markdown history handles remote mappings, two pastes and an existing redo branch', async () => {
    const t = setup();
    const view = markup(t);
    view.dispatch({selection: {anchor: 6}});
    paste(view.contentDOM, {'text/yfm': '![first](/old.png)'});
    paste(view.contentDOM, {'text/yfm': '![second](/old.png)'});
    view.dispatch({changes: {from: 0, insert: 'typed '}, userEvent: 'input.type'});
    cmUndo(view);
    view.dispatch({
        changes: {from: 0, insert: 'remote '},
        annotations: [CMTransaction.remote.of(true), CMTransaction.addToHistory.of(false)],
    });
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/first.png'}]}, 0);
    await flush();
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/second.png'}]}, 1);
    await flush();
    cmRedo(view);
    expect(view.state.doc.toString()).toContain('typed');
    cmUndo(view);
    cmUndo(view);
    expect(view.state.doc.toString()).toBe('remote before![first](/first.png)');
    cmUndo(view);
    expect(view.state.doc.toString()).toBe('remote before');
    cmRedo(view);
    cmRedo(view);
    expect(view.state.doc.toString()).toBe(
        'remote before![first](/first.png)![second](/second.png)',
    );
    view.destroy();
    t.editor.destroy();
});

test('Markdown never rewrites existing images through a newly pasted reference definition', async () => {
    const t = setup();
    const view = markup(t);
    view.dispatch({
        changes: {from: 0, to: 6, insert: '![existing][shared]\n\n'},
        selection: {anchor: 21},
    });
    view.dispatch({selection: {anchor: view.state.doc.length}});
    paste(view.contentDOM, {'text/yfm': '![pasted][shared]\n\n[shared]: /old.png'});
    expect(t.callback).toHaveBeenCalledTimes(1);
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.doc.toString()).toBe(
        '![existing][shared]\n\n![pasted](/new.png)\n\n[shared]: /old.png',
    );
    view.destroy();
    t.editor.destroy();
});

for (const mode of ['wysiwyg', 'markup'] as const) {
    test(`${mode}: replacement URLs are encoded without changing resource structure`, async () => {
        const t = setup();
        const cm = mode === 'markup' ? markup(t) : undefined;
        paste(cm?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
        t.resolve({
            replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new image(1).png'}],
        });
        await flush();
        const value = cm?.state.doc.toString() ?? t.editor.getValue();
        expect(value).toContain('/new%20image%281%29.png');
        expect(prepareMarkupResources(value, t.editor.parser).resources).toHaveLength(1);
        cm?.destroy();
        t.editor.destroy();
    });

    test(`${mode}: a manual change back to the original URL is not replaced again`, async () => {
        const t = setup();
        const cm = mode === 'markup' ? markup(t) : undefined;
        paste(cm?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        if (cm) {
            const from = cm.state.doc.toString().indexOf('/new.png');
            cm.dispatch({changes: {from, to: from + 8, insert: '/old.png'}});
        } else {
            let pos = 0;
            t.editor.view.state.doc.descendants((node, at) => {
                if (node.type.name === 'image') pos = at;
            });
            t.editor.view.dispatch(t.editor.view.state.tr.setNodeAttribute(pos, 'src', '/old.png'));
        }
        expect(cm?.state.doc.toString() ?? t.editor.getValue()).toContain('/old.png');
        expect(t.callback).toHaveBeenCalledTimes(1);
        cm?.destroy();
        t.editor.destroy();
    });
}

test('WYSIWYG treats a differently encoded identical URL as a no-op', async () => {
    const t = setup();
    paste(t.editor.dom, {'text/yfm': '![label](/new%20image.png)'});
    t.resolve({
        replacements: [{kind: 'image', oldPath: '/new%20image.png', newPath: '/new image.png'}],
    });
    await flush();
    expect(t.events.mock.calls.at(-1)[0].status).toBe('succeeded');
    expect(t.editor.getValue()).toContain('/new%20image.png');
    t.editor.destroy();
});

test('WYSIWYG resolves pasted resources with a DevTools-style precomputing dispatch wrapper', async () => {
    const t = setup();
    const view = t.editor.view;
    const dispatch = view.props.dispatchTransaction!.bind(view);
    // prosemirror-dev-toolkit applies first, then returns its cached result for the
    // incoming transaction when the editor's original dispatcher applies it again.
    view.setProps({
        dispatchTransaction(tr) {
            const cached = view.state.applyTransaction(tr);
            const apply = view.state.applyTransaction.bind(view.state);
            view.state.applyTransaction = (next) => {
                if (next === tr) return cached;
                view.state.applyTransaction = apply;
                return apply(next);
            };
            dispatch(tr);
        },
    });
    paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
    expect(t.callback).toHaveBeenCalledTimes(1);
    expect(t.editor.getValue()).toContain('/old.png');
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(t.editor.getValue()).toContain('/new.png');
    undo(view.state, view.dispatch);
    expect(t.editor.getValue()).not.toContain('/new.png');
    redo(view.state, view.dispatch);
    expect(t.editor.getValue()).toContain('/new.png');
    let pos = 0;
    view.state.doc.descendants((node, at) => {
        if (node.type.name === 'image') pos = at;
    });
    view.dispatch(view.state.tr.setNodeAttribute(pos, 'src', '/old.png'));
    expect(t.editor.getValue()).toContain('/old.png');
    expect(t.callback).toHaveBeenCalledTimes(1);
    t.editor.destroy();
});

test.each([
    '{% list tabs %}\n\n- First\n\n  content\n\n{% endlist %}\n\n',
    '[X] Done\n\n[ ] Pending\n\n',
    '{% list tabs %}\n\n- First\n\n  [X] Done\n\n{% endlist %}\n\n',
])('Markdown resolves resources despite generated DOM identities: %s', async (source) => {
    const test = setup();
    const view = markup(test);
    view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: source},
        selection: {anchor: source.length},
    });
    paste(view.contentDOM, {'text/yfm': '![label](/old.png)'});
    expect(test.callback).toHaveBeenCalledTimes(1);
    test.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).toBe(source + '![label](/new.png)');
    cmUndo(view);
    expect(view.state.sliceDoc()).toBe(source);
    cmRedo(view);
    expect(view.state.sliceDoc()).toBe(source + '![label](/new.png)');
    view.destroy();
    test.editor.destroy();
});

test('Markdown notifies external history boundaries around the immediate paste', async () => {
    const t = setup();
    const seen: string[] = [];
    const view = markup(t, [pasteHistoryBoundary.of(() => seen.push(view.state.sliceDoc()))]);
    view.dispatch({selection: {anchor: 6}});
    paste(view.contentDOM, {'text/yfm': '![label](/old.png)'});
    expect(seen).toEqual(['before', 'before![label](/old.png)']);
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).toBe('before![label](/new.png)');
    expect(seen).toHaveLength(2);
    view.destroy();
    t.editor.destroy();
});

test.each(['wysiwyg', 'markup'] as const)(
    '%s skips a remotely deleted resource after resolution',
    async (mode) => {
        const t = setup();
        const view = mode === 'markup' ? markup(t) : undefined;
        paste(view?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
        if (view) {
            view.dispatch({
                changes: {from: 0, to: view.state.doc.length, insert: 'remote content'},
                annotations: [CMTransaction.remote.of(true), CMTransaction.addToHistory.of(false)],
            });
        } else {
            t.editor.view.dispatch(
                t.editor.view.state.tr
                    .replaceWith(
                        0,
                        t.editor.view.state.doc.content.size,
                        t.editor.view.state.schema.nodes.paragraph.create(
                            null,
                            t.editor.view.state.schema.text('remote content'),
                        ),
                    )
                    .setMeta(remoteTransactionMeta, true)
                    .setMeta('addToHistory', false),
            );
        }
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(view?.state.sliceDoc() ?? t.editor.getValue()).toBe('remote content');
        expect(t.callback).toHaveBeenCalledTimes(1);
        view?.destroy();
        t.editor.destroy();
    },
);

describe('paste review regressions', () => {
    test.each(['alt', 'width'])('Undo of %s retains the resolved image path', async (attribute) => {
        const t = setup();
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        const view = t.editor.view;
        let pos = 0;
        view.state.doc.descendants((node, at) => {
            if (node.type.name === 'image') pos = at;
        });
        const attrs = view.state.doc.nodeAt(pos)!.attrs;
        view.dispatch(
            view.state.tr.setNodeMarkup(pos, undefined, {
                ...attrs,
                [attribute]: attribute === 'alt' ? 'edited' : '300',
            }),
        );
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        undo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(pos)!.attrs.src).toBe('/new.png');
        expect(view.state.doc.nodeAt(pos)!.attrs[attribute]).toBe(attrs[attribute]);
        redo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(pos)!.attrs.src).toBe('/new.png');
        t.editor.destroy();
    });

    test.each(['wysiwyg', 'markup'] as const)(
        '%s validates results while the paste is undone',
        async (mode) => {
            const t = setup();
            const cm = mode === 'markup' ? markup(t) : undefined;
            paste(cm?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
            if (cm) cmUndo(cm);
            else undo(t.editor.view.state, t.editor.view.dispatch);
            t.resolve({
                replacements: [
                    {
                        kind: 'image',
                        oldPath: '/old.png',
                        // eslint-disable-next-line no-script-url -- exercise rejection of an unsafe callback result
                        newPath: 'javascript:alert(1)',
                    },
                ],
            });
            await flush();
            expect(t.events.mock.calls.at(-1)[0].status).toBe('failed');
            expect(() => {
                if (cm) cmRedo(cm);
                else redo(t.editor.view.state, t.editor.view.dispatch);
            }).not.toThrow();
            expect(cm?.state.sliceDoc() ?? t.editor.getValue()).toContain('/old.png');
            cm?.destroy();
            t.editor.destroy();
        },
    );

    test('a later reference image keeps its original path', async () => {
        const t = setup();
        const view = markup(t);
        const pasted = '![pasted][ref]\n\n[ref]: /old.png';
        view.dispatch({selection: EditorSelection.range(0, view.state.doc.length)});
        paste(view.contentDOM, {'text/yfm': pasted});
        view.dispatch({
            changes: {from: view.state.doc.length, insert: '\n\n![typed][ref]'},
            annotations: CMTransaction.userEvent.of('input.type'),
        });
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(view.state.sliceDoc()).toBe(
            '![pasted](/new.png)\n\n[ref]: /old.png\n\n![typed][ref]',
        );
        cmUndo(view);
        expect(view.state.sliceDoc()).toBe('![pasted](/new.png)\n\n[ref]: /old.png');
        cmUndo(view);
        expect(view.state.sliceDoc()).toBe('before');
        cmRedo(view);
        expect(view.state.sliceDoc()).toBe('![pasted](/new.png)\n\n[ref]: /old.png');
        view.destroy();
        t.editor.destroy();
    });

    test.each(['![pasted][ref]', '![ref][]', '![ref]'])(
        'resolves %s using an existing definition',
        async (image) => {
            const t = setup();
            const view = markup(t);
            const prefix = '![existing][ref]\n\n[link][ref]\n\n[ref]: /old.png "title"\n\n';
            view.dispatch({
                changes: {from: 0, to: view.state.doc.length, insert: prefix},
                selection: {anchor: prefix.length},
            });
            paste(view.contentDOM, {'text/plain': image});
            expect(t.callback).toHaveBeenCalledTimes(1);
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            const label = image === '![pasted][ref]' ? 'pasted' : 'ref';
            expect(view.state.sliceDoc()).toBe(prefix + '![' + label + '](/new.png "title")');
            cmUndo(view);
            expect(view.state.sliceDoc()).toBe(prefix);
            cmRedo(view);
            expect(view.state.sliceDoc()).toBe(prefix + '![' + label + '](/new.png "title")');
            view.destroy();
            t.editor.destroy();
        },
    );
});

test('reference label edits survive resolution and Undo/Redo', async () => {
    const t = setup();
    const view = markup(t);
    const source = '![label][ref]\n\n[ref]: /old.png';
    view.dispatch({selection: EditorSelection.range(0, view.state.doc.length)});
    paste(view.contentDOM, {'text/yfm': source});
    view.dispatch({
        changes: {from: 2, to: 7, insert: 'edited'},
        annotations: CMTransaction.userEvent.of('input.type'),
    });
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).toBe('![edited](/new.png)\n\n[ref]: /old.png');
    cmUndo(view);
    expect(view.state.sliceDoc()).toBe('![label](/new.png)\n\n[ref]: /old.png');
    cmRedo(view);
    expect(view.state.sliceDoc()).toBe('![edited](/new.png)\n\n[ref]: /old.png');
    view.destroy();
    t.editor.destroy();
});

test('editing a reference definition away and back cancels its pending replacement', async () => {
    const t = setup();
    const view = markup(t);
    paste(view.contentDOM, {'text/yfm': '![label][ref]\n\n[ref]: /old.png'});
    for (const [fromPath, toPath] of [
        ['/old.png', '/manual.png'],
        ['/manual.png', '/old.png'],
    ]) {
        const from = view.state.sliceDoc().indexOf(fromPath);
        view.dispatch({changes: {from, to: from + fromPath.length, insert: toPath}});
    }
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).not.toContain('/new.png');
    view.destroy();
    t.editor.destroy();
});

test('a replacement reference image at the same range is not owned by the paste', async () => {
    const t = setup();
    const view = markup(t);
    const source = '![label][ref]\n\n[ref]: /old.png';
    view.dispatch({selection: EditorSelection.range(0, view.state.doc.length)});
    paste(view.contentDOM, {'text/yfm': source});
    view.dispatch({changes: {from: 0, to: 13, insert: '![typed][ref]'}});
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
    await flush();
    expect(view.state.sliceDoc()).toBe('![typed][ref]\n\n[ref]: /old.png');
    view.destroy();
    t.editor.destroy();
});

test('invalid replacement rejects the entire response before caching another valid path', async () => {
    const t = setup();
    const view = markup(t);
    paste(view.contentDOM, {'text/yfm': '![a](/a.png) ![b](/b.png)'});
    cmUndo(view);
    t.resolve({
        replacements: [
            {kind: 'image', oldPath: '/a.png', newPath: '/copied.png'},
            // eslint-disable-next-line no-script-url -- deliberately invalid callback result
            {kind: 'image', oldPath: '/b.png', newPath: 'javascript:alert(1)'},
        ],
    });
    await flush();
    expect(t.events.mock.calls.at(-1)[0].status).toBe('failed');
    expect(() => cmRedo(view)).not.toThrow();
    expect(view.state.sliceDoc()).toContain('![a](/a.png) ![b](/b.png)');
    view.destroy();
    t.editor.destroy();
});

test('two pending pastes sharing a definition can resolve in reverse order', async () => {
    const t = setup();
    const view = markup(t);
    const prefix = '[ref]: /old.png\n\n';
    view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: prefix},
        selection: {anchor: prefix.length},
    });
    paste(view.contentDOM, {'text/plain': '![first][ref]'});
    paste(view.contentDOM, {'text/plain': ' ![second][ref]'});
    expect(t.callback).toHaveBeenCalledTimes(2);
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/second.png'}]}, 1);
    await flush();
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/first.png'}]}, 0);
    await flush();
    expect(view.state.sliceDoc()).toBe(prefix + '![first](/first.png) ![second](/second.png)');
    cmUndo(view);
    expect(view.state.sliceDoc()).toBe(prefix + '![first](/first.png)');
    cmUndo(view);
    expect(view.state.sliceDoc()).toBe(prefix);
    cmRedo(view);
    cmRedo(view);
    expect(view.state.sliceDoc()).toBe(prefix + '![first](/first.png) ![second](/second.png)');
    view.destroy();
    t.editor.destroy();
});

test('reference conversion preserves escaped labels and titles', async () => {
    const t = setup();
    const view = markup(t);
    const source = '![a \\[b\\]][ref]\n\n[ref]: /old.png "a &quot;b&quot; &amp; c"';
    view.dispatch({selection: EditorSelection.range(0, view.state.doc.length)});
    paste(view.contentDOM, {'text/yfm': source});
    t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new image.png'}]});
    await flush();
    const before = t.editor.parser.parse(source);
    const after = t.editor.parser.parse(view.state.sliceDoc());
    expect(after.child(0).child(0).attrs).toEqual({
        ...before.child(0).child(0).attrs,
        src: '/new%20image.png',
    });
    expect(view.state.sliceDoc()).toContain('[ref]: /old.png "a &quot;b&quot; &amp; c"');
    view.destroy();
    t.editor.destroy();
});

describe('optional ProseMirror resource plugin', () => {
    test.each([
        '![label](/old.png)',
        '{% file src="/file.pdf" name="report" %}',
        ':file[report](/file.pdf)',
    ])('keeps tracking IDs in state but out of HTML and Markdown: %s', (source) => {
        const t = setup();
        try {
            paste(t.editor.dom, {'text/yfm': source});
            const {state} = t.editor.view;
            const snapshot = t.controller.snapshot();
            expect(snapshot?.[0].targetId).toEqual(expect.any(String));
            const dom = document.createElement('div');
            dom.append(DOMSerializer.fromSchema(state.schema).serializeFragment(state.doc.content));
            expect(dom.innerHTML.toLowerCase()).not.toContain(replaceResourceId.toLowerCase());
            expect(t.editor.getValue()).not.toContain(replaceResourceId);
            expect(t.editor.view.state.doc).toBe(state.doc);
            expect(t.controller.snapshot()).toEqual(snapshot);
        } finally {
            t.editor.destroy();
        }
    });

    test('does not install without a resolver and leaves paste transactions untouched', () => {
        const t = setup(undefined, false);
        const view = t.editor.view;
        expect(resourceReplacementKey.getState(view.state)).toBeUndefined();
        for (const nodeType of Object.keys(view.state.schema.nodes)) {
            expect(view.state.schema.nodes[nodeType].spec.attrs ?? {}).not.toHaveProperty(
                replaceResourceId,
            );
        }
        const tr = view.state.tr.replaceSelectionWith(
            view.state.schema.nodes.image.create({src: '/old.png'}),
        );
        const dispatch = jest.fn(view.dispatch);
        dispatch(tr);
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenCalledWith(tr);
        expect(tr.getMeta('uiEvent')).toBeUndefined();
        expect(t.controller.getPendingResourceReplacements()).toEqual([]);
        view.state.doc.descendants((node) => {
            expect(node.attrs[replaceResourceId]).toBeFalsy();
        });
        t.editor.destroy();
    });

    test('runs with the default EditorView dispatcher', async () => {
        const t = setup();
        const view = t.editor.view;
        view.setProps({dispatchTransaction: undefined});
        paste(view.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/new.png');
        undo(view.state, view.dispatch);
        expect(t.editor.getValue()).toBe('before');
        redo(view.state, view.dispatch);
        expect(t.editor.getValue()).toContain('/new.png');
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });

    test('precomputing a paste state never starts requests', () => {
        const t = setup();
        const view = t.editor.view;
        const tr = view.state.tr
            .replaceSelectionWith(view.state.schema.nodes.image.create({src: '/old.png'}))
            .setMeta('paste', true);
        const result = view.state.applyTransaction(tr);
        expect(result.state.doc.eq(view.state.doc)).toBe(false);
        expect(t.callback).not.toHaveBeenCalled();
        expect(t.editor.getValue()).toBe('before');
        view.dispatch(tr);
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });

    test('a filtered paste never starts an operation', () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        filterTransaction: (tr) => !tr.getMeta('paste'),
                    }),
            ),
        );
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.editor.getValue()).toBe('before');
        expect(t.callback).not.toHaveBeenCalled();
        expect(t.controller.getPendingResourceReplacements()).toEqual([]);
        t.editor.destroy();
    });

    test('a rejected completion boundary does not recurse or start a request', () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        filterTransaction: (tr) =>
                            tr.getMeta(resourceReplacementKey)?.type !== 'complete',
                    }),
            ),
        );
        expect(() => paste(t.editor.dom, {'text/yfm': '![label](/old.png)'})).not.toThrow();
        expect(t.callback).not.toHaveBeenCalled();
        t.editor.view.dispatch(t.editor.view.state.tr);
        expect(t.callback).not.toHaveBeenCalled();
        t.editor.destroy();
    });

    test('normalizers finish before resolution and belong to the paste history event', async () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        appendTransaction(transactions, _old, state) {
                            if (
                                !transactions.some(
                                    (tr) => tr.getMeta(resourceReplacementKey)?.type === 'insert',
                                )
                            )
                                return null;
                            return state.tr.insertText('normalized ', 1);
                        },
                    }),
            ),
        );
        const view = t.editor.view;
        paste(view.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        view.dispatch(view.state.tr.insertText('typed ', 1));
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        undo(view.state, view.dispatch);
        expect(t.editor.getValue()).toContain('normalized');
        expect(t.editor.getValue()).not.toContain('typed');
        expect(t.editor.getValue()).toContain('/new.png');
        undo(view.state, view.dispatch);
        expect(t.editor.getValue()).toBe('before');
        t.editor.destroy();
    });

    test('Undo restores tracking detached by a manual URL edit', async () => {
        const t = setup();
        const view = t.editor.view;
        paste(view.dom, {'text/yfm': '![label](/old.png)'});
        let pos = 0;
        view.state.doc.descendants((node, at) => {
            if (node.type.name === 'image') pos = at;
        });
        const id = view.state.doc.nodeAt(pos)!.attrs[replaceResourceId];
        view.dispatch(view.state.tr.setNodeAttribute(pos, 'src', '/manual.png'));
        expect(view.state.doc.nodeAt(pos)!.attrs[replaceResourceId]).toBeNull();
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/manual.png');
        undo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(pos)!.attrs[replaceResourceId]).toBe(id);
        expect(t.editor.getValue()).toContain('/new.png');
        redo(view.state, view.dispatch);
        expect(t.editor.getValue()).toContain('/manual.png');
        expect(view.state.doc.nodeAt(pos)!.attrs[replaceResourceId]).toBeNull();
        t.editor.destroy();
    });

    test('specialized handlePaste handlers take precedence over resource insertion', () => {
        const handled = jest.fn(() => true);
        const t = setup((builder) =>
            builder.addPlugin(
                () => new Plugin({props: {handlePaste: handled}}),
                builder.Priority.Lowest,
            ),
        );
        paste(t.editor.dom, {'text/html': '<img src="/old.png">'});
        expect(handled).toHaveBeenCalledTimes(1);
        expect(t.callback).not.toHaveBeenCalled();
        expect(t.editor.getValue()).toBe('before');
        t.editor.destroy();
    });

    test('a custom paste handler only needs standard paste metadata', async () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        props: {
                            handlePaste(view) {
                                view.dispatch(
                                    view.state.tr
                                        .replaceSelectionWith(
                                            view.state.schema.nodes.image.create({
                                                src: '/custom.png',
                                            }),
                                        )
                                        .setMeta('paste', true),
                                );
                                return true;
                            },
                        },
                    }),
            ),
        );
        paste(t.editor.dom, {'text/html': '<img src="/ignored.png">'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        expect(t.callback.mock.calls[0][0]).toEqual([{kind: 'image', path: '/custom.png'}]);
        t.resolve({replacements: [{kind: 'image', oldPath: '/custom.png', newPath: '/new.png'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/new.png');
        t.editor.destroy();
    });

    test.each([false, true])(
        'ignores unmarked or remote resource insertions (remote: %s)',
        (remote) => {
            const t = setup();
            const view = t.editor.view;
            const tr = view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({src: '/old.png'}),
            );
            if (remote) tr.setMeta('paste', true).setMeta(remoteTransactionMeta, true);
            view.dispatch(tr);
            expect(t.callback).not.toHaveBeenCalled();
            t.editor.destroy();
        },
    );

    test('tracks only pasted ranges across multiple steps and normalization', async () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        appendTransaction(transactions, _old, state) {
                            if (!transactions.some((tr) => tr.getMeta('paste'))) return null;
                            return state.tr.insert(
                                1,
                                state.schema.nodes.image.create({src: '/unrelated.png'}),
                            );
                        },
                    }),
            ),
        );
        const view = t.editor.view;
        const image = view.state.schema.nodes.image;
        view.dispatch(view.state.tr.insert(1, image.create({src: '/same.png'})));
        const before = t.editor.getValue();
        const tr = view.state.tr;
        tr.insert(tr.doc.content.size - 1, image.create({src: '/same.png'}));
        tr.insert(1, image.create({src: '/other.png'}));
        view.dispatch(tr.setMeta('paste', true));
        expect(t.callback.mock.calls[0][0]).toEqual([
            {kind: 'image', path: '/other.png'},
            {kind: 'image', path: '/same.png'},
        ]);
        t.resolve({replacements: [{kind: 'image', oldPath: '/same.png', newPath: '/new.png'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/same.png');
        expect(t.editor.getValue()).toContain('/new.png');
        undo(view.state, view.dispatch);
        expect(t.editor.getValue()).toBe(before);
        redo(view.state, view.dispatch);
        expect(t.editor.getValue()).toContain('/new.png');
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });

    test('uses the final resource after a normalizer replaces its node', () => {
        const t = setup((builder) =>
            builder.addPlugin(
                () =>
                    new Plugin({
                        appendTransaction(transactions, _old, state) {
                            if (
                                !transactions.some(
                                    (tr) => tr.getMeta(resourceReplacementKey)?.type === 'insert',
                                )
                            )
                                return null;
                            const tr = state.tr;
                            state.doc.descendants((node, pos) => {
                                if (node.type.name === 'image' && node.attrs.src === '/old.png') {
                                    tr.replaceWith(
                                        pos,
                                        pos + node.nodeSize,
                                        node.type.create({src: '/normalized.png'}),
                                    );
                                }
                            });
                            return tr.docChanged ? tr : null;
                        },
                    }),
            ),
        );
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        expect(t.callback.mock.calls[0][0]).toEqual([{kind: 'image', path: '/normalized.png'}]);
        t.editor.destroy();
    });

    test('a standalone predicate controls Shift-paste without the bundle policy', () => {
        const t = setup(undefined, true, {shouldTrack: (tr) => tr.getMeta('paste') === true});
        t.editor.dom.dispatchEvent(
            new KeyboardEvent('keydown', {key: 'Shift', shiftKey: true, bubbles: true}),
        );
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });

    test('Shift state is isolated per editor and cleared on blur', () => {
        const first = setup();
        const second = setup();
        first.editor.dom.dispatchEvent(
            new KeyboardEvent('keydown', {key: 'Shift', shiftKey: true, bubbles: true}),
        );
        paste(second.editor.dom, {'text/yfm': '![second](/old.png)'});
        expect(second.callback).toHaveBeenCalledTimes(1);
        paste(first.editor.dom, {'text/yfm': '![first](/old.png)'});
        expect(first.callback).not.toHaveBeenCalled();
        first.editor.dom.dispatchEvent(new Event('blur'));
        paste(first.editor.dom, {'text/yfm': '![after-blur](/old.png)'});
        expect(first.callback).toHaveBeenCalledTimes(1);
        first.editor.destroy();
        second.editor.destroy();
    });

    test('Shift-paste bypasses resolution for parsed Markdown', () => {
        const t = setup();
        t.editor.dom.dispatchEvent(
            new KeyboardEvent('keydown', {key: 'Shift', shiftKey: true, bubbles: true}),
        );
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).not.toHaveBeenCalled();
        t.editor.dom.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift', bubbles: true}));
        paste(t.editor.dom, {'text/yfm': '![next](/old.png)'});
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });
});

describe('configurable resource replacement', () => {
    const media: Extension = (builder) => {
        builder.addNodeSpec('media', () => ({
            inline: true,
            group: 'inline',
            atom: true,
            attrs: {url: {}, label: {default: null}},
            resource: {kind: 'video', urlAttribute: 'url', nameAttribute: 'label'},
            toDOM: (node) => ['video', {src: node.attrs.url}],
        }));
        builder.addMarkdownTokenParserSpec('media', () => ({
            name: 'media',
            type: 'node',
            getAttrs: () => ({url: ''}),
        }));
        builder.addNodeSerializerSpec('media', () => (state, node) => state.write(node.attrs.url));
    };

    test('hides tracking IDs from custom serializers that enumerate all attributes', () => {
        const t = setup(
            (builder) => {
                media(builder);
                builder.overrideNodeSpec('media', (spec) => ({
                    ...spec,
                    toDOM: (node) => ['video', node.attrs],
                }));
                builder.overrideNodeSerializerSpec('media', () => (state, node) => {
                    state.write(JSON.stringify(node.attrs));
                });
            },
            true,
            {shouldTrack: () => true},
        );
        try {
            const view = t.editor.view;
            view.dispatch(
                view.state.tr.insert(
                    1,
                    view.state.schema.nodes.media.create({
                        url: '/clip.mp4',
                        label: 'Clip',
                    }),
                ),
            );
            const node = view.state.doc.nodeAt(1)!;
            const id = node.attrs[replaceResourceId];
            expect(id).toEqual(expect.any(String));
            const dom = DOMSerializer.fromSchema(view.state.schema).serializeNode(
                node,
            ) as HTMLElement;
            expect(dom.getAttribute('url')).toBe('/clip.mp4');
            expect(dom.hasAttribute(replaceResourceId)).toBe(false);
            expect(t.editor.getValue()).toContain('"url":"/clip.mp4"');
            expect(t.editor.getValue()).not.toContain(replaceResourceId);
            expect(node.attrs[replaceResourceId]).toBe(id);
        } finally {
            t.editor.destroy();
        }
    });

    test('custom resource kinds resolve without paste metadata and preserve undo/redo', async () => {
        const t = setup(media, true, {shouldTrack: () => true});
        const view = t.editor.view;
        view.dispatch(
            view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.media.create({
                    url: '/old.mp4',
                    label: 'Clip',
                }),
            ),
        );
        expect(t.callback).toHaveBeenCalledTimes(1);
        expect(t.callback.mock.calls[0][0]).toEqual([
            {kind: 'video', path: '/old.mp4', name: 'Clip'},
        ]);
        expect(t.controller.snapshot()?.[0].targetId).toEqual(expect.any(String));
        t.resolve({replacements: [{kind: 'video', oldPath: '/old.mp4', newPath: '/new.mp4'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/new.mp4');
        undo(view.state, view.dispatch);
        expect(t.editor.getValue()).toBe('before');
        redo(view.state, view.dispatch);
        expect(t.editor.getValue()).toContain('/new.mp4');
        expect(t.callback).toHaveBeenCalledTimes(1);
        expect(t.events.mock.calls.at(-1)?.[0].status).toBe('succeeded');
        t.editor.destroy();
    });

    test('predicate selects custom metadata and attribute-only URL changes', async () => {
        const shouldTrack = jest.fn((tr) => tr.getMeta('import-resource') === true);
        const t = setup(media, true, {shouldTrack});
        const view = t.editor.view;
        view.dispatch(
            view.state.tr
                .insert(1, view.state.schema.nodes.media.create({url: '/old.mp4'}))
                .setMeta('paste', true),
        );
        expect(t.callback).not.toHaveBeenCalled();
        view.dispatch(
            view.state.tr
                .setNodeAttribute(1, 'url', '/imported.mp4')
                .setMeta('import-resource', true),
        );
        expect(t.callback.mock.calls[0][0]).toEqual([{kind: 'video', path: '/imported.mp4'}]);
        t.resolve({replacements: [{kind: 'video', oldPath: '/imported.mp4', newPath: '/new.mp4'}]});
        await flush();
        expect(view.state.doc.nodeAt(1)?.attrs.url).toBe('/new.mp4');
        expect(t.callback).toHaveBeenCalledTimes(1);
        undo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(1)?.attrs.url).toBe('/old.mp4');
        redo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(1)?.attrs.url).toBe('/new.mp4');
        t.editor.destroy();
    });

    test('ignores nodes without resource metadata', () => {
        const t = setup(
            (builder) => {
                media(builder);
                builder.overrideNodeSpec('image', (spec) => ({...spec, resource: undefined}));
            },
            true,
            {shouldTrack: () => true},
        );
        paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
        expect(t.callback).not.toHaveBeenCalled();
        t.editor.destroy();
    });

    test('manual edits detach custom resources from pending results', async () => {
        const t = setup(media);
        const view = t.editor.view;
        view.dispatch(
            view.state.tr
                .insert(1, view.state.schema.nodes.media.create({url: '/old.mp4'}))
                .setMeta('paste', true),
        );
        view.dispatch(view.state.tr.setNodeAttribute(1, 'url', '/manual.mp4'));
        t.resolve({replacements: [{kind: 'video', oldPath: '/old.mp4', newPath: '/new.mp4'}]});
        await flush();
        expect(view.state.doc.nodeAt(1)?.attrs.url).toBe('/manual.mp4');
        undo(view.state, view.dispatch);
        expect(view.state.doc.nodeAt(1)?.attrs.url).toBe('/new.mp4');
        t.editor.destroy();
    });

    test('rejects resource metadata with a missing URL attribute', () => {
        expect(() =>
            setup((builder) => {
                media(builder);
                builder.overrideNodeSpec('media', (spec) => ({
                    ...spec,
                    resource: {kind: 'video', urlAttribute: 'missing'},
                }));
            }),
        ).toThrow('Missing resource URL attribute');
    });
});

describe('standalone CodeMirror resource replacement', () => {
    const imported = Annotation.define<boolean>();

    test('uses a custom predicate with the default dispatcher and does not resolve during state computation', async () => {
        const t = setup((builder) => {
            builder.overrideNodeSpec('image', (spec) => ({
                ...spec,
                resource: {kind: 'asset', urlAttribute: 'src'},
            }));
        });
        const register = jest.spyOn(t.controller, 'register');
        const createTarget = jest.spyOn(t.controller, 'createTarget');
        const view = new CMEditorView({
            doc: 'before',
            extensions: [
                cmHistory(),
                codeMirrorResourceReplacement({
                    host: createResourceReplacementHost(t.controller, 'markup'),
                    parser: () => t.editor.parser,
                    shouldTrack: (tr) => tr.annotation(imported) === true,
                }),
            ],
        });
        try {
            expect(register).toHaveBeenCalledTimes(1);
            const transaction = view.state.update({
                changes: {from: 0, to: 6, insert: '![asset](/old.png)'},
                annotations: imported.of(true),
            });
            // Computing even the final state cannot mutate controller targets or start I/O.
            expect(transaction.state.doc.toString()).toContain('/old.png');
            expect(createTarget).not.toHaveBeenCalled();
            expect(t.callback).not.toHaveBeenCalled();
            view.dispatch(transaction);
            expect(t.callback.mock.calls[0][0]).toEqual([{kind: 'asset', path: '/old.png'}]);
            t.resolve({replacements: [{kind: 'asset', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(view.state.doc.toString()).toBe('![asset](/new.png)');
            cmUndo(view);
            expect(view.state.doc.toString()).toBe('before');
            cmRedo(view);
            expect(view.state.doc.toString()).toBe('![asset](/new.png)');
            expect(t.callback).toHaveBeenCalledTimes(1);
        } finally {
            view.destroy();
            t.editor.destroy();
        }
    });

    test('rejects unselected and remote transactions even with a broad predicate', async () => {
        const t = setup();
        const view = new CMEditorView({
            extensions: [
                cmHistory(),
                codeMirrorResourceReplacement({
                    host: createResourceReplacementHost(t.controller, 'markup'),

                    parser: () => t.editor.parser,
                    shouldTrack: (tr) => !tr.annotation(imported),
                }),
            ],
        });
        try {
            view.dispatch({
                changes: {from: 0, insert: '![ignored](/old.png)'},
                annotations: imported.of(true),
            });
            view.dispatch({
                changes: {from: 0, insert: '![remote](/old.png)'},
                annotations: CMTransaction.remote.of(true),
            });
            expect(t.callback).not.toHaveBeenCalled();
            view.dispatch({changes: {from: 0, insert: '![local](/old.png)'}});
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(view.state.doc.toString()).toContain('![local](/new.png)');
            expect(view.state.doc.toString()).toContain('![ignored](/old.png)');
            expect(view.state.doc.toString()).toContain('![remote](/old.png)');
            cmUndo(view);
            cmRedo(view);
            expect(t.callback).toHaveBeenCalledTimes(1);
        } finally {
            view.destroy();
            t.editor.destroy();
        }
    });

    test('removing the extension unregisters the engine without cancelling its operation', async () => {
        const t = setup();
        const compartment = new Compartment();
        const extension = codeMirrorResourceReplacement({
            host: createResourceReplacementHost(t.controller, 'markup'),

            parser: () => t.editor.parser,
            shouldTrack: () => true,
        });
        const view = new CMEditorView({extensions: [cmHistory(), compartment.of(extension)]});
        try {
            view.dispatch({changes: {from: 0, insert: '![label](/old.png)'}});
            const snapshot = t.controller.snapshot();
            expect(snapshot?.[0].targetId).toBeDefined();
            view.dispatch({effects: compartment.reconfigure([])});
            expect(t.controller.getPendingResourceReplacements()).toHaveLength(1);
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(view.state.doc.toString()).toContain('/old.png');
            view.dispatch({effects: compartment.reconfigure(extension)});
            t.controller.activate('markup', snapshot);
            expect(view.state.doc.toString()).toContain('/new.png');
            expect(t.callback).toHaveBeenCalledTimes(1);
        } finally {
            view.destroy();
            t.editor.destroy();
        }
    });
});

describe('paste resource ownership', () => {
    test.each(['wysiwyg', 'markup'] as const)(
        'destroying the %s engine preserves resolution in the other engine',
        async (mode) => {
            const t = setup();
            const cm = markup(t);
            const destroyHost = jest.spyOn(t.controller, 'destroy');
            if (mode === 'wysiwyg') {
                paste(t.editor.dom, {'text/yfm': '![label](/old.png)'});
                const snapshot = t.controller.snapshot();
                cm.dispatch({
                    changes: {from: 0, to: cm.state.doc.length, insert: t.editor.getValue()},
                });
                t.controller.activate('markup', snapshot);
                t.editor.destroy();
            } else {
                paste(cm.contentDOM, {'text/yfm': '![label](/old.png)'});
                const snapshot = t.controller.snapshot();
                t.editor.replace(cm.state.sliceDoc());
                t.controller.activate('wysiwyg', snapshot);
                cm.destroy();
            }
            expect(destroyHost).not.toHaveBeenCalled();
            expect(t.controller.getPendingResourceReplacements()).toHaveLength(1);
            // Destruction unregisters only the removed engine.
            t.controller.activate(mode);
            expect(t.controller.snapshot()).toBeUndefined();
            t.controller.activate(mode === 'wysiwyg' ? 'markup' : 'wysiwyg');
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(mode === 'wysiwyg' ? cm.state.sliceDoc() : t.editor.getValue()).toContain(
                '/new.png',
            );
            expect(t.events.mock.calls.map(([event]) => event.status)).toEqual([
                'pending',
                'succeeded',
            ]);
            if (mode === 'wysiwyg') cm.destroy();
            else t.editor.destroy();
            destroyHost.mockRestore();
        },
    );

    test('removing the ProseMirror plugin keeps a result for reattachment', async () => {
        const t = setup();
        const view = t.editor.view;
        paste(view.dom, {'text/yfm': '![label](/old.png)'});
        const plugins = view.state.plugins;
        view.updateState(
            view.state.reconfigure({
                plugins: plugins.filter(
                    (plugin) => plugin !== resourceReplacementKey.get(view.state),
                ),
            }),
        );
        expect(t.controller.snapshot()).toBeUndefined();
        expect(t.controller.getPendingResourceReplacements()).toHaveLength(1);
        t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
        await flush();
        expect(t.editor.getValue()).toContain('/old.png');
        view.updateState(view.state.reconfigure({plugins}));
        t.controller.activate('wysiwyg');
        expect(t.editor.getValue()).toContain('/new.png');
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.editor.destroy();
    });
});

describe.each(['wysiwyg', 'markup'] as const)('resource collection in %s', (mode) => {
    test('retains a pending/undone paste and collects its result after Redo is discarded', async () => {
        const t = setup();
        const cm = mode === 'markup' ? markup(t) : undefined;
        const view = t.editor.view;
        const undoPaste = () => (cm ? cmUndo(cm) : undo(view.state, view.dispatch));
        const redoPaste = () => (cm ? cmRedo(cm) : redo(view.state, view.dispatch));
        const value = () => (cm ? cm.state.doc.toString() : t.editor.getValue());
        try {
            paste(cm?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
            const id = t.controller.snapshot()?.find((item) => item.targetId)?.targetId;
            if (!id) throw new Error('Pasted resource was not tracked');
            expect(undoPaste()).toBe(true);
            await flush();
            expect(t.controller.getTarget(id)).toBeDefined();
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(t.controller.getTarget(id)?.replacement).toBe('/new.png');
            expect(redoPaste()).toBe(true);
            await flush();
            expect(value()).toContain('/new.png');
            expect(t.callback).toHaveBeenCalledTimes(1);
            expect(undoPaste()).toBe(true);
            if (cm) cm.dispatch({changes: {from: 0, insert: 'different edit'}});
            else view.dispatch(view.state.tr.insertText('different edit'));
            await flush();
            expect(redoPaste()).toBe(false);
            expect(t.controller.getTarget(id)).toBeUndefined();
        } finally {
            cm?.destroy();
            t.editor.destroy();
        }
    });

    test('cancellation removes live tracking without changing pasted content or undo behavior', async () => {
        const t = setup();
        const cm = mode === 'markup' ? markup(t) : undefined;
        const view = t.editor.view;
        const value = () => (cm ? cm.state.doc.toString() : t.editor.getValue());
        try {
            paste(cm?.contentDOM ?? t.editor.dom, {'text/yfm': '![label](/old.png)'});
            const before = value();
            const id = t.controller.snapshot()?.find((item) => item.targetId)?.targetId;
            if (!id) throw new Error('Pasted resource was not tracked');
            t.controller.cancelResourceReplacement(
                t.controller.getPendingResourceReplacements()[0].operationId,
            );
            await flush();
            expect(t.controller.getTarget(id)).toBeUndefined();
            expect(t.controller.snapshot()?.some((item) => item.targetId === id)).toBe(false);
            expect(value()).toBe(before);
            t.resolve({replacements: [{kind: 'image', oldPath: '/old.png', newPath: '/new.png'}]});
            await flush();
            expect(value()).toBe(before);
            expect(cm ? cmUndo(cm) : undo(view.state, view.dispatch)).toBe(true);
            expect(value()).toBe('before');
            expect(cm ? cmRedo(cm) : redo(view.state, view.dispatch)).toBe(true);
            expect(value()).toBe(before);
            expect(t.callback).toHaveBeenCalledTimes(1);
        } finally {
            cm?.destroy();
            t.editor.destroy();
        }
    });
});
