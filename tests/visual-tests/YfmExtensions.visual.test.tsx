import {test} from 'playwright/core';

import {YFMStories} from './YfmExtensions.helpers';

test.describe('Extensions, YFM', () => {
    test('Task lists', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.Tasklist />);
        await expectScreenshot();
    });
    test('Folding Headings', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.FoldingHeadings />);
        await expectScreenshot();
    });
    test('YFM Notes', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmNote />);
        await expectScreenshot();
    });
    test('YFM Cut', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmCut />);
        await expectScreenshot();
    });
    test('YFM Tabs', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmTabs />);
        await expectScreenshot();
    });
    test('YFM HTML', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmHtmlBlock />);
        await expectScreenshot();
    });
    test('YFM File', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmFile />);
        await expectScreenshot();
    });
    test('YFM Table', async ({mount, expectScreenshot}) => {
        await mount(<YFMStories.YfmTable />);
        await expectScreenshot();
    });
    test('LaTeX Formulas', async ({mount, expectScreenshot, wait}) => {
        await mount(<YFMStories.LaTeXFormulas />);
        await wait.loadersHiddenQASelect();

        await expectScreenshot();
    });
    test('Mermaid diagram', async ({mount, expectScreenshot, wait}) => {
        await mount(<YFMStories.MermaidDiagram />);
        await wait.loadersHiddenQASelect();

        await expectScreenshot();
    });
});
