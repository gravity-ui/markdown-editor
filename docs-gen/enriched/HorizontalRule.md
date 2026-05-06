---
extension: HorizontalRule
version: 15.40.0
category: markdown
---

# HorizontalRule

This markdown extension adds nodes such as `horizontal_rule`, 1 editor action to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `horizontal_rule`

## Actions

| Action ID |
|-----------|
| `hRule` |

## Input Rules

| Pattern |
|---------|
| `/^(---|___|\*\*\*)$/` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
---
```

```markdown
___
```

```markdown
***
```

## Syntax Guide

This extension handles the following markup patterns:

- `---` renders through this extension's parser/serializer integration.
- `___` renders through this extension's parser/serializer integration.
- `***` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `horizontal_rule`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
