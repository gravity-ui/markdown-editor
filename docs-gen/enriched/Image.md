---
extension: Image
version: 15.40.0
category: markdown
---

# Image

This markdown extension adds nodes such as `image`, 1 editor action to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `image`

## Actions

| Action ID |
|-----------|
| `addImage` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
![](img.png)
```

```markdown
![alt text](img2.png "title text")
```

## Syntax Guide

This extension handles the following markup patterns:

- `![](img.png)` renders through this extension's parser/serializer integration.
- `![alt text](img2.png "title text")` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `image`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
