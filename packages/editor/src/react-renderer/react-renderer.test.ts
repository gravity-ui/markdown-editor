import {EditorState} from '@codemirror/state';
import {describe, expect, it} from 'vitest';

import {WysiwygEditor} from '../core';
import {BaseSchemaSpecs} from '../extensions/base/BaseSchema/BaseSchemaSpecs';
import {
    ReactRenderStorage,
    ReactRendererExtension,
    getReactRendererFromState as existingGetter,
} from '../extensions/behavior/ReactRenderer';
import {ReactRendererFacet as existingFacet} from '../markup/codemirror/react-facet';

import {ReactRendererFacet, getReactRendererFromState} from './index';

describe('react-renderer entry point', () => {
    it('should preserve the existing renderer identities', () => {
        expect(ReactRendererFacet).toBe(existingFacet);
        expect(getReactRendererFromState).toBe(existingGetter);
    });

    it('should use the renderer installed by the WYSIWYG extension', () => {
        const storage = new ReactRenderStorage();
        const editor = new WysiwygEditor({
            extensions: (builder) =>
                builder.use(BaseSchemaSpecs, {}).use(ReactRendererExtension, storage),
        });

        try {
            const renderer = getReactRendererFromState(editor.view.state);
            const item = renderer.createItem('external-extension', () => 'answer');

            expect(renderer).toBe(storage);
            expect(storage.getItems()[0].render()).toBe('answer');
            item.remove();
            expect(storage.getItems()).toHaveLength(0);
        } finally {
            editor.destroy();
        }
    });

    it('should use the existing Markdown facet without sharing editor instances', () => {
        const first = new ReactRenderStorage();
        const second = new ReactRenderStorage();
        const firstState = EditorState.create({extensions: [existingFacet.of(first)]});
        const secondState = EditorState.create({extensions: [existingFacet.of(second)]});
        const renderer = firstState.facet(ReactRendererFacet);
        const item = renderer.createItem('external-extension', () => 'answer');

        expect(renderer).toBe(first);
        expect(secondState.facet(ReactRendererFacet)).toBe(second);
        expect(first.getItems()).toHaveLength(1);
        expect(second.getItems()).toHaveLength(0);
        renderer.removeItem(item.id);
        expect(first.getItems()).toHaveLength(0);
    });
});
