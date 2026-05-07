# @gravity-ui/markdown-editor-latex-extension &middot; [![npm package](https://img.shields.io/npm/v/@gravity-ui/markdown-editor-latex-extension)](https://www.npmjs.com/package/@gravity-ui/markdown-editor-latex-extension)

LaTeX extension for [@gravity-ui/markdown-editor](https://github.com/gravity-ui/markdown-editor). Provides support for mathematical expressions using LaTeX/KaTeX syntax in both inline and block formats.

## Installation

```bash
npm install @gravity-ui/markdown-editor @gravity-ui/markdown-editor-latex-extension @diplodoc/latex-extension
```

## Usage

### Basic Setup

```typescript
import {useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {LatexExtension} from '@gravity-ui/markdown-editor-latex-extension';

const editor = new useMarkdownEditor({
  wysiwygConfig: {
    extensions: (builder) => {
      builder
        .use(LatexExtension, {
          loadRuntimeScript: () => {
            import('@diplodoc/latex-extension/runtime');
            import('@diplodoc/latex-extension/runtime/styles');
          },
        });
    },
  },
});
```

## Peer Dependencies

- `@gravity-ui/markdown-editor` (^15.38.1)
- `@gravity-ui/uikit` (^7.1.0)
- `@diplodoc/latex-extension` (^1.0.3)
- `katex` (^0.16.9)
- `markdown-it` (^13.0.0)
- `react` (^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0)
- `react-dom` (^16.14.0 || ^17.0.0 || ^18.0.0 || ^19.0.0)

## License

MIT
