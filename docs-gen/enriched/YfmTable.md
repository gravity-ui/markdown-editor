---
extension: YfmTable
version: 15.40.0
category: yfm
---

# YfmTable

This YFM extension adds nodes such as `yfm_table`, `yfm_tbody`, `yfm_tr`, `yfm_td`, 1 editor action, 2 ProseMirror plugins to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `yfm_table`

### Node: `yfm_tbody`

### Node: `yfm_tr`

### Node: `yfm_td`

## Actions

| Action ID |
|-----------|
| `createYfmTable` |

## Keymaps

| Key |
|-----|
| `Tab` |
| `Shift-Tab` |
| `ArrowDown` |
| `ArrowUp` |
| `Backspace` |

## Markdown Parsing

Uses markdown-it plugins:

- `yfmTable`

## Markdown Serialization

Serializer patterns:

- `#\|`
- `\|#`
- `\n`
- `\|\|`
- `\n`
- `\|`
- `\n`
- `{.${td.attrs[YfmTableAttr.CellAlign]}}`
- `\|>`
- `\|^`
- `\|\|`
- `\|\|`
- `\n`
- `\|\|`
- `\|`
- `\n`

## Plugins

- `yfmTableTransformPastedPlugin`
- `yfmTableControlsPlugins`

## Options

| Option | Type |
|--------|------|
| `controls` | `boolean` |
| `dnd` | `boolean` |

## Syntax Guide

The exact syntax is inferred from serializer hints:

- `#|` appears in the serializer implementation and documents the expected markup shape.
- `|#` appears in the serializer implementation and documents the expected markup shape.
- `\n` appears in the serializer implementation and documents the expected markup shape.
- `||` appears in the serializer implementation and documents the expected markup shape.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_table`, `yfm_tbody`, `yfm_tr`, `yfm_td`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 2 ProseMirror plugins wired by this extension.
