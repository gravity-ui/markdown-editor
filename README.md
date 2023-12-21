# @doc-tools/yfm-editor &middot; [![npm package](https://img.shields.io/npm/v/@doc-tools/yfm-editor)](https://www.npmjs.com/package/@doc-tools/yfm-editor) [![CI](https://img.shields.io/github/actions/workflow/status/yandex-cloud/yfm-editor/ci.yml?branch=master&label=CI&logo=github)](https://github.com/yandex-cloud/yfm-editor/actions/workflows/ci.yml?query=branch:master) [![storybook](https://img.shields.io/badge/Storybook-deployed-ff4685)](https://preview.yandexcloud.dev/yfm-editor/)

[YFM](https://ydocs.tech/) WYSIWYG Editor

Preview: https://preview.yandexcloud.dev/yfm-editor/

## Install

```shell
npm install @doc-tools/yfm-editor
```

Ensure that peer dependencies are installed in your project

```shell
npm install react@17 react-dom@17 @diplodoc/transform@4 @gravity-ui/uikit@5 @gravity-ui/components@2 lodash@4
```

## Usage

```js
import {
    YfmEditor,
    BasePreset,
    BehaviorPreset,
    MarkdownBlocksPreset,
    MarkdownMarksPreset,
    YfmPreset,
} from '@doc-tools/yfm-editor';

const domElem = document.querySelector('#editor');

const editor = new YfmEditor({
    domElem,
    linkify: true,
    allowHTML: false,
    extensions: (builder) =>
        builder
            .use(BasePreset, {})
            .use(BehaviorPreset, {})
            .use(MarkdownBlocksPreset, {image: false, heading: false})
            .use(MarkdownMarksPreset, {})
            .use(YfmPreset, {}),
    onDocChange: () => {
        console.log('The contents of the editor have been changed');
    },
});

// Serialize current content in YFM
editor.getValue();
```

### Usage with React

```jsx
import React from 'react';
import {
    Extension,
    BasePreset,
    BehaviorPreset,
    MarkdownBlocksPreset,
    MarkdownMarksPreset,
    useYfmEditor,
    YfmEditorComponent,
    YfmPreset,
} from '@doc-tools/yfm-editor';

export function Editor({initialContent}) {
    const extensions = React.useMemo<Extension>(
        () => (builder) =>
            builder
                .use(BasePreset, {})
                .use(BehaviorPreset, {})
                .use(MarkdownBlocksPreset, {image: false, heading: false})
                .use(MarkdownMarksPreset, {})
                .use(YfmPreset, {}),
        [],
    );

    const editor = useYfmEditor({
        linkify: true,
        allowHTML: false,
        extensions,
        initialContent,
    });

    // Serialize current content in YFM
    editor.getValue();

    return <YfmEditorComponent autofocus editor={editor} />;
}
```

## Development

To start the dev storybook

```shell
npm run dev
```
