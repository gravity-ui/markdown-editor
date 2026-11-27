import {describe, expect, it} from 'vitest';

import {renderSpecPage} from '../src/spec-pages.mjs';

const FENCE = '`'.repeat(32);

/** Renders a page from lines and returns its lines. */
function render(lines) {
    return renderSpecPage(lines.join('\n')).split('\n');
}

describe('renderSpecPage', () => {
    it('should number chapters and sections and give each an anchor', () => {
        expect(
            render([
                '# Sample Spec',
                '## Introduction',
                '### What is a sample?',
                '## Blocks {#sample-blocks}',
                '### `marker` attribute',
            ]),
        ).toEqual([
            '# Sample Spec',
            '## 1 Introduction {#introduction}',
            '### 1.1 What is a sample? {#what-is-a-sample}',
            '## 2 Blocks {#sample-blocks}',
            '### 2.1 `marker` attribute {#marker-attribute}',
        ]);
    });

    it('should render an example as a table of Markdown and HTML code', () => {
        expect(
            render([
                `${FENCE} example`,
                '`a` | {{b}}',
                '',
                '→c',
                '.',
                '<p><code>a</code> | {{b}}</p>',
                FENCE,
            ]),
        ).toEqual([
            '{% anchor example-1 %}',
            '',
            '[Example 1](#example-1)',
            '',
            '#|',
            '||',
            '',
            '<pre><code>&#96;a&#96; &#124; &#123;&#123;b&#125;&#125;',
            '',
            '→c</code></pre>',
            '',
            '|',
            '',
            '<pre><code>&lt;p&gt;&lt;code&gt;a&lt;/code&gt; &#124; &#123;&#123;b&#125;&#125;&lt;/p&gt;</code></pre>',
            '',
            '||',
            '|#',
        ]);
    });

    it('should keep other fenced blocks with their headings and examples unchanged', () => {
        const fenced = [
            '~~~markdown',
            '## Rules',
            `${FENCE} example`,
            'a',
            '.',
            '<p>a</p>',
            FENCE,
            '~~~',
        ];
        const page = render([...fenced, '', '```` example', 'b', '.', '<p>b</p>', '````']);

        expect(page.slice(0, fenced.length)).toEqual(fenced);
        expect(page).toContain('[Example 1](#example-1)');
        expect(page).toContain('<pre><code>b</code></pre>');
    });

    it.each([
        [['## Rules', '### Rules'], 'Duplicate anchor "#rules"'],
        [[`${FENCE} example`, 'a', FENCE], 'Example 1 has no "." line between Markdown and HTML'],
        [[`${FENCE} example`, 'a', '.'], 'Example 1 is not closed'],
    ])('should reject %j', (lines, message) => {
        expect(() => render(lines)).toThrow(message);
    });
});
