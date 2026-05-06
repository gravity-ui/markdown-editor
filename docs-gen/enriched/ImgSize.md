---
extension: ImgSize
version: 15.40.0
category: yfm
---

# ImgSize

This YFM extension adds 2 editor actions, 1 ProseMirror plugin to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Actions

| Action ID |
|-----------|
| `addImageAction` |
| `addImageWidget` |

## Markdown Parsing

Uses markdown-it plugins:

- `imsize`

## Markdown Serialization

This extension does not produce markdown output.

## Plugins

- `imgSizeNodeViewPlugin`

## Options

| Option | Type |
|--------|------|
| `needToSetDimensionsForUploadedImages` | `boolean` |

## Markup Examples

Extracted from tests:

```markdown
![](img.png)
```

```markdown
![alt text](img2.png "title text")
```

```markdown
![](img3.png =200x100)
```

```markdown
![alt text 2](img4.png "title text 2" =400x300)
```

## Syntax Guide

This extension handles the following markup patterns:

- `![](img.png)` renders through this extension's parser/serializer integration.
- `![alt text](img2.png "title text")` renders through this extension's parser/serializer integration.
- `![](img3.png =200x100)` renders through this extension's parser/serializer integration.
- `![alt text 2](img4.png "title text 2" =400x300)` renders through this extension's parser/serializer integration.

## Use Cases

- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
