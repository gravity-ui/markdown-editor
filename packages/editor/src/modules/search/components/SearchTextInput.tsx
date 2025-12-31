import {useCallback} from 'react';

import {DelayedTextInput} from '@gravity-ui/components';
import {ChevronDown, ChevronUp} from '@gravity-ui/icons';
import {Button, ButtonIcon, Icon, sp} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/search';

import {SearchQA} from '../qa';
import type {SearchCounter} from '../types';

import {SearchCounterText} from './SearchCounter';

type DelayedTextInputProps = React.ComponentProps<typeof DelayedTextInput>;

export type SearchTextInputProps = DelayedTextInputProps & {
    counter?: SearchCounter;
    onFindNext: () => void;
    onFindPrevious: () => void;
};

export const SearchTextInput: React.FC<SearchTextInputProps> = function SearchTextInput({
    counter,
    onFindNext,
    onFindPrevious,
    ...inputProps
}) {
    const handleKeyDown = useCallback<React.KeyboardEventHandler>(
        (event) => {
            if (event.key === 'Enter') {
                if (event.shiftKey) onFindPrevious();
                else onFindNext();
            }
        },
        [onFindNext, onFindPrevious],
    );

    return (
        <DelayedTextInput
            size="l"
            qa={SearchQA.FindInput}
            onKeyDown={handleKeyDown}
            endContent={
                Boolean(inputProps.value) && (
                    <>
                        {counter && <SearchCounterText counter={counter} className={sp({px: 1})} />}
                        <Button
                            size="m"
                            view="flat-secondary"
                            onClick={onFindPrevious}
                            aria-label={i18n('action_prev')}
                            qa={SearchQA.PrevBtn}
                        >
                            <ButtonIcon>
                                <Icon data={ChevronUp} />
                            </ButtonIcon>
                        </Button>
                        <Button
                            size="m"
                            view="flat-secondary"
                            onClick={onFindNext}
                            className={sp({ml: 1})}
                            aria-label={i18n('action_next')}
                            qa={SearchQA.NextBtn}
                        >
                            <ButtonIcon>
                                <Icon data={ChevronDown} />
                            </ButtonIcon>
                        </Button>
                    </>
                )
            }
            {...inputProps}
        />
    );
};
