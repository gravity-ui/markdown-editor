##### Extensions / Sample

# Sample

## Editor extension

### Description

Inserts a sample block.
@deprecated Use the Example extension.

### Import

```ts
import {Sample} from '@gravity-ui/markdown-editor/extensions/markdown/Sample/index.js';
```

### Options

- `frameKey?: string` — Key that toggles the frame.
- `framed?: boolean` — Draws a frame around the block.
- `marker: string` — Text that opens a sample block.
- `onSubmit?: (value: string) => boolean` — Runs when the block is submitted.

### Actions

- `toSample`
- `toggleSampleFrame`

### Keys

- `Mod-Alt-f`
- `Mod-Alt-s`

### Input rules

- `/^--\s$/` → `sample_line`
- `/^:::$/` → `sample`
- `/^>>\s$/` → `sample`
- `new RegExp('^(!{1,' + maxLevel + '})\\s$')` → `sample`
- `new RegExp('^@@\\s$')` → `sample`
- `{open: '%%', close: '%%'}` → `sample_mark`

### Directive syntax

Key: `sample`

Values: `'disabled' | 'enabled'`

Default: `'disabled'`

## Toolbar

| Button | Action |
|--------|--------|
| Sample block | `toSample` |
| Sample frame | `toggleSampleFrame` |
| Sample from another keyset | `toSample` |

## Markdown plugin

### Import

```ts
import alphaPlugin from 'alpha-plugin';
import {sampleDefaults, samplePlugin} from 'sample-plugin';

md.use(samplePlugin, {marker: '>>', defaults: sampleDefaults()});
md.use(alphaPlugin);
```

Defined in the editor: `sampleLocalPlugin`

### Options

#### `samplePlugin`

- `defaults?: object`
- `marker?: string` — Text that opens a sample block.
- Shared transform options: `MarkdownItPluginOpts` from `@diplodoc/transform/lib/typings`

#### `alphaPlugin`

Not found

#### `sampleLocalPlugin`

- `level?: number`
