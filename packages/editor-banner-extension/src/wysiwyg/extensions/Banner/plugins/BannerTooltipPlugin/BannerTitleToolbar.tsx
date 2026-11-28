import {Heading1, Heading2, Heading3, Heading4, Heading5, Heading6} from '@gravity-ui/icons';
import {type BaseTooltipPlugin, ToolbarListButton, cn} from '@gravity-ui/markdown-editor';
import {ToolbarColors} from '@gravity-ui/markdown-editor/_/bundle/toolbar/custom/ToolbarColors.js';
import {closeHistory} from '@gravity-ui/markdown-editor/pm/history';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type BannerTitle,
    bannerTitleDefaults,
    bannerTitleFromAttrs,
    bannerTitleSizes,
    bannerTitleTokenName,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../i18n';

import './BannerToolbar.scss';

const b = cn('banner-toolbar');
const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

export const bannerTitleToolbars = new WeakMap<EditorView, HTMLDivElement>();

type BannerTitleToolbarProps = Pick<BaseTooltipPlugin.BaseTooltipNode, 'node' | 'pos'> & {
    view: EditorView;
};

export function BannerTitleToolbar({view, node, pos}: BannerTitleToolbarProps) {
    const {color, size} = node.attrs as BannerTitle;

    const setToolbar = (element: HTMLDivElement | null) => {
        if (element) bannerTitleToolbars.set(view, element);
        else bannerTitleToolbars.delete(view);
    };
    const focusEditor = () => view.focus();
    const setTitleAttr = <Key extends keyof BannerTitle>(name: Key, value: BannerTitle[Key]) => {
        const current = view.state.doc.nodeAt(pos);
        if (current?.type.name === bannerTitleTokenName && current.attrs[name] !== value) {
            view.dispatch(closeHistory(view.state.tr.setNodeAttribute(pos, name, value)));
        }
    };
    const setColor = (value: string) => {
        const next = bannerTitleFromAttrs((name) => (name === 'data-color' ? value : null)).color;
        setTitleAttr('color', next);
    };
    const sizes = bannerTitleSizes.map((headingSize) => ({
        id: `banner-title-size-${headingSize}`,
        icon: {data: headingIcons[headingSize - 1]},
        title: i18n('heading-size', {size: headingSize}),
        isActive: () => headingSize === size,
        isEnable: () => true,
        exec: () => setTitleAttr('size', headingSize),
    }));

    return (
        <div
            ref={setToolbar}
            className={b({title: true})}
            role="toolbar"
            aria-label={i18n('heading')}
            data-qa="g-md-toolbar-banner-title"
        >
            <ToolbarListButton
                editor={view}
                focus={focusEditor}
                icon={{data: headingIcons[size - 1]}}
                title={i18n('title-size', {value: i18n('heading-size', {size})})}
                qaMenu="g-md-banner-title-size-menu"
                data={sizes}
                withArrow
                alwaysActive
            />
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
