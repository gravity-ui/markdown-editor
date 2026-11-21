import {Gear, TrashBin} from '@gravity-ui/icons';
import {
    type ToolbarBaseProps,
    type ToolbarData,
    ToolbarDataType,
} from '@gravity-ui/markdown-editor';
import type {Attrs} from '@gravity-ui/markdown-editor/pm/model';
import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {type BannerModel, bannerModel} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {cancelBannerUploads, uploadBannerFile} from '../../../../plugins/BannerUploadPlugin';
import {buttonNodeType} from '../../../Button/ButtonSpecs';
import {BlockToolbar, isActive, isEnable} from '../../../blockToolbar';
import {runCommand} from '../../../commands';
import type {BannerOptions} from '../../Banner';
import {
    type RemovedParts,
    addBannerButton,
    removeBanner,
    removeBannerButton,
    setBannerAttrs,
    toggleBannerPart,
} from '../../commands';
import type {BannerParts} from '../../utils';

import type {BackgroundControls} from './Settings/BackgroundField';
import {BannerSettings} from './Settings/BannerSettings';
import type {ContentControls} from './Settings/SettingsFields';

type BannerToolbarProps = BannerOptions & {
    view: EditorView;
    attrs: Attrs;
    pos: number;
    block: HTMLElement | null;
    parts: BannerParts;
    markup: () => string;
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
    markup,
    fileUploadHandler,
    imageTypes,
    maxImageSize,
}: BannerToolbarProps) {
    const run = (command: Command) => runCommand(view, command);
    const model = bannerModel(attrs);
    const setAttrs = (changes: Partial<BannerModel>) => run(setBannerAttrs(pos, changes));
    const content: ContentControls = {
        parts,
        buttonsAvailable: Boolean(buttonNodeType(view.state.schema)),
        onPartChange: (part, enabled) =>
            run(toggleBannerPart(pos, part, enabled, removedPartsOf(block))),
        onButtonChange: (index, enabled) =>
            run(enabled ? addBannerButton(pos) : removeBannerButton(pos, index)),
    };
    const background: BackgroundControls = {
        value: model,
        imageTypes,
        maxImageSize,
        onChange: (value) => {
            if ('bg-image' in value) cancelBannerUploads(view, pos);
            setAttrs(value);
        },
        upload:
            fileUploadHandler &&
            ((file) =>
                uploadBannerFile(view, pos, file, fileUploadHandler, (current, src) =>
                    setBannerAttrs(current, {'bg-image': src}),
                )),
        cancelUpload: () => cancelBannerUploads(view, pos),
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
                        block={block}
                        button={anchorElement}
                        model={model}
                        onChange={setAttrs}
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
