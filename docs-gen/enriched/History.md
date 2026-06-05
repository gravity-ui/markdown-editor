---
extension: History
version: 15.40.0
category: behavior
---

# History

This behavior extension adds 2 editor actions to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets.

## Presets

Not included in any standard preset (use directly).

## Actions

| Action ID |
|-----------|
| `undo` |
| `redo` |

## Markdown Parsing

No markdown parsing.

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `config` | `Parameters<typeof history>[0]` |
| `undoKey` | `string | null` |
| `redoKey` | `string | null` |

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
