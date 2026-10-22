import dd from 'ts-dedent';

import {galleryMarkup} from '../view/gallery/markup';
import {markup} from '../yfm/content';

const introduction = dd`
    # MarkdownViewer playground

    Open sections, then switch versions. Sections keep their state when they move or return.

    Use heading help to check its state across versions. Hide feedback to see its fallback text.
`;

export const headingDocuments = [
    {
        label: 'Headings',
        source: dd`
            - # Heading 1

            - ## Heading 2

            - ### Heading 3

            - #### Heading 4

            - ##### Heading 5

            - ###### Heading 6
        `,
    },
    {
        label: 'Folding headings',
        source: dd`
            - #+ Heading 1

              Section 1.

            - ##+ Heading 2

              Section 2.

            - ###+ Heading 3

              Section 3.

            - ####+ Heading 4

              Section 4.

            - #####+ Heading 5

              Section 5.

            - ######+ Heading 6

              Section 6.
        `,
    },
    {
        label: 'Backgrounds',
        source: dd`
            This example sets \`--g-md-heading-anchor-background-color\` in the demo CSS for the note and table cell.
            Background colors are not detected automatically.

            {% note info %}

            - ### Heading in a note

            {% endnote %}

            #|
            ||::{bg="green-light"}

            - ### Heading in a table

            ||
            |#
        `,
    },
];

const codeExample = dd`
    {% cut "Code actions" %}{#cut-code-example}

    ~~~ts
    import transform from '@diplodoc/transform';
    import {MarkdownViewer, cnYFM} from '@gravity-ui/markdown-viewer';

    const {html} = transform(source).result;

    <MarkdownViewer html={html} className={cnYFM()} />;
    ~~~

    {% endcut %}
`;

const formulas = dd`
    An inline formula $a^2 + b^2 = c^2$ stays in the text.

    $$
    c = \\sqrt{a^2 + b^2}
    $$
`;

const latex = dd`
    {% cut "LaTeX" %}{#cut-latex}

    ${formulas}

    {% endcut %}
`;

const mermaid = dd`
    {% cut "Mermaid" %}{#cut-mermaid}

    ${markup.mermaidDiagram.slice(markup.mermaidDiagram.indexOf('```mermaid'))}

    {% endcut %}
`;

const pageConstructor = dd`
    {% cut "Page Constructor" %}{#cut-page-constructor}

    ${markup.yfmPageConstructor.slice(markup.yfmPageConstructor.indexOf('::: page-constructor'))}

    {% endcut %}
`;

const shortHtmlBlock = `${markup.yfmHtmlBlock.split('</p>', 1)[0]}</p>\n\n:::`;

const htmlBlocks = dd`
    {% cut "HTML blocks" %}{#cut-html-blocks}

    ${shortHtmlBlock.slice(shortHtmlBlock.indexOf('::: html'))}

    {% endcut %}
`;

const feedback = dd`
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
            latex,
            mermaid,
            pageConstructor,
            htmlBlocks,
            codeExample,
            feedback,
        ].join('\n\n'),
    },
    {
        label: 'Version 2',
        source: [introduction, htmlBlocks, codeExample, pageConstructor, feedback].join('\n\n'),
    },
    {
        label: 'Version 3',
        source: [introduction, mermaid, codeExample, latex, feedback].join('\n\n'),
    },
];

export const latexDocuments = [
    {label: 'Formulas', source: `## Formulas\n\n${formulas}`},
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

export const htmlDocuments = [
    {label: 'HTML blocks', source: shortHtmlBlock},
    {
        label: 'Updated block',
        source: shortHtmlBlock.replace('Duis faucibus dignissim posuere', 'Updated HTML block'),
    },
    {label: 'Plain text', source: '## Plain text\n\nThis document has no HTML blocks.'},
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
