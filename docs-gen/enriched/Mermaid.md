---
extension: Mermaid
version: 15.40.0
category: additional
---

# Mermaid

This additional extension adds nodes such as `mermaid`, 1 editor action to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

Not included in any standard preset (use directly).

## Schema

### Node: `mermaid`

## Actions

| Action ID |
|-----------|
| `createMermaid` |

## Markdown Parsing

Uses markdown-it plugins:

- `transform`

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `loadRuntimeScript` | `() => void` |
| `autoSave` | `{ enabled: boolean` |
| `delay` | `number` |

## Markup Examples

Extracted from tests:

```markdown
```mermaid\ncontent\n```\n
```

## Syntax Guide

This extension handles the following markup patterns:

- `\`\`\`mermaid\ncontent\n\`\`\`\n` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `mermaid`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
