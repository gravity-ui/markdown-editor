import {Gear, TrashBin} from '@gravity-ui/icons';
import {
    type ToolbarBaseProps,
    type ToolbarData,
    ToolbarDataType,
} from '@gravity-ui/markdown-editor';
import type {Attrs} from '@gravity-ui/markdown-editor/pm/model';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type LinkParser,
    bannerBackground,
    bannerDimensions,
    bannerLayout,
} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {BlockToolbar, isActive, isEnable} from '../../../../components/BlockToolbar';
import {imageUploader} from '../../../../components/settings';
import {uploadNodeFile} from '../../../../plugins/NodeUploadPlugin';
import {runCommand} from '../../../../utils/commands';
import {buttonNodeType} from '../../../Button/ButtonSpecs';
import {
    type RemovedParts,
    addBannerButton,
    bannerBackgroundSources,
    removeBanner,
    removeBannerButton,
    setBannerBackground,
    setBannerDimension,
    setBannerLayout,
    toggleBannerPart,
} from '../../commands';
import type {BannerUploadOptions} from '../../index';
import type {BannerParts} from '../../utils';

import type {BackgroundControls} from './Settings/BackgroundField';
import {BannerSettings} from './Settings/BannerSettings';
import type {ContentControls} from './Settings/SettingsFields';

type BannerToolbarProps = BannerUploadOptions & {
    view: EditorView;
    attrs: Attrs;
    pos: number;
    block: HTMLElement | null;
    parts: BannerParts;
    onSettingsLayer: (layer: HTMLDivElement | null) => void;
    markup: () => string;
    parser: LinkParser;
};

const COPY_BUTTON_WIDTH = 28;

const removedParts = new WeakMap<HTMLElement, RemovedParts>();

function removedPartsOf(block: HTMLElement | null): RemovedParts {
    if (!block) return new Map();
    const removed = removedParts.get(block) ?? new Map();
    removedParts.set(block, removed);
    return removed;
}

type BannerCopyButtonProps = ToolbarBaseProps<EditorView> & {markup?: () => string};

function BannerCopyButton({markup = () => ''}: BannerCopyButtonProps) {
    return <ClipboardButton qa="banner-copy" text={markup} />;
}

export function BannerToolbar({
    view,
    attrs,
    pos,
    block,
    parts,
    onSettingsLayer,
    markup,
    parser,
    fileUploadHandler,
    imageTypes,
    maxImageSize,
}: BannerToolbarProps) {
    const run = (command: Command) => runCommand(view, command);
    const uploadImage = fileUploadHandler && imageUploader(fileUploadHandler, parser);
    const content: ContentControls = {
        parts,
        buttonsAvailable: Boolean(buttonNodeType(view.state.schema)),
        onPartChange: (part, enabled) =>
            run(toggleBannerPart(pos, part, enabled, removedPartsOf(block))),
        onButtonChange: (index, enabled) =>
            run(enabled ? addBannerButton(pos) : removeBannerButton(pos, index)),
    };
    const background: BackgroundControls = {
        value: bannerBackground(attrs),
        parser,
        imageTypes,
        maxImageSize,
        onChange: (value) => run(setBannerBackground(pos, value)),
        upload:
            uploadImage &&
            ((file, signal) =>
                uploadNodeFile(
                    view,
                    pos,
                    file,
                    uploadImage,
                    (current, image) => setBannerBackground(current, {'bg-image': image}),
                    {attrs: bannerBackgroundSources, signal},
                )),
    };
    const data: ToolbarData<EditorView> = [
        [
            {
                id: 'banner-settings',
                type: ToolbarDataType.ButtonPopup,
                icon: {data: Gear},
                title: i18n('settings'),
                isActive,
                isEnable,
                exec: () => {},
                renderPopup: ({anchorElement, hide}) => (
                    <BannerSettings
                        editor={view.dom}
                        onLayer={onSettingsLayer}
                        button={anchorElement}
                        dimensions={bannerDimensions(attrs)}
                        onChange={(name, value) => run(setBannerDimension(pos, name, value))}
                        layout={bannerLayout(attrs)}
                        onLayoutChange={(name, value) => run(setBannerLayout(pos, name, value))}
                        content={content}
                        background={background}
                        onClose={hide}
                    />
                ),
            },
            {
                id: 'banner-copy',
                type: ToolbarDataType.ReactComponent,
                width: COPY_BUTTON_WIDTH,
                component: BannerCopyButton,
                props: {markup} satisfies Partial<BannerCopyButtonProps>,
                noRerenderOnUpdate: true,
            },
        ],
        [
            {
                id: 'banner-remove',
                type: ToolbarDataType.SingleButton,
                icon: {data: TrashBin},
                title: i18n('remove'),
                theme: 'danger',
                isActive,
                isEnable,
                exec: (editor) => runCommand(editor, removeBanner(pos)),
            },
        ],
    ];

    return <BlockToolbar view={view} qa="g-md-toolbar-banner" data={data} />;
}
