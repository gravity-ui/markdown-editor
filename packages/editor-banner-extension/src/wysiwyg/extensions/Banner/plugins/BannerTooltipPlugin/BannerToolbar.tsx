import {Gear, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {bannerDimensions} from '@gravity-ui/markdown-plugin-banner';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {runCommand} from '../../../commands';
import {
    type RemovedParts,
    removeBanner,
    setBannerDimension,
    toggleBannerPart,
} from '../../commands';
import {bannerPartTypes, bannerParts} from '../../parts';

import {BannerSettings} from './Settings/BannerSettings';
import type {ContentControls} from './Settings/SettingsFields';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const bannerToolbars = new WeakMap<EditorView, HTMLElement>();

/** The blocks removed with the settings switches, by banner, until the page reloads. */
const removedParts = new WeakMap<HTMLElement, RemovedParts>();

function removedPartsOf(block: HTMLElement | null): RemovedParts {
    if (!block) return new Map();
    const removed = removedParts.get(block) ?? new Map();
    removedParts.set(block, removed);
    return removed;
}

const isActive = () => false;
const isEnable = () => true;

type BannerToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    markup: () => string;
};

export function BannerToolbar({view, node, pos, block, markup}: BannerToolbarProps) {
    const content: ContentControls = {
        parts: bannerParts(node),
        available: bannerPartTypes(view.state.schema),
        onPartChange: (part, enabled) =>
            runCommand(view, toggleBannerPart(pos, part, enabled, removedPartsOf(block))),
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
