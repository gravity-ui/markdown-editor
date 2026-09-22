import {history as cmHistory, redo as cmRedo, undo as cmUndo} from '@codemirror/commands';
import {Transaction as CMTransaction} from '@codemirror/state';
import {EditorView as CMView} from '@codemirror/view';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import {closeHistory, redo, undo} from 'prosemirror-history';
import {Plugin} from 'prosemirror-state';

import {ResourceReplacementController} from '..';
import {EditorImpl} from '../../../bundle/Editor';
import {BundlePreset} from '../../../bundle/wysiwyg-preset';
import type {Extension} from '../../../core';
import {createEditorExtensions} from '../../../core/createEditorExtensions';
import {ReactRenderStorage} from '../../../extensions';
import {Logger2} from '../../../logger';
import {codeMirrorResourceReplacement} from '../../../markup/codemirror/resource-replacement-plugin';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import type {
    ReplacementResource,
    ResourceReplacementConfig,
    ResourceReplacementResult,
    ResourceSpecOverrides,
} from '../types';

const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
};
const result = (
    oldValue = '/old.png',
    newValue = '/new.png',
    kind = 'image',
): ResourceReplacementResult => ({replacements: [{kind, oldValue, newValue}]});
// The response validator must reject executable URL schemes.
// eslint-disable-next-line no-script-url
const invalidUrl = 'javascript:alert(1)';
const owned: EditorImpl[] = [];
afterEach(() => {
    for (const editor of owned.splice(0)) editor.destroy();
});
function paste(dom: HTMLElement, source: string, format = 'text/yfm', files: File[] = []) {
    const event = new Event('paste', {bubbles: true, cancelable: true});
    Object.defineProperty(event, 'clipboardData', {
        value: {
            types: [format],
            files,
            getData: (type: string) => (type === format ? source : ''),
        },
    });
    dom.dispatchEvent(event);
}
function setup(
    mode: 'wysiwyg' | 'markup',
    initial = '![A](/old.png)\n\nbefore',
    config: Partial<ResourceReplacementConfig> = {},
    extra?: Extension,
) {
    const resolutions: Array<(value: ResourceReplacementResult) => void> = [];
    const rejections: Array<(error: Error) => void> = [];
    const events = jest.fn();
    const callback = jest.fn(
        (_resources: readonly ReplacementResource[]) =>
            new Promise<ResourceReplacementResult>((yes, no) => {
                resolutions.push(yes);
                rejections.push(no);
            }),
    );
    const configuredResources: ResourceSpecOverrides = {
        image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
        [FILE_TOKEN]: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
    };
    const editor = new EditorImpl({
        logger: new Logger2(),
        renderStorage: new ReactRenderStorage(),
        preset: 'full',
        directiveSyntax: new DirectiveSyntaxContext('enabled'),
        pmTransformers: [],
        initial: {mode, markup: initial},
        markupConfig: {parseHtmlOnPaste: true},
        wysiwygConfig: {
            extensions(builder) {
                builder.use(BundlePreset, {
                    preset: 'full',
                    searchPanel: false,
                    directiveSyntax: new DirectiveSyntaxContext('enabled'),
                    reactRenderer: new ReactRenderStorage(),
                });
                if (extra) builder.use(extra);
            },
        },
        resourceReplacement: {
            resources: configuredResources,
            triggers: ['paste', 'drop'],
            resolve: callback,
            onChange: events,
            ...config,
        },
    });
    owned.push(editor);
    const pm = editor.wysiwygEditor.view;
    const cm = mode === 'markup' ? editor.markupEditor.cm : undefined;
    const dom = cm?.contentDOM ?? pm.dom;
    const value = () => editor.getValue();
    const resources = () => {
        const entries: Array<{from: number; to: number; resource: ReplacementResource}> = [];
        // Positions are only consumed by the ProseMirror-specific assertions.
        const doc = cm ? editor.wysiwygEditor.parser.parse(cm.state.doc.toString()) : pm.state.doc;
        doc.descendants((node, from) => {
            const spec = node.type.spec._resource;
            if (spec)
                entries.push({
                    from,
                    to: from + node.nodeSize,
                    resource: {kind: spec.kind, value: node.attrs[spec.valueAttribute]},
                });
        });
        return entries;
    };
    const append = (source = ' ![B](/old.png)', format?: string) => {
        if (cm) cm.dispatch({selection: {anchor: cm.state.doc.length}});
        else editor.wysiwygEditor.moveCursor('end');
        paste(dom, source, format);
    };
    const edit = (from: number, to: number, insert = '') => {
        if (cm)
            cm.dispatch({
                changes: {from, to, insert},
                annotations: CMTransaction.userEvent.of('input'),
            });
        else pm.dispatch(closeHistory(pm.state.tr).insertText(insert, from, to));
    };
    return {
        editor,
        pm,
        cm,
        dom,
        callback,
        events,
        resources,
        append,
        edit,
        value,
        resolve: (answer = result(), index = resolutions.length - 1) => resolutions[index](answer),
        reject: (index = rejections.length - 1) => rejections[index](new Error('network')),
        undo: () => (cm ? cmUndo(cm) : undo(pm.state, pm.dispatch)),
        redo: () => (cm ? cmRedo(cm) : redo(pm.state, pm.dispatch)),
    };
}

describe.each(['wysiwyg', 'markup'] as const)('global replacement in %s', (mode) => {
    test.each(['text/yfm', 'text/plain', 'text/html'])(
        'accepted %s paste replaces A and B with the mode-specific history',
        async (format) => {
            const t = setup(mode);
            t.append(
                format === 'text/html'
                    ? '<img src="/old.png" alt="B" title="title">'
                    : '![B](/old.png "title")',
                format,
            );
            expect(t.callback).toHaveBeenCalledTimes(1);
            expect(t.callback.mock.calls[0][0]).toEqual([
                {kind: 'image', value: '/old.png', name: 'B'},
            ]);
            expect(t.resources().map((item) => item.resource.value)).toEqual([
                '/old.png',
                '/old.png',
            ]);
            expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(t.cm ? 0 : 1);
            if (!t.cm) {
                expect(t.pm.nodeDOM(t.resources()[0].from)).not.toHaveProperty(
                    'style.display',
                    'none',
                );
                expect((t.pm.nodeDOM(t.resources()[1].from) as HTMLElement).style.display).toBe(
                    'none',
                );
                expect(t.pm.state.schema.nodes.image.spec.attrs).not.toHaveProperty(
                    '__replaceResourceId',
                );
            }
            expect(t.value()).not.toContain('resourcePending');
            t.resolve();
            await flush();
            expect(t.resources().map((item) => item.resource.value)).toEqual([
                '/new.png',
                '/new.png',
            ]);
            expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
            t.undo();
            expect(t.resources().map((item) => item.resource.value)).toEqual(
                t.cm ? ['/old.png', '/old.png'] : ['/new.png'],
            );
            t.redo();
            expect(t.resources().map((item) => item.resource.value)).toEqual([
                '/new.png',
                '/new.png',
            ]);
            if (format !== 'text/html' || mode !== 'markup') expect(t.value()).toContain('title');
            expect(t.callback).toHaveBeenCalledTimes(1);
        },
    );

    test('blocks pending history and mode changes; only PM protects resource edits', async () => {
        const t = setup(mode);
        t.append();
        const initial = t.value();
        t.undo();
        t.redo();
        expect(t.value()).toBe(initial);
        t.editor.setEditorMode(mode === 'wysiwyg' ? 'markup' : 'wysiwyg');
        t.editor.changeEditorMode({
            mode: mode === 'wysiwyg' ? 'markup' : 'wysiwyg',
            reason: 'settings',
        });
        expect(t.editor.currentMode).toBe(mode);
        if (t.cm) {
            const from = t.value().indexOf('![B]');
            t.edit(from, t.value().length);
            expect(t.resources()).toHaveLength(1);
            t.edit(0, 0, 'during ');
            t.resolve();
            await flush();
            expect(t.value()).toContain('during ');
            expect(t.resources()[0].resource.value).toBe('/new.png');
            t.undo();
            expect(t.value()).toContain('during ');
            expect(t.resources()[0].resource.value).toBe('/old.png');
            t.editor.setEditorMode('wysiwyg');
            expect(t.editor.currentMode).toBe('wysiwyg');
            return;
        }
        const range = t.resources()[1];
        t.edit(range.from, range.to);
        t.edit(range.from - 1, range.to, 'replacement');
        if (t.cm) t.edit(range.from + 2, range.from + 3, 'x');
        else {
            t.pm.dispatch(t.pm.state.tr.setNodeAttribute(range.from, 'src', '/manual'));
            t.pm.dispatch(
                t.pm.state.tr.addMark(
                    range.from,
                    range.to,
                    t.pm.state.schema.marks.strong.create(),
                ),
            );
        }
        expect(t.value()).toBe(initial);
        t.edit(t.cm ? 0 : 1, t.cm ? 0 : 1, 'during ');
        expect(t.value()).toContain('during ');
        t.resolve();
        await flush();
        expect(t.value()).toContain('during ');
        expect(t.editor.currentMode).toBe(mode);
        t.undo();
        expect(t.value()).not.toContain('during ');
        expect(t.resources()).toHaveLength(2);
        t.undo();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/new.png']);
        t.redo();
        t.redo();
        expect(t.value()).toContain('during ');
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/new.png', '/new.png']);
        t.editor.setEditorMode(mode === 'wysiwyg' ? 'markup' : 'wysiwyg');
        expect(t.editor.currentMode).not.toBe(mode);
    });

    test('uses current values, including edited A and newly added untracked resources', async () => {
        const t = setup(mode);
        t.append();
        const a = t.resources()[0];
        if (t.cm) {
            const pos = t.value().indexOf('/old.png');
            t.edit(pos, pos + '/old.png'.length, '/manual.png');
            t.edit(0, 0, '![C](/old.png) ');
        } else {
            t.pm.dispatch(t.pm.state.tr.setNodeAttribute(a.from, 'src', '/manual.png'));
            t.pm.dispatch(
                t.pm.state.tr.insert(
                    1,
                    t.pm.state.schema.nodes.image.create({src: '/old.png', alt: 'C'}),
                ),
            );
        }
        t.resolve();
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual([
            '/new.png',
            '/manual.png',
            '/new.png',
        ]);
    });

    test('deduplicates kind/value, ignores ordinary links and code, and permits partial answers', async () => {
        const t = setup(mode, 'before');
        t.append(
            '![one](/shared) ![two](/shared) {% file src="/shared" name="report" %} [link](/shared) `![code](/shared)`',
        );
        expect(t.callback.mock.calls[0][0]).toEqual([
            {kind: 'image', value: '/shared', name: 'one'},
            {kind: 'file', value: '/shared', name: 'report'},
        ]);
        t.resolve(result('/shared', '/new', 'image'));
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual([
            '/new',
            '/new',
            '/shared',
        ]);
        expect(t.value()).toContain('[link](/shared)');
        expect(t.value()).toContain('`![code](/shared)`');
        t.undo();
        expect(t.resources()).toHaveLength(t.cm ? 3 : 0);
        t.redo();
        expect(t.resources().map((item) => item.resource.value)).toEqual([
            '/new',
            '/new',
            '/shared',
        ]);
    });

    test.each([false, true])(
        'parallel replies (reverse=%s) preserve each loader and paste history',
        async (reverse) => {
            const t = setup(mode);
            t.append(' ![B](/old.png)');
            t.edit(t.cm ? 0 : 1, t.cm ? 0 : 1, 'between ');
            t.append(' ![C](/old.png)');
            expect(t.editor.getPendingResourceReplacements()).toHaveLength(2);
            const first = reverse ? 1 : 0;
            t.resolve(result('/old.png', '/first.png'), first);
            await flush();
            expect(t.resources().map((item) => item.resource.value)).toEqual([
                '/first.png',
                '/first.png',
                '/first.png',
            ]);
            expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(t.cm ? 0 : 1);
            const before = t.value();
            t.undo();
            expect(t.value()).toBe(before);
            t.resolve(result('/old.png', '/second.png'), 1 - first);
            await flush();
            expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
            expect(t.value()).not.toContain('/second.png');
            if (t.cm) {
                t.undo();
                expect(t.resources().map((item) => item.resource.value)).toEqual([
                    '/old.png',
                    '/old.png',
                    '/old.png',
                ]);
                t.redo();
                expect(t.callback).toHaveBeenCalledTimes(2);
                return;
            }
            t.undo();
            expect(t.resources()).toHaveLength(2);
            t.undo();
            expect(t.value()).not.toContain('between ');
            t.undo();
            expect(t.resources().map((item) => item.resource.value)).toEqual(['/first.png']);
            t.redo();
            t.redo();
            t.redo();
            expect(t.resources().map((item) => item.resource.value)).toEqual([
                '/first.png',
                '/first.png',
                '/first.png',
            ]);
            expect(t.value()).toContain('between ');
            expect(t.callback).toHaveBeenCalledTimes(2);
        },
    );

    test.each(['cancel', 'error', 'invalid', 'timeout'] as const)(
        '%s releases protection, keeps insertion and ignores late results',
        async (outcome) => {
            if (outcome === 'timeout') jest.useFakeTimers();
            try {
                const t = setup(mode, 'before', {timeoutMs: 20});
                t.append();
                const [operation] = t.editor.getPendingResourceReplacements();
                if (outcome === 'cancel') t.editor.cancelResourceReplacement(operation.operationId);
                if (outcome === 'error') t.reject();
                if (outcome === 'invalid')
                    t.resolve({
                        replacements: [
                            ...result().replacements,
                            {
                                kind: 'image',
                                oldValue: '/old.png',
                                newValue: invalidUrl,
                            },
                        ],
                    });
                if (outcome === 'timeout') jest.advanceTimersByTime(21);
                await flush();
                expect(t.editor.getPendingResourceReplacements()).toEqual([]);
                expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
                expect(t.value()).toContain('/old.png');
                t.resolve();
                await flush();
                expect(t.value()).toContain('/old.png');
                t.undo();
                expect(t.resources()).toHaveLength(0);
                t.redo();
                expect(t.value()).toContain('/old.png');
                expect(t.callback).toHaveBeenCalledTimes(1);
            } finally {
                if (outcome === 'timeout') jest.useRealTimers();
            }
        },
    );

    test('validates all URLs before applying any replacements', async () => {
        const t = setup(mode, 'before');
        t.append('![one](/one) ![two](/two)');
        t.resolve({
            replacements: [
                ...result('/one', '/valid').replacements,
                ...result('/two', invalidUrl).replacements,
            ],
        });
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/one', '/two']);
        expect(t.events.mock.calls.at(-1)[0].status).toBe('failed');
    });

    test('does not cascade replacements inside one response', async () => {
        const t = setup(mode, 'before');
        t.append('![one](/one) ![two](/two)');
        t.resolve({
            replacements: [
                ...result('/one', '/two').replacements,
                ...result('/two', '/three').replacements,
            ],
        });
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/two', '/three']);
    });

    test('empty response succeeds without a new undo event', async () => {
        const t = setup(mode, 'before');
        t.append();
        t.resolve({replacements: []});
        await flush();
        expect(t.events.mock.calls.at(-1)[0].status).toBe('succeeded');
        t.undo();
        expect(t.value()).toBe('before');
    });

    test('UI notifications do not depend on onChange', async () => {
        const t = setup(mode, 'before', {onChange: undefined});
        const rerender = jest.fn();
        t.editor.on('rerender', rerender);
        t.append();
        expect(rerender).toHaveBeenCalled();
        rerender.mockClear();
        t.resolve();
        await flush();
        expect(rerender).toHaveBeenCalled();
        expect(t.editor.getPendingResourceReplacements()).toEqual([]);
    });

    test('mode changes from insertion notifications cannot escape the pending lock', async () => {
        const t = setup(mode);
        let attempted = false;
        t.editor.on('rerender-toolbar', () => {
            if (attempted || t.resources().length < 2) return;
            attempted = true;
            t.editor.setEditorMode(mode === 'wysiwyg' ? 'markup' : 'wysiwyg');
        });
        t.append();
        expect(attempted).toBe(true);
        expect(t.editor.currentMode).toBe(mode);
        t.resolve();
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/new.png', '/new.png']);
    });

    test('saved pending content reopens as resources with the old URLs', async () => {
        const t = setup(mode, 'before');
        let saved = '';
        t.editor.on('change', () => {
            saved = t.value();
        });
        t.append('![B](/old.png "title") {% file src="/old.pdf" name="report.pdf" %}');
        await flush();
        expect(t.editor.getPendingResourceReplacements()).toHaveLength(1);
        expect(saved).toContain('![B](/old.png "title")');
        t.editor.destroy();
        const reopened = setup('wysiwyg', saved);
        expect(reopened.resources().map((item) => item.resource.value)).toEqual([
            '/old.png',
            '/old.pdf',
        ]);
        expect(reopened.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
        expect(reopened.callback).not.toHaveBeenCalled();
    });

    test('paste with Shift resolves resources that were inserted into the document', async () => {
        const t = setup(mode, 'before');
        t.dom.dispatchEvent(
            new KeyboardEvent('keydown', {key: 'Shift', shiftKey: true, bubbles: true}),
        );
        t.append('![plain](/plain)');
        t.dom.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift', bubbles: true}));
        expect(t.callback).toHaveBeenCalledTimes(1);
        expect(t.callback.mock.calls[0][0]).toEqual([
            {kind: 'image', value: '/plain', name: 'plain'},
        ]);
        expect(t.editor.getPendingResourceReplacements()).toHaveLength(1);
        t.resolve(result('/plain', '/resolved.png'));
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/resolved.png']);
        expect(t.editor.getPendingResourceReplacements()).toHaveLength(0);
        expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
    });

    test('native file transfers do not resolve', async () => {
        const t = setup(mode, 'before');
        paste(t.dom, '![file](/file)', 'text/yfm', [
            new File([''], 'file.png', {type: 'image/png'}),
        ]);
        await flush();
        expect(t.callback).not.toHaveBeenCalled();
    });
});

test('Markdown serialization expands references while preserving ordinary link values', async () => {
    const t = setup('markup', '![A][ref] [link][ref]\n\n[ref]: /old.png "title"');
    t.append('\n\n![B][pasted]\n\n[pasted]: /old.png "title"');
    const before = t.value();
    t.resolve();
    await flush();
    expect(t.value()).toContain('![A](/new.png "title")');
    expect(t.value()).toContain('![B](/new.png "title")');
    expect(t.value()).toContain('[link](/old.png "title")');
    t.undo();
    expect(t.value()).toBe(before);
    t.redo();
    expect(t.resources().map((entry) => entry.resource.value)).toEqual(['/new.png', '/new.png']);
});

test.each(['![Photo][id]', '![id][]', '![id]'])(
    'Markdown does not request or protect an image using an existing definition: %s',
    (source) => {
        const t = setup('markup', '[id]: /old.png\n\n');
        t.append(source);
        expect(t.callback).not.toHaveBeenCalled();
        expect(t.editor.getPendingResourceReplacements()).toHaveLength(0);
        expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
        const from = t.value().indexOf(source);
        t.edit(from, from + source.length);
        expect(t.value()).not.toContain(source);
    },
);

test('Markdown tracks only the new resource in a paste containing an existing reference', async () => {
    const t = setup('markup', '[id]: /existing.png\n\n');
    t.append('![old][id] ![new](/new-resource.png)');
    expect(t.callback.mock.calls[0][0]).toEqual([
        {kind: 'image', value: '/new-resource.png', name: 'new'},
    ]);
    expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(t.cm ? 0 : 1);
    const from = t.value().indexOf('![old][id]');
    t.edit(from, from + '![old][id]'.length);
    t.resolve(result('/new-resource.png', '/copied.png'));
    await flush();
    expect(t.value()).toContain('![new](/copied.png)');
    expect(t.value()).not.toContain('[id]:');
});

test('Markdown uses the selected existing definition when a paste contains a duplicate', () => {
    const t = setup('markup', '[id]: /existing.png\n\n');
    t.append('![Photo][id]\n\n[id]: /pasted.png');
    expect(t.resources()[0].resource.value).toBe('/existing.png');
    expect(t.callback.mock.calls[0][0]).toEqual([
        {kind: 'image', value: '/pasted.png', name: 'Photo'},
    ]);
    expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
});

test('Markdown still replaces an untracked reference when another pasted resource resolves its URL', async () => {
    const t = setup('markup', '[id]: /old.png\n\n');
    t.append('![reference][id] ![inline](/old.png)');
    expect(t.callback.mock.calls[0][0]).toEqual([
        {kind: 'image', value: '/old.png', name: 'inline'},
    ]);
    expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(t.cm ? 0 : 1);
    t.resolve();
    await flush();
    expect(t.value()).toContain('![reference](/new.png) ![inline](/new.png)');
    expect(t.value()).not.toContain('[id]:');
    t.undo();
    expect(t.resources().map((entry) => entry.resource.value)).toEqual(['/old.png', '/old.png']);
    t.redo();
    expect(t.resources().map((item) => item.resource.value)).toEqual(['/new.png', '/new.png']);
});

test.each([
    '/file?x=&copy;&y=&#65;',
    '/a(b) [c] <d> "q" \\ end',
    '/file?x=1&y=2',
    '/line\nbreak\tend',
    'https://пример.рф/картинка.png?x=1&y=2',
])('Markdown URLs round-trip through the Markdown parser: %s', async (value) => {
    const t = setup('markup', 'before');
    t.append('![inline](/old.png) ![ref][asset]\n\n[asset]: /old.png "title"');
    t.resolve(result('/old.png', value));
    await flush();
    const parsed = t.editor.wysiwygEditor.parser.parse(t.value());
    const paths: string[] = [];
    parsed.descendants((node) => {
        if (node.type.name === 'image') paths.push(node.attrs.src);
    });
    const {prepareResourceUrl} = await import('../urls');
    expect(paths).toEqual([
        prepareResourceUrl(t.editor.wysiwygEditor.parser, value),
        prepareResourceUrl(t.editor.wysiwygEditor.parser, value),
    ]);
});

test('WYSIWYG preserves dimensions, alt and title', async () => {
    const t = setup('wysiwyg', 'before');
    t.append('![B](/old.png "title" =100x200)');
    const before = {...t.pm.state.doc.nodeAt(t.resources()[0].from)!.attrs};
    t.resolve();
    await flush();
    expect(t.pm.state.doc.nodeAt(t.resources()[0].from)!.attrs).toEqual({
        ...before,
        src: '/new.png',
    });
});

test('WYSIWYG preserves a pending indicator when edits move its resource', () => {
    const t = setup('wysiwyg', 'before');
    t.append('![B](/old.png)');
    const indicator = t.dom.querySelector('[data-resource-pending]');
    expect(indicator).not.toBeNull();
    t.edit(1, 1, 'typing before the image ');
    expect(t.dom.querySelector('[data-resource-pending]')).toBe(indicator);
});

test('Markdown pending resources have no decorations or atomic ranges', () => {
    const t = setup('markup', 'before\n\n');
    t.append('![B](/old.png)');
    const view = t.cm!;
    expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
    expect(view.state.facet(CMView.atomicRanges).every((read) => read(view).size === 0)).toBe(true);
});

test('WYSIWYG precomputed and rejected states cannot start requests', () => {
    const reject: Extension = (builder) =>
        builder.addPlugin(
            () => new Plugin({filterTransaction: (tr) => !tr.getMeta('reject-paste')}),
        );
    const t = setup('wysiwyg', 'before', {}, reject);
    const tr = t.pm.state.tr
        .insert(1, t.pm.state.schema.nodes.image.create({src: '/old.png'}))
        .setMeta('paste', true);
    t.pm.state.applyTransaction(tr);
    expect(t.callback).not.toHaveBeenCalled();
    t.pm.dispatch(tr.setMeta('reject-paste', true));
    expect(t.callback).not.toHaveBeenCalled();
    t.pm.dispatch(tr.setMeta('reject-paste', false));
    expect(t.callback).toHaveBeenCalledTimes(1);
});

test('CodeMirror standalone precomputation is pure and raw commands respect the busy lock', async () => {
    const callback = jest.fn(
        () =>
            new Promise<ResourceReplacementResult>((resolve) => {
                complete = resolve;
            }),
    );
    let complete!: (result: ResourceReplacementResult) => void;
    const controller = new ResourceReplacementController({resolve: callback});
    const {markupParser: parser, serializer} = createEditorExtensions({
        extensions: (builder) =>
            builder.use(BundlePreset, {
                preset: 'full',
                searchPanel: false,
                directiveSyntax: new DirectiveSyntaxContext('enabled'),
                reactRenderer: new ReactRenderStorage(),
            }),
    }).buildDeps();
    const view = new CMView({
        doc: 'before',
        extensions: [
            cmHistory(),
            codeMirrorResourceReplacement({
                parser,
                serializer,
                controller,
                resources: {image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'}},
                shouldTrack: (tr) => tr.isUserEvent('input.paste'),
            }),
        ],
    });
    try {
        const tr = view.state.update({
            changes: {from: 0, to: 6, insert: '![B](/old.png)'},
            userEvent: 'input.paste',
        });
        expect(tr.state.doc.toString()).toContain('/old.png');
        expect(callback).not.toHaveBeenCalled();
        view.dispatch(tr);
        expect(callback).toHaveBeenCalledTimes(1);
        cmUndo(view);
        expect(view.state.doc.toString()).toContain('/old.png');
        complete(result());
        await flush();
        cmUndo(view);
        expect(view.state.doc.toString()).toBe('![B](/old.png)');
        cmRedo(view);
        expect(view.state.doc.toString()).toBe('![B](/new.png)');
    } finally {
        controller.destroy();
        view.destroy();
    }
});

test('unconfigured resources are skipped; collection inside existing code is approximate', () => {
    const t = setup('markup', '', {resources: {}});
    t.append('![B](/old.png)');
    expect(t.callback).not.toHaveBeenCalled();
    const code = setup('markup', '```md\ninside\n```');
    code.cm!.dispatch({selection: {anchor: 8}});
    paste(code.dom, '![B](/old.png)');
    expect(code.callback).toHaveBeenCalledTimes(1);
});

test('Markdown undo and redo of replacements never repeat resolve', async () => {
    const t = setup('markup', 'before');
    t.append(' ![B](/old.png)');
    t.resolve(result('/old.png', '/middle'));
    await flush();
    t.undo();
    expect(t.resources()[0].resource.value).toBe('/old.png');
    t.redo();
    t.append(' ![C](/middle)');
    t.resolve(result('/middle', '/last'));
    await flush();
    t.undo();
    expect(t.resources().map((entry) => entry.resource.value)).toEqual(['/middle', '/middle']);
    t.undo();
    expect(t.resources().map((entry) => entry.resource.value)).toEqual(['/middle']);
    t.redo();
    t.redo();
    expect(t.resources().map((entry) => entry.resource.value)).toEqual(['/last', '/last']);
    expect(t.callback).toHaveBeenCalledTimes(2);
});

test('Markdown undo of a resource typed while waiting removes the complete syntax', async () => {
    const t = setup('markup', 'before');
    t.append();
    t.edit(0, 0, '![typed](/old.png) ');
    t.resolve();
    await flush();
    t.undo();
    expect(t.value()).toContain('![typed](/old.png)');
    t.undo();
    expect(t.value()).toBe('before ![B](/old.png)');
    t.undo();
    expect(t.value()).toBe('before');
});

test('Markdown uses the current definition and succeeds when no old URL matches remain', async () => {
    const t = setup('markup', 'before\n\n');
    t.append('![B][ref]\n\n[ref]: /old.png');
    const from = t.value().indexOf('/old.png');
    t.edit(from, from + 8, '/manual');
    t.resolve();
    await flush();
    expect(t.events.mock.calls.at(-1)[0].status).toBe('succeeded');
    expect(t.value()).toContain('![B][ref]');
    expect(t.value()).toContain('/manual');
    expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
});

test('Markdown parses the insertion and current document using the shared parser', async () => {
    const t = setup('markup', 'before');
    const parse = jest.spyOn(t.editor.wysiwygEditor.parser, 'parse');
    try {
        t.append('![B](/old.png)');
        expect(parse).toHaveBeenCalledWith('![B](/old.png)');
        t.edit(0, 0, 'prefix ');
        const current = t.value();
        t.resolve();
        await flush();
        expect(parse).toHaveBeenLastCalledWith(current);
        parse.mockClear();
        t.undo();
        t.redo();
        expect(parse).not.toHaveBeenCalled();
    } finally {
        parse.mockRestore();
    }
});

test.each(['wysiwyg', 'markup'] as const)(
    '%s cancellation preserves another operation’s completed global changes',
    async (mode) => {
        const t = setup(mode);
        t.append();
        t.append(' ![C](/old.png)');
        t.resolve(result(), 1);
        await flush();
        const [pending] = t.editor.getPendingResourceReplacements();
        t.editor.cancelResourceReplacement(pending.operationId);
        expect(t.resources().map((item) => item.resource.value)).toEqual([
            '/new.png',
            '/new.png',
            '/new.png',
        ]);
        expect(t.dom.querySelectorAll('[data-resource-pending]')).toHaveLength(0);
        t.undo();
        t.undo();
        expect(t.resources().map((item) => item.resource.value)).toEqual(
            t.cm ? ['/old.png', '/old.png'] : ['/new.png'],
        );
    },
);

test.each(['wysiwyg', 'markup'] as const)(
    '%s selects drop transactions independently of paste',
    async (mode) => {
        const t = setup(mode, 'before', {triggers: ['drop']});
        t.append('![untracked](/old.png)');
        expect(t.callback).not.toHaveBeenCalled();
        if (t.cm)
            t.cm.dispatch({
                changes: {from: 0, insert: '![drop](/old.png) '},
                userEvent: 'input.drop',
            });
        else
            t.pm.dispatch(
                t.pm.state.tr
                    .insert(1, t.pm.state.schema.nodes.image.create({src: '/old.png', alt: 'drop'}))
                    .setMeta('uiEvent', 'drop'),
            );
        expect(t.callback).toHaveBeenCalledTimes(1);
        t.resolve();
        await flush();
        expect(t.resources().map((item) => item.resource.value)).toEqual(['/new.png', '/new.png']);
    },
);

test('Markdown history preserves unrelated remote edits through multiple pending pastes', async () => {
    const t = setup('markup');
    t.append();
    t.cm!.dispatch({
        changes: {from: 0, insert: 'remote '},
        annotations: [CMTransaction.remote.of(true), CMTransaction.addToHistory.of(false)],
    });
    t.append(' ![C](/old.png)');
    t.resolve(result('/old.png', '/second'), 1);
    await flush();
    t.resolve(result('/old.png', '/first'), 0);
    await flush();
    t.undo();
    t.undo();
    expect(t.value()).toContain('remote ');
    expect(t.resources().map((item) => item.resource.value)).toEqual(['/old.png', '/old.png']);
    t.redo();
    t.redo();
    expect(t.value()).toContain('remote ');
    expect(t.resources().map((item) => item.resource.value)).toEqual([
        '/second',
        '/second',
        '/second',
    ]);
});

test('WYSIWYG collects the accepted normalized insertion', async () => {
    const normalize: Extension = (builder) =>
        builder.addPlugin(
            () =>
                new Plugin({
                    appendTransaction(transactions, _old, state) {
                        if (!transactions.some((tr) => tr.getMeta('paste'))) return null;
                        const tr = state.tr;
                        state.doc.descendants((node, pos) => {
                            if (node.type.name === 'image' && node.attrs.src === '/old.png')
                                tr.setNodeAttribute(pos, 'src', '/normalized');
                        });
                        return tr.docChanged ? tr : null;
                    },
                }),
        );
    const t = setup('wysiwyg', 'before', {}, normalize);
    t.append();
    expect(t.callback.mock.calls[0][0]).toEqual([{kind: 'image', value: '/normalized', name: 'B'}]);
    t.resolve(result('/normalized', '/new.png'));
    await flush();
    t.undo();
    expect(t.value()).toBe('before');
    t.redo();
    expect(t.value()).toContain('/new.png');
});

test('Markdown serialization errors leave the accepted document intact and unlock the editor', async () => {
    const t = setup('markup', 'before');
    t.append();
    const before = t.value();
    const serialize = jest
        .spyOn(t.editor.wysiwygEditor.serializer, 'serialize')
        .mockImplementation(() => {
            throw new Error('Cannot serialize resource');
        });
    try {
        t.resolve();
        await flush();
        expect(t.value()).toBe(before);
        expect(t.events.mock.calls.at(-1)[0].status).toBe('failed');
        expect(t.editor.getPendingResourceReplacements()).toEqual([]);
        t.undo();
        expect(t.value()).toBe('before');
    } finally {
        serialize.mockRestore();
    }
});

test('Markdown remote transactions cannot resolve even when annotated as paste', () => {
    const t = setup('markup', 'before');
    t.cm!.dispatch({
        changes: {from: 0, insert: '![remote](/old.png) '},
        userEvent: 'input.paste',
        annotations: CMTransaction.remote.of(true),
    });
    expect(t.callback).not.toHaveBeenCalled();
    expect(t.editor.getPendingResourceReplacements()).toEqual([]);
});

test('Markdown replaces an existing matching resource but leaves a pasted candidate inside code intact', async () => {
    const t = setup('markup', '![existing](/old.png)\n\n```md\n\n```');
    const from = t.value().indexOf('```md') + 6;
    t.cm!.dispatch({changes: {from, insert: '![code](/old.png)'}, userEvent: 'input.paste'});
    expect(t.callback).toHaveBeenCalledTimes(1);
    t.resolve();
    await flush();
    expect(t.value()).toContain('![existing](/new.png)');
    expect(t.value()).toContain('![code](/old.png)');
});
