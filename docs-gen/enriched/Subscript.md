---
extension: Subscript
version: 15.40.0
category: markdown
---

# Subscript

This markdown extension adds marks such as `sub`, 1 editor action to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Schema

### Mark: `sub`

## Actions

| Action ID |
|-----------|
| `subscript` |

## Input Rules

| Pattern |
|---------|
| `~...~` |

## Markdown Parsing

Uses markdown-it plugins:

- `subPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
~hello~
```

```markdown
hello~world~!
```

```markdown
Ok, hello~w\\ o\\ r\\ l\\ d~! This world is beautiful!
```

## Syntax Guide

This extension handles the following markup patterns:

- `~hello~` renders through this extension's parser/serializer integration.
- `hello~world~!` renders through this extension's parser/serializer integration.
- `Ok, hello~w\\ o\\ r\\ l\\ d~! This world is beautiful!` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `sub`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
