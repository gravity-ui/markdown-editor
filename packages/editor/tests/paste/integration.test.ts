import {redo as cmRedo, undo as cmUndo} from '@codemirror/commands';
import {Transaction as CMTransaction, EditorSelection} from '@codemirror/state';
import {redo, undo} from 'prosemirror-history';
import {Plugin, TextSelection} from 'prosemirror-state';

import {BundlePreset} from '../../src/bundle/wysiwyg-preset';
import {type Extension, WysiwygEditor} from '../../src/core';
import {ReactRenderStorage} from '../../src/extensions';
import {
    remotePasteTransactionMeta,
    resolvedPasteMeta,
} from '../../src/extensions/behavior/Clipboard/resources/adapter';
import {Logger2} from '../../src/logger';
import {createCodemirror} from '../../src/markup/codemirror/create';
import {pasteHistoryBoundary} from '../../src/markup/codemirror/paste-resources/history-boundary';
import {prepareMarkupResources} from '../../src/markup/codemirror/paste-resources/resources';
import {PasteController} from '../../src/modules/paste/controller';
import {resourceKey} from '../../src/modules/paste/tracking';
import type {PasteResourceResolution} from '../../src/modules/paste/types';
import {DirectiveSyntaxContext} from '../../src/utils/directive';

const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
};
const directiveSyntax = new DirectiveSyntaxContext('enabled');

function setup(extra?: Extension) {
    const resolutions: Array<(result: PasteResourceResolution) => void> = [];
    const callback = jest.fn(
        () =>
            new Promise<PasteResourceResolution>((done) => {
                resolutions.push(done);
            }),
    );
    const events = jest.fn();
    const controller = new PasteController({
        resolvePastedResources: callback,
        onPasteOperationChange: events,
    });
    const editor = new WysiwygEditor({
        pasteController: controller,
        initialContent: 'before',
        extensions(builder) {
            builder.use(BundlePreset, {
                preset: 'full',
                searchPanel: false,
                directiveSyntax,
                reactRenderer: new ReactRenderStorage(),
            });
            if (extra) builder.use(extra);
        },
    });
    return {
        editor,
        controller,
        callback,
        events,
        resolve: (result: PasteResourceResolution, index = resolutions.length - 1) =>
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
            .setMeta(remotePasteTransactionMeta, true)
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
        removed.editor.view.state.tr.delete(1, 7).setMeta(remotePasteTransactionMeta, true),
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
        pasteController: test.controller,
        pasteParser: () => test.editor.parser,
        parseHtmlOnPaste: true,
        extensions,
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
            () => new Plugin({filterTransaction: (tr) => !tr.getMeta(resolvedPasteMeta)}),
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
                        if (!transactions.some((tr) => tr.getMeta(resolvedPasteMeta))) return null;
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
        expect(t.controller.getPendingPasteOperations()).toHaveLength(2);
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
        t.controller.cancelPaste(t.controller.getPendingPasteOperations()[0].operationId);
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
        expect(value).not.toContain('__pasteResourceId');
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
                    .setMeta(remotePasteTransactionMeta, true)
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
