---
extension: Html
version: 15.40.0
category: markdown
---

# Html

This markdown extension adds nodes such as `html_block`, `html_inline` to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `html_block`

### Node: `html_inline`

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

This extension does not produce markdown output.

## Markup Examples

Extracted from tests:

```markdown
This is <span>inline html</span>
```

```markdown
<div>This is block html with <span>inline tags</span><div>
```

## Syntax Guide

This extension handles the following markup patterns:

- `This is <span>inline html</span>` renders through this extension's parser/serializer integration.
- `<div>This is block html with <span>inline tags</span><div>` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `html_block`, `html_inline`.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
