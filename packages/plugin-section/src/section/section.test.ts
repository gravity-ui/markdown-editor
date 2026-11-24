import MarkdownIt from 'markdown-it';
import {describe, expect, it} from 'vitest';

import {sectionPlugin} from './plugin';

const md = new MarkdownIt().use(sectionPlugin);

describe('Section markup', () => {
    it('should render a padded section with separate gap, widths and backgrounds', () => {
        const html = md.render(`::::section{padding="true" gap="0.5"}

:::column{size="5" background="blue"}
One
:::

:::column{size="7" background="green"}
- Two
:::

::::`);
        expect(html).toContain('g-md-section-plugin_padded g-md-section-plugin_gap_half');
        expect(html).toContain(
            'g-md-section-column-plugin_size_5 g-md-section-column-plugin_background_blue',
        );
        expect(html).toContain(
            'g-md-section-column-plugin_size_7 g-md-section-column-plugin_background_green',
        );
        expect(html).toContain('<li>Two</li>');
    });

    it('should normalize invalid widths while preserving all blocks', () => {
        const html = md.render(`::::section

:::column{size="2"}
One
:::

:::column{size="2"}
Two
:::

::::`);
        expect(html.match(/g-md-section-column-plugin_size_6/g)).toHaveLength(2);
        expect(html).toContain('<p>One</p>');
        expect(html).toContain('<p>Two</p>');
    });

    it('should preserve unsupported section content as ordinary Markdown', () => {
        const html = md.render('::::section\n\nKeep this\n\n::::');
        expect(html).toContain('Keep this');
        expect(html).not.toContain('g-md-section-plugin');
    });
});
