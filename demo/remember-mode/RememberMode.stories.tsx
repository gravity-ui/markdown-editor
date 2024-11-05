import React, {useEffect, useState} from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import type {MarkdownEditorMode} from '../../src/bundle';
import {defaultArgs} from '../constants/default-args';
import {excludedControls} from '../constants/excluded-controls';
import {markup} from '../constants/rememberModeMarkup';
import {PlaygroundMini, PlaygroundMiniProps} from '../playground/PlaygroundMini';

const meta: Meta<PlaygroundMiniProps> = {
    title: 'Experiments / Remember the mode',
    component: PlaygroundMini,
    args: defaultArgs,
    parameters: {
        controls: {
            exclude: excludedControls,
        },
    },
};

export default meta;

type Story = StoryObj<typeof PlaygroundMini>;

const handleChangeEditorType = (mode: MarkdownEditorMode) => {
    localStorage.setItem('markdownEditorMode', mode);
};

const handleChangeSplitModeEnabled = (enabled: boolean) => {
    localStorage.setItem('markdownEditorSplitModeEnabled', enabled.toString());
};

export const Playground: Story = {
    args: {
        initial: markup.RememberMode,
    },
    render: function Render(props) {
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
                        {...props}
                        onChangeEditorType={handleChangeEditorType}
                        initialEditor={mode}
                        initialSplitModeEnabled={splitModeEnabled}
                        onChangeSplitModeEnabled={handleChangeSplitModeEnabled}
                    />
                )}
            </>
        );
    },
};
