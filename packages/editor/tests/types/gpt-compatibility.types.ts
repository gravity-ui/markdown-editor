import {createElement} from 'react';

import type {Extension} from '@codemirror/state';
import type {GptWidgetOptions as PackageOptions} from '@gravity-ui/markdown-editor-gpt-extension';

import {
    type ExtensionBuilder,
    type GptWidgetOptions,
    gptExtension,
    mGptExtension,
    mGptToolbarItem,
    wGptItemData,
} from '../../src';

type Answer = {rawText: string; requestId: string};
type Prompt = {scenario: 'correct'};

export function shouldPreserveLegacyGptOptionsAndEntryPoints(builder: ExtensionBuilder) {
    const options: GptWidgetOptions<Answer, Prompt> = {
        answerRender: (answer) => createElement('span', null, answer.requestId),
        promptPresets: [{key: 'correct', display: 'Correct', data: {scenario: 'correct'}}],
        onPromptPresetClick: async ({markup, promptData}) => ({
            rawText: markup,
            requestId: promptData?.scenario ?? 'custom',
        }),
        onUpdate: (answer) => {
            const id: string | undefined = answer?.requestId;
            return id;
        },
    };
    const packageOptions: PackageOptions<Answer, Prompt> = options;
    const legacyOptions: GptWidgetOptions<Answer, Prompt> = packageOptions;
    gptExtension(builder, legacyOptions);
    const extensions: Extension = mGptExtension(legacyOptions);
    return {extensions, mGptToolbarItem, wGptItemData};
}
