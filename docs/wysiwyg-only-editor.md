# WYSIWYG-only editor

Visual editing with Markdown input/output, toolbars, settings, and search.
There is no source editor, mode switch, preview, or split view.

```tsx
import {MarkdownWysiwygEditorView, useMarkdownWysiwygEditor} from '@gravity-ui/markdown-editor';
import {wysiwygToolbarsPresets} from '@gravity-ui/markdown-editor/toolbars';

function Editor() {
  const editor = useMarkdownWysiwygEditor({initial: {markup: 'Hello'}});
  return (
    <MarkdownWysiwygEditorView
      editor={editor}
      stickyToolbar
      contenteditableAttributes={{'aria-label': 'Document'}}
      toolbarsPreset={wysiwygToolbarsPresets.full}
    />
  );
}
```

## Options and API

The hook requires an options object (`{}` is valid). It accepts `preset`, `md`,
`handlers`, `config`, `logger`, `mobile`, and `wysiwygConfig`.
`initial` supports `markup` and `toolbarVisible`. `experimental` excludes
`beforeEditorModeChange` and `prepareRawMarkup`.

Presets: `zero`, `commonmark`, `default`, `yfm`, `full` (default).
Defaults: empty document, toolbar and search enabled, mobile disabled.

The instance provides `focus`, `hasFocus`, `getValue`, `isEmpty`, `clear`, `replace`,
`prepend`, `append`, `insert`, and `moveCursor`. Cursor targets are `'start'`, `'end'`,
or `{line: number}` (zero-based). `getValue` is stable and works without `this`.
It also provides `logger`, readonly `toolbarVisible`, and `on/off` for events.

Events: `change`, `cancel`, and `submit` carry `null`; `toolbar-action` carries
`editorMode: 'wysiwyg'`; `change-toolbar-visibility` reports toolbar visibility.

## Context and custom toolbars

`MarkdownWysiwygEditorProvider` accepts an instance or `null`.
`useMarkdownWysiwygEditorContext()` returns it, or `null` without a Provider.
Use `on/off` to track editor events; the context hook does not subscribe to them.
View uses `props.editor` before context and throws if both are missing.
Its toolbar and React-rendered extensions receive that same instance.

Register custom toolbar components as `ToolbarDataType.ReactComponent`.
They receive `editor: ActionStorage`, `focus`, and `onClick` from their own toolbar;
`useToolbarContext()` is also available. For document operations such as `append`
or `getValue`, use `useMarkdownWysiwygEditorContext()`. To share a component with
the dual-mode editor, pass callbacks bound to the same instance as the View.

Do not fall back to `useMarkdownEditorContext()`: it can return an outer editor
and change the wrong document. The standalone View does not provide that context,
and its instance cannot replace the full API in `MarkdownEditorProvider`.

## Lifetime and View props

`useMarkdownWysiwygEditor(options, deps = [])` reads options once per instance.
Only changes to `deps` create a new instance and reset its document, settings,
and subscriptions. Stop using old references after this change or hook unmount.
Pending uploads cannot update the new instance; their requests are not cancelled.
Unmounting only the View keeps the document and undo history.
Only one View may be mounted per instance; other consumers can share the Provider.

`stickyToolbar` is required. View supports `autofocus`, `qa`, `className`, and an
`HTMLDivElement` ref. `settingsVisible` accepts a boolean or `['toolbar']`.
Use `contenteditableAttributes` to set attributes such as `aria-label`, `lang`, or `spellcheck`.
`toolbarsPreset` configures main, hidden, selection, and slash toolbars with the
existing item format. On mobile, the main toolbar scrolls horizontally.
View props can change without replacing the instance.

## Errors

Initialization errors reach the caller. After initialization, React render errors
show **Show text as Markdown**. This button reads the current document and displays
Markdown in a readonly text area for copying. If conversion fails, it shows an error.
This screen does not handle errors from event handlers or async operations.

See the [example with a shared Provider](../demo/src/stories/examples/wysiwyg-only/WysiwygOnly.tsx)
and the [render error example](../demo/src/stories/examples/wysiwyg-only/WysiwygBroken.tsx).
