import {useCallback, useEffect, useRef, useState} from 'react';

import type {CommonAnswer, GptRequestData} from '../ErrorScreen/types';
import type {GptDialogProps} from '../types';

type Feedback = 'like' | 'dislike';

export function useGptFeedback<AnswerData extends CommonAnswer, PromptData>(
    answer: AnswerData | undefined,
    data: GptRequestData<PromptData> | undefined,
    onLike: GptDialogProps<AnswerData, PromptData>['onLike'],
    onDislike: GptDialogProps<AnswerData, PromptData>['onDislike'],
) {
    const [state, setState] = useState<{type?: Feedback; loading?: Feedback}>({});
    const revision = useRef(0);

    const invalidate = useCallback(() => {
        revision.current++;
    }, []);

    useEffect(() => {
        revision.current++;
        setState({});
        return () => {
            invalidate();
        };
    }, [answer, data, invalidate]);

    const submit = useCallback(
        async (type: Feedback) => {
            const handler = type === 'like' ? onLike : onDislike;
            if (!handler || !answer || !data) return;

            const current = ++revision.current;
            setState({loading: type});

            try {
                await handler(data);
                if (current === revision.current) setState({type});
            } catch {
                if (current === revision.current) setState({});
            }
        },
        [answer, data, onLike, onDislike],
    );

    return {
        feedbackType: state.type,
        feedbackTypeLoading: state.loading,
        handleLike: useCallback(() => submit('like'), [submit]),
        handleDislike: useCallback(() => submit('dislike'), [submit]),
    };
}
