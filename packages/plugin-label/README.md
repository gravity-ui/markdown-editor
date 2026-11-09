# Label Markdown plugin

markdown-it plugin for an inline label: a short caption on a colored background inside the text.

```ts
import MarkdownIt from 'markdown-it';
import {labelPlugin} from '@gravity-ui/markdown-plugin-label';
import '@gravity-ui/markdown-plugin-label/styles.css';

const md = new MarkdownIt().use(labelPlugin);
```

```markdown
Release: :label[In progress]{color=blue}
```

| Part             | Values                                             | Default |
| ---------------- | -------------------------------------------------- | ------- |
| text in brackets | caption, plain text                                | —       |
| `color`          | `gray`, `green`, `yellow`, `blue`, `red`, `purple` | `gray`  |

The label is rendered as `span.g-md-label-plugin` with the modifier `_color_{gray,green,yellow,blue,red,purple}`
and the caption in `span.g-md-label-plugin__text`.
The `data-color` attribute of the element and of the token holds the same color.

The label is 20 px high: the `body-1` text of the theme with 1 px above and below and 9 px on the sides.
The corners are fully rounded, a long caption is cut with an ellipsis at `--g-md-label-plugin-max-width` (`min(180px, 100%)` by default).

| Color    | Background                      | Text                            |
| -------- | ------------------------------- | ------------------------------- |
| `gray`   | `--g-color-base-neutral-light`  | `--g-color-text-complementary`  |
| `green`  | `--g-color-base-positive-light` | `--g-color-text-positive-heavy` |
| `yellow` | `--g-color-base-warning-light`  | `--g-color-text-warning-heavy`  |
| `blue`   | `--g-color-base-info-light`     | `--g-color-text-info-heavy`     |
| `red`    | `--g-color-base-danger-light`   | `--g-color-text-danger-heavy`   |
| `purple` | `--g-color-base-utility-light`  | `--g-color-text-utility-heavy`  |

## Parsing

The label is an inline directive of [`@diplodoc/directive`](https://github.com/diplodoc-platform/directive).
The caption is plain text: Markdown inside it is not parsed, `\`, `[` and `]` are escaped with `\`.
A directive with an empty caption remains text.
An unknown attribute is skipped, and an unsupported color is replaced with `gray`.

The `status` directive of the former Status block is read as a label.
Its colors are mapped to the closest label color: `teal` → `blue`, `lime` → `green`, `orange` → `yellow`, `magenta` → `purple`.
