import React from 'react';

import type {GptWidgetOptions} from '../../src/extensions/yfm/GPT/gptExtension/gptExtension';

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

export const gptWidgetProps = (
    setYfmRaw: (yfmRaw: string) => void,
    gptAlertProps?: GptWidgetOptions['gptAlertProps'],
): GptWidgetOptions => {
    return {
        answerRender: (data) => <div>{data.rawText}</div>,
        customPromptPlaceholder: 'Ask GPT to edit the text highlighted text',
        disabledPromptPlaceholder: 'Ask GPT to generate the text',
        gptAlertProps: gptAlertProps,
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
        onLike: async () => {},
        onDislike: async () => {},
        onApplyResult: (markup) => {
            setYfmRaw(markup);
        },
        onUpdate: (event) => {
            if (event?.rawText) {
                setYfmRaw(event.rawText);
            }
        },
    };
};
