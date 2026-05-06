---
extension: Link
version: 15.40.0
category: markdown
---

# Link

This markdown extension adds marks such as `link`, 2 editor actions, 2 ProseMirror plugins to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Mark: `link`

## Actions

| Action ID |
|-----------|
| `addLink` |
| `link` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Plugins

- `linkTooltipPlugin`
- `linkPasteEnhance`

## Options

| Option | Type |
|--------|------|
| `linkKey` | `string | null` |

## Markup Examples

Extracted from tests:

```markdown
[yandex](ya.ru)
```

```markdown
[imageboard](4chan.org "4chan")
```

```markdown
[text](https://example.com/+_file/#~anchor)
```

```markdown
<https://example.com/+_file/#~anchor>
```

```markdown
[parentheses](https://example.com/example=?qwe\\(asd)
```

```markdown
[parentheses2](https://example.com/example=?qwe\\(asd\\)\\))
```

```markdown
[test text](http://example.com?)
```

## Syntax Guide

This extension handles the following markup patterns:

- `[yandex](ya.ru)` renders through this extension's parser/serializer integration.
- `[imageboard](4chan.org "4chan")` renders through this extension's parser/serializer integration.
- `[text](https://example.com/+_file/#~anchor)` renders through this extension's parser/serializer integration.
- `<https://example.com/+_file/#~anchor>` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs marks `link`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 2 ProseMirror plugins wired by this extension.
