---
extension: YfmHeading
version: 15.40.0
category: yfm
---

# YfmHeading

This YFM extension extends editor behavior without introducing new schema elements. It is included in `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- YfmPreset
- FullPreset

## Markdown Parsing

Uses markdown-it plugins:

- `headingIdsPlugin`

## Markdown Serialization

Serializer patterns:

- ` {#${anchor}}`

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
## heading with **bold** {#heading-with-bold}
```

## Syntax Guide

This extension handles the following markup patterns:

- `# one` renders through this extension's parser/serializer integration.
- `## two` renders through this extension's parser/serializer integration.
- `### three` renders through this extension's parser/serializer integration.
- `#### four` renders through this extension's parser/serializer integration.

## Use Cases

- Keep it aligned with `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
