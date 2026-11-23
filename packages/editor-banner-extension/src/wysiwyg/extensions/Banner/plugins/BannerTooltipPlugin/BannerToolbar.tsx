import {Gear, TrashBin} from '@gravity-ui/icons';
import {
    Toolbar,
    type ToolbarBaseProps,
    type ToolbarData,
    ToolbarDataType,
    cn,
} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerDimensions} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {removeBanner, setBannerDimension} from '../../commands';

import {BannerSettings} from './Settings/BannerSettings';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const bannerToolbars = new WeakMap<EditorView, HTMLElement>();

const isActive = () => false;
const isEnable = () => true;

const COPY_BUTTON_WIDTH = 28;

type BannerCopyButtonProps = ToolbarBaseProps<EditorView> & {markup?: () => string};

function BannerCopyButton({markup = () => ''}: BannerCopyButtonProps) {
    return <ClipboardButton qa="banner-copy" text={markup} />;
}

type BannerToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    markup: () => string;
};

export function BannerToolbar({view, node, pos, block, markup}: BannerToolbarProps) {
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
