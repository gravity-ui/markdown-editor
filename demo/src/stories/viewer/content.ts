import dd from 'ts-dedent';

const introduction = dd`
    # MarkdownViewer playground

    One document, three versions. Open a few sections, then switch versions to keep reading with the same sections expanded.
`;

const readingGuide = dd`
    ## Text and structure

    {% cut "Reading guide" %}{#cut-reading-guide}

    A document can combine **important details**, *short explanations*, and links to the [Markdown Editor documentation](https://gravity-ui.github.io/markdown-editor/).

    > The application prepares the HTML. MarkdownViewer displays it and gives React extensions access to its content.

    {% endcut %}
`;

const updatedReadingGuide = dd`
    ## Text and structure

    {% cut "Reading and navigation" %}{#cut-reading-guide}

    The section has a new title and updated content, but keeps its original ID.

    A useful document should be easy to:

    1. Read and navigate.
    2. Update without losing your place.
    3. Extend with new types of content.

    {% endcut %}
`;

const codeExample = dd`
    ## Code examples

    {% cut "Rendering example" %}{#cut-code-example}

    ~~~ts
    import transform from '@diplodoc/transform';
    import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';

    const {html} = transform(source).result;

    <MarkdownViewer html={html} className={cnYFM()} />;
    ~~~

    {% endcut %}
`;

const reference = dd`
    ## Structured data

    {% cut "Content reference" %}{#cut-content-reference}

    | Content | Example |
    | --- | --- |
    | Text | Headings, paragraphs, and lists |
    | Data | A small table |
    | Code | A TypeScript example |

    {% endcut %}
`;

const nextSteps = dd`
    ## Next steps

    {% cut "Extending the document" %}{#cut-next-steps}

    This section first appears in version 3. The reading guide is absent from this version and returns when you select version 1 or 2.

    - Existing sections keep their open or closed state.
    - New sections use their initial state.
    - Returning sections restore the state you left them in.

    {% endcut %}
`;

export const documents = [
    {
        label: 'Version 1',
        source: [introduction, readingGuide, codeExample, reference].join('\n\n'),
    },
    {
        label: 'Version 2',
        source: [introduction, reference, updatedReadingGuide, codeExample].join('\n\n'),
    },
    {
        label: 'Version 3',
        source: [introduction, codeExample, reference, nextSteps].join('\n\n'),
    },
];
