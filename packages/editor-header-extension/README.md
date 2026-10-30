# Header editor extension

Adds an empty Header block with independent height and width.

```ts
import {Header, headerItem} from '@gravity-ui/markdown-editor-header-extension';

// Add Header to wysiwygConfig.extensions.
const extensions = (builder) => builder.use(Header);

// Add headerItem to your toolbar preset and its desired orders.
```

Select the block to open Cover settings. The panel contains Height (S/M/L) and
Width (S/M/L/Full width). Changes support undo and redo. Readonly views do not
show the panel or allow dimension changes.

Use `headerPlugin` and its stylesheet from `@gravity-ui/markdown-plugin-header`
for Markdown previews. That package defines the shared defaults and dimensions.
The editor serializes both attributes, including their default values.
Unsupported Header containers remain visible as source and retain their markup
when switching modes. They do not expose dimension controls.

`HeaderSpecs` is available for parsers without an editor view. `Header` requires
the editor's React renderer, which is included in the standard presets.
