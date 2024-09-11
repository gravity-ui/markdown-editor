import React from 'react';
import type {FC} from 'react';

import {cn} from '@bem-react/classname';
import {Skeleton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n/gpt/loading';
import {IconRefuge} from '../../IconRefuge/IconRefuge';
import GPTLoading from '../assets/GPTLoading';

import './LoadingScreen.scss';

export const cnGptDialogLoadingScreen = cn('gpt-dialog-loading-screen');

export const LoadingScreen: FC = () => {
    return (
        <div className={cnGptDialogLoadingScreen()}>
            <div className={cnGptDialogLoadingScreen('header')}>
                <IconRefuge
                    containerClassName={cnGptDialogLoadingScreen('icon')}
                    data={GPTLoading}
                    refugeSize={28}
                    size={20}
                />
                <span className={cnGptDialogLoadingScreen('text')}>{i18n('loading-text')}</span>
            </div>
            <div className={cnGptDialogLoadingScreen('skeleton')}>
                <Skeleton className={cnGptDialogLoadingScreen('skeleton-small-button')} />
                <Skeleton className={cnGptDialogLoadingScreen('skeleton-medium-button')} />
            </div>
        </div>
    );
};
