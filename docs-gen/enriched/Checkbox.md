---
extension: Checkbox
version: 15.40.0
category: yfm
---

# Checkbox

This YFM extension adds nodes such as `checkbox`, `checkbox_input`, `checkbox_label`, 1 editor action, 1 ProseMirror plugin to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `checkbox`

### Node: `checkbox_input`

### Node: `checkbox_label`

## Actions

| Action ID |
|-----------|
| `addCheckbox` |

## Input Rules

| Pattern |
|---------|
| `/^\[(\s?)\]\s$/` |

## Markdown Parsing

Uses markdown-it plugins:

- `checkboxPlugin`

## Markdown Serialization

Serializer patterns:

- `[${checked ? `
- `[ ] `

## Plugins

- `fixPastePlugin`

## Options

| Option | Type |
|--------|------|
| `multiline` | `boolean` |

## Markup Examples

Extracted from tests:

```markdown
[ ] checkbox
```

```markdown
[X] checkbox
```

```markdown
[ ] abobo +
```

```markdown
[X] **bold** text
```

## Syntax Guide

This extension handles the following markup patterns:

- `[ ] checkbox` renders through this extension's parser/serializer integration.
- `[X] checkbox` renders through this extension's parser/serializer integration.
- `[ ] abobo +` renders through this extension's parser/serializer integration.
- `[X] **bold** text` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `checkbox`, `checkbox_input`, `checkbox_label`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
