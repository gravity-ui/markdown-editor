import { useRef, useState } from 'react';

import type { SearchQuery } from '@codemirror/search';
import { ChevronDown, ChevronUp, Xmark } from '@gravity-ui/icons';
import {
    Button,
    Card,
    Checkbox,
    Icon,
    Popup,
    TextInput,
    type TextInputProps,
    sp,
} from '@gravity-ui/uikit';

import { cn } from '../../../../classname';
import { i18n } from '../../../../i18n/search';
import { enterKeyHandler } from '../../../../utils/handlers';

import './SearchPopup.scss';
import { ReplaceIcon, ReplaceAllIcon } from './ReplaceIcons';

type SearchInitial = Pick<SearchQuery, 'search' | 'caseSensitive' | 'wholeWord'>;
type SearchConfig = Pick<SearchInitial, 'caseSensitive' | 'wholeWord'>;

interface SearchCardProps {
    initial: SearchInitial;
    onSearchKeyDown?: (query: string) => void;
    onChange?: (query: string) => void;
    onClose?: (query: string) => void;
    onSearchPrev?: (query: string) => void;
    onSearchNext?: (query: string) => void;
    onReplaceNext?: (query: string, replacement: string) => void;
    onReplaceAll?: (query: string, replacement: string) => void;
    onConfigChange?: (config: SearchConfig) => void;
}

const b = cn('search-card');

const noop = () => { };
const inverse = (val: boolean) => !val;

export const SearchCard: React.FC<SearchCardProps> = ({
    initial,
    onChange = noop,
    onClose = noop,
    onSearchPrev = noop,
    onSearchNext = noop,
    onReplaceNext = noop,
    onReplaceAll = noop,
    onConfigChange = noop,
}) => {
    const [query, setQuery] = useState<string>(initial.search);
    const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(initial.caseSensitive);
    const [isWholeWord, setIsWholeWord] = useState<boolean>(initial.wholeWord);
    const [replacement, setReplacement] = useState<string>('');
    const textInputRef = useRef<HTMLInputElement>(null);

    const setInputFocus = () => {
        textInputRef.current?.focus();
    };

    const handleInputChange = (value: string) => {
        setQuery(value);
        onChange(value);
    };

    const handleClose = () => {
        setQuery('');
        onClose(query);
        setInputFocus();
    };

    const handlePrev = () => {
        onSearchPrev(query);
        setInputFocus();
    };

    const handleNext = () => {
        onSearchNext(query);
        setInputFocus();
    };

    const handleReplace = () => {
        onReplaceNext(query, replacement);
        setInputFocus();
    };

    const handleReplaceAll = () => {
        onReplaceAll(query, replacement);
        setInputFocus();
    };

    const handleIsCaseSensitive = () => {
        onConfigChange({
            caseSensitive: !isCaseSensitive,
            wholeWord: isWholeWord,
        });
        setIsCaseSensitive(inverse);
        setInputFocus();
    };

    const handleIsWholeWord = () => {
        onConfigChange({
            caseSensitive: isCaseSensitive,
            wholeWord: !isWholeWord,
        });
        setIsWholeWord(inverse);
        setInputFocus();
    };

    const handleSearchKeyPress: TextInputProps['onKeyPress'] = enterKeyHandler(handleNext);

    return (
        <Card className={b()}>
            <div className={b('header')}>
                <span className={b('title')}> {i18n('title')}</span>
                <Button onClick={handleClose} size="s" view="flat">
                    <Icon data={Xmark} size={14} />
                </Button>
            </div>
            <TextInput
                controlRef={textInputRef}
                className={sp({ mb: 2 })}
                size="s"
                autoFocus
                onKeyPress={handleSearchKeyPress}
                onUpdate={handleInputChange}
                value={query}
                endContent={
                    <>
                        <Button onClick={handlePrev} pin="round-brick">
                            <Icon data={ChevronUp} size={12} />
                        </Button>
                        <Button onClick={handleNext} pin="brick-round">
                            <Icon data={ChevronDown} size={12} />
                        </Button>
                    </>
                }
            />
            <TextInput
                placeholder={i18n('replace_placeholder')}
                className={sp({ mb: 2 })}
                size="s"
                onUpdate={setReplacement}
                value={replacement}
                endContent={
                    <>
                        <Button size="s" onClick={handleReplace} pin="round-brick" disabled={!query} title={i18n('action_replace')}>
                            <ReplaceIcon width={12} height={12} />
                        </Button>
                        <Button size="s" onClick={handleReplaceAll} pin="brick-round" disabled={!query} title={i18n('action_replace_all')}>
                            <ReplaceAllIcon width={12} height={12} />
                        </Button>
                    </>
                }
            />
            <Checkbox
                size="m"
                onUpdate={handleIsCaseSensitive}
                checked={isCaseSensitive}
                className={sp({ mr: 4 })}
            >
                {i18n('label_case-sensitive')}
            </Checkbox>
            <Checkbox size="m" onUpdate={handleIsWholeWord} checked={isWholeWord}>
                {i18n('label_whole-word')}
            </Checkbox>
        </Card>
    );
};

export interface SearchPopupProps extends SearchCardProps {
    open: boolean;
    anchor: HTMLElement;
    onClose: () => void;
}

export const SearchPopup: React.FC<SearchPopupProps> = ({ open, anchor, ...props }) => {
    return (
        <Popup
            open={open}
            anchorElement={anchor}
            placement="bottom-end"
            onOpenChange={(_open, _event, reason) => {
                if (reason === 'escape-key') {
                    props.onClose();
                }
            }}
        >
            <SearchCard {...props} />
        </Popup>
    );
};

SearchPopup.displayName = 'SearchPopup';

interface SearchPopupWithRefProps extends Omit<SearchPopupProps, 'anchor'> {
    anchor: HTMLElement | null;
}

export function renderSearchPopup({ anchor, ...props }: SearchPopupWithRefProps) {
    return <>{anchor && <SearchPopup anchor={anchor} {...props} />}</>;
}
