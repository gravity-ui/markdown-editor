## Label

An inline label: a short caption in a colored pill inside the text.

### Markup

```md
:label[In progress]{color=green}
```

The `label` text (inline) directive. The caption is the content in square brackets, the color is
the `color` attribute. Available colors: `gray`, `green`, `yellow`, `blue`, `red`, `purple`.

The default `gray` color is omitted on serialization: `:label[In progress]`. A missing or unknown
color becomes `gray`. `\` and `]` in the caption are escaped.

#### Former markup

The extension also reads the `status` directive of its previous version and writes it back as
`label`, so `:status[Done]{color=green}` becomes `:label[Done]{color=green}`. The caption is kept
as is. Colors of the former palette are mapped to the closest current color:

| Former color | Color    |
| ------------ | -------- |
| `teal`       | `blue`   |
| `lime`       | `green`  |
| `orange`     | `yellow` |
| `magenta`    | `purple` |

### Node

The `label` node is inline and atomic, with the `text` and `color` attributes. The editor and the
preview render the DOM of the UIKit `Label` with its classes, with `span` elements to stay valid
inside a paragraph:

```html
<span
  class="g-label g-label_theme_success g-label_size_xs g-md-label"
  data-qa="label"
  data-color="green"
  ><span class="g-label__text"><span class="g-label__content">In progress</span></span></span
>
```

Classes are derived from the attributes, `class` is not stored in the node.

### Appearance

Every color is a `theme` of the UIKit `Label`, so the label follows the light and the dark themes:

| Color    | Theme     |
| -------- | --------- |
| `gray`   | `unknown` |
| `green`  | `success` |
| `yellow` | `warning` |
| `blue`   | `info`    |
| `red`    | `danger`  |
| `purple` | `utility` |

The label is the `xs` size of `Label`, 18 px high, fully rounded and without a border. It is
vertically centered in the line and does not increase the height of a 20 px line. The styles of
`Label` come with the UIKit `Label` component, which the extension imports; a preview without the
extension needs the UIKit styles and the extension stylesheet.

### Editor

Selecting a label opens a popover with a caption field and a row of six color swatches. The
selected swatch has a check mark and `aria-pressed`.

- A click on a label and the insertion of a new one open the popover and move the focus to the
  caption field.
- A label selected by the keyboard opens the popover and keeps the focus in the editor. `Enter`
  moves the focus to the caption field.
- The clear button of the field clears the caption and keeps the popover open.
- `Escape` or a click outside the popover closes it. `Escape` in the popover puts the cursor after
  the label.
- A label with an empty caption lives only while it is selected and its popover is open. Closing
  the popover or moving the selection out of the label removes it.

The `addLabel` action inserts a gray label with the caption from the `label` keyset.

`ArrowLeft` and `ArrowRight` step through three positions around a label: the edge before it, the
label itself, the edge after it. At both edges the editor draws the fake cursor of the Code
extension instead of the native caret, and typed text goes outside the label.

### Limitations

- The caption is plain text: markdown inside it is not parsed.
- An unbalanced `[` in the caption makes the directive unreadable, and the line stays plain text.
- Attributes other than `color` are dropped on parsing.
- The extension is part of the `full` preset; the toolbar button inserts a label in the WYSIWYG
  mode, in the markup mode the directive is written by hand.
