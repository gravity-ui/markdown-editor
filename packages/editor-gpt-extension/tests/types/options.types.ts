import {createElement} from 'react';

import type {GptRequestData} from '../../src/components/ErrorScreen/types';
import type {GptDialogProps, GptWidgetOptions} from '../../src/types';

type Answer = {rawText: string; id: number};
type Prompt = {kind: 'correct'};
export function shouldPreserveTheDialogContract() {
    const options: GptWidgetOptions<Answer, Prompt> = {
        answerRender: (answer) => createElement('span', null, answer.id),
        onCustomPromptApply: async (request) => {
            const data: GptRequestData<Prompt> = request;
            return {rawText: data.markup, id: 1};
        },
    };
    const dialog: GptDialogProps<Answer, Prompt> = {
        ...options,
        markup: '',
        onApplyResult: () => {},
    };
    // @ts-expect-error The apply callback is required for a standalone dialog.
    const invalid: GptDialogProps<Answer, Prompt> = {...options, markup: ''};
    return {dialog, invalid};
}
