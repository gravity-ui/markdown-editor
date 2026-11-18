import type {EditorView} from '@codemirror/view';
import {describe, expect, it, onTestFinished, vi} from 'vitest';

import {Logger2} from '../../logger';
import {ReactRenderStorage} from '../../modules/react-renderer';
import {DirectiveSyntaxContext} from '../../utils/directive';
import {TabFocusModeState} from '../../utils/tab-focus-mode';

import {createCodemirror} from './create';
import {createMarkupTabFocusMode} from './tab-focus-mode';

vi.hoisted(() => {
    // Set the platform before CodeMirror reads it.
    Object.defineProperty(window.navigator, 'platform', {value: 'MacIntel', configurable: true});
});

function createView(doc: string, tabFocusState?: TabFocusModeState): EditorView {
    const tabFocus = tabFocusState && createMarkupTabFocusMode(tabFocusState);
    const view = createCodemirror({
        doc,
        placeholder: '',
        logger: new Logger2(),
        onCancel: () => undefined,
        onSubmit: () => undefined,
        onChange: () => undefined,
        onDocChange: () => undefined,
        onScroll: () => undefined,
        reactRenderer: new ReactRenderStorage(),
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        preserveEmptyRows: false,
        searchPanel: false,
        extensions: tabFocus ? [tabFocus.extension] : [],
    });
    tabFocus?.initialize(view);
    return view;
}

describe('markup editor keymap on macOS', () => {
    it('should leave Opt+Shift+A to the browser: it types "Å" on macOS layouts', () => {
        const view = createView('text');
        view.focus();

        // macOS reports the composed character in event.key, so CodeMirror resolves Alt
        // combinations by key code instead. That turns this event into the "Alt-A" binding of
        // defaultKeymap (toggleBlockComment) and inserts an HTML comment over the character.
        const event = new KeyboardEvent('keydown', {
            key: 'Å',
            code: 'KeyA',
            keyCode: 65,
            altKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
        });

        view.contentDOM.dispatchEvent(event);

        expect(view.state.sliceDoc()).toBe('text');
        expect(event.defaultPrevented).toBe(false);

        view.destroy();
    });

    it('should leave Opt+Shift+0 to the browser: it types "`" on the Russian layout', () => {
        const view = createView('text');
        view.focus();

        // Alt combinations resolve by the produced character, so this event reaches the
        // "Alt-`" binding of completionKeymap (startCompletion) and the backtick is lost.
        const event = new KeyboardEvent('keydown', {
            key: '`',
            code: 'Digit0',
            keyCode: 48,
            altKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
        });

        view.contentDOM.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);

        view.destroy();
    });

    it.each([
        {key: 'Â', mode: 'indent'},
        {key: 'M', mode: 'indent'},
        {key: 'Â', mode: 'focus'},
        {key: 'M', mode: 'focus'},
    ] as const)(
        'should leave Opt+Shift+M with key $key to the browser in $mode mode',
        ({key, mode}) => {
            const state = new TabFocusModeState(mode);
            const change = vi.fn();
            state.on('change', change);
            const view = createView('text', state);
            onTestFinished(() => view.destroy());
            view.focus();
            const event = new KeyboardEvent('keydown', {
                key,
                code: 'KeyM',
                keyCode: 77,
                altKey: true,
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            });

            view.contentDOM.dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
            expect(state.getMode()).toBe(mode);
            expect(change).not.toHaveBeenCalled();
            expect(view.state.sliceDoc()).toBe('text');

            const tab = new KeyboardEvent('keydown', {
                key: 'Tab',
                code: 'Tab',
                keyCode: 9,
                bubbles: true,
                cancelable: true,
            });
            view.contentDOM.dispatchEvent(tab);

            expect(tab.defaultPrevented).toBe(mode === 'indent');
            expect(view.state.sliceDoc()).toBe(mode === 'indent' ? '\ttext' : 'text');
        },
    );

    it('should keep Ctrl+Space bound to completion', () => {
        const view = createView('text');
        view.focus();

        const event = new KeyboardEvent('keydown', {
            key: ' ',
            code: 'Space',
            keyCode: 32,
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });

        view.contentDOM.dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);

        view.destroy();
    });
});
