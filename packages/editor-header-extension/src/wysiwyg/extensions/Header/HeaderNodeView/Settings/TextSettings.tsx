import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import {
    type HeaderTextAttrs,
    type HeaderTitleAttrs,
    headerTextColors,
    headerTitleSizes,
    normalizeHeaderTitleAttrs,
} from '@gravity-ui/markdown-plugin-header';
import {Switch, Text} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';
import {findHeaderSlot} from '../../text/commands';

import {SettingsSelect} from './SettingsSelect';

type TextSettingsProps = {
    header: Node;
    onTitleChange: (attrs: Partial<HeaderTitleAttrs>) => void;
    onVisibilityChange: (slot: keyof HeaderTextAttrs, visible: boolean) => void;
};

export function TextSettings({header, onTitleChange, onVisibilityChange}: TextSettingsProps) {
    const title = findHeaderSlot(header, 'title')?.node;
    const description = findHeaderSlot(header, 'description')?.node;
    if (!title || !description) return null;
    const {size, color} = normalizeHeaderTitleAttrs(title.attrs);
    const toggle = (slot: keyof HeaderTextAttrs) => (visible: boolean) =>
        onVisibilityChange(slot, visible);
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
                onUpdate={(value) => onTitleChange({size: value})}
            />
            <SettingsSelect
                label={i18n('title-color')}
                value={color}
                values={headerTextColors}
                format={(value) => i18n(`color-${value}`)}
                onUpdate={(value) => onTitleChange({color: value})}
            />
        </>
    );
}
