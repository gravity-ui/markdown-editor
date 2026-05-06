---
extension: Heading
version: 15.40.0
category: markdown
---

# Heading

This markdown extension adds nodes such as `heading`, 6 editor actions to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `heading`

## Actions

| Action ID |
|-----------|
| `toH1` |
| `toH2` |
| `toH3` |
| `toH4` |
| `toH5` |
| `toH6` |

## Keymaps

| Key |
|-----|
| `Backspace` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Options

| Option | Type |
|--------|------|
| `h1Key` | `string | null` |
| `h2Key` | `string | null` |
| `h3Key` | `string | null` |
| `h4Key` | `string | null` |
| `h5Key` | `string | null` |
| `h6Key` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
# one
```

```markdown
## two
```

```markdown
### three
```

```markdown
#### four
```

```markdown
##### five
```

```markdown
###### six
```

```markdown
## heading with **bold**
```

## Syntax Guide

This extension handles the following markup patterns:

- `# one` renders through this extension's parser/serializer integration.
- `## two` renders through this extension's parser/serializer integration.
- `### three` renders through this extension's parser/serializer integration.
- `#### four` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `heading`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 6 related editor actions.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
