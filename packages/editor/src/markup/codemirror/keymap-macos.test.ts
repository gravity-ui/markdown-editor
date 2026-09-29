import type {EditorView} from '@codemirror/view';
import {describe, expect, it, vi} from 'vitest';

import {ReactRenderStorage} from '../../extensions';
import {Logger2} from '../../logger';
import {DirectiveSyntaxContext} from '../../utils/directive';

import {createCodemirror} from './create';

vi.hoisted(() => {
    // Set the platform before CodeMirror reads it.
    Object.defineProperty(window.navigator, 'platform', {value: 'MacIntel', configurable: true});
});

function createView(doc: string): EditorView {
    return createCodemirror({
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
    });
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
});
