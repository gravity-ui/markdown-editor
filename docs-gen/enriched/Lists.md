---
extension: Lists
version: 15.40.0
category: markdown
---

# Lists

This markdown extension adds nodes such as `list_item`, `bullet_list`, `ordered_list`, 4 editor actions, 2 ProseMirror plugins to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `list_item`

### Node: `bullet_list`

### Node: `ordered_list`

## Actions

| Action ID |
|-----------|
| `toBulletList` |
| `toOrderedList` |
| `sinkListItem` |
| `liftListItem` |

## Keymaps

| Key |
|-----|
| `Tab` |
| `Shift-Tab` |
| `Backspace` |
| `Mod-[` |
| `Mod-]` |
| `Enter` |

## Input Rules

| Pattern |
|---------|
| `/^(\d+)([.)])\s$/` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Plugins

- `mergeListsPlugin`
- `collapseListsPlugin`

## Options

| Option | Type |
|--------|------|
| `ulKey` | `string | null` |
| `olKey` | `string | null` |
| `ulInputRules` | `ListsInputRulesOptions['bulletListInputRule']` |

## Markup Examples

Extracted from tests:

```markdown
* one\n* two
```

```markdown
* one\n\n* two
```

```markdown
1. one\n2. two
```

```markdown
1. one\n\n2. two
```

```markdown
1) one\n2) two
```

```markdown
1) one\n\n2) two
```

```markdown
- + * 2. item
```

## Syntax Guide

This extension handles the following markup patterns:

- `* one\n* two` renders through this extension's parser/serializer integration.
- `* one\n\n* two` renders through this extension's parser/serializer integration.
- `1. one\n2. two` renders through this extension's parser/serializer integration.
- `1. one\n\n2. two` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `list_item`, `bullet_list`, `ordered_list`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 4 related editor actions.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 2 ProseMirror plugins wired by this extension.
