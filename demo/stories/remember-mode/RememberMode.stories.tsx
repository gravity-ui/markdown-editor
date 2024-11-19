import React, {useEffect, useState} from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import type {MarkdownEditorMode} from '../../../src/bundle';
import {PlaygroundMini, PlaygroundMiniProps} from '../../PlaygroundMini';
import {args} from '../../defaults/args';
import {excludedControls} from '../../defaults/excluded-controls';

import {markup} from './content';

const meta: Meta<PlaygroundMiniProps> = {
    title: 'Experiments / Remember the mode',
    component: PlaygroundMini,
    args: args,
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
