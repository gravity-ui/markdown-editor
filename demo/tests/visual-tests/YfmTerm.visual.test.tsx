import {expect} from '@playwright/experimental-ct-react';

import {test} from '../playwright/core/extensions/yfm-term';

import {TermStories} from './YfmTerm.helpers';

const source = [
    'Read the [API](*api) documentation.',
    'The [interface](*api) is publicly available.',
    'The same definition is used throughout the document.',
    'Edit the term to update the definition.',
    'The new definition appears wherever this term is used.',
    'Open the Markdown preview to read the definition.',
    'Return to the editor to continue writing.',
    '[*api]: A contract describing how software components interact.',
].join('\n\n');

test.describe('Diplodoc Term', () => {
    test('should render inline terms @wysiwyg', async ({mount, editor, term, expectScreenshot}) => {
        await mount(<TermStories.YfmTerm width={540} initial={source} />);
        await editor.assertMode('wysiwyg');
        await expect(term.references).toHaveCount(2);
        await expect(term.form).toBeHidden();
        await expectScreenshot({component: editor.locators.component});
    });

    test('should open the term form @wysiwyg', async ({mount, editor, term, expectScreenshot}) => {
        await mount(<TermStories.YfmTerm width={540} initial={source} />, {
            styles: '[data-qa="demo-md-editor"] { min-height: 350px; }',
        });
        await term.openForm();
        await expect(term.label).toBeFocused();
        await expect(term.label).toHaveValue('API');
        await expect(term.definition).toHaveValue(
            'A contract describing how software components interact.',
        );
        await expectScreenshot({component: editor.locators.component});
    });
});
