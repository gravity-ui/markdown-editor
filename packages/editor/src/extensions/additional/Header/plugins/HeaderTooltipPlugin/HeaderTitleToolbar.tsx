import {useEffect, useState} from 'react';

import {Popup, Select} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {i18n} from 'src/i18n/header';
import {i18n as menubarI18n} from 'src/i18n/menubar';

import {setHeaderTitle} from '../../commands';

import {HeaderColorControl} from './HeaderColorControl';

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
    useEffect(() => () => onMenuOpenChange(false), [onMenuOpenChange]);
    const patch = (attrs: Record<string, string>) => {
        setHeaderTitle(pos, attrs)(editorView.state, editorView.dispatch);
        editorView.focus();
    };
    const menuOpenChange = (open: boolean) => {
        onMenuOpenChange(open);
        if (!open) editorView.focus();
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
                className="g-md-header-title-toolbar"
                role="toolbar"
                aria-label={i18n('title')}
                data-qa="g-md-toolbar-header-title"
            >
                <Select
                    view="clear"
                    width={120}
                    aria-label={i18n('title_size')}
                    value={[node.attrs.size]}
                    options={(['1', '2', '3', '4', '5', '6'] as const).map((value) => ({
                        value,
                        content: menubarI18n(`heading${value}`),
                    }))}
                    onOpenChange={menuOpenChange}
                    onUpdate={([size]) => patch({size})}
                />
                <HeaderColorControl
                    label={i18n('title_color')}
                    value={node.attrs.color}
                    onOpenChange={menuOpenChange}
                    onUpdate={(color) => patch({color: color || 'auto'})}
                />
            </div>
        </Popup>
    );
}
