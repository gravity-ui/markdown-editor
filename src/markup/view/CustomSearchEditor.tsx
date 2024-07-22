import React, {ChangeEvent, useState} from 'react';

import {SearchQuery, setSearchQuery} from '@codemirror/search';
import {EditorView} from '@codemirror/view';
import {Button, Card, TextInput} from '@gravity-ui/uikit';

interface SearchPanelProps {
    onSearch: (query: string) => void;
    view: EditorView;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({onSearch, view}) => {
    const [query, setQuery] = useState<string>('');

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(query);

            const searchQuery = new SearchQuery({
                search: query,
                replace: '',
                caseSensitive: false,
                regexp: false,
                wholeWord: false,
            });

            view.dispatch({
                effects: setSearchQuery.of(searchQuery),
            });
        }
    };

    const handleClose = () => {
        setQuery('');
    };

    return (
        <Card>
            <TextInput onChange={handleInputChange} value={query} />
            <Button onClick={handleSearch}>Search</Button>
            <Button onClick={handleClose}>Close</Button>
        </Card>
    );
};
