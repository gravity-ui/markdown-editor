import {expect, test} from 'playwright/core';

import {EditorPopupSelection} from './EditorPopupSelection.helpers';

for (const legacy of [false, true]) {
    test.describe(`Editor popup selection (${legacy ? 'legacy root' : 'createRoot'})`, () => {
        for (const startsWithNote of [false, true]) {
            test(`preserves selection behavior without nested updates (${startsWithNote ? 'menu already open' : 'from paragraph'})`, async ({
                mount,
                page,
            }) => {
                const errors: string[] = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await mount(
                    <EditorPopupSelection legacy={legacy} startsWithNote={startsWithNote} />,
                );
                const editor = page.locator('.ProseMirror');
                const note = editor.locator('.yfm-note');
                const menu = page.getByTestId('g-md-toolbar-yfm-note');
                if (startsWithNote) {
                    await note.getByText('Text in note', {exact: true}).click();
                    await expect(menu).toBeVisible();
                } else {
                    await editor.getByText('Before', {exact: true}).click();
                    await expect(menu).toBeHidden();
                }
                await page.getByRole('button', {name: 'Reset probe'}).dispatchEvent('click');
                await note.click({position: {x: 10, y: 10}});
                await expect(menu).toBeVisible();
                await expect
                    .poll(async () => {
                        const data = JSON.parse(
                            await page.getByTestId('selection-probe').innerText(),
                        );
                        const node = data.selections.find(
                            (selection: {type: string}) => selection.type === 'node',
                        );
                        const last = data.selections.at(-1);
                        return Boolean(
                            node &&
                            (startsWithNote
                                ? last?.type === 'node' &&
                                  last.from === node.from &&
                                  last.to === node.to
                                : last?.type === 'text' &&
                                  last.from > node.from &&
                                  last.to < node.to &&
                                  last.from < last.to),
                        );
                    })
                    .toBe(true);
                const data = JSON.parse(await page.getByTestId('selection-probe').innerText());
                expect(data.maxDepth).toBe(1);
                if (startsWithNote) {
                    // Keeping the same open popup must not normalize a later block selection.
                    expect(data.selections.at(-1).type).toBe('node');
                    await expect(note).toHaveClass(/ProseMirror-selectednode/);
                }
                await expect(editor).toBeFocused();
                expect(await page.evaluate(() => document.getSelection()?.toString())).toContain(
                    'Text in note',
                );
                expect(errors).toEqual([]);
            });
        }

        for (const action of ['paragraph', 'destroy'] as const) {
            test(`discards deferred work after ${action === 'paragraph' ? 'selection changes' : 'destroy'}`, async ({
                mount,
                page,
            }) => {
                const errors: string[] = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await mount(<EditorPopupSelection legacy={legacy} />);
                await page.locator('.ProseMirror').getByText('Before', {exact: true}).click();
                await page.getByRole('button', {name: 'Reset probe'}).dispatchEvent('click');
                await page.getByRole('button', {name: `Select note then ${action}`}).click();
                const output = page.getByTestId('selection-probe');
                await expect
                    .poll(async () => JSON.parse(await output.innerText()).settled)
                    .toBe(true);
                const data = JSON.parse(await output.innerText());
                expect(data.selections[0].type).toBe('node');
                expect(data.maxDepth).toBe(1);
                expect(data.updatesAfterDestroy).toBe(0);
                if (action === 'paragraph') {
                    expect(data.selections).toHaveLength(2);
                    expect(data.selections[1]).toEqual({type: 'text', from: 1, to: 1});
                    await expect(page.getByTestId('g-md-toolbar-yfm-note')).toBeHidden();
                } else {
                    expect(data.destroyed).toBe(true);
                    await expect(page.locator('.ProseMirror')).toHaveCount(0);
                }
                expect(errors).toEqual([]);
            });
        }
    });
}
