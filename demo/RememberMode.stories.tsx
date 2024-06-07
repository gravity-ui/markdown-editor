import React, {useEffect, useState} from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import type {Meta, StoryFn} from '@storybook/react';

import {EditorMode} from '../src/bundle/Editor';

import {Playground as PlaygroundComponent, PlaygroundProps} from './Playground';

export default {
    title: 'Experiments / Remember the mode',
} as Meta;

const markup = {
    RememberMode: `
## Remember the мode

MarkdownEditor API provides access to flexible configuration, in this demo, when the page is reloaded, the editor's mode of operation does not change.

For this example, the settings are saved in localStorage, but you can use other methods

`.trim(),
};

type PlaygroundStoryProps = Pick<
    PlaygroundProps,
    | 'initialEditor'
    | 'settingsVisible'
    | 'breaks'
    | 'allowHTML'
    | 'linkify'
    | 'linkifyTlds'
    | 'sanitizeHtml'
    | 'prepareRawMarkup'
    | 'splitModeOrientation'
    | 'stickyToolbar'
    | 'initialSplitModeEnabled'
    | 'renderPreviewDefined'
    | 'height'
>;

const args: Partial<PlaygroundStoryProps> = {
    initialEditor: 'wysiwyg',
    settingsVisible: true,
    allowHTML: true,
    breaks: true,
    linkify: true,
    linkifyTlds: [],
    sanitizeHtml: false,
    prepareRawMarkup: false,
    splitModeOrientation: 'horizontal',
    stickyToolbar: true,
    initialSplitModeEnabled: false,
    renderPreviewDefined: true,
    height: 'initial',
};

export const RememberMode: StoryFn<PlaygroundStoryProps> = (props) => {
    const [mode, setMode] = useState<EditorMode>();
    const [splitModeEnabled, setSplitModeEnabled] = useState<boolean>();

    const handleChangeEditorType = (mode: EditorMode) => {
        localStorage.setItem('markdownEditorMode', mode);
    };

    const handleChangeSplitModeEnabled = (enabled: boolean) => {
        localStorage.setItem('markdownEditorSplitModeEnabled', enabled.toString());
    };

    useEffect(() => {
        const storedMode = localStorage.getItem('markdownEditorMode');
        const storedSplitModeEnabled = localStorage.getItem('markdownEditorSplitModeEnabled');

        if (storedMode) {
            setMode(storedMode as EditorMode);
            setSplitModeEnabled(storedSplitModeEnabled === 'true');
        }
    }, []);

    return (
        <>
            {mode && (
                <PlaygroundComponent
                    {...props}
                    onChangeEditorType={handleChangeEditorType}
                    initialEditor={mode}
                    initialSplitModeEnabled={splitModeEnabled}
                    onChangeSplitModeEnabled={handleChangeSplitModeEnabled}
                    initial={markup.RememberMode}
                />
            )}
        </>
    );
};

RememberMode.args = args;
RememberMode.storyName = 'Playground';
