import {useCallback, useEffect, useRef, useState} from 'react';

import {ErrorScreen} from '../ErrorScreen/ErrorScreen';
import type {CommonAnswer} from '../ErrorScreen/types';
import {gptHotKeys} from '../constants';
import {useGpt} from '../hooks/useGpt';
import {useGptHotKeys} from '../hooks/useGptHotKeys';
import type {GptDialogProps} from '../types';

import {GptAnswer} from './GptAnswer';
import {GptPrompt} from './GptPrompt';
import {LoadingScreen} from './LoadingScreen/LoadingScreen';
import {cnGptDialog} from './classname';

import './GptDialog.scss';

export type {GptDialogProps};
export {cnGptDialog};

export function GptDialog<A extends CommonAnswer = CommonAnswer, P = unknown>(
    props: GptDialogProps<A, P>,
) {
    const session = useGpt(props);
    const {loading, showError, showAnswer, handleTryAgain, handleFreshStart, handleApplyResult} =
        session;
    const localPromptRef = useRef<HTMLInputElement | null>(null);
    const promptRef = props.promptRef ?? localPromptRef;
    const [alertDismissed, setAlertDismissed] = useState(false);

    const onCloseAlert = useCallback(() => {
        setAlertDismissed(true);
        props.gptAlertProps?.onCloseGptAlert?.();
    }, [props.gptAlertProps]);

    useEffect(() => {
        promptRef.current?.focus({preventScroll: true});
    }, [promptRef, loading, showError, showAnswer]);

    useGptHotKeys(gptHotKeys.tryAgainGpt, handleTryAgain, {enabled: !loading});
    useGptHotKeys(gptHotKeys.freshStartGpt, handleFreshStart);
    useGptHotKeys(gptHotKeys.applyResultGpt, handleApplyResult, {enabled: showAnswer});

    let content;
    if (loading) {
        content = <LoadingScreen />;
    } else if (showError) {
        content = <ErrorScreen onRetry={handleTryAgain} onStartAgain={handleFreshStart} />;
    } else {
        content = (
            <>
                <GptPrompt
                    {...props}
                    session={session}
                    promptRef={promptRef}
                    showedGptAlert={props.gptAlertProps?.showedGptAlert && !alertDismissed}
                    onCloseAlert={onCloseAlert}
                />
                {showAnswer && <GptAnswer {...props} session={session} />}
            </>
        );
    }

    return <div className={cnGptDialog()}>{content}</div>;
}
