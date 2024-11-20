##### Create react app

## Installation Guide

### 1. Setting Up the Environment for the React Application
First, set up the environment for React. In this example, we will use Create React App:

```bash
npx create-react-app markdown-editor --template typescript
cd markdown-editor
```

### 2. Installing the Markdown editor
Install the Markdown editor

```bash
npm install @gravity-ui/markdown-editor
```

### 3. Installing dependencies
Ensure that you have the necessary dependencies listed in peerDependencies. Include the following packages:
- `@diplodoc/transform`
- `react`
- `react-dom`
- `@gravity-ui/uikit`
- `@gravity-ui/components`

Check the peerDependencies section in the `package.json` file to ensure all necessary dependencies are installed correctly.

To install the dependencies, use:

```bash
npm install @diplodoc/transform react react-dom @gravity-ui/uikit @gravity-ui/components
```

### 4. Configuring Webpack
In order for the `diplodoc/transform` process to function correctly, please add the [webpack resolve-fallbacks](https://webpack.js.org/configuration/resolve/#resolvefallback).

To accomplish this, please install CRACO and configure it follow the instructions below:

1. Install CRACO:

```bash
npm install @craco/craco
```
2. Create a file called craco.config.js in the root of the project and add the following configuration:

```javascript
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        process: false,
        path: false,
      };
      return webpackConfig;
    },
  },
};
```
3. Update package.json to use craco for scripts:

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
### 5. Configuring the application
Add ThemeProvider to App:

```ts
import { ThemeProvider } from '@gravity-ui/uikit';

// ...
function App() {
  return (
    <ThemeProvider theme="light">
      <Editor onSubmit={(value) => console.log(value)} />
    </ThemeProvider>
  );
}
```
Add the Editor component to App:

```ts
import React from 'react';
import { useMarkdownEditor, MarkdownEditorView } from '@gravity-ui/markdown-editor';
import { toaster } from '@gravity-ui/uikit/toaster-singleton-react-18';

function Editor({ onSubmit }) {
  const editor = useMarkdownEditor({ allowHTML: false });

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
Add styles:

```ts
import '@gravity-ui/uikit/styles/styles.css';
```
