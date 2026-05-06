---
extension: Color
version: 15.40.0
category: yfm
---

# Color

This YFM extension adds marks such as `color`, 1 editor action to the editor pipeline. It is included in `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- FullPreset

## Schema

### Mark: `color`

## Actions

| Action ID |
|-----------|
| `colorify` |

## Markdown Parsing

Uses markdown-it plugins:

- `color`
- `mdPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `validateClassNameColorName` | `(colorName: string) => boolean` |
| `parseStyleColorValue` | `(color: string) => string | null` |

## Markup Examples

Extracted from tests:

```markdown
{c1}(hello!)
```

```markdown
he{c2}(llo wor)ld!
```

```markdown
{green}(some\\(){blue}(2,3){green}(\\))
```

## Syntax Guide

This extension handles the following markup patterns:

- `{c1}(hello!)` renders through this extension's parser/serializer integration.
- `he{c2}(llo wor)ld!` renders through this extension's parser/serializer integration.
- `{green}(some\\(){blue}(2,3){green}(\\))` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `color`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `FullPreset` when you want behavior consistent with the standard preset stack.
