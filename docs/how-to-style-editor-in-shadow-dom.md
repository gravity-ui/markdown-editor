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

### What `cssText` leaves out

- **`@gravity-ui/uikit` styles.** Attach `@gravity-ui/uikit/styles/styles.css` to the shadow root the same way, in the version the application uses.
- **LaTeX CSS.** `@diplodoc/latex-extension/runtime/styles` is loaded on demand by the extension; attach it separately where LaTeX is enabled.
