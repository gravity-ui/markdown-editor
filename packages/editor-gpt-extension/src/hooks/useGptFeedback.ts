import {useCallback, useEffect, useRef, useState} from 'react';

import type {CommonAnswer, GptDialogProps, GptRequestData} from '../types';

export type Feedback = 'like' | 'dislike';

type FeedbackState =
    | {status: 'idle'}
    | {status: 'loading'; type: Feedback}
    | {status: 'success'; type: Feedback};

export function useGptFeedback<A extends CommonAnswer, P>(
    answer: A | undefined,
    request: GptRequestData<P> | undefined,
    onLike: GptDialogProps<A, P>['onLike'],
    onDislike: GptDialogProps<A, P>['onDislike'],
) {
    const [state, setState] = useState<FeedbackState>({status: 'idle'});
    const revision = useRef(0);
    const pending = useRef(false);
    const mounted = useRef(true);

    const invalidate = useCallback(() => {
        revision.current++;
    }, []);

    useEffect(() => {
        mounted.current = true;
        revision.current++;
        pending.current = false;
        setState({status: 'idle'});
        return () => {
            mounted.current = false;
            invalidate();
        };
    }, [answer, request, invalidate]);

    const submit = useCallback(
        async (type: Feedback) => {
            const handler = type === 'like' ? onLike : onDislike;
            if (!answer || !request || !handler || pending.current || !mounted.current) return;
            const current = ++revision.current;
            pending.current = true;
            setState({status: 'loading', type});
            let failed = false;
            try {
                await handler(request);
            } catch {
                failed = true;
            }
            if (!mounted.current || current !== revision.current) return;
            pending.current = false;
            setState(failed ? {status: 'idle'} : {status: 'success', type});
        },
        [answer, request, onLike, onDislike],
    );

    return {state, submit};
}
