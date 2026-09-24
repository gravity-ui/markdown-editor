import type MarkdownIt from 'markdown-it';
import {Plugin} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';

import {WysiwygEditor} from './Editor';
import type {Extension} from './ExtensionBuilder';
import {createEditorExtensionsManager} from './createEditorExtensionsManager';

describe('shared editor dependencies', () => {
    it('should prepare dependencies once without creating editor components', () => {
        const createPlugin = vi.fn(() => new Plugin({}));
        const createNodeView = vi.fn(() => () => ({dom: document.createElement('p')}));
        const extensions = vi.fn<Extension>((builder) => {
            builder.use(BaseSchemaSpecs, {});
            builder.addPlugin(createPlugin);
            builder.addNodeView('paragraph', createNodeView);
        });
        const manager = createEditorExtensionsManager({extensions});
        expect(extensions).not.toHaveBeenCalled();

        const deps = manager.buildDeps();
        expect(manager.buildDeps()).toBe(deps);
        expect(extensions).toHaveBeenCalledTimes(1);
        expect(createPlugin).not.toHaveBeenCalled();
        expect(createNodeView).not.toHaveBeenCalled();
        expect(deps.serializer.serialize(deps.markupParser.parse('hello'))).toBe('hello');

        const built = manager.build();
        expect(built.schema).toBe(deps.schema);
        expect(built.markupParser).toBe(deps.markupParser);
        expect(built.serializer).toBe(deps.serializer);
        expect(manager.build().plugins).toBe(built.plugins);
        expect(manager.build().nodeViews).toBe(built.nodeViews);
        expect(createPlugin).toHaveBeenCalledTimes(1);
        expect(createNodeView).toHaveBeenCalledTimes(1);
    });

    it('should reuse prepared dependencies without accumulating view plugins', () => {
        const manager = createEditorExtensionsManager({
            extensions: (builder) => builder.use(BaseSchemaSpecs, {}),
        });
        const deps = manager.buildDeps();
        const originalPlugins = [...manager.build().plugins];
        for (const initialContent of ['first', 'second']) {
            const editor = new WysiwygEditor({extensionsManager: manager, initialContent});
            try {
                expect(editor.view.state.schema).toBe(deps.schema);
                expect(editor.getValue()).toBe(initialContent);
                expect(manager.build().plugins).toEqual(originalPlugins);
            } finally {
                editor.destroy();
            }
        }
    });

    it('should apply shared parser configuration before creating a view', () => {
        const configure = vi.fn((md: MarkdownIt) => {
            expect(md.options).toMatchObject({html: true, linkify: true, breaks: true});
            return md;
        });
        const manager = createEditorExtensionsManager({
            allowHTML: true,
            linkify: true,
            mdPreset: 'commonmark',
            extensions: (builder) => {
                builder.use(BaseSchemaSpecs, {});
                builder.configureMd(configure);
            },
        });
        manager.buildDeps();
        expect(configure).toHaveBeenCalled();
        const callCount = configure.mock.calls.length;
        manager.build();
        expect(configure).toHaveBeenCalledTimes(callCount);
    });
});
