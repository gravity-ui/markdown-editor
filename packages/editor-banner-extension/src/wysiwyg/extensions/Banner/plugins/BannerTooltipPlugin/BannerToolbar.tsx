import {Gear, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerBackground, bannerDimensions, bannerLayout} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {cancelBannerUploads, uploadBannerFile} from '../../../../plugins/BannerUploadPlugin';
import {runCommand} from '../../../commands';
import {
    type RemovedParts,
    removeBanner,
    setBannerBackground,
    setBannerDimension,
    setBannerLayout,
    toggleBannerPart,
} from '../../commands';
import type {BannerOptions} from '../../index';
import {bannerPartTypes, bannerParts} from '../../parts';

import type {BackgroundControls} from './Settings/BackgroundField';
import {BannerSettings} from './Settings/BannerSettings';
import type {ContentControls, LayoutControls} from './Settings/SettingsFields';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const bannerToolbars = new WeakMap<EditorView, HTMLElement>();

/** The blocks removed with the settings switches, by banner, while its node view exists. */
const removedParts = new WeakMap<HTMLElement, RemovedParts>();

function removedPartsOf(block: HTMLElement | null): RemovedParts {
    if (!block) return new Map();
    const removed = removedParts.get(block) ?? new Map();
    removedParts.set(block, removed);
    return removed;
}

const isActive = () => false;
const isEnable = () => true;

type BannerToolbarProps = BannerOptions & {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    markup: () => string;
};

export function BannerToolbar({
    view,
    node,
    pos,
    block,
    markup,
    fileUploadHandler,
    imageTypes,
    maxImageSize,
}: BannerToolbarProps) {
    const content: ContentControls = {
        parts: bannerParts(node),
        available: bannerPartTypes(view.state.schema),
        onPartChange: (part, enabled) =>
            runCommand(view, toggleBannerPart(pos, part, enabled, removedPartsOf(block))),
    };
    const layout: LayoutControls = {
        value: bannerLayout(node.attrs),
        onChange: (name, value) => runCommand(view, setBannerLayout(pos, name, value)),
    };
    const background: BackgroundControls = {
        value: bannerBackground(node.attrs),
        imageTypes,
        maxImageSize,
        onChange: (value) => runCommand(view, setBannerBackground(pos, value)),
        upload:
            fileUploadHandler &&
            ((file) =>
                uploadBannerFile(view, pos, file, fileUploadHandler, (current, image) =>
                    setBannerBackground(current, {'bg-image': image}),
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
                        dimensions={bannerDimensions(node.attrs)}
                        onChange={(name, value) =>
                            runCommand(view, setBannerDimension(pos, name, value))
                        }
                        content={content}
                        layout={layout}
                        background={background}
                        onClose={hide}
                    />
                ),
            },
            {
                id: 'banner-copy',
                type: ToolbarDataType.ReactComponent,
                width: 28,
                component: () => <ClipboardButton text={markup} />,
                noRerenderOnUpdate: true,
            },
        ],
        [
            {
                id: 'banner-remove',
                type: ToolbarDataType.SingleButton,
                theme: 'danger',
                icon: {data: TrashBin},
                title: i18n('remove'),
                isActive,
                isEnable,
                exec: (editor) => runCommand(editor, removeBanner(pos)),
            },
        ],
    ];

    return (
        <div
            className={b()}
            ref={(element) => {
                if (element) bannerToolbars.set(view, element);
                else bannerToolbars.delete(view);
            }}
        >
            <Toolbar
                editor={view}
                focus={() => view.focus()}
                qa="g-md-toolbar-banner"
                data={data}
            />
        </div>
    );
}
