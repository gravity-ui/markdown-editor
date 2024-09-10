import React from 'react';
import type {FC} from 'react';

import {cn} from '@bem-react/classname';
import {CircleXmarkFill} from '@gravity-ui/icons';
// import {cn} from '@gravity-ui/markdown-editor/_/classname.js';
import {Button} from '@gravity-ui/uikit';

import {i18n} from '../../../../i18n/gpt/errors';
import {IconRefuge} from '../IconRefuge/IconRefuge';

import './ErrorScreen.scss';

type ErrorScreenProps = {
    onRetry: () => void;
    onStartAgain: () => void;
};

export const cnGptDialogErrorScreen = cn('gpt-dialog-error-screen');

export const ErrorScreen: FC<ErrorScreenProps> = ({onRetry, onStartAgain}) => {
    return (
        <div className={cnGptDialogErrorScreen()}>
            <div className={cnGptDialogErrorScreen('content')}>
                <IconRefuge
                    containerClassName={cnGptDialogErrorScreen('icon')}
                    data={CircleXmarkFill}
                    refugeSize={28}
                    size={16}
                />
                <span className={cnGptDialogErrorScreen('text')}>{i18n('error-text')}</span>
            </div>
            <div className={cnGptDialogErrorScreen('buttons')}>
                <Button view="normal" onClick={onStartAgain}>
                    {i18n('start-again-button')}
                </Button>
                <Button view="normal" onClick={onRetry}>
                    {i18n('retry-button')}
                </Button>
            </div>
        </div>
    );
};
