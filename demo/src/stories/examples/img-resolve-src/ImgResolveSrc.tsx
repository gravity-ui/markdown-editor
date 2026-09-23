import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const INITIAL_MARKUP = `![Avatar](./avatar.jpg =320x200)`;

const resolveImageSrc = (src: string): string => {
    const imageMap: Record<string, string> = {
        './avatar.jpg':
            'https://avatars.mds.yandex.net/get-shedevrum/14441318/img_1c3b6b42eee211efad66ea120268400c/orig',
    };
    return imageMap[src] ?? src;
};

export const ImgResolveSrcDemo = memo(() => {
    const editor = useMarkdownEditor({
        initial: {
            mode: 'wysiwyg',
            markup: INITIAL_MARKUP,
        },
        wysiwygConfig: {
            extensionOptions: {
                imgSize: {
                    resolveImageSrc,
                },
            },
        },
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
});

ImgResolveSrcDemo.displayName = 'ImgResolveSrcDemo';
