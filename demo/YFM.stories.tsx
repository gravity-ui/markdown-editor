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

TextMarks.args = args;
YfmNote.args = args;
YfmNote.storyName = 'YFM Note';
YfmCut.args = args;
YfmCut.storyName = 'YFM Cut';
YfmTabs.args = args;
YfmTabs.storyName = 'YFM Tabs';
YfmFile.args = args;
YfmFile.storyName = 'YFM File';
YfmTable.args = args;
YfmTable.storyName = 'YFM Table';
Tasklist.args = args;
LaTeXFormulas.args = args;
LaTeXFormulas.storyName = 'LaTeX Formulas';
MermaidDiagram.args = args;
