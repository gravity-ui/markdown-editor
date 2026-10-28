import {useRef} from 'react';

import {Popup, type PopupProps} from '@gravity-ui/uikit';

import type {CommonAnswer} from '../ErrorScreen/types';
import {GptDialog} from '../GptDialog/GptDialog';
import {cn} from '../classname';
import {gptPopupPlacement} from '../constants';
import type {GptDialogProps} from '../types';

import '../gptExtension/view.scss';

export const cnGptPopup = cn('gpt-popup');

type Props<AnswerData extends CommonAnswer, PromptData> = GptDialogProps<AnswerData, PromptData> &
    Pick<PopupProps, 'anchorElement'>;

export function GptPopup<AnswerData extends CommonAnswer, PromptData>({
    anchorElement,
    gptPopupContainer,
    ...props
}: Props<AnswerData, PromptData>) {
    const promptRef = useRef<HTMLInputElement | null>(null);

    return (
        <Popup
            className={cnGptPopup()}
            open
            anchorElement={anchorElement}
            container={gptPopupContainer}
            placement={gptPopupPlacement}
            initialFocus={promptRef}
            returnFocus={false}
            onOpenChange={(open) => {
                if (!open) props.onClose?.();
            }}
            strategy="absolute"
        >
            <div className={cnGptPopup('content')}>
                <GptDialog {...props} promptRef={promptRef} />
            </div>
        </Popup>
    );
}
