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
import {headerBackground, headerDimensions} from '@gravity-ui/markdown-plugin-header';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {cancelHeaderUploads, uploadHeaderFile} from '../../../../plugins/HeaderUploadPlugin';
import {runCommand} from '../../../commands';
import {
    type RemovedParts,
    removeHeader,
    setHeaderBackground,
    setHeaderDimension,
    toggleHeaderPart,
} from '../../commands';
import type {HeaderOptions} from '../../index';
import {headerPartTypes, headerParts} from '../../parts';

import type {BackgroundControls} from './Settings/BackgroundField';
import {HeaderSettings} from './Settings/HeaderSettings';
import type {ContentControls} from './Settings/SettingsFields';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const headerToolbars = new WeakMap<EditorView, HTMLElement>();

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

const COPY_BUTTON_WIDTH = 28;

type HeaderCopyButtonProps = ToolbarBaseProps<EditorView> & {markup?: () => string};

function HeaderCopyButton({markup = () => ''}: HeaderCopyButtonProps) {
    return <ClipboardButton qa="header-copy" text={markup} />;
}

type HeaderToolbarProps = HeaderOptions & {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    /** The Markdown of the banner, read when it is copied. */
    markup: () => string;
};

export function HeaderToolbar({
    view,
    node,
    pos,
    block,
    markup,
    fileUploadHandler,
    imageTypes,
    maxImageSize,
}: HeaderToolbarProps) {
    const content: ContentControls = {
        parts: headerParts(node),
        available: headerPartTypes(view.state.schema),
        onPartChange: (part, enabled) =>
            runCommand(view, toggleHeaderPart(pos, part, enabled, removedPartsOf(block))),
    };
    const background: BackgroundControls = {
        value: headerBackground(node.attrs),
        imageTypes,
        maxImageSize,
        onChange: (value) => runCommand(view, setHeaderBackground(pos, value)),
        upload:
            fileUploadHandler &&
            ((file) =>
                uploadHeaderFile(view, pos, file, fileUploadHandler, (current, image) =>
                    setHeaderBackground(current, {'bg-image': image}),
                )),
        cancelUpload: () => cancelHeaderUploads(view, pos),
    };
    const data: ToolbarData<EditorView> = [
        [
            {
                id: 'header-settings',
                type: ToolbarDataType.ButtonPopup,
                icon: {data: Gear},
                title: i18n('settings'),
                isActive,
                isEnable,
                exec: () => {},
                renderPopup: ({anchorElement, hide}) => (
                    <HeaderSettings
                        block={block}
                        button={anchorElement}
                        dimensions={headerDimensions(node.attrs)}
                        onChange={(name, value) =>
                            runCommand(view, setHeaderDimension(pos, name, value))
                        }
                        content={content}
                        background={background}
                        onClose={hide}
                    />
                ),
            },
            {
                id: 'header-copy',
                type: ToolbarDataType.ReactComponent,
                width: COPY_BUTTON_WIDTH,
                component: HeaderCopyButton,
                props: {markup} satisfies Partial<HeaderCopyButtonProps>,
                noRerenderOnUpdate: true,
            },
        ],
        [
            {
                id: 'header-remove',
                type: ToolbarDataType.SingleButton,
                theme: 'danger',
                icon: {data: TrashBin},
                title: i18n('remove'),
                isActive,
                isEnable,
                exec: (editor) => runCommand(editor, removeHeader(pos)),
            },
        ],
    ];

    return (
        <div
            className={b()}
            ref={(element) => {
                if (element) headerToolbars.set(view, element);
                else headerToolbars.delete(view);
            }}
        >
            <Toolbar
                editor={view}
                focus={() => view.focus()}
                qa="g-md-toolbar-header"
                data={data}
            />
        </div>
    );
}
