---
extension: YfmHtmlBlock
version: 15.40.0
category: additional
---

# YfmHtmlBlock

This additional extension adds nodes such as `yfm_html_block`, 1 editor action to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

Not included in any standard preset (use directly).

## Schema

### Node: `yfm_html_block`

## Actions

| Action ID |
|-----------|
| `createYfmHtmlBlock` |

## Markdown Parsing

Uses markdown-it plugins:

- `transform`

## Markdown Serialization

Serializer patterns:

- `::: html`
- `\n`
- `:::`

## Markup Examples

Extracted from tests:

```markdown
::: html\ncontent\n:::
```

## Syntax Guide

This extension handles the following markup patterns:

- `::: html\ncontent\n:::` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_html_block`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
