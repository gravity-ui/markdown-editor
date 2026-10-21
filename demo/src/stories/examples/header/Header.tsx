import {memo} from 'react';

import {
    type FileUploadHandler,
    MarkdownEditorView,
    useMarkdownEditor,
    wysiwygToolbarConfigs,
} from '@gravity-ui/markdown-editor';
import {Header} from '@gravity-ui/markdown-editor/extensions/additional/Header/index.js';
import {wHeaderItemData} from '@gravity-ui/markdown-editor/extensions/additional/Header/toolbar.js';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

const fileUploadHandler: FileUploadHandler = async (file) => {
    return {url: URL.createObjectURL(file)};
};

export type HeaderDemoProps = {
    markup: string;
    uploadEnabled: boolean;
};

export const HeaderDemo = memo<HeaderDemoProps>(function HeaderDemo({markup, uploadEnabled}) {
    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup},
            handlers: uploadEnabled ? {uploadFile: fileUploadHandler} : undefined,
            wysiwygConfig: {
                extensions: (builder) =>
                    builder.use(Header, {
                        fileUploadHandler: uploadEnabled ? fileUploadHandler : undefined,
                    }),
                extensionOptions: {
                    commandMenu: {
                        actions: wysiwygToolbarConfigs.wCommandMenuConfig.concat(wHeaderItemData),
                    },
                },
            },
        },
        [markup, uploadEnabled],
    );

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
