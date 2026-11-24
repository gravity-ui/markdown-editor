import {expect} from 'playwright/core';
import {test} from 'playwright/core/extensions/section';

import {SectionStories} from './Section.helpers';

test('should keep section edges and render the edited layout in preview @wysiwyg @markup', async ({
    mount,
    editor,
    section,
}) => {
    await mount(<SectionStories.Section />, {width: 960});
    await section.openSettings();

    const original = await section.layout(section.editable);
    expect(original.gap).toBe(20);
    expect(original.padding).toEqual(['0px', '0px', '0px']);
    expect(original.radii).toEqual(['0px', '0px', '0px']);

    await section.hoverColumnText();
    expect((await section.boundaryAppearance()).opacity).toBe('0');
    await section.firstBoundary.hover();
    expect(await section.boundaryAppearance()).toMatchObject({
        opacity: '1',
        backgroundImage: expect.stringContaining('linear-gradient'),
        filter: expect.stringContaining('drop-shadow'),
    });
    await section.hoverColumnText();
    expect((await section.boundaryAppearance()).opacity).toBe('0');

    await section.select(section.gap, '2');
    await section.select(section.rounded, 'S');
    await section.select(section.padding, 'L');
    await section.select(section.secondBackground, 'Violet');
    const changed = await section.layout(section.editable);
    expect(changed).toMatchObject({
        startInset: 0,
        endInset: 0,
        gap: 8,
        padding: ['16px', '16px', '16px'],
    });
    expect(await section.editorInsets()).toEqual([0, 0]);
    expect(changed.colors[1]).not.toBe(original.colors[1]);
    expect(changed.radii).toEqual(['5px', '5px', '5px']);

    await section.clearDimension(section.padding);
    const unpadded = await section.layout(section.editable);
    expect(unpadded).toEqual({...changed, padding: ['0px', '0px', '0px']});

    await section.resizeFirstBoundary();
    const resized = await section.layout(section.editable);
    expect(resized.widths[0]).toBeGreaterThan(unpadded.widths[0]);
    expect(resized.widths[1]).toBeLessThan(unpadded.widths[1]);
    expect(resized.widths[2]).toEqual(unpadded.widths[2]);

    await section.openSettings();
    await section.select(section.padding, 'M');
    await section.select(section.rounded, 'L');
    const expected = await section.layout(section.editable);
    expect(expected.padding).toEqual(['8px', '8px', '8px']);
    expect(expected.radii).toEqual(['8px', '8px', '8px']);
    await editor.switchPreview('visible');
    await expect(section.preview).toBeVisible();
    expect(await section.layout(section.preview)).toEqual(expected);
});
