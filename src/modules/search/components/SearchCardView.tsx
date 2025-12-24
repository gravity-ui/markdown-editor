import {useRef} from 'react';

import {DelayedTextInput, FormRow} from '@gravity-ui/components';
import {Xmark} from '@gravity-ui/icons';
import {Button, Card, Checkbox, type DOMProps, Flex, Icon, Text, sp} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/search';
import {useAutoFocus} from 'src/react-utils/useAutoFocus';

import {SearchQA} from '../qa';
import type {SearchCounter, SearchState} from '../types';

import {SearchTextInput} from './SearchTextInput';

import './SearchCardView.scss';

export type SearchCardViewProps = DOMProps & {
    counter?: SearchCounter;
    searchState: SearchState;
    onClose: () => void;
    onSearchChange: (value: string) => void;
    onReplacementChange: (value: string) => void;
    onFindPrevious: () => void;
    onFindNext: () => void;
    onReplace: () => void;
    onReplaceAll: () => void;
    onWholeWordChange: (value: boolean) => void;
    onCaseSensitiveChange: (value: boolean) => void;
};

const b = cn('search-card');

export const SearchCardView: React.FC<SearchCardViewProps> = ({
    style,
    className,

    counter,
    searchState,
    onClose,
    onSearchChange,
    onReplacementChange,
    onFindPrevious,
    onFindNext,
    onReplace,
    onReplaceAll,
    onWholeWordChange,
    onCaseSensitiveChange,
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);

    useAutoFocus(searchInputRef, [], 200);

    return (
        <Card
            size="l"
            spacing={{pt: 4, pb: 5, pl: 5, pr: 5}}
            style={style}
            className={b(null, className)}
        >
            <Flex
                spacing={{mb: 5}}
                alignItems="center"
                justifyContent="space-between"
                className={b('header')}
            >
                <Text variant="subheader-2" className={b('title')}>
                    {i18n('title')}
                </Text>
                <Button
                    size="m"
                    view="flat"
                    onClick={onClose}
                    aria-label={i18n('action_close')}
                    qa={SearchQA.CloseBtn}
                >
                    <Icon data={Xmark} />
                </Button>
            </Flex>

            <FormRow direction="row" label={i18n('title_search')} className={b('row', sp({mb: 4}))}>
                <SearchTextInput
                    counter={counter}
                    onFindNext={onFindNext}
                    onFindPrevious={onFindPrevious}
                    controlRef={searchInputRef}
                    className={sp({mb: 2})}
                    onUpdate={onSearchChange}
                    value={searchState.search}
                    delay={300}
                />

                <Checkbox
                    size="m"
                    onUpdate={onCaseSensitiveChange}
                    checked={searchState.caseSensitive}
                    qa={SearchQA.CaseSensitiveCheck}
                    className={sp({mr: 4})}
                >
                    {i18n('label_case-sensitive')}
                </Checkbox>

                <Checkbox
                    size="m"
                    checked={searchState.wholeWord}
                    onUpdate={onWholeWordChange}
                    qa={SearchQA.WholeWordCheck}
                >
                    {i18n('label_whole-word')}
                </Checkbox>
            </FormRow>

            <FormRow
                direction="row"
                label={i18n('title_replace')}
                className={b('row', sp({mb: 5}))}
            >
                <DelayedTextInput
                    size="l"
                    delay={300}
                    value={searchState.replace}
                    onUpdate={onReplacementChange}
                    qa={SearchQA.ReplaceInput}
                />
            </FormRow>

            <Flex justifyContent="flex-end" gap={2} className={b('footer')}>
                <Button
                    size="l"
                    view="normal"
                    onClick={onReplaceAll}
                    disabled={!searchState.search}
                    qa={SearchQA.ReplaceAllBtn}
                >
                    {i18n('action_replace_all')}
                </Button>
                <Button
                    view="action"
                    size="l"
                    disabled={!searchState.search}
                    onClick={onReplace}
                    qa={SearchQA.ReplaceBtn}
                >
                    {i18n('action_replace')}
                </Button>
            </Flex>
        </Card>
    );
};
