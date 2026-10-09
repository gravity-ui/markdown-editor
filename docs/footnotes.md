##### Extensions / Footnote

## Footnotes

The `full` preset includes inline footnotes. Insert one from the `/` menu, or select inline text and use **Footnote** in the selection toolbar. Click a marker to edit its Markdown text.

```markdown
The rate is 15%:footnote[From 2026: **18%**, see [the report](https://example.com).].
Source:footnote[Report for 2025]{marker="\*"}.
```

Automatic markers are numbered across the document. Custom markers do not consume a number. Hover or focus a marker to read the note; Escape closes the tooltip. Printing includes the note text next to its marker.

The original directive spelling, inline Markdown, and unknown parameters are preserved. Editing replaces only the content of `[]`.

For a custom WYSIWYG preset, register `Footnote` from `@gravity-ui/markdown-editor/extensions`. For a Markdown preview, register the default export from `@gravity-ui/markdown-editor/markdown-it/footnote` and include the editor styles. The preview plugin emits the marker and formatted note text.
