---
extension: Code
version: 15.40.0
category: markdown
---

# Code

This markdown extension adds marks such as `code`, 1 editor action to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Mark: `code`

## Actions

| Action ID |
|-----------|
| `code` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `codeKey` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
`hello!`
```

```markdown
he`llo wor`ld!
```

```markdown
This is **strong *emphasized text with `code` in* it**
```

```markdown
`\\n`
```

## Syntax Guide

This extension handles the following markup patterns:

- `\`hello!\`` renders through this extension's parser/serializer integration.
- `he\`llo wor\`ld!` renders through this extension's parser/serializer integration.
- `This is **strong *emphasized text with \`code\` in* it**` renders through this extension's parser/serializer integration.
- `\`\\n\`` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `code`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
