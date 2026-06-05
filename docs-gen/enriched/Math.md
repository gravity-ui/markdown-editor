---
extension: Math
version: 15.40.0
category: additional
---

# Math

This additional extension adds 2 editor actions, 1 ProseMirror plugin to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

Not included in any standard preset (use directly).

## Actions

| Action ID |
|-----------|
| `addMathInline` |
| `toMathBlock` |

## Keymaps

| Key |
|-----|
| `Enter` |

## Input Rules

| Pattern |
|---------|
| `/^\$\$\s$/` |
| `/\$[^$\s]+\$$/` |

## Markdown Parsing

Uses markdown-it plugins:

- `transform`

## Markdown Serialization

Serializer patterns:

- `$${node.textContent}$`
- `$$${node.textContent}$$\n\n`

## Plugins

- `latexPastePlugin`

## Markup Examples

Extracted from tests:

```markdown
Inline math: $\\sqrt{3x-1}+(1+x)^2$
```

```markdown
$$${formula}$$\n\n
```

## Syntax Guide

This extension handles the following markup patterns:

- `Inline math: $\\sqrt{3x-1}+(1+x)^2---
extension: Math
version: 15.40.0
category: additional
---

# Math

This additional extension adds 2 editor actions, 1 ProseMirror plugin to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets. The extracted test markup shows how the feature is expected to appear in real content.

## Presets

Not included in any standard preset (use directly).

## Actions

| Action ID |
|-----------|
| `addMathInline` |
| `toMathBlock` |

## Keymaps

| Key |
|-----|
| `Enter` |

## Input Rules

| Pattern |
|---------|
| `/^\$\$\s$/` |
| `/\$[^$\s]+\$$/` |

## Markdown Parsing

Uses markdown-it plugins:

- `transform`

## Markdown Serialization

Serializer patterns:

- `$${node.textContent}$`
- `$$${node.textContent}$$\n\n`

## Plugins

- `latexPastePlugin`

## Markup Examples

Extracted from tests:

```markdown
Inline math: $\\sqrt{3x-1}+(1+x)^2$
```

```markdown
$$${formula}$$\n\n
```

## Syntax Guide

 renders through this extension's parser/serializer integration.
- `$${formula}$\n\n` renders through this extension's parser/serializer integration.

## Use Cases

- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
- Include it when your editor flow depends on the 1 ProseMirror plugin wired by this extension.
