# Sticky toolbar

A sticky toolbar stays near the top when you scroll.
This guide explains how to turn it on and how it works.

## Turn on the sticky toolbar

Set `stickyToolbar` to `true`:

```tsx
import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

function MyEditor() {
  const editor = useMarkdownEditor({preset: 'default'});

  return <MarkdownEditorView editor={editor} stickyToolbar={true} className="my-editor" />;
}
```

Set `stickyToolbar={false}` to turn it off.
The settings area still uses CSS sticky positioning.
It does not get the active background and border when the toolbar is off.

`MarkdownEditorView` requires this prop.
`MarkupEditorView` and `WysiwygEditorView` use `true` if you do not set it.

## Set the top space

Use `--g-md-toolbar-sticky-offset` when your page has a header above the editor.
The toolbar uses this value plus an extra `8px`.

For example, leave space for a `48px` page header:

```css
.my-editor {
  --g-md-toolbar-sticky-offset: 48px;
}
```

The toolbar stops `56px` from the top in this example.

You can also change these CSS variables:

| Variable                        | What it changes                                          | CSS fallback                                  |
| ------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| `--g-md-toolbar-sticky-offset`  | Space above the toolbar, before the extra `8px`          | `0px`                                         |
| `--g-md-toolbar-sticky-padding` | Space inside the toolbar when it is active               | No fallback                                   |
| `--g-md-toolbar-sticky-inset`   | Position of the background and border around the toolbar | `-4px`                                        |
| `--g-md-toolbar-sticky-border`  | Border around the active toolbar                         | `1px solid var(--g-color-line-generic-solid)` |

A fallback is the value that CSS uses when you do not set a variable.
CSS padding cannot be negative.
See [Editor customization](./how-to-customize-the-editor.md) for other variables.

## How it works

### Position and active styles

CSS sets `position: sticky` on the toolbar.
Its top position is:

```css
top: calc(var(--g-md-toolbar-sticky-offset, 0px) + 8px);
```

The `useSticky` hook checks the toolbar position.
A hook is a React function that tracks state.
This hook returns `true` when the toolbar reaches its top position:

```ts
const rectTop = elem.getBoundingClientRect().top;
const stickyTop = parseInt(getComputedStyle(elem).top, 10);
const stickyActive = rectTop <= stickyTop;
```

The hook checks once after the element appears.
It checks again after events such as scroll and resize.
It listens on `window`.
It also receives scroll events from elements inside the page.
It waits for the next animation frame before each new check.

The active toolbar has a background, a border, and `z-index: 2000`.
The background and border use a `::before` pseudo-element.
A pseudo-element is a CSS box that needs no extra HTML element.

The toolbar and settings area share this style.
When both are visible, their backgrounds meet without a border between them.
Without a visible toolbar, the settings area does not get the active style.

### Menus above the toolbar

`z-index` controls which box appears above another box.
The toolbar has a `data-layout="sticky-toolbar"` marker.
The `useTargetZIndex` hook finds this marker and reads its `z-index`.

The hook adds `10` by default.
With the default active style, menus get `z-index: 2010`.
The hook returns `undefined` if it finds no marker.
It also returns `undefined` if the value is not a positive number.

The lookup uses the first matching marker in the document.
With several editors, it can read a toolbar from another editor.
Keep this in mind when you add custom toolbar styles.

### Move to a line

`moveToLine` leaves space above the target line.
This space helps keep the line below the toolbar.

The internal `getTopOffset` helper adds:

```text
sticky offset + 8px above the toolbar + 36px toolbar height + 8px below it
```

It reads `--g-md-toolbar-sticky-offset` from the editor element.
It uses a hidden element to turn the CSS value into pixels.
Set this variable to a value in pixels, such as `0px` or `48px`.
The helper does not use the CSS fallback from the toolbar rule.

Markdown mode passes this space to CodeMirror when it scrolls.
WYSIWYG mode uses `window.scrollTo`.
Both modes use this space even when `stickyToolbar` is `false`.
The helper does not check the active state or measure the toolbar height.

## Current limits

- Inside a scroll container, CSS can keep the toolbar at the top of that container.
  But `useSticky` compares its position with the top of the browser view.
  The active styles can be wrong if the container starts lower on the page.
- `useSticky` uses `parseInt`, so it drops the decimal part of the top value.
  A value with a decimal part, such as `8.5px`, can give the wrong active state.
- With `top: auto`, `useSticky` returns `false`.
- In WYSIWYG mode, `moveToLine` scrolls the window.
  It does not scroll a separate container.

## Check a problem

| Problem                                              | What to check                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| The toolbar does not stay at the top                 | Check `stickyToolbar`, `position` and `top` values in the browser, and the parent scroll container. |
| The toolbar stays at the top but has no active style | Check the limits above, especially scroll containers and top values with a decimal part.            |
| A menu appears below the toolbar                     | Check the marker, the `z-index` value in the browser, and other editors on the page.                |
| A line moves under the toolbar                       | Check the offset on the editor element and the fixed `36px` toolbar height.                         |

## Source code

- [Sticky CSS](../packages/editor/src/bundle/sticky/sticky.scss): position, background, border, and CSS variables.
- [Sticky classes](../packages/editor/src/bundle/sticky/index.ts): toolbar and settings styles.
- [Active state](../packages/editor/src/react-utils/useSticky.ts): position checks and event listeners.
- [Menu hook](../packages/editor/src/react-utils/useTargetZIndex.ts) and [marker lookup](../packages/editor/src/utils/get-target-z-index.ts): menu `z-index`.
- [Editor view](../packages/editor/src/bundle/MarkdownEditorView.tsx): the prop and settings behavior.
- [Editor](../packages/editor/src/bundle/Editor.ts): line scrolling and top space.
