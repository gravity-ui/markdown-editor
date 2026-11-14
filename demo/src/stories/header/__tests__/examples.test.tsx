import {describe, expect, it} from 'vitest';

import {
    filteringSectionTitle,
    markupExamplesDocument,
    parseMarkupExamples,
    selectMarkupExamples,
    withLocalImages,
} from '../examples';
import {markupSections} from '../sections';

const markupExamples = markupSections.flatMap(({examples}) => examples);
const markupExamplesOf = (prefix: string, first?: number, last?: number) =>
    selectMarkupExamples(markupSections, prefix, first, last);

describe('Header syntax examples', () => {
    it.each([
        ['Block composition', 32],
        ['Sizes and alignment', 108],
        ['Backgrounds', 171],
        ['Title size and color', 63],
        ['Description size and paragraphs', 14],
        ['Image attributes', 15],
        ['Button styles and target', 125],
        ['Button URLs', 25],
        ['Defaults and empty values', 12],
        ['Links and nested formatting in the description', 78],
        ['Combined examples', 16],
        ['Unsupported input and normalization', 8],
        [filteringSectionTitle, 6],
    ])('should read the section %j with %i examples', (title, count) => {
        expect(markupSections.find((section) => section.title === title)?.examples).toHaveLength(
            count,
        );
    });

    it('should read every example once', () => {
        const ids = markupExamples.map(({id}) => id);
        expect(ids).toHaveLength(673);
        expect(new Set(ids).size).toBe(673);
        expect(markupSections).toHaveLength(13);
        expect(markupSections.every(({description}) => description)).toBe(true);
    });

    it('should read the id, the title and the markup of an example', () => {
        expect(
            parseMarkupExamples(
                'Intro\n\n## Section\n\nAbout.\n\n### case-001 — First · A: b\n\n```markdown\n:::header\n\n:button[One]\n:::\n```\n\n### case-002 — Second\n\n```markdown\ntext\n```\n',
            ),
        ).toEqual([
            {
                title: 'Section',
                description: 'About.',
                examples: [
                    {
                        id: 'case-001',
                        title: 'First · A: b',
                        markup: ':::header\n\n:button[One]\n:::',
                    },
                    {id: 'case-002', title: 'Second', markup: 'text'},
                ],
            },
        ]);
    });

    it.each([
        ['button', 1, Infinity, 125, 'button-001', 'button-125'],
        ['button', 26, 50, 25, 'button-026', 'button-050'],
        ['link', 1, Infinity, 25, 'link-001', 'link-025'],
        ['boundaries', 9, 13, 5, 'boundaries-009', 'boundaries-013'],
        ['layout', 1, Infinity, 108, 'layout-001', 'layout-108'],
        ['layout', 28, 36, 9, 'layout-028', 'layout-036'],
        ['background', 10, 36, 27, 'background-010', 'background-036'],
        ['mixed', 9, 16, 8, 'mixed-009', 'mixed-016'],
    ])('should select the examples %s %i–%d', (prefix, first, last, count, firstId, lastId) => {
        const examples = markupExamplesOf(prefix, first, last);
        expect(examples).toHaveLength(count);
        expect(examples[0].id).toBe(firstId);
        expect(examples[count - 1].id).toBe(lastId);
    });

    it.each([
        [
            ':::header{bg-image="https://example.org/banner.jpg"}',
            ':::header{bg-image="/assets/test-image.jpg"}',
        ],
        [
            '::header-image{src="http://example.org/image.jpg" alt="A"}',
            '::header-image{src="/assets/test-image.jpg" alt="A"}',
        ],
        [
            ':button[Docs]{href="https://example.org/docs"}',
            ':button[Docs]{href="https://example.org/docs"}',
        ],
    ])('should replace the image address of %j', (markup, result) => {
        expect(withLocalImages(markup)).toBe(result);
    });

    it('should join the examples into a document with their names and local images', () => {
        expect(
            markupExamplesDocument([
                {id: 'case-001', title: 'First', markup: ':::header\n:::'},
                {
                    id: 'case-002',
                    title: 'Second',
                    markup: ':::header{bg-image="https://example.org/banner.jpg"}\n:::',
                },
            ]),
        ).toBe(
            'case-001 — First\n\n:::header\n:::\n\ncase-002 — Second\n\n:::header{bg-image="/assets/test-image.jpg"}\n:::',
        );
    });

    it('should join the examples with the given local image', () => {
        expect(
            markupExamplesDocument(
                [
                    {
                        id: 'case-001',
                        title: 'First',
                        markup: ':::header{bg-image="https://example.org/banner.jpg"}\n:::',
                    },
                ],
                '/assets/header-bg-light.svg',
            ),
        ).toBe('case-001 — First\n\n:::header{bg-image="/assets/header-bg-light.svg"}\n:::');
    });

    it('should keep no image of the examples on the network', () => {
        const images = markupExamples.flatMap(
            ({markup}) => withLocalImages(markup).match(/(?:bg-image|src)="[^"]*"/g) ?? [],
        );
        expect(images.length).toBeGreaterThan(200);
        expect(new Set(images)).toEqual(
            new Set(['bg-image="/assets/test-image.jpg"', 'src="/assets/test-image.jpg"']),
        );
    });
});
