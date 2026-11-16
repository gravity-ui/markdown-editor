import {type ReactElement, createElement} from 'react';

import type {GptDialogProps} from '@gravity-ui/markdown-editor-gpt-extension';
import {TextSelection} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import {WysiwygEditor} from '../../../core';
import {BaseSchemaSpecs} from '../../base/BaseSchema/BaseSchemaSpecs';
import {ReactRenderStorage, ReactRendererExtension} from '../../behavior/ReactRenderer';

import {gptExtension} from './index';

describe('legacy GPT integration', () => {
    it('should register the extracted extension and replace the original selection', () => {
        const storage = new ReactRenderStorage();
        const onApplyResult = vi.fn();
        const editor = new WysiwygEditor({
            initialContent: 'original text',
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(ReactRendererExtension, storage)
                    .use(gptExtension, {
                        answerRender: () => createElement('div'),
                        onCustomPromptApply: async () => undefined,
                        onApplyResult,
                    }),
        });

        try {
            const {view} = editor;
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 1, 14)));
            editor.actions.addGptWidget.run({});
            const popup = storage.getItems()[0].render() as ReactElement<GptDialogProps>;
            expect(popup.props.markup.trim()).toBe('original text');
            popup.props.onApplyResult('updated text');
            expect(editor.doc.textContent).toBe('updated text');
            expect(onApplyResult).toHaveBeenCalledExactlyOnceWith('updated text');
        } finally {
            editor.destroy();
        }
        expect(storage.getItems()).toHaveLength(0);
    });
    it('should reject callbacks from a closed or replaced popup session', () => {
        const storage = new ReactRenderStorage();
        const onApplyResult = vi.fn();
        const onUpdate = vi.fn();
        const editor = new WysiwygEditor({
            initialContent: 'original text',
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(ReactRendererExtension, storage)
                    .use(gptExtension, {
                        answerRender: () => createElement('div'),
                        onCustomPromptApply: async () => undefined,
                        onApplyResult,
                        onUpdate,
                    }),
        });
        try {
            editor.actions.addGptWidget.run({});
            const oldPopup = storage.getItems()[0].render() as ReactElement<GptDialogProps>;
            editor.view.dispatch(editor.view.state.tr.insertText('changed ', 1));
            oldPopup.props.onApplyResult('stale');
            oldPopup.props.onUpdate?.({rawText: 'stale'});
            expect(editor.doc.textContent).toBe('changed original text');
            editor.actions.addGptWidget.run({});
            oldPopup.props.onApplyResult('stale after reopen');
            oldPopup.props.onUpdate?.({rawText: 'stale after reopen'});
            expect(editor.doc.textContent).toBe('changed original text');
            expect(onApplyResult).not.toHaveBeenCalled();
            expect(onUpdate).not.toHaveBeenCalled();
        } finally {
            editor.destroy();
        }
    });
});
