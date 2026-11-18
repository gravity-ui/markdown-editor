import {afterEach, describe, expect, it, vi} from 'vitest';

import {WysiwygEditor} from '../../../core/Editor';
import {isMac} from '../../../utils/platform';
import {TabFocusModeState} from '../../../utils/tab-focus-mode';
import {BaseSchemaSpecs} from '../../base/BaseSchema/BaseSchemaSpecs';

import {createWysiwygTabFocusModeExtension} from './TabFocusMode';

describe('WYSIWYG Tab focus mode', () => {
    const editors: WysiwygEditor[] = [];

    afterEach(() => {
        for (const editor of editors) editor.destroy();
        editors.length = 0;
    });

    function createEditor(state: TabFocusModeState) {
        const command = vi.fn(() => true);
        const editor = new WysiwygEditor({
            initialContent: 'Text',
            extensions: (builder) =>
                builder
                    .use(BaseSchemaSpecs, {})
                    .use(createWysiwygTabFocusModeExtension(state))
                    .addKeymap(() => ({Tab: command, 'Shift-Tab': command})),
        });
        editors.push(editor);
        return {editor, command};
    }

    function dispatchKey(editor: WysiwygEditor, init: KeyboardEventInit) {
        const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, ...init});
        editor.dom.dispatchEvent(event);
        return event;
    }

    it.each([false, true])(
        'should bypass editor commands only in focus mode with Shift %s',
        (shiftKey) => {
            const state = new TabFocusModeState();
            const {editor, command} = createEditor(state);

            expect(dispatchKey(editor, {key: 'Tab', shiftKey}).defaultPrevented).toBe(true);
            expect(command).toHaveBeenCalledTimes(1);

            state.setMode('focus');

            expect(dispatchKey(editor, {key: 'Tab', shiftKey}).defaultPrevented).toBe(false);
            expect(command).toHaveBeenCalledTimes(1);

            state.setMode('indent');

            expect(dispatchKey(editor, {key: 'Tab', shiftKey}).defaultPrevented).toBe(true);
            expect(command).toHaveBeenCalledTimes(2);
        },
    );

    it('should toggle the standalone mode with the keyboard shortcut', () => {
        const state = new TabFocusModeState();
        const {editor} = createEditor(state);

        const first = dispatchKey(editor, {
            key: 'm',
            code: 'KeyM',
            keyCode: 77,
            ctrlKey: true,
            shiftKey: isMac(),
        });

        expect(first.defaultPrevented).toBe(true);
        expect(state.getMode()).toBe('focus');

        dispatchKey(editor, {
            key: 'm',
            code: 'KeyM',
            keyCode: 77,
            ctrlKey: true,
            shiftKey: isMac(),
        });

        expect(state.getMode()).toBe('indent');
    });

    it('should expose an action that checks availability without changing the shared mode', () => {
        const state = new TabFocusModeState();
        const {editor} = createEditor(state);
        const action = editor.actions.toggleTabFocusMode;
        const change = vi.fn();
        const document = editor.doc;
        state.on('change', change);

        expect(editor.action('toggleTabFocusMode')).toBe(action);
        expect(action.isEnable()).toBe(true);
        expect(action.isActive()).toBe(false);
        expect(change).not.toHaveBeenCalled();
        expect(state.getMode()).toBe('indent');

        action.run();

        expect(state.getMode()).toBe('focus');
        expect(action.isActive()).toBe(true);
        expect(action.isEnable()).toBe(true);
        expect(change).toHaveBeenCalledExactlyOnceWith({mode: 'focus'});
        expect(editor.doc).toBe(document);
        expect(editor.getValue()).toBe('Text');

        state.setMode('indent');

        expect(action.isActive()).toBe(false);
        expect(editor.doc).toBe(document);
    });

    it.each(['m', 'ь'])(
        'should recognize the native shortcut with the %s layout and follow native repeat behavior',
        (key) => {
            const state = new TabFocusModeState();
            const change = vi.fn();
            state.on('change', change);
            const {editor} = createEditor(state);
            const shortcut = {
                key,
                code: 'KeyM',
                keyCode: 77,
                ctrlKey: true,
                shiftKey: isMac(),
            };

            expect(dispatchKey(editor, {...shortcut, altKey: true}).defaultPrevented).toBe(false);
            expect(change).not.toHaveBeenCalled();

            expect(dispatchKey(editor, shortcut).defaultPrevented).toBe(true);
            expect(dispatchKey(editor, {...shortcut, repeat: true}).defaultPrevented).toBe(true);
            expect(state.getMode()).toBe('indent');
            expect(change.mock.calls).toEqual([[{mode: 'focus'}], [{mode: 'indent'}]]);
        },
    );

    it('should leave shortcut handling to ProseMirror during composition', () => {
        const state = new TabFocusModeState();
        const {editor} = createEditor(state);
        editor.dom.dispatchEvent(new CompositionEvent('compositionstart', {bubbles: true}));

        const event = dispatchKey(editor, {
            key: 'm',
            code: 'KeyM',
            keyCode: 77,
            ctrlKey: true,
            shiftKey: isMac(),
        });

        editor.dom.dispatchEvent(new CompositionEvent('compositionend', {bubbles: true}));

        expect(state.getMode()).toBe('indent');
        expect(event.defaultPrevented).toBe(false);
    });

    it('should stop nested widget handlers without cancelling native Tab navigation', () => {
        const state = new TabFocusModeState('focus');
        const {editor} = createEditor(state);
        const widget = document.createElement('button');
        const handler = vi.fn((event: KeyboardEvent) => event.preventDefault());
        widget.addEventListener('keydown', handler);
        editor.dom.append(widget);
        const event = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });

        widget.dispatchEvent(event);

        expect(handler).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    it('should remove the Tab capture listener when its editor is destroyed', () => {
        const state = new TabFocusModeState('focus');
        const {editor} = createEditor(state);
        const dom = editor.dom;
        editor.destroy();
        editors.splice(editors.indexOf(editor), 1);

        const widget = document.createElement('button');
        const handler = vi.fn((event: KeyboardEvent) => event.preventDefault());
        widget.addEventListener('keydown', handler);
        dom.append(widget);
        const event = new KeyboardEvent('keydown', {
            key: 'Tab',
            bubbles: true,
            cancelable: true,
        });
        widget.dispatchEvent(event);

        expect(state.getMode()).toBe('focus');
        expect(handler).toHaveBeenCalledOnce();
        expect(event.defaultPrevented).toBe(true);
    });
});
