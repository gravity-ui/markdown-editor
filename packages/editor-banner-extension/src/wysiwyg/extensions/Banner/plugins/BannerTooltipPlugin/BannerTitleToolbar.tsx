import {type BaseTooltipPlugin, cn} from '@gravity-ui/markdown-editor';
import {ToolbarColors} from '@gravity-ui/markdown-editor/_/bundle/toolbar/custom/ToolbarColors.js';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    bannerTitleDefaults,
    bannerTitleFromAttrs,
    bannerTitleTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../i18n';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');

export const bannerTitleToolbars = new WeakMap<EditorView, HTMLDivElement>();

type BannerTitleToolbarProps = Pick<BaseTooltipPlugin.BaseTooltipNode, 'node' | 'pos'> & {
    view: EditorView;
};

export function BannerTitleToolbar({view, node, pos}: BannerTitleToolbarProps) {
    const color = node.attrs.color as string;

    const setToolbar = (element: HTMLDivElement | null) => {
        if (element) bannerTitleToolbars.set(view, element);
        else bannerTitleToolbars.delete(view);
    };
    const focusEditor = () => view.focus();
    const setColor = (value: string) => {
        const current = view.state.doc.nodeAt(pos);
        if (current?.type.name !== bannerTitleTokenName) return;
        const next = bannerTitleFromAttrs((name) => (name === 'data-color' ? value : null)).color;
        if (next !== current.attrs.color) {
            view.dispatch(closeHistory(view.state.tr.setNodeAttribute(pos, 'color', next)));
        }
    };

    return (
        <div
            ref={setToolbar}
            className={b()}
            role="toolbar"
            aria-label={i18n('heading')}
            data-qa="g-md-toolbar-banner-title"
        >
            <ToolbarColors
                currentColor={color === bannerTitleDefaults.color ? undefined : color}
                enable
                withDefault
                focus={focusEditor}
                exec={setColor}
            />
        </div>
    );
}
