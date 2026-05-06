---
extension: Mark
version: 15.40.0
category: markdown
---

# Mark

This markdown extension adds marks such as `mark`, 1 editor action to the editor pipeline. It is included in `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- FullPreset

## Schema

### Mark: `mark`

## Actions

| Action ID |
|-----------|
| `mark` |

## Input Rules

| Pattern |
|---------|
| `==...==` |

## Markdown Parsing

Uses markdown-it plugins:

- `markPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
==hello!==
```

```markdown
he==llo wor==ld!
```

## Syntax Guide

This extension handles the following markup patterns:

- `==hello!==` renders through this extension's parser/serializer integration.
- `he==llo wor==ld!` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `mark`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
