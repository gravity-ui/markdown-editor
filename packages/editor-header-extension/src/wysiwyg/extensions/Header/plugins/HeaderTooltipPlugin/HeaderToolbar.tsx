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
import {headerDimensions} from '@gravity-ui/markdown-plugin-header';
import {ClipboardButton} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {removeHeader, setHeaderDimension} from '../../commands';

import {HeaderSettings} from './Settings/HeaderSettings';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const headerToolbars = new WeakMap<EditorView, HTMLElement>();

const isActive = () => false;
const isEnable = () => true;

const COPY_BUTTON_WIDTH = 28;

type HeaderCopyButtonProps = ToolbarBaseProps<EditorView> & {markup?: () => string};

function HeaderCopyButton({markup = () => ''}: HeaderCopyButtonProps) {
    return <ClipboardButton qa="header-copy" text={markup} />;
}

type HeaderToolbarProps = {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
    /** The Markdown of the banner, read when it is copied. */
    markup: () => string;
};

export function HeaderToolbar({view, node, pos, block, markup}: HeaderToolbarProps) {
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
                            setHeaderDimension(pos, name, value)(view.state, view.dispatch)
                        }
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
                exec: (editor) => removeHeader(pos)(editor.state, editor.dispatch),
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
