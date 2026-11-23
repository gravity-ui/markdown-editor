##### Spec / About

# About the specifications

A specification defines the Markdown syntax of an extension and the HTML that the extension renders from it. The specifications follow the layout of the [CommonMark Spec](https://spec.commonmark.org/0.31.2/).

## Reading a specification

### Sections

The sections are numbered. A section states a rule and then shows it in examples: the main case first, then the variants, then the limits of the rule. Terms are defined once, in the chapter _Preliminaries_, and the text links to them.

### Examples

An example has a number and an anchor, such as `#example-1`. The left column holds Markdown, the right column holds the HTML that the extension renders from it. The `→` character stands for a tab.

```````````````````````````````` example
Plain text
.
<p>Plain text</p>
````````````````````````````````

The section _About this document_ of each specification names the renderer that produces the HTML of its examples.

## Writing a specification

A specification is a page in `docs/` that starts with the line `##### Spec / <Name>`. An example is a fenced block with the info string `example`: Markdown, a line with a single `.`, and HTML.

~~~markdown
```````````````````````````````` example
Plain text
.
<p>Plain text</p>
````````````````````````````````
~~~

The documentation build numbers the `##` and `###` headings and the examples and gives each of them an anchor. The anchor of a heading is its text in lowercase with other characters replaced by `-`, or the `{#anchor}` at the end of the heading.

The agent skill [`markup-spec`](https://github.com/gravity-ui/markdown-editor/blob/main/infra/docs-gen/skills/markup-spec/SKILL.md) writes the specification of an extension in this format.
