import React, {ChangeEvent, useState} from 'react';

import {Button, Card, TextInput} from '@gravity-ui/uikit';

interface SearchPanelProps {
    onSearch: (query: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({onSearch}) => {
    const [query, setQuery] = useState<string>('');

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        setQuery(event.target.value);
    };

    const handleSearch = () => {
        if (onSearch) {
            onSearch(query);
        }
    };

    return (
        <Card>
            <TextInput onChange={handleInputChange} value={query} />
            <Button onClick={handleSearch}>Search</Button>
        </Card>
    );
};
