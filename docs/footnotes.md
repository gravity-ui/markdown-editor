##### Extensions / Footnote

## Footnotes

The `full` preset supports the [native Diplodoc term syntax](https://diplodoc.com/docs/en/syntax/term). Insert a footnote from the `/` menu, or select text and use **Footnote** in the selection toolbar. The selected text remains visible; insertion at the cursor uses `*` by default. Click the visible text to edit it and its Markdown explanation.

```markdown
The rate is 15%[*](*rate).
A [selected phrase](*source) with an explanation.
Another reference[*](*rate).

[*rate]: From 2026: **18%**, see [the report](https://example.com).

[*source]: Source: `report-2025`.
```

All visible labels, including text and `*`, render as superscript footnote markers in WYSIWYG and preview. References sharing a key use the same explanation. Editing the explanation updates every reference. Labels use plain text; uniformly formatted selections retain their outer formatting. Mixed formatting, links and code cannot be converted into a term label.

Hover, focus or select a reference with the arrow keys in WYSIWYG to read the explanation; Escape closes the tooltip. Enter on a selected reference opens the form. Cancel and Escape in the form return focus to the editor; Cancel also restores the original selection of a new footnote.

Definitions, including unused and duplicate definitions, are preserved during Markdown conversion; the first definition of a key is used. Definitions follow the native parser's default rules: a blank line ends the explanation, and keys are case sensitive. An explanation can reference another definition; the tooltip shows its visible text.

A reference without a definition in the document stays a reference in Markdown, because its definition can come from an include. WYSIWYG marks it and reports the missing definition; saving an explanation adds the definition. Native preview shows such a reference as plain text. A backslash does not prevent a reference to a defined key in native output; use inline code to show the syntax.

Storybook shows grouped examples with their Markdown and native output in **Examples / Footnote**, and a live editor with a preview.

For a custom WYSIWYG preset, register `Footnote` from `@gravity-ui/markdown-editor/extensions`. For a preview, register the native Diplodoc term plugin with its runtime and styles. The preview uses the native click and Enter interaction, with Escape returning focus to the reference.
