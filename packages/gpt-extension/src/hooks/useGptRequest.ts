import {useCallback, useEffect, useRef, useState} from 'react';

import type {CommonAnswer, GptRequestData} from '../ErrorScreen/types';
import type {GptDialogProps} from '../types';

type RequestState<AnswerData, PromptData> = {
    status: 'idle' | 'loading' | 'answer' | 'error';
    answer?: AnswerData;
    lastRequestData?: GptRequestData<PromptData>;
};

export function useGptRequest<AnswerData extends CommonAnswer, PromptData>(
    onUpdate: GptDialogProps<AnswerData, PromptData>['onUpdate'],
) {
    const [state, setState] = useState<RequestState<AnswerData, PromptData>>({status: 'idle'});
    const revision = useRef(0);
    const mounted = useRef(true);

    const invalidate = useCallback(() => {
        revision.current++;
    }, []);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            invalidate();
        };
    }, [invalidate]);

    const reset = useCallback(() => {
        revision.current++;
        setState({status: 'idle'});
        onUpdate?.(undefined);
    }, [onUpdate]);

    const request = useCallback(
        async (
            handler: GptDialogProps<AnswerData, PromptData>['onPromptPresetClick'],
            data: GptRequestData<PromptData>,
        ) => {
            if (!handler || !mounted.current) return;

            const current = ++revision.current;
            setState({status: 'loading', lastRequestData: data});
            let answer: AnswerData | undefined;
            let failed = false;

            try {
                answer = await handler(data);
            } catch {
                failed = true;
            }

            if (!mounted.current || current !== revision.current) return;

            let status: RequestState<AnswerData, PromptData>['status'] = 'idle';
            if (failed) status = 'error';
            else if (answer) status = 'answer';

            setState({
                status,
                answer,
                lastRequestData: data,
            });
            onUpdate?.(answer);
        },
        [onUpdate],
    );

    return {state, request, reset};
}
