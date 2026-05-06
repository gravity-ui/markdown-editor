---
extension: Deflist
version: 15.40.0
category: markdown
---

# Deflist

This markdown extension adds nodes such as `dl`, `dt`, `dd`, 1 editor action to the editor pipeline. It is included in `YfmPreset`, `FullPreset`.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `dl`

### Node: `dt`

### Node: `dd`

## Actions

| Action ID |
|-----------|
| `toDefList` |

## Keymaps

| Key |
|-----|
| `Enter` |

## Markdown Parsing

Uses markdown-it plugins:

- `deflistPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Enable it when your editor setup needs nodes `dl`, `dt`, `dd`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
