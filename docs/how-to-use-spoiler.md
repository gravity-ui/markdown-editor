##### Extensions / Spoiler

## Spoiler

A spoiler is an inline text mark, like bold or italic. Noise covers the hidden text. A reader opens the text with a click or with the keyboard.

### Syntax

The spoiler uses the inline directive syntax:

```markdown
:spoiler[hidden text]
```

The text in square brackets is regular markdown. It can contain other marks, links and line breaks:

| Markup | Result |
|--------|--------|
| `:spoiler[The answer is 42]` | Hidden plain text |
| `:spoiler[**bold**, *italic* and [a link](https://example.com)]` | Hidden text with marks and a link |
| `Answers: :spoiler[first] and :spoiler[second]` | Two spoilers in one line |

A line break inside a spoiler:

```markdown
:spoiler[first line\
second line]
```

Square brackets in pairs need no escapes. Use `\[`, `\]` and `\\` for single brackets and backslashes. An empty spoiler, `:spoiler[]`, is plain text.

### Editor

The `full` preset includes the `Spoiler` extension. The toolbars, the selection toolbar and the markup mode have the **Spoiler** button.

```ts
import {Spoiler} from '@gravity-ui/markdown-editor';

builder.use(Spoiler);
```

The extension adds the `spoiler` action. The action toggles the mark like other text marks: on the selection, at the cursor for new input, and on mixed ranges. Undo and redo work as usual.

In the WYSIWYG mode the text of a spoiler is visible while the cursor or the selection touches it and the editor has focus. In other cases noise covers the text. This state is a part of the view only. It does not change the document, the markdown or the history.

The markup mode command is `MarkupCommands.toggleSpoiler`.

### Preview

Add the markdown-it plugin to the preview plugins:

```ts
import spoiler from '@gravity-ui/markdown-editor/markdown-it/spoiler';

const plugins = [
    // ...
    spoiler,
];
```

The plugin renders this HTML:

```html
<span class="yfm-spoiler"><span class="yfm-spoiler__content">hidden text</span></span>
```

Call the `useYfmSpoiler` hook with the ref of the preview container. The hook adds the styles and makes hidden spoilers interactive:

```tsx
import {YfmStaticView, useYfmSpoiler} from '@gravity-ui/markdown-editor/view';

function Preview({html}: {html: string}) {
    const ref = useRef<HTMLDivElement>(null);
    useYfmSpoiler(ref);

    return <YfmStaticView ref={ref} html={html} />;
}
```

A hidden spoiler is a button with the "Spoiler" label. A click, <kbd>Enter</kbd> or <kbd>Space</kbd> shows the text. A click on a hidden link shows the text and does not open the link. Links inside a hidden spoiler are skipped by the <kbd>Tab</kbd> key. The shown state is reset when the preview renders new HTML.

### Styles

The noise uses the text color, so it follows the light and dark themes. The noise does not change the size of the text or the line breaks. The animation stops when the user prefers reduced motion. Printed pages show the text.
