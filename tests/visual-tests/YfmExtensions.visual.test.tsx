import {test} from 'playwright/core';

import {PlaygroundMini} from '../../demo/components/PlaygroundMini';
import {markup} from '../../demo/stories/yfm/content';

test.describe('Extensions, YFM', () => {
    test('Text', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.textMarks} />);
        await expectScreenshot();
    });
    test('Task lists', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.tasklist} />);
        await expectScreenshot();
    });
    test('Folding Headings', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.foldingHeadings} />);
        await expectScreenshot();
    });
    test('YFM Notes', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmNotes} />);
        await expectScreenshot();
    });
    test('YFM Cut', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmCut} />);
        await expectScreenshot();
    });
    test('YFM Tabs', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmTabs} />);
        await expectScreenshot();
    });
    test('YFM HTML', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmHtmlBlock} />);
        await expectScreenshot();
    });
    test('YFM File', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmFile} />);
        await expectScreenshot();
    });
    test('YFM Table', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.yfmTable} />);
        await expectScreenshot();
    });
    test('LaTeX Formulas', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.latexFormulas} />);
        await expectScreenshot();
    });
    test('Mermaid diagram', async ({mount, expectScreenshot}) => {
        await mount(<PlaygroundMini initial={markup.mermaidDiagram} />);
        await expectScreenshot();
    });
});
