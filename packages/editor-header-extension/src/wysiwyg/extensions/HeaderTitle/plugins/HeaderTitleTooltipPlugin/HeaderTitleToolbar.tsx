import type {SVGProps} from 'react';

import {Font, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6} from '@gravity-ui/icons';
import type {ToolbarData, ToolbarIconData} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderTitleColor,
    type HeaderTitleModel,
    headerTitleClassName,
    headerTitleColors,
    headerTitleSizes,
} from '@gravity-ui/markdown-plugin-header';

import {i18n} from '../../../../../i18n';
import {BlockToolbar, type ToolbarOption, optionsButton} from '../../../blockToolbar';
import {runCommand} from '../../../commands';
import {setHeaderTitleAttrs} from '../../commands';

const colorIcon = (color: HeaderTitleColor): ToolbarIconData => {
    const className = color === 'auto' ? undefined : `${headerTitleClassName}_color_${color}`;
    return {data: (props: SVGProps<SVGSVGElement>) => <Font {...props} className={className} />};
};

const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

const sizeOptions: ToolbarOption<HeaderTitleModel['size']>[] = headerTitleSizes.map((size) => ({
    value: size,
    icon: {data: headingIcons[size - 1]},
    title: () => i18n('heading-size', {size}),
}));

const colorOptions: ToolbarOption<HeaderTitleModel['color']>[] = headerTitleColors.map((color) => ({
    value: color,
    icon: colorIcon(color),
    title: () => i18n(`title-color-${color}`),
}));

type HeaderTitleToolbarProps = HeaderTitleModel & {
    view: EditorView;
    pos: number;
};

export function HeaderTitleToolbar({view, pos, size, color}: HeaderTitleToolbarProps) {
    const setAttrs = (attrs: Partial<HeaderTitleModel>) =>
        runCommand(view, setHeaderTitleAttrs(pos, attrs));
    const data: ToolbarData<EditorView> = [
        [
            optionsButton({
                id: 'header-title-size',
                title: (value) => i18n('title-size', {value}),
                options: sizeOptions,
                current: size,
                onSelect: (value) => setAttrs({size: value}),
            }),
            optionsButton({
                id: 'header-title-color',
                title: (value) => i18n('title-color', {value}),
                options: colorOptions,
                current: color,
                onSelect: (value) => setAttrs({color: value}),
            }),
        ],
    ];

    return <BlockToolbar view={view} qa="g-md-toolbar-header-title" data={data} />;
}
