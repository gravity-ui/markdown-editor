import {Copy, TrashBin} from '@gravity-ui/icons';
import {Toolbar, type ToolbarData, ToolbarDataType, cn} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';

import {i18n} from '../../../../../i18n';
import {copyHeader, removeHeader} from '../../commands';

import './HeaderToolbar.scss';

const b = cn('header-toolbar');

/** The open toolbar of each editor, for the keymap to move focus into it. */
export const headerToolbars = new WeakMap<EditorView, HTMLElement>();

const isActive = () => false;
const isEnable = () => true;

type HeaderToolbarProps = {
    view: EditorView;
    pos: number;
};

export function HeaderToolbar({view, pos}: HeaderToolbarProps) {
    const data: ToolbarData<EditorView> = [
        [
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
