import {test} from 'playwright/core';

import {
    FoldingHeadings,
    LatexFormulas,
    MermaidDiagram,
    TaskLists,
    Text,
    YfmCut,
    YfmFile,
    YfmHtml,
    YfmNotes,
    YfmTable,
    YfmTabs,
} from './YfmExtensions.helpers';

test.describe('Extensions, YFM', () => {
    test('Text', async ({mount, expectScreenshot}) => {
        await mount(<Text />);
        await expectScreenshot();
    });
    test('Task lists', async ({mount, expectScreenshot}) => {
        await mount(<TaskLists />);
        await expectScreenshot();
    });
    test('Folding Headings', async ({mount, expectScreenshot}) => {
        await mount(<FoldingHeadings />);
        await expectScreenshot();
    });
    test('YFM Notes', async ({mount, expectScreenshot}) => {
        await mount(<YfmNotes />);
        await expectScreenshot();
    });
    test('YFM Cut', async ({mount, expectScreenshot}) => {
        await mount(<YfmCut />);
        await expectScreenshot();
    });
    test('YFM Tabs', async ({mount, expectScreenshot}) => {
        await mount(<YfmTabs />);
        await expectScreenshot();
    });
    test('YFM HTML', async ({mount, expectScreenshot}) => {
        await mount(<YfmHtml />);
        await expectScreenshot();
    });
    test('YFM File', async ({mount, expectScreenshot}) => {
        await mount(<YfmFile />);
        await expectScreenshot();
    });
    test('YFM Table', async ({mount, expectScreenshot}) => {
        await mount(<YfmTable />);
        await expectScreenshot();
    });
    test('LaTeX Formulas', async ({mount, expectScreenshot}) => {
        await mount(<LatexFormulas />);
        await expectScreenshot();
    });
    test('Mermaid diagram', async ({mount, expectScreenshot}) => {
        await mount(<MermaidDiagram />);
        await expectScreenshot();
    });
});
