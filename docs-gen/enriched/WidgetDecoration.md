---
extension: WidgetDecoration
version: 15.40.0
category: behavior
---

# WidgetDecoration

This behavior extension adds 1 ProseMirror plugin to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets.

## Presets

Not included in any standard preset (use directly).

## Markdown Parsing

No markdown parsing.

## Markdown Serialization

This extension does not produce markdown output.

## Plugins

- `WidgetDecorationPlugin`

## Syntax Guide

This extension does not define custom markdown syntax.

## Use Cases

- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
