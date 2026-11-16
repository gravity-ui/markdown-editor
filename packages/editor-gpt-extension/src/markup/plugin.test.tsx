// @vitest-environment jsdom
import {type ReactElement, type ReactNode, createElement} from 'react';

import {EditorView} from '@codemirror/view';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {GptDialogProps} from '../types';

import {showMarkupGpt} from './commands/gpt';
import {mGptPlugin} from './plugin';

function setup() {
    let render!: () => ReactNode;
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    const onApplyResult = vi.fn();
    const plugin = mGptPlugin(
        {
            answerRender: () => createElement('div'),
            onCustomPromptApply: async () => undefined,
            onUpdate,
            onClose,
            onApplyResult,
        },
        {
            getRenderer: () => ({
                createItem: (_id, callback) => {
                    render = callback;
                    return {rerender() {}, remove() {}};
                },
            }),
        },
    );
    const view = new EditorView({doc: 'original text', extensions: [plugin]});
    const popup = () => render() as ReactElement<GptDialogProps>;
    return {view, popup, onUpdate, onClose, onApplyResult};
}

describe('GPT markup lifecycle', () => {
    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', () => 0);
        vi.stubGlobal('cancelAnimationFrame', () => {});
    });
    afterEach(() => vi.unstubAllGlobals());

    it('should preserve the session for an unchanged selection and reject callbacks after reopening', () => {
        const {view, popup, onUpdate} = setup();
        try {
            showMarkupGpt(view);
            const original = popup();
            expect(original).not.toBeNull();
            view.dispatch({selection: view.state.selection});
            expect(popup().key).toBe(original.key);
            showMarkupGpt(view);
            expect(popup().key).not.toBe(original.key);
            original.props.onUpdate?.({rawText: 'stale'});
            expect(onUpdate).not.toHaveBeenCalled();
        } finally {
            view.destroy();
        }
    });

    it('should invalidate all popup callbacks immediately on destruction', () => {
        const {view, popup, onUpdate, onClose, onApplyResult} = setup();
        showMarkupGpt(view);
        const original = popup();
        view.destroy();
        original.props.onUpdate?.({rawText: 'late'});
        original.props.onClose?.();
        original.props.onApplyResult('late');
        expect(onUpdate).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(onApplyResult).not.toHaveBeenCalled();
    });
});
