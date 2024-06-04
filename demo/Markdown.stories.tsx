import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

export default {
    title: 'Markdown Editor / Markdown examples',
} as Meta;

const markup = {
    heading: `
# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
`.trim(),

    blockquote: `
## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.
`.trim(),

    emphasis: `
## Emphasis

**This is bold text**

__This is bold text__

*This is italic text*

_This is italic text_

~~Strikethrough~~

### Additional:

++Inserted text++

==Marked text==
`.trim(),

    horizontalRules: `
## Horizontal Rules

___

---

***
`.trim(),

    lists: `
## Lists

Unordered

+ Create a list by starting a line with \`+\`, \`-\`, or \`*\`
+ Sub-lists are made by indenting 2 spaces:
    - Marker character change forces new list start:
    * Ac tristique libero volutpat at
    + Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
+ Very easy!

Ordered

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa


1. You can use sequential numbers...
1. ...or keep all the numbers as \`1.\`

Start numbering with offset:

57. foo
1. bar
`.trim(),

    code: `
## Code

Inline \`code\`

Indented code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code


Block code "fences"

\`\`\`
Sample text here...
\`\`\`

Syntax highlighting

\`\`\` js
var foo = function (bar) {
    return bar++;
};

console.log(foo(5));
\`\`\`
`.trim(),

    tables: `
## Tables

| Option | Description |
| ------ | ----------- |
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |

Right aligned columns

| Option | Description |
| ------:| -----------:|
| data   | path to data files to supply the data that will be passed into templates. |
| engine | engine to be used for processing templates. Handlebars is the default. |
| ext    | extension to be used for dest files. |
`.trim(),

    links: `
## Links

[link text](https://gravity-ui.com)

[link with title](https://gravity-ui.com/libraries "title text!")

Autoconverted link https://gravity-ui.com/components (linkify must be enabled)
`.trim(),

    images: `
## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

![Dojocat](https://octodex.github.com/images/dojocat.jpg "The Dojocat")
`.trim(),

    subAndSub: `
## Subscript & Superscript (additional feature)

- 19^th^
- H~2~O    
`.trim(),

    emojies: `
## Emojies (additional feature)

:wink: :cry: :laughing: :yum:
`.trim(),

    deflist: `
## Definition list (additional feature)

Term 1

:   Definition 1
with lazy continuation.

Term 2 with **inline markup**

:   Definition 2

        { some code, part of Definition 2 }

    Third paragraph of definition 2.
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

export const Heading: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.heading} />
);

export const Blockquote: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.blockquote} />
);

export const Emphasis: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.emphasis} />
);

export const HorizontalRules: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.horizontalRules} />
);

export const Lists: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.lists} />
);

export const Code: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.code} />
);

export const Tables: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.tables} />
);

export const Links: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.links} />
);

export const Images: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.images} />
);

export const SubSup: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.subAndSub} />
);

export const Emojies: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.emojies} />
);

export const DefinitionList: StoryFn<PlaygroundStoryProps> = (props) => (
    <PlaygroundComponent {...props} initial={markup.deflist} />
);

Heading.args = args;
Blockquote.args = args;
Emphasis.args = args;
HorizontalRules.args = args;
Lists.args = args;
Code.args = args;
Tables.args = args;
Links.args = args;
Images.args = args;
SubSup.args = args;
SubSup.storyName = 'Subscript & Superscript';
Emojies.args = args;
DefinitionList.args = args;
