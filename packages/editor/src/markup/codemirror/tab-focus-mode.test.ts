import {defaultKeymap, insertTab} from '@codemirror/commands';
import {EditorView, keymap} from '@codemirror/view';
import {afterEach, describe, expect, it, vi} from 'vitest';

import {TabFocusModeState} from '../../utils/tab-focus-mode';

import {createMarkupTabFocusModeExtension} from './tab-focus-mode';

vi.hoisted(() => {
    Object.defineProperty(window.navigator, 'platform', {value: 'MacIntel', configurable: true});
});

describe('markup Tab focus mode', () => {
    const views = new Set<EditorView>();

    afterEach(() => {
        for (const view of views) view.destroy();
        views.clear();
        vi.restoreAllMocks();
    });

    function createView(state: TabFocusModeState) {
        const view = new EditorView({
            parent: document.body,
            extensions: [
                createMarkupTabFocusModeExtension(state),
                keymap.of([{key: 'Tab', run: insertTab}, ...defaultKeymap]),
            ],
        });
        views.add(view);
        view.focus();
        return view;
    }

    function destroyView(view: EditorView) {
        view.destroy();
        views.delete(view);
    }

    function pressKey(view: EditorView, init: KeyboardEventInit) {
        const event = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            ...init,
        });
        view.contentDOM.dispatchEvent(event);
        return event;
    }

    function pressTab(view: EditorView) {
        return pressKey(view, {key: 'Tab', code: 'Tab', keyCode: 9});
    }

    it.each(['indent', 'focus'] as const)(
        'should apply the initial %s mode to Tab handling',
        async (mode) => {
            const state = new TabFocusModeState(mode);
            const view = createView(state);
            const setTabFocusMode = vi.spyOn(view, 'setTabFocusMode');

            await Promise.resolve();
            const event = pressTab(view);

            expect(setTabFocusMode).toHaveBeenCalledWith(mode === 'focus');
            expect(event.defaultPrevented).toBe(mode === 'indent');
            expect(view.state.sliceDoc()).toBe(mode === 'indent' ? '\t' : '');
        },
    );

    it('should update Tab handling when the shared mode changes', async () => {
        const state = new TabFocusModeState();
        const view = createView(state);
        await Promise.resolve();
        const setTabFocusMode = vi.spyOn(view, 'setTabFocusMode');

        state.setMode('focus');

        expect(setTabFocusMode).toHaveBeenLastCalledWith(true);
        expect(pressTab(view).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('');

        state.setMode('indent');

        expect(setTabFocusMode).toHaveBeenLastCalledWith(false);
        expect(pressTab(view).defaultPrevented).toBe(true);
        expect(view.state.sliceDoc()).toBe('\t');
    });

    it('should toggle the shared mode once with the configured shortcut', async () => {
        const state = new TabFocusModeState();
        const change = vi.fn();
        state.on('change', change);
        const view = createView(state);
        await Promise.resolve();

        const event = pressKey(view, {
            key: 'M',
            code: 'KeyM',
            keyCode: 77,
            ctrlKey: true,
            shiftKey: true,
        });

        expect(event.defaultPrevented).toBe(true);
        expect(state.getMode()).toBe('focus');
        expect(change).toHaveBeenCalledExactlyOnceWith({mode: 'focus'});
        expect(pressTab(view).defaultPrevented).toBe(false);
    });

    it.each(['M', 'Ь'])(
        'should run the native shortcut command with the %s layout on every keydown',
        async (key) => {
            const state = new TabFocusModeState();
            const change = vi.fn();
            state.on('change', change);
            const view = createView(state);
            await Promise.resolve();
            const shortcut = {
                key,
                code: 'KeyM',
                keyCode: 77,
                ctrlKey: true,
                shiftKey: true,
            };

            expect(pressKey(view, {...shortcut, altKey: true}).defaultPrevented).toBe(false);
            expect(change).not.toHaveBeenCalled();

            expect(pressKey(view, shortcut).defaultPrevented).toBe(true);
            expect(pressKey(view, {...shortcut, repeat: true}).defaultPrevented).toBe(true);
            expect(state.getMode()).toBe('indent');
            expect(change.mock.calls).toEqual([[{mode: 'focus'}], [{mode: 'indent'}]]);
        },
    );

    it('should preserve native Tab navigation before nested widget handlers in focus mode', async () => {
        const state = new TabFocusModeState('focus');
        const view = createView(state);
        await Promise.resolve();
        const widget = document.createElement('button');
        const handler = vi.fn((event: KeyboardEvent) => event.preventDefault());
        widget.addEventListener('keydown', handler);
        view.dom.append(widget);
        const event = new KeyboardEvent('keydown', {
            key: 'Tab',
            code: 'Tab',
            keyCode: 9,
            bubbles: true,
            cancelable: true,
        });

        widget.dispatchEvent(event);

        expect(state.getMode()).toBe('focus');
        expect(event.defaultPrevented).toBe(false);
        expect(handler).not.toHaveBeenCalled();
    });

    it('should synchronize the shared mode with the native macOS shortcut', async () => {
        const state = new TabFocusModeState();
        const change = vi.fn();
        state.on('change', change);
        const view = createView(state);
        await Promise.resolve();
        const shortcut = {
            key: 'M',
            code: 'KeyM',
            keyCode: 77,
            altKey: true,
            shiftKey: true,
        };

        expect(pressKey(view, shortcut).defaultPrevented).toBe(true);
        expect(state.getMode()).toBe('focus');
        expect(change).toHaveBeenCalledExactlyOnceWith({mode: 'focus'});
        expect(pressTab(view).defaultPrevented).toBe(false);

        expect(pressKey(view, shortcut).defaultPrevented).toBe(true);
        expect(state.getMode()).toBe('indent');
        expect(change).toHaveBeenLastCalledWith({mode: 'indent'});
        expect(change).toHaveBeenCalledTimes(2);
        expect(pressTab(view).defaultPrevented).toBe(true);
    });

    it('should preserve the mode and remove listeners when a view is recreated', async () => {
        const state = new TabFocusModeState('focus');
        const oldView = createView(state);
        await Promise.resolve();
        const setOldMode = vi.spyOn(oldView, 'setTabFocusMode');

        destroyView(oldView);

        expect(state.countOf('change')).toBe(0);
        pressKey(oldView, {
            key: 'M',
            code: 'KeyM',
            keyCode: 77,
            ctrlKey: true,
            shiftKey: true,
        });
        expect(state.getMode()).toBe('focus');

        const view = createView(state);
        await Promise.resolve();

        expect(state.countOf('change')).toBe(1);
        expect(pressTab(view).defaultPrevented).toBe(false);

        state.setMode('indent');

        expect(setOldMode).not.toHaveBeenCalled();
        expect(pressTab(view).defaultPrevented).toBe(true);
    });

    it('should skip pending initialization after the view is destroyed', async () => {
        const state = new TabFocusModeState('focus');
        const view = createView(state);
        const setTabFocusMode = vi.spyOn(view, 'setTabFocusMode');

        destroyView(view);
        state.setMode('indent');
        await Promise.resolve();

        expect(setTabFocusMode).not.toHaveBeenCalled();
        expect(state.countOf('change')).toBe(0);
    });
});
