// @vitest-environment jsdom
import {ThemeProvider} from '@gravity-ui/uikit';
import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {GptDialogProps} from '../../types';

import {GptDialog} from './GptDialog';

describe('GPT dialog', () => {
    let container: HTMLDivElement;
    let root: Root;
    let props: GptDialogProps;

    beforeEach(() => {
        vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
        vi.stubGlobal(
            'ResizeObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        vi.stubGlobal('requestAnimationFrame', () => 0);
        vi.stubGlobal('cancelAnimationFrame', () => {});
        container = document.createElement('div');
        document.body.appendChild(container);
        root = createRoot(container);
        props = {
            markup: 'source',
            answerRender: (answer) => <span>{answer.rawText}</span>,
            onApplyResult: vi.fn(),
            onCustomPromptApply: async () => ({rawText: 'answer'}),
            onPromptPresetClick: async () => ({rawText: 'answer'}),
            promptPresets: [{key: 'correct', display: 'Correct'}],
        };
    });
    afterEach(() => {
        act(() => root.unmount());
        container.remove();
        vi.unstubAllGlobals();
    });
    function render() {
        act(() =>
            root.render(
                <ThemeProvider theme="light">
                    <GptDialog {...props} />
                </ThemeProvider>,
            ),
        );
    }
    async function showAnswer() {
        const button = Array.from(container.querySelectorAll('button')).find(
            (item) => item.textContent === 'Correct',
        );
        expect(button).toBeDefined();
        await act(async () => {
            button?.click();
        });
    }

    it('should render only feedback actions supplied by the caller', async () => {
        props.onLike = vi.fn(async () => {});
        render();
        await showAnswer();
        expect(container.querySelector('[aria-label="Good response"]')).not.toBeNull();
        expect(container.querySelector('[aria-label="Bad response"]')).toBeNull();
        await act(async () => {
            container.querySelector<HTMLButtonElement>('[aria-label="Good response"]')?.click();
        });
        expect(props.onLike).toHaveBeenCalledExactlyOnceWith({
            markup: 'source',
            promptData: undefined,
        });
        expect(container.textContent).toContain('Thanks for your feedback!');
    });

    it('should dismiss an alert without mutating the caller props', () => {
        props.disablePromptPresets = true;
        const onCloseGptAlert = vi.fn();
        props.gptAlertProps = Object.freeze({showedGptAlert: true, onCloseGptAlert});
        render();
        const close = container.querySelector<HTMLButtonElement>('.g-alert button');
        expect(close).not.toBeNull();
        act(() => close?.click());
        expect(props.gptAlertProps.showedGptAlert).toBe(true);
        expect(onCloseGptAlert).toHaveBeenCalledTimes(1);
        expect(container.querySelector('.g-alert')).toBeNull();
    });

    it('should leave keyboard events outside the dialog untouched', async () => {
        render();
        await showAnswer();
        const outside = document.createElement('button');
        document.body.appendChild(outside);
        outside.focus();
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true,
        });
        act(() => outside.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(false);
        expect(props.onApplyResult).not.toHaveBeenCalled();
        outside.remove();
    });

    it('should apply from the dialog keyboard scope without intercepting feedback buttons', async () => {
        props.onLike = async () => {};
        render();
        await showAnswer();
        const dialog = container.querySelector<HTMLDivElement>('.g-md-gpt-dialog');
        dialog?.focus();
        act(() =>
            dialog?.dispatchEvent(
                new KeyboardEvent('keydown', {key: 'Enter', code: 'Enter', bubbles: true}),
            ),
        );
        expect(props.onApplyResult).toHaveBeenCalledExactlyOnceWith('answer');
        const like = container.querySelector<HTMLButtonElement>('[aria-label="Good response"]');
        like?.focus();
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true,
        });
        act(() => like?.dispatchEvent(event));
        expect(event.defaultPrevented).toBe(false);
        expect(props.onApplyResult).toHaveBeenCalledTimes(1);
    });
});
