# Markdown Editor

[![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-editor?logo=npm)](https://www.npmjs.com/package/@gravity-ui/markdown-editor) [![CI](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/ci.yml?branch=main&label=CI)](https://github.com/gravity-ui/markdown-editor/actions/workflows/ci.yml?query=branch:main) [![Release](https://img.shields.io/github/actions/workflow/status/gravity-ui/markdown-editor/release.yml?branch=main&label=Release)](https://github.com/gravity-ui/markdown-editor/actions/workflows/release.yml?query=branch:main) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685?logo=storybook)](https://preview.gravity-ui.com/md-editor/) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/gravity-ui/markdown-editor)

WYSIWYG and markup editor for Markdown.

<!--GITHUB_BLOCK-->

![Markdown Editor](https://github.com/user-attachments/assets/0b4e5f65-54cf-475f-9c68-557a4e9edb46)

## Resources

### [Website](https://gravity-ui.com/libraries/markdown-editor)

### [Storybook](https://preview.gravity-ui.com/md-editor/)

### [Community](https://t.me/gravity_ui)

<!--/GITHUB_BLOCK-->

## Description

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

  return <MarkdownEditorView stickyToolbar autofocus editor={editor} />;
}
```
Read more:
- [How to connect the editor in the Create React App](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-create-react-app--docs)
- [How to add preview for markup mode](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-getting-started-preview--docs)
- [How to add HTML extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-html-block--docs)
- [How to add Latex extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-latex-extension--docs)
- [How to add Mermaid extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-mermaid-extension--docs)
- [How to write extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-creation--docs)
- [How to add GPT extension](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-extensions-gpt--docs)
- [How to add text binding extension in markdown](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-develop-extension-with-popup--docs)

### Development

1. Install Nodejs environment, version is specified in `.nvmrc` file. We recommend using [NVM](https://github.com/nvm-sh/nvm) or a similar tool.
2. Install [pnpm](https://pnpm.io/installation), version is specified in `package.json` in "packageManager" property.
  
   You can use [Corepack](https://nodejs.org/api/corepack.html), or just install via npm: run `npm deps:global --force`.
3. Install dependencies: `pnpm i`
4. Run storybook dev-server: `pnpm start`


### i18n

To set up internationalization, you just need to use the `configure`:

```typescript
import {configure} from '@gravity-ui/markdown-editor';

configure({
  lang: 'ru',
});
```

Don't forget to call `configure()` from [UIKit](https://github.com/gravity-ui/uikit?tab=readme-ov-file#i18n) and other UI libraries.

### Contributing

- [Contributor Guidelines](https://preview.gravity-ui.com/md-editor/?path=/docs/docs-contributing--docs)
