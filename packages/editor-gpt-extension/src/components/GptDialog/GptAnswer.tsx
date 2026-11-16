import {ArrowRotateLeft, ThumbsDown, ThumbsUp} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import {gptHotKeys} from '../../constants';
import {useGptFeedback} from '../../hooks/useGptFeedback';
import {i18n} from '../../i18n/dialog';
import type {CommonAnswer, GptDialogProps, GptRequestData} from '../../types';
import {getDisableReplaceButtonText} from '../../utils';

import {cnGptDialog} from './classname';

type Props<A extends CommonAnswer, P> = Pick<GptDialogProps<A, P>, 'onLike' | 'onDislike'> & {
    answer: A;
    request: GptRequestData<P>;
    answerRender: GptDialogProps<A>['answerRender'];
    disablePromptPresets?: boolean;
    onRetry?: () => void;
    onReset: () => void;
    onApply: () => void;
    onClose?: () => void;
};

export function GptAnswer<A extends CommonAnswer, P>({
    answer,
    request,
    answerRender,
    disablePromptPresets,
    onRetry,
    onReset,
    onApply,
    onClose,
    onLike,
    onDislike,
}: Props<A, P>) {
    const {state, submit} = useGptFeedback(answer, request, onLike, onDislike);
    const pending = state.status === 'loading';
    const feedback = state.status === 'success' ? state.type : undefined;
    const replaceText = getDisableReplaceButtonText(disablePromptPresets);
    return (
        <>
            <div className={cnGptDialog('header')}>
                <span className={cnGptDialog('answer-title')}>{i18n('answer-title')}</span>
                <div className={cnGptDialog('header-bottom')}>
                    {onRetry && (
                        <ActionTooltip hotkey={gptHotKeys.tryAgainGpt} title={i18n('try-again')}>
                            <Button className={cnGptDialog('try-again-button')} onClick={onRetry}>
                                <Icon data={ArrowRotateLeft} size={16} />
                                {i18n('try-again')}
                            </Button>
                        </ActionTooltip>
                    )}
                    <ActionTooltip
                        hotkey={gptHotKeys.freshStartGpt}
                        title={i18n('fresh-start-button')}
                    >
                        <Button className={cnGptDialog('back-to-start')} onClick={onReset}>
                            {i18n('fresh-start-button')}
                        </Button>
                    </ActionTooltip>
                </div>
            </div>
            <div className={cnGptDialog('body')}>
                <div className={cnGptDialog('answer')}>{answerRender(answer)}</div>
            </div>
            <div className={cnGptDialog('footer')}>
                {(onLike || onDislike) && (
                    <div className={cnGptDialog('answer-actions')}>
                        {onLike && (
                            <Button
                                className={cnGptDialog('like-button')}
                                aria-label={i18n('like')}
                                onClick={() => submit('like')}
                                selected={feedback === 'like'}
                                loading={pending && state.type === 'like'}
                                disabled={pending}
                            >
                                <Icon data={ThumbsUp} size={16} />
                            </Button>
                        )}
                        {onDislike && (
                            <Button
                                className={cnGptDialog('dislike-button')}
                                aria-label={i18n('dislike')}
                                onClick={() => submit('dislike')}
                                selected={feedback === 'dislike'}
                                loading={pending && state.type === 'dislike'}
                                disabled={pending}
                            >
                                <Icon data={ThumbsDown} size={16} />
                            </Button>
                        )}
                        {feedback && (
                            <span className={cnGptDialog('feedback-message')}>
                                {i18n('feedback-message')}
                            </span>
                        )}
                    </div>
                )}
                <ActionTooltip title={i18n('close-button')} hotkey={gptHotKeys.closeGpt}>
                    <Button className={cnGptDialog('close-button')} view="flat" onClick={onClose}>
                        {i18n('close-button')}
                    </Button>
                </ActionTooltip>
                <ActionTooltip title={replaceText} hotkey={gptHotKeys.applyResultGpt}>
                    <Button className={cnGptDialog('apply-button')} view="action" onClick={onApply}>
                        {replaceText}
                    </Button>
                </ActionTooltip>
            </div>
        </>
    );
}
