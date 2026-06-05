---
extension: Breaks
version: 15.40.0
category: markdown
---

# Breaks

This markdown extension adds nodes such as `hard_break`, `soft_break` to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `hard_break`

### Node: `soft_break`

## Keymaps

| Key |
|-----|
| `Shift-Enter` |
| `Ctrl-Enter` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `\\\n`
- `\n`

## Options

| Option | Type |
|--------|------|
| `TODO` | `[context] make this deprecated preferredBreak?: 'hard' | 'soft'` |

## Syntax Guide

The exact syntax is inferred from serializer hints:

- `\\\n` appears in the serializer implementation and documents the expected markup shape.
- `\n` appears in the serializer implementation and documents the expected markup shape.

## Use Cases

- Enable it when your editor setup needs nodes `hard_break`, `soft_break`.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
