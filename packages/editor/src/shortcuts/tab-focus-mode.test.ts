import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

describe('getToggleTabFocusModeShortcut', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        {platform: 'Win32', shortcut: 'Control+M'},
        {platform: 'Linux x86_64', shortcut: 'Control+M'},
        {platform: 'MacIntel', shortcut: 'Control+Shift+M'},
    ])(
        'should preserve $shortcut on $platform after CodeMirror formatting',
        async ({platform, shortcut}) => {
            vi.stubGlobal('navigator', {platform});
            const {Action, formatter, getToggleTabFocusModeShortcut} = await import('./index');
            const viewShortcut = formatter.toView(Action.ToggleTabFocusMode);

            expect(getToggleTabFocusModeShortcut()).toBe(shortcut);

            formatter.toCM(Action.ToggleTabFocusMode);

            expect(getToggleTabFocusModeShortcut()).toBe(shortcut);
            expect(formatter.toView(Action.ToggleTabFocusMode)).toBe(viewShortcut);
        },
    );
});
