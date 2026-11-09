import {describe, expect, it} from 'vitest';

import {
    commonmark,
    defaultPreset,
    full,
    markupToolbarsPresets,
    wysiwygToolbarsPresets,
    yfm,
    zero,
} from './index';

const combinedPresets = {zero, commonmark, default: defaultPreset, yfm, full};

describe('Mode toolbar presets', () => {
    it.each([
        ['wysiwyg', 'markup', wysiwygToolbarsPresets],
        ['markup', 'wysiwyg', markupToolbarsPresets],
    ] as const)(
        'should expose only %s behavior with the existing item order',
        (mode, other, presets) => {
            expect(Object.keys(presets)).toEqual(['zero', 'commonmark', 'default', 'yfm', 'full']);

            for (const name of Object.keys(combinedPresets) as (keyof typeof combinedPresets)[]) {
                const preset = presets[name];
                const combined = combinedPresets[name];
                expect(Object.keys(preset.items)).toEqual(Object.keys(combined.items));
                for (const [id, item] of Object.entries(preset.items)) {
                    expect(item).not.toHaveProperty(other);
                    expect(item.view).toBe(combined.items[id].view);
                    expect(item[mode]).toBe(combined.items[id][mode]);
                }
                expect(preset.orders).toEqual(
                    Object.fromEntries(
                        Object.entries(combined.orders).filter(([id]) => id.startsWith(mode)),
                    ),
                );
            }
        },
    );

    it('should preserve the legacy image and file item positions and mode actions', () => {
        expect(full.items.undo).toBe(zero.items.undo);
        expect(full.items.bold).toBe(commonmark.items.bold);
        expect(Object.keys(yfm.orders)).toEqual([
            'wysiwygMain',
            'markupMain',
            'wysiwygHidden',
            'markupHidden',
            'wysiwygSelection',
            'wysiwygSlash',
        ]);
        expect(Object.keys(yfm.items).slice(-11)).toEqual([
            'underline',
            'mono',
            'note',
            'cut',
            'image',
            'imagePopup',
            'file',
            'filePopup',
            'table',
            'checkbox',
            'tabs',
        ]);
        expect(yfm.orders.wysiwygMain.at(-1)).toEqual(['image', 'file', 'table', 'checkbox']);
        expect(yfm.orders.markupMain.at(-1)).toEqual([
            'imagePopup',
            'filePopup',
            'table',
            'checkbox',
        ]);
        expect(yfm.items.image.wysiwyg?.exec).toBeTypeOf('function');
        expect(yfm.items.imagePopup.markup).toHaveProperty('renderPopup');
        expect(yfm.items.file.wysiwyg?.exec).toBeTypeOf('function');
        expect(yfm.items.filePopup.markup).toHaveProperty('renderPopup');
    });
});
