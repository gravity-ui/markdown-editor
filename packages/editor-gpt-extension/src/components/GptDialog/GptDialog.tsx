import {useCallback, useContext, useLayoutEffect, useRef, useState} from 'react';

import {gptHotKeys} from '../../constants';
import {useGptFeedback} from '../../hooks/useGptFeedback';
import {GptHotkeysContext, useGptHotKeys} from '../../hooks/useGptHotKeys';
import {useGptSession} from '../../hooks/useGptSession';
import type {CommonAnswer, GptDialogProps} from '../../types';
import {ErrorScreen} from '../ErrorScreen/ErrorScreen';

import {GptAnswer} from './GptAnswer';
import {GptPrompt} from './GptPrompt';
import {LoadingScreen} from './LoadingScreen/LoadingScreen';
import {cnGptDialog} from './classname';
import {GptPromptRefContext} from './focus';

import './GptDialog.scss';

export type {GptDialogProps};
export {cnGptDialog};

export function GptDialog<A extends CommonAnswer = CommonAnswer, P = unknown>(
    props: GptDialogProps<A, P>,
) {
    const containerRef = useRef<HTMLDivElement>(null);
    return (
        <GptHotkeysContext.Provider value={containerRef}>
            <div className={cnGptDialog()} ref={containerRef} tabIndex={-1}>
                <DialogContent {...props} />
            </div>
        </GptHotkeysContext.Provider>
    );
}

function DialogContent<A extends CommonAnswer, P>(props: GptDialogProps<A, P>) {
    const session = useGptSession(props);
    const {state} = session;
    const [alertDismissed, setAlertDismissed] = useState(false);
    const onCloseAlert = useCallback(() => {
        setAlertDismissed(true);
        props.gptAlertProps?.onCloseGptAlert?.();
    }, [props.gptAlertProps]);
    const localPromptRef = useRef<HTMLInputElement>(null);
    const popupPromptRef = useContext(GptPromptRefContext);
    const promptRef = popupPromptRef ?? localPromptRef;
    const previousStatus = useRef<typeof state.status>();
    const containerRef = useContext(GptHotkeysContext);
    const answer = state.status === 'success' ? state.answer : undefined;
    const feedback = useGptFeedback(answer, state.request, props.onLike, props.onDislike);

    useLayoutEffect(() => {
        // The positioned popup owns initial focus. Later screen changes restore it here.
        if (!popupPromptRef || previousStatus.current !== undefined) {
            (promptRef.current ?? containerRef?.current)?.focus({preventScroll: true});
        }
        previousStatus.current = state.status;
    }, [state.status, containerRef, promptRef, popupPromptRef]);

    useGptHotKeys(gptHotKeys.tryAgainGpt, session.retry, {
        enabled: state.status !== 'loading' && Boolean(props.onTryAgain),
    });
    useGptHotKeys(gptHotKeys.freshStartGpt, session.reset);
    useGptHotKeys(gptHotKeys.applyResultGpt, session.apply, {enabled: state.status === 'success'});

    if (state.status === 'loading') return <LoadingScreen />;
    if (state.status === 'error')
        return (
            <ErrorScreen
                onRetry={props.onTryAgain ? session.retry : undefined}
                onStartAgain={session.reset}
            />
        );
    if (state.status === 'success')
        return (
            <GptAnswer
                answer={state.answer}
                answerRender={props.answerRender}
                disablePromptPresets={props.disablePromptPresets}
                onRetry={props.onTryAgain ? session.retry : undefined}
                onReset={session.reset}
                onApply={session.apply}
                onClose={props.onClose}
                onLike={
                    props.onLike
                        ? () => {
                              feedback.submit('like');
                          }
                        : undefined
                }
                onDislike={
                    props.onDislike
                        ? () => {
                              feedback.submit('dislike');
                          }
                        : undefined
                }
                feedback={feedback.state.status === 'success' ? feedback.state.type : undefined}
                pendingFeedback={
                    feedback.state.status === 'loading' ? feedback.state.type : undefined
                }
            />
        );
    return (
        <GptPrompt
            promptPresets={props.promptPresets}
            disablePromptPresets={props.disablePromptPresets}
            customPromptPlaceholder={props.customPromptPlaceholder}
            disabledPromptPlaceholder={props.disabledPromptPlaceholder}
            alertDismissed={alertDismissed}
            onCloseAlert={onCloseAlert}
            gptAlertProps={props.gptAlertProps}
            allowCustomPrompt={Boolean(props.onCustomPromptApply)}
            prompt={session.customPrompt}
            inputRef={promptRef}
            onPromptChange={session.setCustomPrompt}
            onSubmit={session.submitCustom}
            onPresetClick={session.submitPreset}
        />
    );
}
