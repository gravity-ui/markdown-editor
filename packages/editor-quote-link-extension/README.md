# Quote link editor extension

Quote links for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor): a quote that starts with a link to its source. In Markdown, the link has the `data-quotelink=true` attribute:

```md
> [Source title](https://example.com){data-quotelink=true}
>
> Quote text
```

Requires React 18 or 19. Supports `@gravity-ui/markdown-editor` 15.47.0 and higher. Starting with version 16, the editor does not include the quote link extension, and this package provides it.

## Installation

```bash
npm install @gravity-ui/markdown-editor-quote-link-extension @diplodoc/quote-link-extension
```

## Usage

```ts
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {QuoteLink} from '@gravity-ui/markdown-editor-quote-link-extension';

const editor = useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => builder.use(QuoteLink),
    extensionOptions: {
      yfmConfigs: {attrs: {allowedAttributes: ['data-quotelink']}},
    },
  },
});
```

The `data-quotelink` attribute must be in the allowed attributes of `yfmConfigs`, otherwise the link stays a regular link.
The Markdown plugin for the markup preview is `transform` from `@diplodoc/quote-link-extension`.
The setup of the plugin and the toolbar is described in [How to connect the quote link extension](https://gravity-ui.github.io/markdown-editor/extensions/quote-link-extension.html).

| Entry point                                                      | Exports                                                                                                                                                                                                               |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gravity-ui/markdown-editor-quote-link-extension`               | `QuoteLink`, its action names, the Markdown command `insertBlockquoteLink`, the toolbar button `toolbarQuoteLinkItem` for both modes and its parts `quoteLinkItemView`, `quoteLinkItemWysiwyg`, `quoteLinkItemMarkup` |
| `@gravity-ui/markdown-editor-quote-link-extension/wysiwyg`       | `QuoteLink`, its action names, `quoteLinkItemWysiwyg` and `toolbarQuoteLinkItem` for the visual editor                                                                                                                |
| `@gravity-ui/markdown-editor-quote-link-extension/wysiwyg/specs` | `QuoteLinkSpecs`, `QuoteLinkAttr`, `quoteLinkNodeName`, `quoteLinkType` and `isQuoteLinkNode`                                                                                                                         |
| `@gravity-ui/markdown-editor-quote-link-extension/markup`        | `insertBlockquoteLink`, `quoteLinkItemMarkup` and `toolbarQuoteLinkItem` for the Markdown editor                                                                                                                      |

`QuoteLinkSpecs` adds only the schema, Markdown parsing and serialization, and runs in Node.js without a DOM or styles.
`QuoteLink` also adds the `> ` input rule, the `quoteLink` and `addLinkToQuoteLink` actions, the link form and the styles.

## Migration from `@gravity-ui/markdown-editor`

The entities keep their names. Only the import path changes.

| In `@gravity-ui/markdown-editor` 15                                                                                                               | In this package                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `QuoteLink` from `/extensions/additional/QuoteLink`                                                                                               | `QuoteLink` from `.` or `/wysiwyg`                           |
| `QuoteLinkSpecs`, `QuoteLinkAttr`, `quoteLinkNodeName`, `quoteLinkType`, `isQuoteLinkNode` from `/extensions/additional/QuoteLink/QuoteLinkSpecs` | the same names from `/wysiwyg/specs`                         |
| `MarkupCommands.insertBlockquoteLink`                                                                                                             | `insertBlockquoteLink` from `.` or `/markup`                 |
| `quoteLinkItemView` from `/toolbars`                                                                                                              | `quoteLinkItemView` from `.`                                 |
| `quoteLinkItemWysiwyg` from `/toolbars`                                                                                                           | `quoteLinkItemWysiwyg` from `.` or `/wysiwyg`                |
| `quoteLinkItemMarkup` from `/toolbars`                                                                                                            | `quoteLinkItemMarkup` from `.` or `/markup`                  |
| `{view: quoteLinkItemView, wysiwyg: quoteLinkItemWysiwyg, markup: quoteLinkItemMarkup}`                                                           | `toolbarQuoteLinkItem` from `.`                              |
| `ActionName.quoteLink`                                                                                                                            | any string key of the preset item, for example `'quoteLink'` |
| `icons.quoteLink`, `QuoteLinkIcon`                                                                                                                | `CircleLink` from `@gravity-ui/icons`                        |

`QuoteLinkAttr` is a plain object with `as const`; its keys and values are the same.
The `quotelink` key of the editor's `menubar` keyset is removed. The package registers its own keyset.
`@gravity-ui/markdown-editor` no longer lists `@diplodoc/quote-link-extension` as an optional peer dependency; this package requires it.
