---
extension: Italic
version: 15.40.0
category: markdown
---

# Italic

This markdown extension adds marks such as `em`, 1 editor action to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Mark: `em`

## Actions

| Action ID |
|-----------|
| `italic` |

## Input Rules

| Pattern |
|---------|
| `*...*` |
| `_..._` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `italicKey` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
*hello!*
```

```markdown
_hello!_
```

```markdown
he*llo wor*ld!
```

## Syntax Guide

This extension handles the following markup patterns:

- `*hello!*` renders through this extension's parser/serializer integration.
- `_hello!_` renders through this extension's parser/serializer integration.
- `he*llo wor*ld!` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `em`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
