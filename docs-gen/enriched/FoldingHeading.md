---
extension: FoldingHeading
version: 15.40.0
category: additional
---

# FoldingHeading

This additional extension adds 1 editor action, 1 ProseMirror plugin to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets.

## Presets

Not included in any standard preset (use directly).

## Actions

| Action ID |
|-----------|
| `toggleHeadingFolding` |

## Keymaps

| Key |
|-----|
| `Enter` |
| `Backspace` |

## Markdown Parsing

Uses markdown-it plugins:

- `transform`

## Markdown Serialization

This extension does not produce markdown output.

## Plugins

- `foldingPlugin`

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
