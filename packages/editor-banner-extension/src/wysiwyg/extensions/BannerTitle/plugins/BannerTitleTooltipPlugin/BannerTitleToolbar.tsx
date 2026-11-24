import type {SVGProps} from 'react';

import {Font, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6} from '@gravity-ui/icons';
import type {ToolbarData, ToolbarIconData} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type BannerTitleColor,
    type BannerTitleModel,
    bannerTitleClassName,
    bannerTitleColors,
    bannerTitleSizes,
} from '@gravity-ui/markdown-plugin-banner';

import {i18n} from '../../../../../i18n';
import {BlockToolbar, type ToolbarOption, optionsButton} from '../../../blockToolbar';
import {runCommand} from '../../../commands';
import {setBannerTitleAttrs} from '../../commands';

const colorIcon = (color: BannerTitleColor): ToolbarIconData => {
    const className = color === 'auto' ? undefined : `${bannerTitleClassName}_color_${color}`;
    return {data: (props: SVGProps<SVGSVGElement>) => <Font {...props} className={className} />};
};

const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

const sizeOptions: ToolbarOption<BannerTitleModel['size']>[] = bannerTitleSizes.map((size) => ({
    value: size,
    icon: {data: headingIcons[size - 1]},
    title: () => i18n('heading-size', {size}),
}));

const colorOptions: ToolbarOption<BannerTitleModel['color']>[] = bannerTitleColors.map((color) => ({
    value: color,
    icon: colorIcon(color),
    title: () => i18n(`title-color-${color}`),
}));

type BannerTitleToolbarProps = BannerTitleModel & {
    view: EditorView;
    pos: number;
};

export function BannerTitleToolbar({view, pos, size, color}: BannerTitleToolbarProps) {
    const setAttrs = (attrs: Partial<BannerTitleModel>) =>
        runCommand(view, setBannerTitleAttrs(pos, attrs));
    const data: ToolbarData<EditorView> = [
        [
            optionsButton({
                id: 'banner-title-size',
                title: (value) => i18n('title-size', {value}),
                options: sizeOptions,
                current: size,
                onSelect: (value) => setAttrs({size: value}),
            }),
            optionsButton({
                id: 'banner-title-color',
                title: (value) => i18n('title-color', {value}),
                options: colorOptions,
                current: color,
                onSelect: (value) => setAttrs({color: value}),
            }),
        ],
    ];

    return <BlockToolbar view={view} qa="g-md-toolbar-banner-title" data={data} />;
}
