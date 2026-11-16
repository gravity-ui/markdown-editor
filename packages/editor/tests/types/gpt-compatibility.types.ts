import {createElement} from 'react';

import type {Extension} from '@codemirror/state';
import {
    type GptWidgetOptions as PackageOptions,
    createGptExtension,
} from '@gravity-ui/markdown-editor-gpt-extension';

import {
    type ExtensionBuilder,
    type GptWidgetOptions,
    gptExtension,
    mGptExtension,
    mGptToolbarItem,
    wGptItemData,
} from '../../src';
import {getReactRendererFromState} from '../../src/react-renderer';

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
    createGptExtension(getReactRendererFromState)(builder, packageOptions);
    const extensions: Extension = mGptExtension(legacyOptions);
    return {extensions, mGptToolbarItem, wGptItemData};
}

export function shouldRejectIncompatibleOptions(options: GptWidgetOptions<Answer, Prompt>) {
    // @ts-expect-error Preset payloads must preserve the consumer's prompt type.
    options.promptPresets = [{key: 'wrong', display: 'Wrong', data: 42}];
    // @ts-expect-error Answers must include the consumer's required fields.
    options.onTryAgain = async () => ({rawText: 'missing request id'});
}

export function shouldPreserveExtensionBuilderType(builder: Parameters<typeof gptExtension>[0]) {
    const fullBuilder: ExtensionBuilder = builder;
    return fullBuilder;
}
