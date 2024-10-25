## Connection and Configuration
This document provides instructions for configuring Webpack and Turbopack to avoid issues related to the 'fs' module and for connecting the editor on the nextjs client side. 

### Issue with 'fs' Module Not Found
In order for the `diplodoc/transform` process to function correctly, please add the [webpack resolve-fallbacks](https://webpack.js.org/configuration/resolve/#resolvefallback).

#### Webpack Configuration

Add the following code to your Webpack configuration:

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

#### Turbopack Configuration

If you are using Turbopack, set up the `resolveAlias` as follows:

```
experimental: {
turbo: {
  resolveAlias: {
   fs: './stubs/fs.js',
  },
 },
},
```

Code for stubs/fs.js

```
let fs;

if (typeof window === 'undefined') {
 fs = require('node:fs');
} else {
 fs = {};
}

module.exports = fs;
```

### Server-Side Rendering (SSR)

Since the editor uses [ProseMirror](https://prosemirror.net) and [CodeMirror](https://codemirror.net) libraries that depend on working with the DOM on the client side, errors may occur during the build process. Use the following method to load the editor on the client side:

```
import dynamic from 'next/dynamic';
...
const MarkdownEditor = dynamic(
    () =>
        import('./MarkdownEditor').then(
            (mod) => mod.MarkdownEditor,
        ),
    {
        ssr: false,
    },
);
```


These configurations will help you correctly connect and work with the editor, preventing errors related to the absence of server modules on the client side.

