---
extension: Table
version: 15.40.0
category: markdown
---

# Table

This markdown extension adds nodes such as `table`, `thead`, `tbody`, `tr`, 2 editor actions, 1 ProseMirror plugin to the editor pipeline. It is included in `DefaultPreset`, `YfmPreset`, `FullPreset`.

## Presets

- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `table`

### Node: `thead`

### Node: `tbody`

### Node: `tr`

### Node: `th`

### Node: `td`

## Actions

| Action ID |
|-----------|
| `createTable` |
| `deleteTable` |

## Keymaps

| Key |
|-----|
| `Tab` |
| `Shift-Tab` |
| `Enter` |
| `Shift-Enter` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `\n`
- `\|:---`
- `\|:---:`
- `\|---:`
- `\|---`
- `\|`
- `\|`
- `\|`
- `\|`

## Plugins

- `tableCellContextPlugin`

## Syntax Guide

The exact syntax is inferred from serializer hints:

- `\n` appears in the serializer implementation and documents the expected markup shape.
- `|:---` appears in the serializer implementation and documents the expected markup shape.
- `|:---:` appears in the serializer implementation and documents the expected markup shape.
- `|---:` appears in the serializer implementation and documents the expected markup shape.

## Use Cases

- Enable it when your editor setup needs nodes `table`, `thead`, `tbody`, `tr`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Keep it aligned with `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
