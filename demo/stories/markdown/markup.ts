export const markup = {
    heading: `
&nbsp;

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
`.trim(),

    blockquote: `
&nbsp;

## Blockquotes


> Blockquotes can also be nested...
>> ...by using additional greater-than signs right next to each other...
> > > ...or with spaces between arrows.
`.trim(),

    emphasis: `
&nbsp;

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
&nbsp;

## Horizontal Rules

___

---

***
`.trim(),

    lists: `
&nbsp;

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
&nbsp;

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
&nbsp;

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
&nbsp;

## Links

[link text](https://gravity-ui.com)

[link with title](https://gravity-ui.com/libraries "title text!")

Autoconverted link https://gravity-ui.com/components (linkify must be enabled)
`.trim(),

    images: `
&nbsp;

## Images

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg "The Stormtroopocat")

![Dojocat](https://octodex.github.com/images/dojocat.jpg "The Dojocat")
`.trim(),

    subAndSub: `
&nbsp;

## Subscript & Superscript (additional feature)

- 19^th^
- H~2~O
`.trim(),

    emojis: `
&nbsp;

## Emojis (additional feature)

:wink: :cry: :laughing: :yum:
`.trim(),

    deflist: `
&nbsp;

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
