---
extension: CodeBlock
version: 15.40.0
category: markdown
---

# CodeBlock

This markdown extension adds nodes such as `code_block`, 1 editor action, 3 ProseMirror plugins to the editor pipeline. It is included in `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset`. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

- CommonMarkPreset
- DefaultPreset
- YfmPreset
- FullPreset

## Schema

### Node: `code_block`

## Actions

| Action ID |
|-----------|
| `toCodeBlock` |

## Keymaps

| Key |
|-----|
| `Enter` |
| `Backspace` |
| `Tab` |

## Input Rules

| Pattern |
|---------|
| `/^```$/` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `\n`

## Plugins

- `codeBlockPastePlugin`
- `codeBlockLineWrappingPlugin`
- `codeBlockLineNumbersPlugin`

## Options

| Option | Type |
|--------|------|
| `codeBlockKey` | `string | null` |
| `langs` | `HighlightLangMap` |
| `lineWrapping` | `{ /** * Enable line wrapping toggling in code block * @default false */ enabled?: boolean` |

## Markup Examples

Extracted from tests:

```markdown
Some code:\n\n```\nHere it is\n```\n\nPara
```

```markdown
foo\n\n```javascript\n1\n```
```

```markdown
```\nsome code\n\n\n\n```
```

```markdown
~~~\n123\n~~~
```

## Syntax Guide

This extension handles the following markup patterns:

- `Some code:\n\n\`\`\`\nHere it is\n\`\`\`\n\nPara` renders through this extension's parser/serializer integration.
- `foo\n\n\`\`\`javascript\n1\n\`\`\`` renders through this extension's parser/serializer integration.
- `\`\`\`\nsome code\n\n\n\n\`\`\`` renders through this extension's parser/serializer integration.
- `~~~\n123\n~~~` renders through this extension's parser/serializer integration.

## Use Cases

- Enable it when your editor setup needs nodes `code_block`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 1 related editor action.
- Keep it aligned with `CommonMarkPreset`, `DefaultPreset`, `YfmPreset`, `FullPreset` when you want behavior consistent with the standard preset stack.
- Include it when your editor flow depends on the 3 ProseMirror plugins wired by this extension.
