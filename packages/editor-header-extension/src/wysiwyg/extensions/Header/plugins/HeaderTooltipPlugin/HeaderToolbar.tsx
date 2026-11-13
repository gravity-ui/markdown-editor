import {Copy, Gear, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {headerBackground, headerDimensions} from '@gravity-ui/markdown-plugin-header';

import type {HeaderOptions} from '../..';
import {i18n} from '../../../../../i18n';
import {copyHeader, removeHeader, setHeaderBackground, setHeaderDimension} from '../../commands';
import {uploadHeaderImage} from '../HeaderUploadPlugin';

import type {BackgroundControls} from './Settings/BackgroundField';
import {HeaderSettings} from './Settings/HeaderSettings';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const headerToolbars = new WeakMap<EditorView, HTMLElement>();

const isActive = () => false;
const isEnable = () => true;

type HeaderToolbarProps = HeaderOptions & {
    view: EditorView;
    node: Node;
    pos: number;
    block: HTMLElement | null;
};

export function HeaderToolbar({
    view,
    node,
    pos,
    block,
    fileUploadHandler,
    imageTypes,
    maxImageSize,
}: HeaderToolbarProps) {
    const background: BackgroundControls = {
        value: headerBackground(node.attrs),
        imageTypes,
        maxImageSize,
        onChange: (value) => setHeaderBackground(pos, value)(view.state, view.dispatch),
        upload:
            fileUploadHandler && ((file) => uploadHeaderImage(view, pos, file, fileUploadHandler)),
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
                            setHeaderDimension(pos, name, value)(view.state, view.dispatch)
                        }
                        background={background}
                        onClose={hide}
                    />
                ),
            },
            {
                id: 'header-copy',
                type: ToolbarDataType.SingleButton,
                icon: {data: Copy},
                title: i18n('copy'),
                isActive,
                isEnable,
                exec: (editor) => copyHeader(pos)(editor.state, editor.dispatch),
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
