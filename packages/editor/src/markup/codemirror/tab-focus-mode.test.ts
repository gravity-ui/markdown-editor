import {defaultKeymap, indentLess, insertTab} from '@codemirror/commands';
import {EditorView, ViewPlugin, keymap} from '@codemirror/view';
import {afterEach, describe, expect, it, onTestFinished, vi} from 'vitest';

import {TabFocusModeState} from '../../utils/tab-focus-mode';

import {createMarkupTabFocusMode} from './tab-focus-mode';

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

    function createView(state: TabFocusModeState, doc = '') {
        const tabFocus = createMarkupTabFocusMode(state);
        const view = new EditorView({
            doc,
            parent: document.body,
            extensions: [
                tabFocus.extension,
                keymap.of([{key: 'Tab', run: insertTab, shift: indentLess}, ...defaultKeymap]),
            ],
        });
        views.add(view);
        tabFocus.initialize(view);
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
        (mode) => {
            const state = new TabFocusModeState(mode);
            const view = createView(state);
            const event = pressTab(view);

            expect(event.defaultPrevented).toBe(mode === 'indent');
            expect(view.state.sliceDoc()).toBe(mode === 'indent' ? '\t' : '');
        },
    );

    it('should update Tab handling when the shared mode changes', () => {
        const state = new TabFocusModeState();
        const view = createView(state);
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

    it('should toggle the shared mode once with the configured shortcut', () => {
        const state = new TabFocusModeState();
        const change = vi.fn();
        state.on('change', change);
        const view = createView(state);

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
        (key) => {
            const state = new TabFocusModeState();
            const change = vi.fn();
            state.on('change', change);
            const view = createView(state);
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

    it.each([false, true])(
        'should let Tab reach parent handlers in focus mode with Shift %s',
        (shiftKey) => {
            const state = new TabFocusModeState('focus');
            const doc = '\tText';
            const view = createView(state, doc);
            const handler = vi.fn();
            document.body.addEventListener('keydown', handler);
            onTestFinished(() => document.body.removeEventListener('keydown', handler));

            const event = pressKey(view, {key: 'Tab', code: 'Tab', keyCode: 9, shiftKey});

            expect(event.defaultPrevented).toBe(false);
            expect(handler).toHaveBeenCalledExactlyOnceWith(event);
            expect(view.state.sliceDoc()).toBe(doc);
        },
    );

    it('should allow nested widgets to handle Tab in focus mode', () => {
        const state = new TabFocusModeState('focus');
        const view = createView(state);
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
        expect(event.defaultPrevented).toBe(true);
        expect(handler).toHaveBeenCalledExactlyOnceWith(event);
    });

    it('should preserve the mode and remove listeners when a view is recreated', () => {
        const state = new TabFocusModeState('focus');
        const oldView = createView(state);
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

        expect(state.countOf('change')).toBe(1);
        expect(pressTab(view).defaultPrevented).toBe(false);

        state.setMode('indent');

        expect(setOldMode).not.toHaveBeenCalled();
        expect(pressTab(view).defaultPrevented).toBe(true);
    });

    it('should initialize only views with the active adapter installed', () => {
        const state = new TabFocusModeState('focus');
        const tabFocus = createMarkupTabFocusMode(state);
        const view = new EditorView({extensions: [tabFocus.extension]});
        views.add(view);
        const setTabFocusMode = vi.spyOn(view, 'setTabFocusMode');

        expect(setTabFocusMode).not.toHaveBeenCalled();
        expect(state.countOf('change')).toBe(0);
        tabFocus.initialize(view);
        expect(setTabFocusMode).toHaveBeenCalledExactlyOnceWith(true);
        expect(state.countOf('change')).toBe(1);

        tabFocus.initialize(view);
        expect(state.countOf('change')).toBe(1);

        destroyView(view);
        tabFocus.initialize(view);
        state.setMode('indent');

        expect(setTabFocusMode).toHaveBeenCalledTimes(2);
        expect(state.countOf('change')).toBe(0);

        const unrelatedView = new EditorView();
        views.add(unrelatedView);
        const setUnrelatedMode = vi.spyOn(unrelatedView, 'setTabFocusMode');
        tabFocus.initialize(unrelatedView);

        expect(setUnrelatedMode).not.toHaveBeenCalled();
    });

    it('should initialize with shared mode changes made during view construction', () => {
        const state = new TabFocusModeState();
        const tabFocus = createMarkupTabFocusMode(state);
        const view = new EditorView({
            extensions: [
                tabFocus.extension,
                ViewPlugin.define(() => {
                    state.setMode('focus');
                    return {};
                }),
                keymap.of([{key: 'Tab', run: insertTab}]),
            ],
        });
        views.add(view);
        view.focus();

        expect(state.countOf('change')).toBe(0);
        tabFocus.initialize(view);

        expect(state.countOf('change')).toBe(1);
        expect(pressTab(view).defaultPrevented).toBe(false);
        expect(view.state.sliceDoc()).toBe('');
    });
});
