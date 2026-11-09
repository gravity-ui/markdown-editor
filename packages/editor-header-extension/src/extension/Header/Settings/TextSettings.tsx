import type {Command} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {
    type HeaderTextAttrs,
    headerTextColors,
    headerTitleSizes,
    normalizeHeaderTitleAttrs,
} from '@gravity-ui/markdown-plugin-header';
import {Switch, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../i18n';
import {findHeaderSlot, setHeaderTextVisibility, setHeaderTitleAttrs} from '../text/commands';

import {SettingsSelect} from './SettingsSelect';

type TextSettingsProps = {
    view: EditorView;
    pos: number;
};

export function TextSettings({view, pos}: TextSettingsProps) {
    const title = findHeaderSlot(view.state, pos, 'title')?.node;
    const description = findHeaderSlot(view.state, pos, 'description')?.node;
    if (!title || !description) return null;
    const {size, color} = normalizeHeaderTitleAttrs(title.attrs);
    const run = (command: Command) => command(view.state, view.dispatch);
    const toggle = (slot: keyof HeaderTextAttrs) => (visible: boolean) =>
        run(setHeaderTextVisibility(pos, slot, visible));
    return (
        <>
            <Text variant="subheader-2">{i18n('text')}</Text>
            <Switch
                size="m"
                checked={!title.attrs.hidden}
                onUpdate={toggle('title')}
                content={i18n('show-title')}
                qa="header-settings-title"
            />
            <Switch
                size="m"
                checked={!description.attrs.hidden}
                onUpdate={toggle('description')}
                content={i18n('show-description')}
                qa="header-settings-description"
            />
            <SettingsSelect
                label={i18n('title-size')}
                value={size}
                values={headerTitleSizes}
                format={(value) => `H${value}`}
                onUpdate={(value) => run(setHeaderTitleAttrs(pos, {size: value}))}
            />
            <SettingsSelect
                label={i18n('title-color')}
                value={color}
                values={headerTextColors}
                format={(value) => i18n(`color-${value}`)}
                onUpdate={(value) => run(setHeaderTitleAttrs(pos, {color: value}))}
            />
        </>
    );
}
