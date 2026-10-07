## Status

An inline status badge: a short caption in a colored box inside the text.

### Markup

```md
:status[In progress]{color=green}
```

The `status` text (inline) directive. The caption is the content in square brackets, the color is
the `color` attribute. Available colors: `gray`, `blue`, `green`, `yellow`, `orange`, `red`,
`violet` — the palette of the text color extension.

The default `gray` color is omitted on serialization: `:status[In progress]`. A missing or unknown
color becomes `gray`. `\` and `]` in the caption are escaped.

### Node

The `status` node is inline and atomic, with the `text` and `color` attributes. The markup of both
the editor and the preview is the same:

```html
<span class="g-md-status g-md-status_color_green" data-qa="status" data-color="green"
  >In progress</span
>
```

Classes are derived from the attributes, `class` is not stored in the node.

### Editor

Selecting a badge opens a popover with a caption field and a color grid. A badge with an empty
caption lives only while it is selected: as soon as the selection leaves it, the badge is removed.
The `addStatus` action inserts a gray badge with the caption from the `status` keyset and selects
it.

### Limitations

- The caption is plain text: markdown inside it is not parsed.
- An unbalanced `[` in the caption makes the directive unreadable, and the line stays plain text.
- Attributes other than `color` are dropped on parsing.
- The extension is part of the `full` preset; the toolbar button inserts a badge in the WYSIWYG
  mode, in the markup mode the directive is written by hand.
