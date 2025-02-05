import {useEffect, useState} from 'react';

import type {MarkdownEditorMode} from '../../../src/bundle';
import {PlaygroundMini} from '../../components/PlaygroundMini';

import {markup} from './content';

const handleChangeEditorType = (mode: MarkdownEditorMode) => {
    localStorage.setItem('markdownEditorMode', mode);
};

const handleChangeSplitModeEnabled = (enabled: boolean) => {
    localStorage.setItem('markdownEditorSplitModeEnabled', enabled.toString());
};

export const RememberMode: React.FC = () => {
    const [mode, setMode] = useState<MarkdownEditorMode>();
    const [splitModeEnabled, setSplitModeEnabled] = useState<boolean>();

    useEffect(() => {
        const storedMode = localStorage.getItem('markdownEditorMode') || 'wysiwyg';
        const storedSplitModeEnabled = localStorage.getItem('markdownEditorSplitModeEnabled');

        if (storedMode) {
            setMode(storedMode as MarkdownEditorMode);
            setSplitModeEnabled(storedSplitModeEnabled === 'true');
        }
    }, []);

    return (
        <>
            {mode && (
                <PlaygroundMini
                    initial={markup.RememberMode}
                    onChangeEditorType={handleChangeEditorType}
                    initialEditor={mode}
                    initialSplitModeEnabled={splitModeEnabled}
                    onChangeSplitModeEnabled={handleChangeSplitModeEnabled}
                />
            )}
        </>
    );
};
