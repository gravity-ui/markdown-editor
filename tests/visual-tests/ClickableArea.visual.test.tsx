import {test, expect} from 'playwright/core';
import {PresetsStories} from './Presets.helpers';

const getHeights = async (page) => {
    const container = page.locator('.g-md-wysiwyg-editor__editor');
    const editor = container.locator('.ProseMirror');
    const containerBox = await container.boundingBox();
    const editorBox = await editor.boundingBox();
    return {containerHeight: containerBox?.height, editorHeight: editorBox?.height};
};

test('zero preset clickable area', async ({mount, page}) => {
    await mount(<PresetsStories.Zero />);
    const {containerHeight, editorHeight} = await getHeights(page);
    expect(containerHeight).toBeCloseTo(editorHeight!, 1);
});
