---
extension: SelectionContext
version: 15.40.0
category: behavior
---

# SelectionContext

This behavior extension extends editor behavior without introducing new schema elements. It is intended to be composed directly when you need this behavior outside the standard presets.

## Presets

Not included in any standard preset (use directly).

## Markdown Parsing

No markdown parsing.

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `config` | `ContextConfig` |
| `placement` | `'top' | 'bottom'` |
| `flip` | `boolean` |

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
