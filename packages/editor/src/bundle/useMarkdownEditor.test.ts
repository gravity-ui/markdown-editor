import {createElement} from 'react';

import {Transaction} from '@codemirror/state';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import {Plugin} from 'prosemirror-state';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';

import type {ExtensionDeps} from '../core';
import type {ResourceReplacementResult} from '../modules/resource-replacement';

import type {EditorInt} from './Editor';
import type {MarkdownEditorOptions} from './types';
import {useMarkdownEditor} from './useMarkdownEditor';

function mountEditor(options: MarkdownEditorOptions) {
    let editor!: EditorInt;
    function Component() {
        editor = useMarkdownEditor(options) as EditorInt;
        return null;
    }
    const container = document.createElement('div');
    const root = createRoot(container);
    flushSync(() => root.render(createElement(Component)));
    return {editor, unmount: () => flushSync(() => root.unmount())};
}

test.each([
    ['![label](/old.png)', 'image'],
    ['![label][ref]\n\n[ref]: /old.png', 'image'],
    ['{% file src="/old.png" name="label" %}', 'file'],
])('useMarkdownEditor resolves %s with only resource options', async (source, kind) => {
    const resolve = jest.fn(async () => ({
        replacements: [{kind, oldValue: '/old.png', newValue: '/new.png'}],
    }));
    const {editor, unmount} = mountEditor({
        initial: {mode: 'markup'},
        resourceReplacement: {
            resources: {
                image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
                [FILE_TOKEN]: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
            },
            triggers: ['paste'],
            resolve,
        },
    });
    const modeChange = jest.fn();
    editor.on('change-editor-mode', modeChange);
    try {
        editor.cm.dispatch({
            changes: {from: 0, insert: source},
            annotations: Transaction.userEvent.of('input.paste'),
        });
        expect(resolve).toHaveBeenCalledWith(
            [{kind, value: '/old.png', name: 'label'}],
            expect.any(Object),
        );
        for (let i = 0; i < 8; i++) await Promise.resolve();
        expect(editor.getValue()).toContain('/new.png');
        expect(editor.currentMode).toBe('markup');
        expect(modeChange).not.toHaveBeenCalled();
        expect(editor._wysiwygView).toBeUndefined();
    } finally {
        unmount();
    }
});

test.each(['markup', 'wysiwyg'] as const)(
    'shared parser configuration is reused when starting in %s',
    async (mode) => {
        jest.useFakeTimers();
        let deps!: ExtensionDeps;
        const createPlugin = jest.fn((value: ExtensionDeps) => {
            deps = value;
            return new Plugin({});
        });
        const configure = jest.fn((md) => {
            const normalize = md.normalizeLink.bind(md);
            const validate = md.validateLink.bind(md);
            Object.assign(md, {
                normalizeLink: (url: string) => normalize(url.replace('/alias', '/actual')),
                validateLink: (url: string) => validate(url) && !url.startsWith('/blocked'),
            });
            return md;
        });
        let complete!: (result: ResourceReplacementResult) => void;
        const resolve = jest.fn(
            () =>
                new Promise<ResourceReplacementResult>((done) => {
                    complete = done;
                }),
        );
        const {editor, unmount} = mountEditor({
            initial: {mode},
            wysiwygConfig: {
                extensions: (builder) => builder.configureMd(configure).addPlugin(createPlugin),
            },
            resourceReplacement: {
                resources: {image: {kind: 'image', valueAttribute: 'src'}},
                triggers: ['paste'],
                resolve,
            },
        });
        try {
            if (mode === 'wysiwyg') {
                expect(editor.wysiwygEditor.view).toBeDefined();
                editor.setEditorMode('markup');
                jest.advanceTimersByTime(30);
            }
            const view = editor.cm;
            if (mode === 'markup') {
                expect(editor._wysiwygView).toBeUndefined();
                expect(createPlugin).not.toHaveBeenCalled();
            }
            // Each extension configures the markup and plain-text parser once.
            expect(configure).toHaveBeenCalledTimes(2);
            view.dispatch({
                changes: {from: 0, insert: '![a](/alias.png) ![b](/blocked.png)'},
                annotations: Transaction.userEvent.of('input.paste'),
            });
            expect(resolve).toHaveBeenCalledWith(
                [{kind: 'image', value: '/actual.png'}],
                expect.any(Object),
            );
            complete({
                replacements: [
                    {kind: 'image', oldValue: '/actual.png', newValue: '/alias-new.png'},
                ],
            });
            for (let i = 0; i < 8; i++) await Promise.resolve();
            expect(editor.getValue()).toBe('![a](/actual-new.png) ![b](/blocked.png)');
            view.dispatch({
                changes: {from: view.state.doc.length, insert: ' ![c](/alias.png)'},
                annotations: Transaction.userEvent.of('input.paste'),
            });
            const before = editor.getValue();
            complete({
                replacements: [
                    {kind: 'image', oldValue: '/actual.png', newValue: '/blocked-new.png'},
                ],
            });
            for (let i = 0; i < 8; i++) await Promise.resolve();
            expect(editor.getValue()).toBe(before);
            expect(editor.getPendingResourceReplacements()).toEqual([]);
            editor.setEditorMode('wysiwyg');
            jest.advanceTimersByTime(30);
            expect(createPlugin).toHaveBeenCalledTimes(1);
            expect(configure).toHaveBeenCalledTimes(2);
            expect(editor.wysiwygEditor.parser).toBe(deps.markupParser);
            expect(editor.wysiwygEditor.parser.normalizeLink('/alias.png')).toBe('/actual.png');
        } finally {
            unmount();
            jest.clearAllTimers();
            jest.useRealTimers();
        }
    },
);
