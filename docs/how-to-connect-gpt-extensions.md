## How to connect GPT extensions to editor

First to integrate this extension, you need to use the following versions of the packages:

    @gravity-ui/markdown-editor version 13.18.0 or higher

### 1. Add extension usage to extension builder 

```ts
    import {gptExtension} from '@gravity-ui/markdown-editor';

    builder.use(
        gptExtension,
        // The next step add gptWidgetProps,
    )          
```
### 2. Add gpt extensions props

```ts
    import {gptExtension, type GptWidgetOptions} from '@gravity-ui/markdown-editor';

    const gptWidgetProps: GptWidgetOptions = {
        // add params
    }

    builder.use(
        gptExtension,
        gptWidgetProps, // use params
    )        
```

#### Example of implementation

    setYfmRaw - a setter to change the text in an editor

    gptRequestHandler - your function to implement GPT response
    
```ts
    import {gptExtension, type GptWidgetOptions} from '@gravity-ui/markdown-editor';

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

    const gptWidgetProps: GptWidgetOptions = {
        answerRender: (data) => <div>{data.rawText}</div>,
        customPromptPlaceholder: 'Ask Yandex GPT to edit the text highlighted text',
        disabledPromptPlaceholder: 'Ask Yandex GPT to generate the text',
        gptAlertProps: {
            showedGptAlert: true;
            onCloseGptAlert: () => {};
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
            setYfmRaw(markup);
        },
        onUpdate: (event) => {
            if (event?.rawText) {
                setYfmRaw(event.rawText);
            }
        },
    }

    builder.use(
        gptExtension,
        gptWidgetProps,
    )                
```

### 3. Add extension to menubar and toolbar and command menu config for editor

#### Add in tool bar

```ts
    import {
        wGptToolbarItem, 
        wysiwygToolbarConfig, 
        MarkdownEditorView, 
        useMarkdownEditor
    } from '@gravity-ui/markdown-editor';
    
    wysiwygToolbarConfig.unshift([wGptToolbarItem]);

    const mdEditor = useMarkdownEditor({
       // editor options
    })

    <MarkdownEditorView
        ...
        wysiwygToolbarConfig={wysiwygToolbarConfig}
        editor={mdEditor}
        ...
    />
```
#### Add in menu bar
```ts
    import {
        wGptToolbarItem, 
        wysiwygToolbarConfig, 
        wysiwygToolbarConfigs, 
        MarkdownEditorView,
        useMarkdownEditor
    } from '@gravity-ui/markdown-editor';

    const wSelectionMenuConfig = [[wGptToolbarItem], ...wysiwygToolbarConfigs.wSelectionMenuConfig];

    const mdEditor = useMarkdownEditor({
        ...
        extensionOptions: {
            selectionContext: {config: wSelectionMenuConfig},
        },
        ...
    })

    <MarkdownEditorView
        ...
        editor={mdEditor}
        ...
    />
```

#### Add in command menu config (/)
```ts
    import {  
        wysiwygToolbarConfigs, 
        MarkdownEditorView,
        useMarkdownEditor
    } from '@gravity-ui/markdown-editor';

    const wCommandMenuConfig = wysiwygToolbarConfigs.wCommandMenuConfig // main commands

    wCommandMenuConfig.unshift(wysiwygToolbarConfigs.wGptItemData); // add gpt command

    const mdEditor = useMarkdownEditor({
        ...
        extensionOptions: {
            commandMenu: {actions: wCommandMenuConfig},
        },
        ...
    })

    <MarkdownEditorView
        ...
        editor={mdEditor}
        ...
    />

```

### 4. Done, You can use the extension!
