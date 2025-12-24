import {useBooleanState} from 'src/react-utils';

import type {SearchState} from '../types';

export type UseSearchProps = {
    state: SearchState;
    onChange: (config: SearchState) => void;
    onSearchPrev: (config: SearchState) => void;
    onSearchNext: (config: SearchState) => void;
    onReplaceNext: (config: SearchState) => void;
    onReplaceAll: (config: SearchState) => void;
};

export function useSearch({
    state,
    onChange,
    onSearchPrev,
    onSearchNext,
    onReplaceNext,
    onReplaceAll,
}: UseSearchProps) {
    const [isCompact, , showFullForm] = useBooleanState(true);

    const handleSearchChange = (value: string) => {
        onChange({...state, search: value});
    };

    const handleReplacementChange = (value: string) => {
        onChange({...state, replace: value});
    };

    const handleFindPrevious = () => {
        onSearchPrev(state);
    };

    const handleFindNext = () => {
        onSearchNext(state);
    };

    const handleReplace = () => {
        onReplaceNext(state);
    };

    const handleReplaceAll = () => {
        onReplaceAll(state);
    };

    const handleCaseSensitiveChange = (val: boolean) => {
        onChange({...state, caseSensitive: val});
    };

    const handleWholeWordChange = (val: boolean) => {
        onChange({...state, wholeWord: val});
    };

    return {
        isCompact,

        searchState: state,

        handlers: {
            onExpand: showFullForm,

            onSearchChange: handleSearchChange,
            onReplaceChange: handleReplacementChange,

            onWholeWordChange: handleWholeWordChange,
            onCaseSensitiveChange: handleCaseSensitiveChange,

            onFindPrevious: handleFindPrevious,
            onFindNext: handleFindNext,

            onReplace: handleReplace,
            onReplaceAll: handleReplaceAll,
        },
    };
}
