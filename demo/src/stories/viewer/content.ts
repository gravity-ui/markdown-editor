import dd from 'ts-dedent';

import {galleryMarkup} from '../view/gallery/markup';
import {markup} from '../yfm/content';

const introduction = dd`
    # MarkdownViewer playground

    One document, three versions. Open a few sections, then switch versions to keep reading with the same sections expanded.

    Sections keep their open or closed state when their title or position changes. Heading help marks preserve opening counts by ID across versions. Hide feedback to see its fallback text.
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

const formulas = dd`
    ## Formulas

    An inline formula $a^2 + b^2 = c^2$ stays in the text.

    $$
    c = \\sqrt{a^2 + b^2}
    $$
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

const feedback = dd`
    ## React feedback

    This block is rendered by a React extension inside a prepared host. Hide feedback to restore its fallback.

    <section data-demo-block-container>
    <p data-demo-block-fallback>Feedback is unavailable.</p>
    <div data-demo-block-id="feedback"></div>
    </section>
`;

export const documents = [
    {
        label: 'Version 1',
        source: [
            introduction,
            readingGuide,
            codeExample,
            reference,
            formulas,
            markup.yfmPageConstructor,
            markup.mermaidDiagram,
            feedback,
        ].join('\n\n'),
    },
    {
        label: 'Version 2',
        source: [
            introduction,
            reference,
            updatedReadingGuide,
            codeExample,
            formulas,
            markup.yfmPageConstructor,
            markup.mermaidDiagram,
            feedback,
        ].join('\n\n'),
    },
    {
        label: 'Version 3',
        source: [introduction, codeExample, reference, nextSteps, feedback].join('\n\n'),
    },
];

export const latexDocuments = [
    {label: 'Formulas', source: formulas},
    {label: 'Updated formulas', source: '## Formulas\n\nThe new formula is $E = mc^2$.'},
    {label: 'Plain text', source: '## Plain text\n\nThis document has no formulas.'},
    {
        label: 'Invalid formulas',
        source: dd`
            ## Invalid formulas

            An invalid inline formula $\\frac{$ stays visible with an error color.

            $$
            \\sqrt{
            $$
        `,
    },
];

export const pageConstructorDocuments = [
    {label: 'Page Constructor', source: markup.yfmPageConstructor},
    {
        label: 'Updated block',
        source: markup.yfmPageConstructor.replace("title: 'Title'", "title: 'Updated title'"),
    },
    {label: 'Plain text', source: '## Plain text\n\nThis document has no Page Constructor blocks.'},
];

export const mermaidDocuments = [
    {label: 'Diagram', source: markup.mermaidDiagram},
    {label: 'Updated diagram', source: markup.mermaidDiagram.replaceAll('Alice', 'Carol')},
    {label: 'Plain text', source: '## Plain text\n\nThis document has no diagrams.'},
    {label: 'Invalid diagram', source: '```mermaid\nnot a diagram\n```'},
];

const codeBlockIntroduction = dd`
    # Code block actions

    Copy code without line numbers, or turn wrapping on and off for a long line. Switch versions to attach the actions to new code blocks.
`;

export const codeBlockDocuments = [
    {
        label: 'Version 1',
        source: dd`
            ${codeBlockIntroduction}

            ~~~ts showLineNumbers
            const language = 'TypeScript';
            console.log(language, 'This long line shows how code wrapping keeps a complete example readable inside a narrow document without changing the text copied to the clipboard.');
            ~~~
        `,
    },
    {
        label: 'Version 2',
        source: dd`
            ${codeBlockIntroduction}

            ~~~ts showLineNumbers
            const version = 2;
            console.log(version, 'The HTML now contains a different code block. Copy this version to check that the actions use its current text and turn wrapping on to read this long line.');
            ~~~

            ~~~sh
            echo 'Code without line numbers also supports copy and wrapping.'
            ~~~
        `,
    },
    {
        label: 'Version 3',
        source: dd`
            ${codeBlockIntroduction}

            ## Legacy YFM markup

            <div class="yfm-clipboard">
            <pre><code>const legacy = true;
            console.log(legacy, 'Legacy code blocks use the same copy and wrap actions. This line is long enough to show the difference when wrapping is enabled.');</code></pre>
            <button class="yfm-clipboard-button" type="button">Copy</button>
            </div>
        `,
    },
];

export const galleryCustomFile = {
    url: 'https://raw.githubusercontent.com/gravity-ui/markdown-editor/main/README.md',
    name: 'README.md',
    mimetype: 'text/markdown',
    preview: 'This Markdown file uses a custom preview from the application.',
};

export const galleryDocuments = [
    {
        label: 'Files gallery',
        source: dd`
            # Files gallery

            Open an image or file, use the arrow keys to browse, then press Escape to return. Copy and download actions use URLs from the application.

            ${galleryMarkup}

            ## Custom file preview

            The application can render other file types with its own resolver.

            {% file src="${galleryCustomFile.url}" name="${galleryCustomFile.name}" type="${galleryCustomFile.mimetype}" %}

            ## Ordinary links

            These links open the documentation in a new tab.

            <a href="https://gravity-ui.github.io/markdown-editor/" target="_blank" rel="noopener noreferrer">Markdown Editor documentation</a>

            <a href="https://gravity-ui.github.io/markdown-editor/" target="_blank" rel="noopener noreferrer"><img src="https://octodex.github.com/images/minion.png" alt="Linked Minion" width="80"></a>
        `,
    },
];
