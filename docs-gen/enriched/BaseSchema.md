---
extension: BaseSchema
version: 15.40.0
category: base
---

# BaseSchema

This base extension adds 1 editor action to the editor pipeline. It is included in `ZeroPreset`, `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- ZeroPreset
- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Actions

| Action ID |
|-----------|
| `toParagraph` |

## Markdown Parsing

No markdown parsing.

## Markdown Serialization

Serializer patterns:

- `&nbsp;\n`
- `\n`

## Options

| Option | Type |
|--------|------|
| `paragraphKey` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
hello!
```

```markdown
hello!\n\n&nbsp;\n\nworld!
```

```markdown
> hello!\n>\n> &nbsp;\n> \n> world!
```

## Syntax Guide

This extension handles the following markup patterns:

- `hello!` renders through this extension's parser/serializer integration.
- `hello!\n\n&nbsp;\n\nworld!` renders through this extension's parser/serializer integration.
- `> hello!\n>\n> &nbsp;\n> \n> world!` renders through this extension's parser/serializer integration.

## Use Cases

- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `ZeroPreset`, `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
