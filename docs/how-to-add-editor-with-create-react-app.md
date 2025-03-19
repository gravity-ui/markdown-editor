##### Getting started / Create react app

## Installation Guide

### 1. Setting Up the Environment for the React Application
First, set up the environment for React. In this example, we will use Create React App:

```bash
npx create-react-app markdown-editor --template gravity-ui-pure && cd markdown-editor
```
Ensure that the `typescript` version in `devDependencies` matches the version specified in `overrides` in `package.json`. If there is a mismatch, update it by running:

```bash
npm install typescript@<version_from_overrides> --save-dev
```

### 2. Installing the Markdown editor
Install the Markdown editor

```bash
npm install @gravity-ui/markdown-editor
```

### 3. Install peer dependencies
Ensure that you have the necessary dependencies listed in [peerDependencies](https://github.com/gravity-ui/markdown-editor/blob/main/package.json) and install it. Include the following packages:
- `@diplodoc/transform`
- `highlight.js`
- `katex`
- `lowlight`
- `markdown-it`

### 4. Configuring the application
Add the `Editor.tsx`:

```tsx
import React from 'react';
import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

export function Editor({onSubmit}: any) {
    const editor = useMarkdownEditor({
        md: {
            html: false,
        },
    });

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

Update the `App.tsx` with `Editor` component:

```tsx
import {ThemeProvider, Toaster, ToasterProvider} from '@gravity-ui/uikit';

import {Editor} from './Editor';

const toaster = new Toaster();

const App = () => {
    return (
        <ThemeProvider theme="light">
            <ToasterProvider toaster={toaster}>
                <Editor onSubmit={(value: any) => console.log(value)} />
            </ToasterProvider>
        </ThemeProvider>
    );
};

export default App;
````

### 5. Configuring Webpack
To prevent errors related to missing polyfills for Node.js core modules in Webpack 5, such as:

- `Can't resolve 'process'`
- `Can't resolve 'fs'`
- `Can't resolve 'path'`
- `Can't resolve 'url'`

These errors occur because Webpack 5 no longer includes polyfills for Node.js modules by default. To fix this, you need to configure [fallback modules](https://webpack.js.org/configuration/resolve/#resolvefallback).

We recommend using CRACO to apply these configurations.

1. Install CRACO:

```bash
npm install @craco/craco
```
2. Create a file called `craco.config.js` in the root of the project and add the following configuration:

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        process: false,
        path: false,
        url: false,
      };
      return webpackConfig;
    },
  },
};
```
3. Update `package.json` to use CRACO for scripts:

```json
{
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test",
    "eject": "react-scripts eject"
  }
}
```
This setup ensures that your project is compatible with Webpack 5 and prevents missing module errors.

6. After these changes, start the development server:

```bash
npm start
```



