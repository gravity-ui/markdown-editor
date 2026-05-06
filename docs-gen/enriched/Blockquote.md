---
extension: Blockquote
version: 15.40.0
category: markdown
---

# Blockquote

This markdown extension adds nodes such as `blockquote`, 1 editor action to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `blockquote`

## Actions

| Action ID |
|-----------|
| `quote` |

## Keymaps

| Key |
|-----|
| `Backspace` |

## Input Rules

| Pattern |
|---------|
| `/^\s*>\s$/` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `qouteKey` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
> hello!
```

```markdown
> > hello!
```

## Syntax Guide

This extension handles the following markup patterns:

- `> hello!` renders through this extension's parser/serializer integration.
- `> > hello!` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `blockquote`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Add it when editor typing rules should transform input into the corresponding markup structure.
