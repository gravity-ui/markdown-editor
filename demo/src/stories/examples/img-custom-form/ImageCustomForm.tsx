import {memo} from 'react';

import {FilePlus} from '@gravity-ui/icons';
import {
    type ImgSizeOptions,
    MarkdownEditorView,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {Button, FilePreview, Icon, useFileInput} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {randomDelay} from '../../../utils/delay';

type RenderImageWidgetFormFn = NonNullable<ImgSizeOptions['renderImageWidgetForm']>;
type RenderImageWidgetFormProps = Parameters<RenderImageWidgetFormFn>[0];

const ImageForm = memo<RenderImageWidgetFormProps>(function ImageForm({onSubmit, onAttach}) {
    const {controlProps, triggerProps} = useFileInput({onUpdate: onAttach});

    return (
        <div
            style={{
                display: 'grid',
                padding: '12px 16px',
                justifyItems: 'center',
                alignItems: 'center',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gridGap: 8,
            }}
        >
            {/* Rendering previews for images */}
            {getImages().map(({id, url}) => {
                const name = id;
                return (
                    <FilePreview
                        key={id}
                        imageSrc={url}
                        file={{name, type: 'image/png'} as File}
                        onClick={() => onSubmit({url, name, alt: '', width: 320, height: 320})}
                    />
                );
            })}

            {/* Rendering a button for uploading images from device */}
            <Button
                size="xl"
                view="flat-secondary"
                width="max"
                style={
                    {
                        '--g-button-height': '100%',
                        '--g-button-border-radius': '4px',
                    } as React.CSSProperties
                }
                {...triggerProps}
            >
                <Icon data={FilePlus} width={36} height={36} />
            </Button>
            <input type="file" multiple={false} accept="image/*" {...controlProps} />
        </div>
    );
});

export const ImageCustomFormDemo = memo(() => {
    const editor = useMarkdownEditor({
        initial: {
            mode: 'wysiwyg',
            markup: '&nbsp;\n\nClick the `Image` action on the toolbar or select it from the slash `/` menu.',
        },
        handlers: {
            uploadFile: async (file) => {
                await randomDelay(1000, 3000);
                return {url: URL.createObjectURL(file)};
            },
        },
        wysiwygConfig: {
            extensionOptions: {
                imgSize: {
                    // pass a function to render custom form in the image widget
                    renderImageWidgetForm: (props) => <ImageForm {...props} />,
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

ImageCustomFormDemo.displayName = 'ImageCustomFormDemo';

type ImageItem = {
    id: string;
    url: string;
};

function getImages(): ImageItem[] {
    return [
        {
            id: 'low',
            url: 'https://avatars.mds.yandex.net/get-shedevrum/14441318/img_1c3b6b42eee211efad66ea120268400c/orig',
        },
        {
            id: 'unsatisfactory',
            url: 'https://avatars.mds.yandex.net/get-shedevrum/15170052/img_7ba17345eee211efa1d9c61932b2752e/orig',
        },
        {
            id: 'good',
            url: 'https://avatars.mds.yandex.net/get-shedevrum/16106905/img_26cb5157eee311efb16cf600b5cb441c/orig',
        },
        {
            id: 'outstanding',
            url: 'https://avatars.mds.yandex.net/get-shedevrum/14441318/img_834891dceee111ef80908e055cc35a5d/orig',
        },
        {
            id: 'amazing',
            url: 'https://avatars.mds.yandex.net/get-shedevrum/15320627/img_d62906eeeee211ef9e61968caa0a2b17/orig',
        },
    ];
}
