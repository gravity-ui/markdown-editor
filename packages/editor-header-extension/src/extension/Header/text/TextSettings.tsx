import {useId} from 'react';

import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderTextAttrs,
    headerTextColors,
    headerTitleSizes,
    isHeaderTextColor,
    isHeaderTitleSize,
    normalizeHeaderTextAttrs,
    normalizeHeaderTitleAttrs,
} from '@gravity-ui/markdown-plugin-header';
import {Select, Switch, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';

import {setHeaderTitleColor, setHeaderTitleSize, toggleHeaderText} from './commands';

export function TextSettings({view, node}: {view: EditorView; node: Node}) {
    const sizeId = useId();
    const colorId = useId();
    const visibility = normalizeHeaderTextAttrs(node.attrs);
    const title = normalizeHeaderTitleAttrs(node.firstChild?.attrs ?? {});
    const toggle = (slot: keyof HeaderTextAttrs) => (visible: boolean) =>
        toggleHeaderText(view.state, view.dispatch, view, {slot, visible});

    return (
        <>
            <Text variant="subheader-2">{i18n('text')}</Text>
            <Switch
                size="m"
                checked={visibility.title}
                onUpdate={toggle('title')}
                content={i18n('show-title')}
                qa="header-settings-title"
            />
            <Switch
                size="m"
                checked={visibility.description}
                onUpdate={toggle('description')}
                content={i18n('show-description')}
                qa="header-settings-description"
            />
            <div className="g-md-header-settings__row">
                <Text variant="body-1" id={sizeId}>
                    {i18n('title-size')}
                </Text>
                <Select
                    size="m"
                    width="max"
                    aria-labelledby={sizeId}
                    value={[title.size]}
                    options={headerTitleSizes.map((value) => ({value, content: `H${value}`}))}
                    onUpdate={([size]) => {
                        if (isHeaderTitleSize(size))
                            setHeaderTitleSize(view.state, view.dispatch, view, {size});
                    }}
                />
            </div>
            <div className="g-md-header-settings__row">
                <Text variant="body-1" id={colorId}>
                    {i18n('title-color')}
                </Text>
                <Select
                    size="m"
                    width="max"
                    aria-labelledby={colorId}
                    value={[title.color]}
                    options={headerTextColors.map((value) => ({
                        value,
                        content: i18n(`color-${value}`),
                    }))}
                    onUpdate={([color]) => {
                        if (isHeaderTextColor(color))
                            setHeaderTitleColor(view.state, view.dispatch, view, {color});
                    }}
                />
            </div>
        </>
    );
}
