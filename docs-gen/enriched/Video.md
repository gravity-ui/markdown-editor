---
extension: Video
version: 15.40.0
category: yfm
---

# Video

This YFM extension adds nodes such as `video`, 1 editor action to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `video`

## Actions

| Action ID |
|-----------|
| `video` |

## Markdown Parsing

Uses markdown-it plugins:

- `videoPlugin`

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
YouTube @[youtube](dQw4w9WgXcQ)
```

```markdown
Vimeo @[vimeo](19706846)
```

```markdown
Vine @[vine](etVpwB7uHlw)
```

```markdown
Prezi @[prezi](1kkxdtlp4241)
```

```markdown
Osf @[osf](kuvg9)
```

```markdown
YouTube @[youtube](yt-video-1)
```

## Syntax Guide

This extension handles the following markup patterns:

- `YouTube @[youtube](dQw4w9WgXcQ)` renders through this extension's parser/serializer integration.
- `Vimeo @[vimeo](19706846)` renders through this extension's parser/serializer integration.
- `Vine @[vine](etVpwB7uHlw)` renders through this extension's parser/serializer integration.
- `Prezi @[prezi](1kkxdtlp4241)` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `video`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
