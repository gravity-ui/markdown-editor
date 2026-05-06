---
extension: YfmFile
version: 15.40.0
category: yfm
---

# YfmFile

This YFM extension adds nodes such as `yfmFileNodeName`, 1 editor action to the editor pipeline. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Schema

### Node: `yfmFileNodeName`

## Actions

| Action ID |
|-----------|
| `addFile` |

## Markdown Parsing

Uses markdown-it plugins:

- `fileTransform`

## Markdown Serialization

Serializer patterns:

- `${FILE_MARKUP_PREFIX}${attrsStr} %}`

## Options

| Option | Type |
|--------|------|
| `fileUploadHandler` | `FileUploadHandler` |
| `needToSetDimensionsForUploadedImages` | `boolean` |

## Markup Examples

Extracted from tests:

```markdown
{% file src="path/to/readme" name="readme.md" %}
```

```markdown
This is file: {% file src="path/to/readme" name="readme.md" %}
```

```markdown
{% file src="path/to/readme" name="readme.md" %} - download it
```

```markdown
This is file: {% file src="path/to/readme" name="readme.md" %} - download it
```

```markdown
{% file src="path/to/readme" name="readme.md" lang="ru" referrerpolicy="origin" rel="help" target="_top" type="text/markdown" %}
```

## Syntax Guide

This extension handles the following markup patterns:

- `{% file src="path/to/readme" name="readme.md" %}` renders through this extension's parser/serializer integration.
- `This is file: {% file src="path/to/readme" name="readme.md" %}` renders through this extension's parser/serializer integration.
- `{% file src="path/to/readme" name="readme.md" %} - download it` renders through this extension's parser/serializer integration.
- `This is file: {% file src="path/to/readme" name="readme.md" %} - download it` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `yfmFileNodeName`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
