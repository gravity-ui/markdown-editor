export type MarkupExample = {
    /** `button-001` */
    id: string;
    title: string;
    markup: string;
};

export type MarkupSection = {
    title: string;
    description: string;
    examples: readonly MarkupExample[];
};

const EXAMPLE_RE = /^### (\S+) — (.+)\n+```markdown\n([\s\S]*?)\n```$/gm;

/**
 * Reads the document of syntax examples: `##` is a section with a description,
 * `### id — title` with a `markdown` code block is an example.
 */
export function parseMarkupExamples(document: string): MarkupSection[] {
    return document
        .split(/^## /m)
        .slice(1)
        .map((part) => {
            const [title, ...rest] = part.split('\n');
            const body = rest.join('\n');
            return {
                title: title.trim(),
                description: body.split(/^### /m)[0].trim(),
                examples: Array.from(body.matchAll(EXAMPLE_RE), ([, id, name, markup]) => ({
                    id,
                    title: name.trim(),
                    markup,
                })),
            };
        });
}

const NORMALIZATION_SECTION = 'Unsupported input and normalization';

/** Dropping blocks by their place or number is not implemented; these examples render as written. */
const filteringExampleIds: readonly string[] = [
    'boundaries-001',
    'boundaries-002',
    'boundaries-003',
    'boundaries-004',
    'boundaries-005',
    'boundaries-006',
];

export const filteringSectionTitle = 'Filtering (not implemented, rendered as written)';

/** The sections of the document; the filtering examples are moved to a section of their own. */
export function readMarkupSections(document: string): MarkupSection[] {
    return parseMarkupExamples(document).flatMap((section) => {
        if (section.title !== NORMALIZATION_SECTION) return [section];
        const isFiltering = ({id}: MarkupExample) => filteringExampleIds.includes(id);
        return [
            {...section, examples: section.examples.filter((example) => !isFiltering(example))},
            {
                title: filteringSectionTitle,
                description:
                    'Blocks outside a header, a fourth button and a second title are meant to be dropped. Filtering is a separate task, so here every block is rendered where it is written.',
                examples: section.examples.filter(isFiltering),
            },
        ];
    });
}

/** Examples by the prefix of their id and their numbers, `first` to `last` inclusive. */
export const selectMarkupExamples = (
    sections: readonly MarkupSection[],
    prefix: string,
    first = 1,
    last = Infinity,
) =>
    sections
        .flatMap(({examples}) => examples)
        .filter(({id}) => {
            const [name, number] = id.split(/-(?=\d+$)/);
            return name === prefix && Number(number) >= first && Number(number) <= last;
        });

const EXAMPLE_IMAGE_RE = /https?:\/\/example\.org\/[\w./-]+\.(?:jpe?g|png|gif|webp)/g;

const HEADER_IMAGE_RE = /^::header-image\{.*$/gm;

/** The local images of the examples: `bgImage` for the backgrounds, `image` for the images beside the text. */
export type LocalImages = {
    bgImage?: string;
    image?: string;
};

const DEFAULT_LOCAL_IMAGE = '/assets/test-image.jpg';

/**
 * The addresses of the examples do not exist; a local image of the demo assets loads without
 * a network. The images beside the text take `image`, the backgrounds take `bgImage`.
 */
export const withLocalImages = (
    markup: string,
    {bgImage = DEFAULT_LOCAL_IMAGE, image = bgImage}: LocalImages = {},
) =>
    markup
        .replace(HEADER_IMAGE_RE, (line) => line.replace(EXAMPLE_IMAGE_RE, image))
        .replace(EXAMPLE_IMAGE_RE, bgImage);

/** One document of several examples: the name of each example, then its markup. */
export const markupExamplesDocument = (examples: readonly MarkupExample[], images?: LocalImages) =>
    examples
        .map(({id, title, markup}) => `${id} — ${title}\n\n${withLocalImages(markup, images)}`)
        .join('\n\n');
