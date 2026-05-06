---
extension: QuoteLink
version: 15.40.0
category: additional
---

# QuoteLink

This additional extension adds nodes such as `yfm_quote-link`, 2 editor actions to the editor pipeline. It is intended to be composed directly when you need this behavior outside the standard presets.

## Presets

Not included in any standard preset (use directly).

## Schema

### Node: `yfm_quote-link`

## Actions

| Action ID |
|-----------|
| `quoteLink` |
| `addLinkToQuoteLink` |

## Input Rules

| Pattern |
|---------|
| `/^\s*>\s$/` |

## Markdown Parsing

Uses built-in markdown-it tokens (CommonMark).

## Markdown Serialization

Serializer patterns:

- `[${node.attrs[QuoteLinkAttr.DataContent]}](${
                            node.attrs[QuoteLinkAttr.Cite]
                        }){data-quotelink=true}`
- `\n`
- `\n`

## Syntax Guide

This extension reacts to these editor input patterns:

- `/^\s*>\s$/` is registered as an input rule for this extension.

## Use Cases

- Enable it when your editor setup needs nodes `yfm_quote-link`.
- Use it when toolbar buttons, slash commands, or shortcuts should trigger 2 related editor actions.
- Compose it directly in custom presets when you need this feature without pulling in a larger preset.
- Add it when editor typing rules should transform input into the corresponding markup structure.
