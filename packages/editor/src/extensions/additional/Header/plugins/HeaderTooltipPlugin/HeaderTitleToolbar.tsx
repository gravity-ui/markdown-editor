import {useState} from 'react';

import {Popup} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {icons} from 'src/bundle/config/icons';
import {ToolbarButtonWithPopupMenu} from 'src/bundle/toolbar/ToolbarButtonWithPopupMenu';
import {ToolbarColors} from 'src/bundle/toolbar/custom/ToolbarColors';
import {i18n} from 'src/i18n/header';
import {i18n as menubarI18n} from 'src/i18n/menubar';

import {setHeaderTitle} from '../../commands';

export function HeaderTitleToolbar({
    node,
    pos,
    editorView,
    onMenuOpenChange,
}: {
    node: Node;
    pos: number;
    editorView: EditorView;
    onMenuOpenChange: (open: boolean) => void;
}) {
    const [dismissed, setDismissed] = useState(false);
    const patch = (attrs: Record<string, string>) => {
        setHeaderTitle(pos, attrs)(editorView.state, editorView.dispatch);
        editorView.focus();
    };
    const anchor = editorView.nodeDOM(pos + 1);
    if (dismissed || !(anchor instanceof HTMLElement)) return null;
    return (
        <Popup
            open
            className="g-md-header-toolbar__popup"
            anchorElement={anchor}
            placement={['bottom-start', 'top-start']}
            offset={8}
            onOpenChange={(open) => {
                if (!open) setDismissed(true);
            }}
        >
            <div
                className="g-md-header-toolbar g-md-header-title-toolbar"
                role="toolbar"
                aria-label={i18n('title')}
                data-qa="g-md-toolbar-header-title"
            >
                <ToolbarButtonWithPopupMenu
                    title={i18n('title_size')}
                    icon={icons.headline}
                    focus={() => editorView.focus()}
                    onOpenChange={onMenuOpenChange}
                    menuItems={(['1', '2', '3', '4', '5', '6'] as const).map((size) => ({
                        id: size,
                        icon: icons[`h${size}`].data,
                        text: menubarI18n(`heading${size}`),
                        ignoreActive: true,
                        action: {
                            run: () => patch({size}),
                            isEnable: () => true,
                            isActive: () => node.attrs.size === size,
                            meta() {},
                        },
                    }))}
                />
                <ToolbarColors
                    enable
                    withDefault
                    currentColor={node.attrs.color === 'auto' ? undefined : node.attrs.color}
                    focus={() => editorView.focus()}
                    onOpenChange={onMenuOpenChange}
                    exec={(color) => patch({color: color || 'auto'})}
                />
            </div>
        </Popup>
    );
}
