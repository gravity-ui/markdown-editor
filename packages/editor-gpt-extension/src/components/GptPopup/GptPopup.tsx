import {useRef} from 'react';

import {flip, offset, shift, size} from '@floating-ui/react';
import {Popup, type PopupProps} from '@gravity-ui/uikit';

import {cn} from '../../classname';
import {gptPopupPlacement} from '../../constants';
import type {CommonAnswer, GptDialogProps} from '../../types';
import {GptDialog} from '../GptDialog';
import {GptPromptRefContext} from '../GptDialog/focus';

import './GptPopup.scss';

const middlewares = [
    offset(4),
    flip({padding: 16}),
    shift({padding: 16}),
    size({
        padding: 16,
        apply: ({availableHeight, elements}) => {
            elements.floating.style.setProperty(
                '--gpt-popup-max-height',
                `${Math.max(0, availableHeight)}px`,
            );
        },
    }),
];

export const cnGptPopup = cn('gpt-popup');

type Props<A extends CommonAnswer, P> = GptDialogProps<A, P> & Pick<PopupProps, 'anchorElement'>;

export function GptPopup<A extends CommonAnswer, P>({anchorElement, ...props}: Props<A, P>) {
    const promptRef = useRef<HTMLInputElement>(null);
    return (
        <Popup
            className={cnGptPopup()}
            open
            anchorElement={anchorElement}
            placement={gptPopupPlacement}
            strategy="absolute"
            initialFocus={props.onCustomPromptApply ? promptRef : 0}
            floatingMiddlewares={middlewares}
            returnFocus={false}
            onOpenChange={(open) => {
                if (!open) props.onClose?.();
            }}
        >
            <div className={cnGptPopup('content')}>
                <GptPromptRefContext.Provider value={promptRef}>
                    <GptDialog {...props} />
                </GptPromptRefContext.Provider>
            </div>
        </Popup>
    );
}
