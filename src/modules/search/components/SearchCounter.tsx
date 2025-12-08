import {type DOMProps, Text} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/search';

import {SearchQA} from '../qa';
import type {SearchCounter} from '../types';

export type SearchCounterProps = DOMProps & {
    counter: SearchCounter;
};

export const SearchCounterText: React.FC<SearchCounterProps> = ({counter, style, className}) => {
    return (
        <Text whiteSpace="nowrap" style={style} className={className} qa={SearchQA.Counter}>
            {i18n('search_counter', {
                current: String(counter.current),
                total: String(counter.total),
            })}
        </Text>
    );
};
