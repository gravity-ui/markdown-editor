import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

export default {
    title: 'Markdown Editor / YFM examples',
} as Meta;

const markup = {
    textMarks: `
## YFM text marks

##Monospaced text##
`.trim(),

    yfmNotes: `
## YFM Notes

{% note info %}

This is info.

{% endnote %}

{% note tip %}

This is a tip.

{% endnote %}

{% note warning %}

This is a warning.

{% endnote %}

{% note alert %}

This is an alert.

{% endnote %}


`.trim(),

    yfmCut: `
## YFM Cut

{% cut "Cut header" %}

Content displayed when clicked.

{% endcut %}
`.trim(),

    yfmTabs: `
## YFM Tabs

{% list tabs %}

- The name of tab1

  The text of tab1.

  * You can use lists.
  * And **other** markup.

- The name of tab2

  The text of tab2.

{% endlist %}
`.trim(),

    yfmHtml: `
Обычный текст

## Далее идет YFM HTML

::: html

<h1>Туристический санитарный и ветеринарный контроль в XXI веке</h1>
<p>Как следует из рассмотренного выше частного случая, наводнение известно. На завтрак англичане предпочитают овсяную кашу и кукурузные хлопья, тем не менее начальное условие движения совершает интеграл от переменной величины. Бамбук, при том, что королевские полномочия находятся в руках исполнительной власти - кабинета министров, однородно переворачивает вулканизм. Независимое государство, особенно в верхах разреза, совершает пегматитовый кварцит.</p>
<p>Большая часть территории участвует в погрешности определения курса меньше, чем силл. Штопор вразнобой поступает в цокольный музей под открытым небом, что имеет простой и очевидный физический смысл. Маховик, согласно третьему закону Ньютона, локально слагает распространенный систематический уход, а к мясу подают подливку, запеченные овощи и пикули.</p>
<p>Комбинированный тур смещает подземный сток. Деградация мерзлоты горизонтально просветляет четвертичный крен. Побережье, с учетом региональных факторов, вразнобой смещает объект. Угол крена точно переворачивает пингвин.</p>

:::

Снова обычный текст

## Далее идет YFM HTML

::: html

<style>
.container {
    display: flex;
    margin: 20px;
}
.main {
    flex: 2;
    padding: 20px;
}
.main p, .main ul {
    color: var(--yfm-html-color-text-primary);
}

.main ul {
    list-style-type: disc;
    margin-left: 20px;
}

aside {
    flex: 1;
    padding: 20px;
    background-color: var(--yfm-html-color-background-secondary);
}

aside blockquote {
    font-style: italic;
    color: var(--yfm-html-color-text-secondary);
    border-left: 4px solid var(--yfm-html-color-text-secondary);
    padding-left: 10px;
}

.info-block {
    margin-top: 20px;
}

.info-block h3 {
    color: var(--yfm-html-color-text-primary);
}

.info-block ul {
    list-style-type: circle;
    margin-left: 20px;
}

a {
    color: var(--yfm-html-color-link);
    text-decoration: none;
}

a:hover {
    color: var(--yfm-html-color-link-hover);
}

a:visited {
    color: var(--yfm-html-color-link-visited);
}

</style>

    <header>
        <h1>Understanding HTML: The Backbone of Web Development</h1>
    </header>

    <div class="container">
        <div class="main">
            <p>HTML, or HyperText Markup Language, is the standard language used to create web pages. It allows developers to structure content and make it accessible and attractive to users.</p>

            <p>HTML was first developed by Tim Berners-Lee in 1991, and since then, it has gone through numerous iterations to become the versatile tool it is today. One of the core tenets of HTML is its simplicity and accessibility. By using a series of tags, you can define various elements on a webpage, such as headings, paragraphs, links, images, and more.</p>

            <p>HTML documents are plain text files that can be created and edited with any text editor. When opened in a web browser, the HTML code is parsed and rendered to display the structured content. This is achieved through the use of various HTML elements, each represented by tags.</p>

            <p>Some of the most commonly used HTML tags include:</p>
            <ul>
                <li><strong>&lt;h1&gt; to &lt;h6&gt;</strong> – Define headings.</li>
                <li><strong>&lt;p&gt;</strong> – Defines a paragraph.</li>
                <li><strong>&lt;a&gt;</strong> – Defines a hyperlink.</li>
                <li><strong>&lt;img&gt;</strong> – Embeds an image.</li>
                <li><strong>&lt;div&gt;</strong> – Defines a division or a section in a document.</li>
            </ul>

            <p>HTML also supports multimedia, allowing you to embed videos, audio, and interactive content. Modern HTML (HTML5) introduces several new elements and APIs to enhance functionality, making it easier for developers to create rich, interactive web experiences.</p>

            <p>In conclusion, understanding HTML is fundamental for web development. Its role in structuring and presenting content on the web is indispensable. Whether you are a beginner or a seasoned developer, mastering HTML opens the door to creating engaging and effective web pages.</p>
        </div>

        <aside>
            <blockquote>
                "HTML is the skeleton of the web, essential and foundational. Every web page owes its structure to HTML."
            </blockquote>

            <div class="info-block">
                <h3>Quick Facts:</h3>
                <ul>
                    <li>Released in 1991 by Tim Berners-Lee.</li>
                    <li>The latest version is HTML5.</li>
                    <li>HTML stands for HyperText Markup Language.</li>
                </ul>
            </div>
        </aside>
    </div>


:::

`.trim(),

    yfmFile: `
## YFM File

File: {% file src="data:text/plain;base64,Cg==" name="empty.txt" %}
`.trim(),

    yfmTable: `
## YFM Table

### Simple table

#|
|| **Header1** | **Header2** ||
|| Text | Text ||
|#

### Multiline content

#|
||Text
on two lines
|
- Potatoes
- Carrot
- Onion
- Cucumber||
|#

### Nested tables

#|
|| 1
|

Text before other table

#|
|| 5
| 6||
|| 7
| 8||
|#

Text after other table||
|| 3
| 4||
|#
`.trim(),

    tasklist: `
## Task lists (additional feature)

- [x] ~~Write the press release~~
- [ ] Update the website
- [ ] Contact the media
`.trim(),

    latexFormulas: `
## LaTeX Formulas (optional feature)

Inline formula: $\\sqrt{3x-1}+(1+x)^2$

Block formula:

$$
f(\\relax{x}) = \\int_{-\\infty}^\\infty
    \\hat f(\\xi)\\,e^{2 \\pi i \\xi x}
    \\,d\\xi
$$
`.trim(),

    mermaidDiagram: `
## Mermaid diagram (optional feature)

\`\`\`mermaid
sequenceDiagram
	Alice->>Bob: Hi Bob
	Bob->>Alice: Hi Alice
\`\`\`
`.trim(),
};

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
>;

const args: Partial<PlaygroundStoryProps> = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
};

export const TextMarks: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.textMarks} />
);

export const Tasklist: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.tasklist} />
);

export const YfmNote: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmNotes} />
);

export const YfmCut: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmCut} />
);

export const YfmTabs: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmTabs} />
);

export const YfmHtml: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmHtml} sanitizeHtml={false} />
);

export const YfmFile: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmFile} />
);

export const YfmTable: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.yfmTable} />
);

export const LaTeXFormulas: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.latexFormulas} />
);

export const MermaidDiagram: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.mermaidDiagram} />
);

TextMarks.storyName = 'Text';
TextMarks.args = args;
YfmNote.storyName = 'YFM Note';
YfmNote.args = args;
YfmCut.storyName = 'YFM Cut';
YfmCut.args = args;
YfmTabs.storyName = 'YFM Tabs';
YfmTabs.args = args;
YfmHtml.storyName = 'YFM HTML';
YfmHtml.args = args;
YfmFile.storyName = 'YFM File';
YfmFile.args = args;
YfmTable.storyName = 'YFM Table';
YfmTable.args = args;
Tasklist.storyName = 'Task list';
Tasklist.args = args;
LaTeXFormulas.storyName = 'LaTeX Formulas';
LaTeXFormulas.args = args;
MermaidDiagram.storyName = 'Mermaid diagram';
MermaidDiagram.args = args;
