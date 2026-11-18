import {describe, expect, it, vi} from 'vitest';

import {TabFocusModeState} from './tab-focus-mode';

describe('TabFocusModeState', () => {
    it('should initialize independent modes for each editor', () => {
        const first = new TabFocusModeState();
        const second = new TabFocusModeState('focus');

        first.toggle();

        expect(first.getMode()).toBe('focus');
        expect(second.getMode()).toBe('focus');

        second.toggle();

        expect(first.getMode()).toBe('focus');
        expect(second.getMode()).toBe('indent');
    });

    it('should notify subscribers only after the mode changes', () => {
        const state = new TabFocusModeState();
        const listener = vi.fn(() => state.getMode());
        state.on('change', listener);

        state.setMode('indent');
        expect(listener).not.toHaveBeenCalled();

        state.setMode('focus');
        state.setMode('focus');
        state.toggle();

        expect(listener.mock.calls).toEqual([[{mode: 'focus'}], [{mode: 'indent'}]]);
        expect(listener.mock.results.map(({value}) => value)).toEqual(['focus', 'indent']);
    });

    it('should stop notifying a removed subscriber', () => {
        const state = new TabFocusModeState();
        const listener = vi.fn();
        state.on('change', listener);
        state.off('change', listener);

        state.toggle();

        expect(listener).not.toHaveBeenCalled();
        expect(state.getMode()).toBe('focus');
    });
});
