import {Gear, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerBackground, bannerDimensions} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {cancelBannerUploads, uploadBannerFile} from '../../../../plugins/BannerUploadPlugin';
import {removeBanner, setBannerBackground, setBannerDimension} from '../../commands';
import type {BannerOptions} from '../../index';

import type {BackgroundControls} from './Settings/BackgroundField';
import {BannerSettings} from './Settings/BannerSettings';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const bannerToolbars = new WeakMap<EditorView, HTMLElement>();

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
    const background: BackgroundControls = {
        value: bannerBackground(node.attrs),
        imageTypes,
        maxImageSize,
        onChange: (value) => setBannerBackground(pos, value)(view.state, view.dispatch),
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
                            setBannerDimension(pos, name, value)(view.state, view.dispatch)
                        }
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
                exec: (editor) => removeBanner(pos)(editor.state, editor.dispatch),
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
