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
    const session = useRef({active: true, pending: false});

    useEffect(() => {
        const current = {active: true, pending: false};
        session.current = current;
        setState({status: 'idle'});
        return () => {
            current.active = false;
        };
    }, [answer, request]);

    const submit = useCallback(
        async (type: Feedback) => {
            const handler = type === 'like' ? onLike : onDislike;
            const current = session.current;
            if (!answer || !request || !handler || current.pending || !current.active) return;
            current.pending = true;
            setState({status: 'loading', type});
            let failed = false;
            try {
                await handler(request);
            } catch {
                failed = true;
            }
            if (!current.active) return;
            current.pending = false;
            setState(failed ? {status: 'idle'} : {status: 'success', type});
        },
        [answer, request, onLike, onDislike],
    );

    return {state, submit};
}
