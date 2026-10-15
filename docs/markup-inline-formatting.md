##### Getting started / Inline formatting

## Inline formatting in markup mode

Structural inline formatting uses the CodeMirror Markdown tree to choose where to
add or remove markers. It keeps block markers, such as list prefixes, outside the
formatted text. The feature affects markup mode only.

### Enable the feature

The feature is disabled by default. Enable it when you create the editor:

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';

const editor = useMarkdownEditor({
  initial: {mode: 'markup'},
  experimental: {
    structuralInlineFormatting: true,
  },
});
```

Without this flag, inline commands use the previous algorithm. This includes the
old inline code wrapping behavior and undo grouping. The rules below apply when
the flag is enabled.

The flag is read when the editor is created. To change it at runtime, add it to
the dependency list of `useMarkdownEditor`. This creates a new editor instance.

### Try it in the demo

Open **Experiments / Inline formatting** in the local demo. Use the
**Structural inline formatting** switch in **Controls** to compare both modes.
The story starts in markup mode with sample text and a preview. Changing the flag
keeps the current text, but resets the selection and undo history.

See the [story](../demo/src/stories/experiments/inline-formatting/InlineFormatting.stories.tsx)
and its [editor component](../demo/src/stories/experiments/inline-formatting/InlineFormatting.tsx).

### Format text blocks

Commands format paragraphs, headings, list items, task lists, and ordinary
Markdown table cells separately. They keep heading and list prefixes, checkboxes, and
table separators outside the new markers.

For example, select both list items and apply bold:

```md
- one
- two
```

Result:

```md
- **one**
- **two**
```

A single line break inside a paragraph or blockquote stays inside one marker pair.
Spaces at the edges stay outside the markers when the syntax requires it. Empty
selected parts are skipped.

### Keep directive source lines

When one selection covers more than one source line, commands skip these lines:

- A whole `{% ... %}` line.
- A line starting with `::`, including any directive name, arguments, or `:::`.

The check skips quote, list, and checkbox prefixes found in the CodeMirror tree,
then uses trimmed line text. It also protects directives inside nested quotes and
list items. The original prefixes, spaces, and line separators stay unchanged.
Text before, between, and after these lines is formatted separately, even without
blank lines. For example, bold changes this source:

```md
{% note info %}
text
{% endnote %}
```

Result:

```md
{% note info %}
**text**
{% endnote %}
```

Text inside recognized inline code, links, images, or HTML tags is not treated
as a directive line. These nodes keep their normal formatting rules.

A selection within one source line or an empty cursor still allows direct edits.
Selections fully inside code or a source field keep the literal editing rules.
This check protects directive lines; it does not parse the full YFM block structure.

### Add and remove text styles

The style commands support bold, italic, strikethrough, underline, monospace, and
highlight. A second command removes one selected layer of the same style.

If you select part of styled text, the command adds a nested style. For example,
select `two` in `**one two three**` and apply bold:

```md
**one **two** three**
```

If you select a whole styled node or all its content, the command removes one
layer. Select the whole example above and apply bold again:

```md
one **two** three
```

For a mixed selection, the command keeps complete styles that already match and
adds the missing ones. If all selected parts have that style, it removes one layer
from each part. A selection that crosses a style boundary is split at that
boundary to avoid overlapping markers.

With an empty cursor, the command inserts a marker pair and places the cursor
inside it. This also works inside the same style. Repeating the command inside an
empty pair removes it.

Italic uses `_` by default. It uses `*` when needed, for example inside a word:
`a*b*c`. The command can complete a simple missing marker, such as `**First` or
`First**`. It does not complete escaped markers or unclear marker groups.

Color and inline math use the same text ranges, but always add markers. They do
not toggle an existing color or math wrapper.

### Format links, images, and code

A whole link, image, or inline code node gets text styles outside its markup:

```md
**[link text](https://example.com)**
```

A partial link label gets styles inside the link:

```md
[link **text**](https://example.com)
```

Text style commands also allow direct edits in selections fully inside inline
code, link destinations or titles, image markup, and HTML attributes. In these
areas, the commands add or remove marker text. They do not apply a visual style.
An empty cursor inserts a pair; a second command inside an empty pair removes it.
Selections that cross only part of code or a source field skip that area.

If a selection crosses a code block boundary, commands skip the code and its
fences. For a non-empty selection fully inside one code block, text style commands
add or remove literal markers. Inline code, color, and inline math commands add
markers there. Blank lines split the selected text into separate parts. Code
spacing and indentation stay unchanged.

### Toggle inline code

Use `MarkupCommands.toggleInlineCode` in custom markup commands. It adds inline
code to plain text. It removes the code markers when a whole inline code node or
all its content is selected. It skips partial inline code selections.

For a mixed selection, it adds code to plain text and keeps existing inline code.
New code markers use a backtick run longer than any run in the content. The command
adds padding spaces when needed to keep backticks in the content.

`MarkupCommands.wrapToInlineCode` is a deprecated alias with the same behavior.
It is planned for removal in the next major release.

### Format bare URLs

With `md.linkify: true`, text style and color commands first put complete bare
URLs in autolinks (`<url>`) or explicit links (`[text](url)`). This keeps closing
style markers outside the URL.

For example, apply bold to `https://example.com/path`:

```md
**<https://example.com/path>**
```

Removing bold leaves `<https://example.com/path>`. Undoing both commands restores
the original bare URL. Inline math and inline code keep the selected URL as content.

A partial URL selection receives literal markers. This can change or break the
URL. The command handles only URL nodes found by CodeMirror; it does not use a
separate link matcher or support custom linkify rules. `md.linkify` is `false`
by default.

### Selection and undo

Commands keep the selection direction, multiple ranges, and the main range.
Formatting markers stay selected so the next command can include them.
Each command has a separate undo step for text and selection.

### How commands work

The internal `createInlineCommand({spec, fallback})` function connects a command
to the shared formatter. It edits the source text directly; it does not serialize
the Markdown tree or run MarkdownIt.

```text
Command + EditorState
          |
          v
Feature enabled?
          |
          +-- no --> old command + original undo grouping
          | yes
          v
collectSimpleWord() --------------------------+
  One word with simple style markers?         |
          | no                                | yes: no tree
          v                                   |
ensureSyntaxTree(..., 50 ms)                   |
          |                                   |
          +-- null --> old command            |
          |             + separate undo step  |
          v complete tree                     |
collectFormattingParts()                      |
  Find ranges and pairs; skip directive lines  |
          |                                   |
          +-----------------------------------+
          v
planFormatting()
          |
          +-- toggle + all parts have markers --> remove one layer
          |
          +-- otherwise --> keep pairs, add missing markers
          |                 + optional URL links
          v
createFormattingTransaction()
  Map selections and create one undo step
          |
          v
state.update(...) --> dispatch once
```

The single-word shortcut uses local marker checks for text style commands.
Escapes, nested markup, long marker runs, and multiple selections use the tree.
An existing marker pair refers to one real layer, not a style inherited from a
parent node.

If there are no editable parts or no planned changes, the command finishes
without a transaction. This case does not run the fallback.

See the [formatter source](../packages/editor/src/markup/commands/inline-formatting/index.ts).

### Limitations and fallback

- CodeMirror does not parse the full YFM block structure. The directive-line
  check covers only the source lines described above. Other YFM syntax, including
  YFM tables, can be treated as ordinary Markdown text. Color and math syntax have
  no separate tree nodes.
- Long or unclear marker runs and some strikethrough cases can produce an
  incorrect tree and toggle result. Nested strike markers at the start of a line
  can create a code fence. The command allows this direct text edit.
- Tree completion has a soft time budget of 50 ms. If CodeMirror does not return
  a complete tree, the whole command uses the previous algorithm without the
  directive-line check. It does not combine a partial tree with old logic. The
  fallback splits text at blank lines, can include block markers in formatting,
  and keeps the old code wrapping behavior. It still has a separate undo step
  when the feature is enabled.
