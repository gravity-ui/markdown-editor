import {Skeleton} from '@gravity-ui/uikit';

import {cn} from '../../../../../classname';
import {i18n} from '../../../../../i18n/gpt/loading';
import GPTLoading from '../../../../../icons/GPTLoading';
import {IconRefuge} from '../../IconRefuge/IconRefuge';

import './LoadingScreen.scss';

export const cnGptDialogLoadingScreen = cn('gpt-dialog-loading-screen');

export const LoadingScreen: React.FC = () => {
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
