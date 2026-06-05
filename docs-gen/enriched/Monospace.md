---
extension: Monospace
version: 15.40.0
category: yfm
---

# Monospace

This YFM extension adds marks such as `monospace`, 1 editor action to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Schema

### Mark: `monospace`

## Actions

| Action ID |
|-----------|
| `mono` |

## Input Rules

| Pattern |
|---------|
| `##...##` |

## Markdown Parsing

Uses markdown-it plugins:

- `yfmPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
##hello!##
```

```markdown
he##llo wor##ld!
```

## Syntax Guide

This extension handles the following markup patterns:

- `##hello!##` renders through this extension's parser/serializer integration.
- `he##llo wor##ld!` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `monospace`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
