import {describe, expect, it} from 'vitest';

import {parseExtensionReadme} from '../src/extension-readme/format.mjs';

const FRONTMATTER = [
    '---',
    'generated: ai',
    'editor: 1.2.3',
    `commit: ${'a'.repeat(40)}`,
    'date: 2026-01-02',
    `source-hash: ${'b'.repeat(64)}`,
    '---',
];

const BODY = [
    '',
    '## Description',
    '',
    'Adds a `sample` block to the editor. It parses `::: sample`.',
    '',
    '## Examples',
    '',
    '### Connect',
    '',
    '```ts',
    "import {Sample} from 'sample';",
    '```',
    '',
    '### Set the marker',
    '',
    '```ts',
    "const marker = 'x';",
    '```',
];

const README = [...FRONTMATTER, ...BODY].join('\n') + '\n';

/** Replaces one line of the valid README; `null` removes it, an array inserts several lines. */
function replaceLine(text, line, replacement) {
    const lines = text.split('\n');
    lines.splice(line - 1, 1, ...(replacement === null ? [] : [replacement].flat()));
    return lines.join('\n');
}

/** Returns the violations that the parser reports for a README. */
function violations(text) {
    try {
        parseExtensionReadme(text);
    } catch (error) {
        return error.violations;
    }
    throw new Error('The README was accepted.');
}

describe('parseExtensionReadme', () => {
    it('should parse a valid README', () => {
        expect(parseExtensionReadme(README)).toEqual({
            frontmatter: {
                generated: 'ai',
                editor: '1.2.3',
                commit: 'a'.repeat(40),
                date: '2026-01-02',
                'source-hash': 'b'.repeat(64),
            },
            description: 'Adds a `sample` block to the editor. It parses `::: sample`.',
            examples: [
                {title: 'Connect', code: "import {Sample} from 'sample';"},
                {title: 'Set the marker', code: "const marker = 'x';"},
            ],
        });
    });

    it('should accept a README with the Connect example only', () => {
        const text = README.split('\n').slice(0, 19).join('\n');

        expect(parseExtensionReadme(text).examples).toEqual([
            {title: 'Connect', code: "import {Sample} from 'sample';"},
        ]);
    });

    it('should accept `generated: edited`', () => {
        expect(
            parseExtensionReadme(replaceLine(README, 2, 'generated: edited')).frontmatter.generated,
        ).toBe('edited');
    });

    it('should list every violation with its line number in the error message', () => {
        const text = replaceLine(
            replaceLine(README, 3, 'editor: 1.2'),
            11,
            'One. Two. Three. Four.',
        );

        expect(() => parseExtensionReadme(text)).toThrow(
            [
                'Invalid extension README:',
                '  line 3: `editor` must be a semver version, found "1.2".',
                '  line 9: `## Description` must have one to 3 sentences, found 4.',
            ].join('\n'),
        );
    });

    it.each([
        [
            'a missing opening frontmatter line',
            (text) => replaceLine(text, 1, null),
            1,
            'must start with a `---`',
        ],
        [
            'a missing closing frontmatter line',
            (text) => text.replace(/^---\n\n/m, '\n'),
            1,
            'no closing `---`',
        ],
        [
            'a wrong field order',
            (text) => replaceLine(replaceLine(text, 2, 'editor: 1.2.3'), 3, 'generated: ai'),
            2,
            'Expected the `generated` field, found `editor`',
        ],
        ['a missing field', (text) => replaceLine(text, 6, null), 6, 'no `source-hash` field'],
        [
            'an extra field',
            (text) => replaceLine(text, 7, ['title: Sample', '---']),
            7,
            'Unexpected field `title`',
        ],
        [
            'a wrong `generated` value',
            (text) => replaceLine(text, 2, 'generated: human'),
            2,
            '`generated` must be',
        ],
        [
            'a non-semver `editor`',
            (text) => replaceLine(text, 3, 'editor: v1'),
            3,
            '`editor` must be',
        ],
        [
            'a short `commit`',
            (text) => replaceLine(text, 4, 'commit: abc123'),
            4,
            '`commit` must be',
        ],
        [
            'an invalid `date`',
            (text) => replaceLine(text, 5, 'date: 2026-02-30'),
            5,
            '`date` must be',
        ],
        [
            'a wrong `source-hash`',
            (text) => replaceLine(text, 6, 'source-hash: xyz'),
            6,
            '`source-hash` must be',
        ],
        [
            'text before Description',
            (text) => replaceLine(text, 8, 'Intro.'),
            8,
            'Text before `## Description`',
        ],
        [
            'a wrong first heading',
            (text) => replaceLine(text, 9, '## About'),
            9,
            'Expected `## Description`, found `## About`',
        ],
        [
            'an empty description',
            (text) => replaceLine(text, 11, ''),
            9,
            '`## Description` has no text',
        ],
        [
            'more than three sentences',
            (text) => replaceLine(text, 11, 'One. Two. Three. Four.'),
            9,
            'one to 3 sentences, found 4',
        ],
        [
            'a list in the description',
            (text) => replaceLine(text, 11, '- Adds a block.'),
            11,
            'plain sentences only',
        ],
        [
            'two description paragraphs',
            (text) => replaceLine(text, 11, ['Adds a block.', '', 'Parses it.']),
            12,
            'one paragraph',
        ],
        [
            'an unfinished description',
            (text) => replaceLine(text, 11, 'Adds a block'),
            11,
            'full sentence',
        ],
        [
            'text between Examples and Connect',
            (text) => replaceLine(text, 14, 'Examples follow.'),
            14,
            'Text between `## Examples` and `### Connect`',
        ],
        [
            'a missing Connect heading',
            (text) => replaceLine(text, 15, '### Install'),
            15,
            'Expected `### Connect`',
        ],
        [
            'text in an example',
            (text) => replaceLine(text, 16, 'Connect it.'),
            16,
            'must start with a `ts` code block',
        ],
        [
            'a non-ts code block',
            (text) => replaceLine(text, 17, '```js'),
            17,
            'must start with a `ts` code block',
        ],
        [
            'text after the code block',
            (text) => replaceLine(text, 20, 'Done.'),
            20,
            'one `ts` code block and nothing else',
        ],
        [
            'two code blocks in an example',
            (text) => replaceLine(text, 20, ['```ts', 'const a = 1;', '```']),
            20,
            'one `ts` code block and nothing else',
        ],
        ['an empty code block', (text) => replaceLine(text, 18, null), 17, 'is empty'],
        [
            'four task examples',
            (text) =>
                text +
                ['A', 'B', 'C']
                    .flatMap((title) => ['', `### ${title}`, '', '```ts', 'const a = 1;', '```'])
                    .join('\n'),
            39,
            'at most 3 task examples',
        ],
        [
            'a level 4 heading',
            (text) => replaceLine(text, 21, '#### Details'),
            21,
            'Only `###` headings may follow `### Connect`',
        ],
        [
            'a level 2 heading after the examples',
            (text) => `${text}\n## Notes\n`,
            27,
            'Only `###` headings may follow `### Connect`',
        ],
        ['an unclosed code block', (text) => replaceLine(text, 25, null), 23, 'is not closed'],
    ])('should report %s', (_name, change, line, message) => {
        expect(violations(change(README))).toContainEqual({
            line,
            message: expect.stringContaining(message),
        });
    });
});
