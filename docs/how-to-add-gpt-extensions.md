## How to add GPT extensions to editor

### 1. Add extension usage to extension builder 

    gptExtension - import from current library.

```ts
    import {gptExtension} from '@gravity-ui/markdown-editor';

    builder.use(
        gptExtension,
        // The next step add gptWidgetProps,
    )          
```
### 2. Add gpt extensions props

    gptWidgetProps - list of props that the extension accepts

```ts
    import {gptExtension, type GptWidgetOptions} from '@gravity-ui/markdown-editor';

    // GptWidgetOptions: {
    //     answerRender: (data: CommonAnswer) => JSX.Element,
    //     customPromptPlaceholder?: string | undefined,
    //     disabledPromptPlaceholder?: string | undefined,
    //     promptPresets?: PromptPreset<unknown>[] | undefined,
    //     onCustomPromptApply?: ((data: GptRequestData<unknown>) => Promise<CommonAnswer | undefined>) | undefined,
    //     onPromptPresetClick?: ((data: GptRequestData<unknown>) => Promise<CommonAnswer | undefined>) | undefined,
    //     onTryAgain?: ((data: GptRequestData<unknown>) => Promise<CommonAnswer | undefined>) | undefined,
    //     onLike?: ((data: GptRequestData<unknown>) => Promise<void>) | undefined,
    //     onDislike?: ((data: GptRequestData<unknown>) => Promise<void>) | undefined
    //     onUpdate?: ((value: CommonAnswer | undefined) => void) | undefined,
    // }

    const gptWidgetProps: GptWidgetOptions = {
        // add params
    }

    builder.use(
        gptExtension,
        gptWidgetProps, // use params
    )        
```

#### Example of implementation.

    setYfmRaw - a setter to change the text in the editor

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
            showedGptAlert: boolean;
            onCloseGptAlert?: () => void;
            message?: string;
            theme?: AlertProps["theme"];
            className?: string;
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
        onLike: async () => {
            console.log('Like');
        },
        onDislike: async () => {
            console.log('Disike');
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

#### add in tool bar

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
#### add in menu bar
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

#### add in command menu config (/)
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
