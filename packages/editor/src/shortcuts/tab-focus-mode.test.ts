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
    ])('should return $shortcut on $platform', async ({platform, shortcut}) => {
        vi.stubGlobal('navigator', {platform});
        const {getToggleTabFocusModeShortcut} = await import('./index');

        expect(getToggleTabFocusModeShortcut()).toBe(shortcut);
    });
});
