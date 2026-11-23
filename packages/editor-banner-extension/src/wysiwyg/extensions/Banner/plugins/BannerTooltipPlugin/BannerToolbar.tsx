import {Copy, Gear, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {Serializer} from '@gravity-ui/markdown-editor/core';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerDimensions} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../i18n';
import {copyBanner, removeBanner, setBannerDimension} from '../../commands';

import {BannerSettings} from './Settings/BannerSettings';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const bannerToolbars = new WeakMap<EditorView, HTMLElement>();

const isActive = () => false;
const isEnable = () => true;

type BannerToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    serializer: Serializer;
};

export function BannerToolbar({view, node, pos, block, serializer}: BannerToolbarProps) {
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
                type: ToolbarDataType.SingleButton,
                icon: {data: Copy},
                title: i18n('copy'),
                isActive,
                isEnable,
                exec: (editor) => copyBanner(editor, pos, serializer),
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
