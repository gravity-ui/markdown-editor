import React from 'react';

import {search} from '@codemirror/search';
import {EditorView} from '@codemirror/view';
import {createRoot} from 'react-dom/client';

import {SearchPanel} from '../view/CustomSearchEditor';

// Remove default search options
export const customSearch = () =>
    search({
        caseSensitive: false, // Ignore case sensitivity
        scrollToMatch: (range) => EditorView.scrollIntoView(range), // Scroll to the match
        createPanel: () => {
            const dom = document.createElement('div');
            const root = createRoot(dom);

            root.render(React.createElement(SearchPanel, {onSearch: () => {}}));

            return {dom};
        },
    });
