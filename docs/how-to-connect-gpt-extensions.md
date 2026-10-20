##### Extensions / GPT

## How to connect GPT extensions to editor

First to integrate this extension, you need to use the following versions of the packages:

    @gravity-ui/markdown-editor version 15.48.0 or higher


Features:

<img src="https://raw.githubusercontent.com/gravity-ui/markdown-editor/refs/heads/main/docs/assets/gifs/custom-prompt-preset-gpt.gif" width="470"/>


<img src="https://raw.githubusercontent.com/gravity-ui/markdown-editor/refs/heads/main/docs/assets/gifs/prompt-preset-gpt.gif" width="470"/>

### 1. Add extension usage and extensions props

```ts
import React from 'react';

import {
    MarkdownEditorView,
    gptExtension,
    mGptExtension,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

export const Editor: React.FC<EditorProps> = (props) => {
    // add a plugin to the markup mode
    const markupGptExtension = mGptExtension(gptWidgetProps);

    const mdEditor = useMarkdownEditor({
        // ...

        markupConfig: {
            extensions: markupGptExtension,
        },

        extraExtensions: (builder) =>
            builder.use(
                ...
                // add GPT extension
                gptExtension,
                // The next step we show implementation gptWidgetProps
                gptWidgetProps,
            ),
    });

    return <MarkdownEditorView
        ...
        editor={mdEditor}
    />
};
```
### 2. Implementation ```gptWidgetProps```

```ts
import React from 'react';
import {type GptWidgetOptions} from '@gravity-ui/markdown-editor';

// Your function to implement GPT response
const gptRequestHandler = async ({
    markup,
    customPrompt,
    promptData,
}: {
    markup: string;
    customPrompt?: string;
    promptData: unknown;
}) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let gptResponseMarkup = markup;

    if (customPrompt) {
        gptResponseMarkup = markup + ` \`enhanced with ${customPrompt}\``;
    } else if (promptData === 'do-uno-reverse') {
        gptResponseMarkup = gptResponseMarkup.replace(/[\wа-яА-ЯёЁ]+/g, (match) =>
            match.split('').reverse().join(''),
        );
    } else if (promptData === 'do-shout-out') {
        gptResponseMarkup = gptResponseMarkup.toLocaleUpperCase();
    }

    return {
        rawText: gptResponseMarkup,
    };
};

function renderAnswer(data: {rawText: string}) {
    return <div>{data.rawText}</div>;
}

export const gptWidgetProps: GptWidgetOptions = {
    answerRender: renderAnswer,
    customPromptPlaceholder: 'Ask Yandex GPT to edit the text highlighted text',
    disabledPromptPlaceholder: 'Ask Yandex GPT to generate the text',
    gptAlertProps: {
        showedGptAlert: true,
        onCloseGptAlert: () => {},
    },
    promptPresets: [
        {
            hotKey: 'control+3',
            data: 'do-uno-reverse',
            display: 'Use the uno card',
            key: 'do-uno-reverse',
        },
        {
            hotKey: 'control+4',
            data: 'do-shout-out',
            display: 'Make the text flashy',
            key: 'do-shout-out',
        },
    ],
    onCustomPromptApply: async ({markup, customPrompt, promptData}) => {
        return gptRequestHandler({markup, customPrompt, promptData});
    },
    onPromptPresetClick: async ({markup, customPrompt, promptData}) => {
        return gptRequestHandler({markup, customPrompt, promptData});
    },
    onTryAgain: async ({markup, customPrompt, promptData}) => {
        return gptRequestHandler({markup, customPrompt, promptData});
    },
    onApplyResult: (markup) => {
        // add your callback for apply GPT result text
        console.log(markup);
    },
    onUpdate: (event) => {
        if (event?.rawText) {
            // add your callback for any text updates
            console.log(event.rawText);
        }
    },
    onLike: async () => {}, // function to track feedback for good
    onDislike: async () => {}, // and bad GPT answers
};
```
### 3. Add the GPT button to the toolbars

The button is declared once in the [toolbars preset](./how-to-customize-toolbars.md) and placed into every toolbar that needs it: the main toolbars of both modes, the selection toolbar and the slash menu. The example extends the built-in `full` preset; the main toolbars come only from the preset, so extend the one matching your editor preset. The button in the markup toolbar works through `mGptExtension` from step 1.

```tsx
import {MarkdownEditorView, type ToolbarsPreset} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    full,
    gptItemMarkup,
    gptItemView,
    gptItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.gpt]: {view: gptItemView, wysiwyg: gptItemWysiwyg, markup: gptItemMarkup},
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygMain]: [[Action.gpt], ...full.orders[Toolbar.wysiwygMain]],
        [Toolbar.markupMain]: [[Action.gpt], ...full.orders[Toolbar.markupMain]],
        [Toolbar.wysiwygSelection]: [[Action.gpt], ...full.orders[Toolbar.wysiwygSelection]],
        [Toolbar.wysiwygSlash]: [[Action.gpt, ...full.orders[Toolbar.wysiwygSlash].flat()]],
    },
};

export const Editor: React.FC<EditorProps> = (props) => {
    ...

    return <MarkdownEditorView
        ...
        editor={mdEditor}
        toolbarsPreset={toolbarsPreset}
    />
};
```
### 4. Done, You can use the extension!

Вelow is an example of all code in one place

```tsx
import React from 'react';

import {
    MarkdownEditorView,
    type ToolbarsPreset,
    gptExtension,
    mGptExtension,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    full,
    gptItemMarkup,
    gptItemView,
    gptItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

import {gptWidgetProps} from './gptWidgetProps';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.gpt]: {view: gptItemView, wysiwyg: gptItemWysiwyg, markup: gptItemMarkup},
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygMain]: [[Action.gpt], ...full.orders[Toolbar.wysiwygMain]],
        [Toolbar.markupMain]: [[Action.gpt], ...full.orders[Toolbar.markupMain]],
        [Toolbar.wysiwygSelection]: [[Action.gpt], ...full.orders[Toolbar.wysiwygSelection]],
        [Toolbar.wysiwygSlash]: [[Action.gpt, ...full.orders[Toolbar.wysiwygSlash].flat()]],
    },
};

export const Editor: React.FC<EditorProps> = (props) => {
    const mdEditor = useMarkdownEditor({
        // ...
        // the markup mode button needs the markup extension
        markupConfig: {
            extensions: mGptExtension(gptWidgetProps),
        },
        extraExtensions: (builder) => {
            builder.use(
                ...
                // Add GPT extension
                gptExtension,
                // How to make gptWidgetProps, we will tell you in the next chapter
                gptWidgetProps,
            );
        },
    });

    return <MarkdownEditorView
        ...
        editor={mdEditor}
        toolbarsPreset={toolbarsPreset}
        ...
    />
};
```
