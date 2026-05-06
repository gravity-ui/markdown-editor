---
extension: Emoji
version: 15.40.0
category: yfm
---

# Emoji

This YFM extension adds nodes such as `emoji`, 1 editor action to the editor pipeline. It is included in `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- FullPreset

## Schema

### Node: `emoji`

## Actions

| Action ID |
|-----------|
| `openEmojiSuggest` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `:${node.attrs[EmojiConsts.NodeAttrs.Markup]}:`

## Markup Examples

Extracted from tests:

```markdown
I can parse :ddd: emoji
```

## Syntax Guide

This extension handles the following markup patterns:

- `I can parse :ddd: emoji` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `emoji`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `FullPreset` when you want behavior consistent with the standard preset stack.
