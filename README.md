![Markdown Editor](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46)

# @gravity-ui/markdown-editor &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-editor)](https://www.npmjs.com/package/@gravity-ui/markdown-editor) [![CI](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/ci.yml?branch=main&label=CI)](https://github.com/gravity-ui/markdown-editor/actions/workflows/ci.yml?query=branch:main) [![Release](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/release.yml?branch=main&label=Release)](https://github.com/gravity-ui/markdown-editor/actions/workflows/release.yml?query=branch:main) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685)](https://preview.gravity-ui.com/md-editor/)

## Markdown wysiwyg and markup editor

MarkdownEditor is a powerful tool for working with Markdown, which combines WYSIWYG and Markup modes. This means that you can create and edit content in a convenient visual mode, as well as have full control over the markup.

### 🔧 Main features

- Support for the basic Markdown and [YFM](https://ydocs.tech) syntax.
- Extensibility through the use of ProseMirror and CodeMirror engines.
- The ability to work in WYSIWYG and Markup modes for maximum flexibility.

## Install

```shell
npm install @gravity-ui/markdown-editor
```

### Required dependencies

Please note that to start using the package, your project must also have the following installed: `@diplodoc/transform`, `react`, `react-dom`, `@gravity-ui/uikit`, `@gravity-ui/components` and some others. Check out the `peerDependencies` section of `package.json` for accurate information.

## Getting started

The markdown editor is supplied as a React hook to create an instance of editor and a component for rendering the view.\
To set up styling and theme see [UIKit docs](https://github.com/gravity-ui/uikit?tab=readme-ov-file#styles).

```tsx
import React from 'react';
import {useMarkdownEditor, MarkdownEditorView} from '@gravity-ui/markdown-editor';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

function Editor({onSubmit}) {
  const editor = useMarkdownEditor({allowHTML: false});

  React.useEffect(() => {
    function submitHandler() {
      // Serialize current content to markdown markup
      const value = editor.getValue();
      onSubmit(value);
    }

    editor.on('submit', submitHandler);
    return () => {
      editor.off('submit', submitHandler);
    };
  }, [onSubmit]);

  return <MarkdownEditorView stickyToolbar autofocus toaster={toaster} editor={editor} />;
}
```
Read more:
- [How to connect the editor in the Create React App](docs/how-to-add-editor-with-create-react-app.md)
- [How to add preview for markup mode](docs/how-to-add-preview.md)
- [How to add HTML extension](docs/how-to-connect-html-extension.md)
- [How to add Latex extension](docs/how-to-connect-latex-extension.md)
- [How to add Mermaid extension](docs/how-to-connect-mermaid-extension.md)
- [How to write extension](docs/how-to-create-extension.md)
- [How to add GPT extension](docs/how-to-connect-gpt-extensions.md)


### i18n

To set up internationalization, you just need to use the `configure`:

```typescript
import {configure} from '@gravity-ui/markdown-editor';

configure({
  lang: 'ru',
});
```

Don't forget to call `configure()` from [UIKit](https://github.com/gravity-ui/uikit?tab=readme-ov-file#i18n) and other UI libraries.

## Development

To start the dev storybook

```shell
npm start
```
