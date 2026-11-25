import {afterEach, describe, expect, it} from 'vitest';

import {ShortcutsRegistry} from './registry';

function setPlatform(value: string) {
    Object.defineProperty(window.navigator, 'platform', {value, configurable: true});
}

const initialPlatform = window.navigator.platform;

afterEach(() => setPlatform(initialPlatform));

describe('ShortcutsRegistry', () => {
    it('should read one combination of an action', () => {
        const registry = new ShortcutsRegistry().set('bold', ['mod', 'b']);

        expect(registry.toPM('bold')).toBe('mod-b');
        expect(registry.toView('bold')).toBe('mod+b');
        expect(registry.toPMList('bold')).toEqual(['mod-b']);
    });

    it('should return null and undefined for an unknown action', () => {
        const registry = new ShortcutsRegistry();

        expect(registry.toPM('bold')).toBe(null);
        expect(registry.toView('bold')).toBe(undefined);
        expect(registry.toPMList('bold')).toEqual([]);
    });

    it('should keep every combination of an action and show the first one', () => {
        const registry = new ShortcutsRegistry().set('strike', [
            ['mod', 'shift', 's'],
            ['mod', 'shift', 'x'],
        ]);

        expect(registry.toPMList('strike')).toEqual(['mod-shift-s', 'mod-shift-x']);
        expect(registry.toView('strike')).toBe('mod+shift+s');
    });

    it('should choose combinations by platform', () => {
        const registry = new ShortcutsRegistry().set('h1', {
            pc: [['ctrl', 'shift', '1']],
            mac: [['cmd', 'alt', '1']],
        });

        setPlatform('Win32');
        expect(registry.toPM('h1')).toBe('ctrl-shift-1');

        setPlatform('MacIntel');
        expect(registry.toPM('h1')).toBe('cmd-alt-1');
    });

    it('should move Shift to the front for CodeMirror', () => {
        const registry = new ShortcutsRegistry().set('h1', ['ctrl', 'shift', '1']);

        expect(registry.toCM('h1')).toBe('shift-ctrl-1');
    });

    it('should let a layer replace an action and leave the rest untouched', () => {
        const base = new ShortcutsRegistry().set('bold', ['mod', 'b']).set('italic', ['mod', 'i']);
        const user = base.extend({bold: ['mod', 'shift', 'b']});

        expect(user.toPM('bold')).toBe('mod-shift-b');
        expect(user.toPM('italic')).toBe('mod-i');
        expect(base.toPM('bold')).toBe('mod-b');
    });

    it('should remove an action by an empty layer value', () => {
        const registry = new ShortcutsRegistry().set('bold', ['mod', 'b']).extend({bold: []});

        expect(registry.toPM('bold')).toBe(null);
    });

    it('should report a combination taken by two actions', () => {
        setPlatform('Win32');
        const registry = new ShortcutsRegistry()
            .set('bold', ['mod', 'b'])
            .set('bullets', ['mod', 'b']);

        expect(registry.conflicts()).toEqual([
            {kind: 'duplicate', shortcut: 'mod+b', actions: ['bold', 'bullets']},
        ]);
    });

    it('should report a combination taken by the browser', () => {
        setPlatform('MacIntel');
        const registry = new ShortcutsRegistry().set('strike', ['mod', 'shift', 's']);

        expect(registry.conflicts()).toEqual([
            {
                kind: 'external',
                shortcut: 'mod+shift+s',
                action: 'strike',
                owner: 'Firefox: screenshot of an element',
            },
        ]);
    });

    it('should leave a combination taken on another platform alone', () => {
        setPlatform('MacIntel');
        const registry = new ShortcutsRegistry().set('h1', ['ctrl', 'shift', '1']);

        expect(registry.conflicts()).toEqual([]);
    });
});
