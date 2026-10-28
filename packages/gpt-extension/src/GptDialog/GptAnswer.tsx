import {ThumbsDown, ThumbsUp} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon} from '@gravity-ui/uikit';

import type {CommonAnswer} from '../ErrorScreen/types';
import {gptHotKeys} from '../constants';
import type {GptSession} from '../hooks/useGpt';
import {i18n} from '../i18n/dialog';
import type {GptDialogProps} from '../types';
import {getDisableReplaceButtonText} from '../utils';

import {cnGptDialog} from './classname';

type Props<A extends CommonAnswer, P> = Pick<
    GptDialogProps<A, P>,
    'answerRender' | 'onClose' | 'disablePromptPresets'
> & {
    session: GptSession<A, P>;
};

export function GptAnswer<A extends CommonAnswer, P>({
    session,
    answerRender,
    onClose,
    disablePromptPresets,
}: Props<A, P>) {
    const {
        answer,
        showAnswerActions,
        feedbackType,
        feedbackTypeLoading,
        handleLike,
        handleDislike,
        handleApplyResult,
    } = session;
    if (!answer) return null;

    const replaceButtonText = getDisableReplaceButtonText(disablePromptPresets);
    return (
        <>
            <div className={cnGptDialog('body')}>
                <div className={cnGptDialog('answer')}>{answerRender(answer)}</div>
            </div>
            <div className={cnGptDialog('footer')}>
                {showAnswerActions && (
                    <div className={cnGptDialog('answer-actions')}>
                        <Button
                            className={cnGptDialog('like-button')}
                            view="normal"
                            size="m"
                            onClick={handleLike}
                            selected={feedbackType === 'like'}
                            loading={feedbackTypeLoading === 'like'}
                        >
                            <Icon data={ThumbsUp} size={16} />
                        </Button>
                        <Button
                            className={cnGptDialog('dislike-button')}
                            view="normal"
                            size="m"
                            onClick={handleDislike}
                            selected={feedbackType === 'dislike'}
                            loading={feedbackTypeLoading === 'dislike'}
                        >
                            <Icon data={ThumbsDown} size={16} />
                        </Button>
                        {feedbackType && (
                            <span className={cnGptDialog('feedback-message')}>
                                {i18n('feedback-message')}
                            </span>
                        )}
                    </div>
                )}
                <ActionTooltip title={i18n('close-button')} hotkey={gptHotKeys.closeGpt}>
                    <Button
                        className={cnGptDialog('close-button')}
                        view="flat"
                        size="m"
                        onClick={onClose}
                    >
                        {i18n('close-button')}
                    </Button>
                </ActionTooltip>
                <ActionTooltip title={replaceButtonText} hotkey={gptHotKeys.applyResultGpt}>
                    <Button
                        className={cnGptDialog('apply-button')}
                        view="action"
                        size="m"
                        onClick={handleApplyResult}
                    >
                        {replaceButtonText}
                    </Button>
                </ActionTooltip>
            </div>
        </>
    );
}
