##### Getting started / Shadow DOM styles

## How to Style the Editor Inside a Shadow Root

Document stylesheets do not reach a shadow root, so the editor CSS has to be attached to the root itself. The `@gravity-ui/markdown-editor/shadow-styles` subpath publishes that CSS:

| Export               | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| `cssText`            | The editor CSS together with the CSS of the bundled `@diplodoc` extensions |
| `createStyleSheet()` | A `CSSStyleSheet` with `cssText` already applied                           |

### Adopt a constructed stylesheet

```ts
import {createStyleSheet} from '@gravity-ui/markdown-editor/shadow-styles';

const editorStyleSheet = createStyleSheet();

const shadowRoot = host.attachShadow({mode: 'open'});
shadowRoot.adoptedStyleSheets = [editorStyleSheet];
```

A sheet can be adopted by any number of shadow roots of the document it was created in; another document rejects it with `NotAllowedError`. Each call parses the CSS anew, so create the sheet once per document.

### Insert a style element

`new CSSStyleSheet()` is available in current browsers only; elsewhere `cssText` goes into a `<style>` element:

```ts
import {cssText} from '@gravity-ui/markdown-editor/shadow-styles';

const style = document.createElement('style');
style.textContent = cssText;
shadowRoot.append(style);
```

### Mount the editor under a theme class

The YFM theme selectors are built as `.g-root_theme_* .yfm`, so the editor needs an ancestor with the theme class inside the shadow root. `scoped` puts the theme classes on the element `ThemeProvider` renders; without it they go to `document.body`, outside the root:

```tsx
<ThemeProvider theme={theme} scoped>
    <MarkdownEditorView editor={editor} stickyToolbar />
</ThemeProvider>
```

### Render popups inside the shadow root

UIKit `Portal` picks its container in this order: an explicit `container` prop, then the container from `PortalProvider`, then `document.body`. In `document.body` a popup is outside the shadow root, and the editor CSS does not reach it. The editor renders `Portal` without a container in the YFM table controls: `FloatingPopup` holds the table menus and insert buttons, `InsertCursor` draws the insert line. UIKit popups of the toolbar take the container the same way.

Put a `<div>` inside the shadow root, outside the scrollable area of the editor, and pass a ref to it to `PortalProvider`. The full integration:

```tsx
import {useEffect, useRef, useState} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {createStyleSheet} from '@gravity-ui/markdown-editor/shadow-styles';
import {PortalProvider, ThemeProvider} from '@gravity-ui/uikit';
import {createPortal} from 'react-dom';

const editorStyleSheet = createStyleSheet();

export function ShadowEditor({markup}: {markup: string}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const portalContainerRef = useRef<HTMLDivElement>(null);
    const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
    const editor = useMarkdownEditor({initial: {markup, mode: 'wysiwyg'}});

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const root = host.shadowRoot ?? host.attachShadow({mode: 'open'});
        root.adoptedStyleSheets = [editorStyleSheet];
        setShadowRoot(root);
    }, []);

    return (
        <div ref={hostRef}>
            {shadowRoot &&
                createPortal(
                    <ThemeProvider theme="light" scoped>
                        <PortalProvider container={portalContainerRef}>
                            <div style={{height: 400, overflow: 'auto'}}>
                                <MarkdownEditorView editor={editor} stickyToolbar />
                            </div>
                            <div ref={portalContainerRef} />
                        </PortalProvider>
                    </ThemeProvider>,
                    shadowRoot,
                )}
        </div>
    );
}
```

`PortalProvider` does not control the following:

- elements that code appends to `document.body` directly, such as the drag preview of table rows and columns;
- separate React roots, which do not receive the provider context;
- portals with an explicit `container`.

### What `cssText` leaves out

- **`@gravity-ui/uikit` styles.** Attach `@gravity-ui/uikit/styles/styles.css` to the shadow root the same way, in the version the application uses.
- **LaTeX CSS.** `@diplodoc/latex-extension/runtime/styles` is loaded on demand by the extension; attach it separately where LaTeX is enabled.

### Scope of the export

The subpath provides CSS only; it does not confirm that every editor feature works inside a shadow root.
