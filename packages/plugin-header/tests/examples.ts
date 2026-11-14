// The shared parts of the syntax examples: their ids, their markup and their generated tables.
// Every block test imports them and keeps only its own expected HTML.

/** The id of the example at the index of a section: `title-001`. */
export const exampleId = (prefix: string, index: number) =>
    `${prefix}-${String(index + 1).padStart(3, '0')}`;

/** The shape of the syntax examples: every block stands after an empty line of a header. */
export const example = (attrs: string, ...blocks: string[]) =>
    `:::header${attrs && `{${attrs}}`}\n${blocks.map((block) => `\n${block}\n`).join('')}:::`;

/** The opening tag of a header with default attributes. */
export const defaultHeaderTag =
    '<div class="g-md-header-plugin g-md-header-plugin_height_s g-md-header-plugin_width_m" data-height="s" data-width="m">';
/** A header with default attributes around the rendered content. */
export const header = (content: string) =>
    `${defaultHeaderTag}${content && `\n${content}`}</div>\n`;

export const exampleImageUrl = 'https://example.org/banner.jpg';
export const exampleImage = `::header-image{src="${exampleImageUrl}" alt="Team"}`;
export const exampleTitle = '::header-title[Team portal]';
export const exampleContent = ':::header-content\nPortal description.\n:::';
export const exampleButtons = [
    ':button[Button 1]{href="/page" view="action" color="blue"}',
    ':button[Button 2]{href="/page" view="normal" color="gray"}',
    ':button[Button 3]{href="/page" view="flat" color="standard"}',
];

type CompositionExample = {
    id: string;
    image: boolean;
    title: boolean;
    content: boolean;
    buttons: number;
};

const compositions = (prefix: string, buttonCounts: number[]): CompositionExample[] =>
    [false, true]
        .flatMap((image) =>
            [false, true].flatMap((title) =>
                [false, true].flatMap((content) =>
                    buttonCounts.map((buttons) => ({image, title, content, buttons})),
                ),
            ),
        )
        .map((item, index) => ({id: exampleId(prefix, index), ...item}));

// structure-001 … structure-032: the image, the title, the description and 0–3 buttons.
export const structureExamples = compositions('structure', [0, 1, 2, 3]);

/** The markup of a structure example in the default header. */
export const structureMarkup = ({image, title, content, buttons}: CompositionExample) =>
    example(
        '',
        ...(image ? [exampleImage] : []),
        ...(title ? [exampleTitle] : []),
        ...(content ? [exampleContent] : []),
        ...exampleButtons.slice(0, buttons),
    );

// mixed-001 … mixed-016: the centered header, then the same with an image beside the text
// and the right alignment; the title, the description and 0 or 3 buttons.
export const mixedExamples = compositions('mixed', [0, 3]);

/** The alignment of a mixed example: right beside an image, centered without one. */
export const mixedAlign = ({image}: CompositionExample) => (image ? 'right' : 'center');
export const mixedAttrs = (align: string) =>
    `height="l" width="full" align="${align}" vertical="bottom" bg-color="violet-light" bg-image="${exampleImageUrl}" bg-image-theme="dark" bg-image-blur="true"`;
export const mixedTitle = '::header-title[Team portal]{size="1" color="yellow"}';
export const mixedContent = ':::header-content{size="3"}\nPortal description.\n:::';

/** The markup of a mixed example in the header with every attribute. */
export const mixedMarkup = (item: CompositionExample) =>
    example(
        mixedAttrs(mixedAlign(item)),
        ...(item.image ? [exampleImage] : []),
        ...(item.title ? [mixedTitle] : []),
        ...(item.content ? [mixedContent] : []),
        ...exampleButtons.slice(0, item.buttons),
    );
