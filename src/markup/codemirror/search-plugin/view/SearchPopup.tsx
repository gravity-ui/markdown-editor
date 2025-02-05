import {useRef, useState} from 'react';

import type {SearchQuery} from '@codemirror/search';
import {ChevronDown, ChevronUp, Xmark} from '@gravity-ui/icons';
import {
    Button,
    Card,
    Checkbox,
    Icon,
    type PopoverAnchorRef,
    Popup,
    TextInput,
    type TextInputProps,
    sp,
} from '@gravity-ui/uikit';

import {cn} from '../../../../classname';
import {i18n} from '../../../../i18n/search';
import {enterKeyHandler} from '../../../../utils/handlers';

import './SearchPopup.scss';

type SearchInitial = Pick<SearchQuery, 'search' | 'caseSensitive' | 'wholeWord'>;
type SearchConfig = Pick<SearchInitial, 'caseSensitive' | 'wholeWord'>;

interface SearchCardProps {
    initial: SearchInitial;
    onSearchKeyDown?: (query: string) => void;
    onChange?: (query: string) => void;
    onClose?: (query: string) => void;
    onSearchPrev?: (query: string) => void;
    onSearchNext?: (query: string) => void;
    onConfigChange?: (config: SearchConfig) => void;
}

const b = cn('search-card');

const noop = () => {};
const inverse = (val: boolean) => !val;

export const SearchCard: React.FC<SearchCardProps> = ({
    initial,
    onChange = noop,
    onClose = noop,
    onSearchPrev = noop,
    onSearchNext = noop,
    onConfigChange = noop,
}) => {
    const [query, setQuery] = useState<string>(initial.search);
    const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(initial.caseSensitive);
    const [isWholeWord, setIsWholeWord] = useState<boolean>(initial.wholeWord);
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
                className={sp({mb: 2})}
                size="s"
                autoFocus
                onKeyPress={handleSearchKeyPress}
                onUpdate={handleInputChange}
                value={query}
                endContent={
                    <>
                        <Button onClick={handlePrev}>
                            <Icon data={ChevronUp} size={12} />
                        </Button>
                        <Button onClick={handleNext}>
                            <Icon data={ChevronDown} size={12} />
                        </Button>
                    </>
                }
            />
            <Checkbox
                size="m"
                onUpdate={handleIsCaseSensitive}
                checked={isCaseSensitive}
                className={sp({mr: 4})}
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

export const SearchPopup: React.FC<SearchPopupProps> = ({open, anchor, onClose, ...props}) => {
    const anchorRef = useRef<HTMLElement>(anchor);

    return (
        <Popup
            onEscapeKeyDown={onClose}
            open={anchorRef.current && open}
            anchorRef={anchorRef as PopoverAnchorRef}
            placement="bottom-end"
        >
            <SearchCard onClose={onClose} {...props} />
        </Popup>
    );
};

SearchPopup.displayName = 'SearchPopup';

interface SearchPopupWithRefProps extends Omit<SearchPopupProps, 'anchor'> {
    anchor: HTMLElement | null;
}

export function renderSearchPopup({anchor, open, onClose, ...props}: SearchPopupWithRefProps) {
    return (
        <>{anchor && <SearchPopup open={open} onClose={onClose} anchor={anchor} {...props} />}</>
    );
}
