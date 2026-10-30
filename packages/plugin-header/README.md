# Header Markdown plugin

An empty Header container with independent height and width.

```ts
import MarkdownIt from 'markdown-it';
import headerPlugin from '@gravity-ui/markdown-plugin-header';
import '@gravity-ui/markdown-plugin-header/styles.css';

const md = new MarkdownIt().use(headerPlugin);
```

```markdown
:::header{height="s" width="m"}
:::
```

Height: `s` (236 px), `m` (300 px), `l` (360 px). Default: `s`.
Width: `s` (600 px), `m` (900 px), `l` (1200 px), `full` (the available column). Default: `m`.
Height is a minimum. Width never exceeds the container. Narrow blocks align left.

The host supplies `--g-color-line-generic` and `--g-border-radius-2xl`.
The radius falls back to 16 px when the host does not define that token.
Dimensions can be overridden with `--g-md-header-height-s`, `--g-md-header-height-m`,
`--g-md-header-height-l`, `--g-md-header-width-s`, `--g-md-header-width-m`, and
`--g-md-header-width-l`. The L values are provisional defaults.

Only empty containers and the two size attributes are supported.
Unsupported or malformed containers are displayed as escaped source text.
Their content is never rendered as HTML or discarded.
The plugin does not depend on the editor, React, or UIKit.
