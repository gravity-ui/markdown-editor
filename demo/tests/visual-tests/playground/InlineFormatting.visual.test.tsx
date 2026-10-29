import {expect, test} from 'playwright/core';

import {Playground} from './Playground.helpers';

test('should format list items through the toolbar and shortcut with separate undo steps @markup', async ({
    mount,
    editor,
    helpers,
}) => {
    await mount(
        <Playground initial={'- one\n- two'} experimental={{structuralInlineFormatting: true}} />,
    );
    await editor.switchMode('markup');
    await editor.focus();
    await editor.press(helpers.keys.selectAll);

    const lines = editor.getBySelectorInContenteditable('.cm-line');
    await editor.clickMainToolbarButton('Bold');
    await expect(lines).toHaveText(['- **one**', '- **two**']);

    await editor.press('ControlOrMeta+i');
    await expect(lines).toHaveText(['- _**one**_', '- _**two**_']);

    await editor.press('ControlOrMeta+z');
    await expect(lines).toHaveText(['- **one**', '- **two**']);
    await editor.press('ControlOrMeta+z');
    await expect(lines).toHaveText(['- one', '- two']);

    await editor.press('ControlOrMeta+Shift+z');
    await expect(lines).toHaveText(['- **one**', '- **two**']);
    await editor.press('ControlOrMeta+Shift+z');
    await expect(lines).toHaveText(['- _**one**_', '- _**two**_']);
});
