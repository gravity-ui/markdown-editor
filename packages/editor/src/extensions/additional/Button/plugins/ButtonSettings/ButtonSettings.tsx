import {Switch, Text, TextInput} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/button';

import {
    BUTTON_TARGET_BLANK,
    ButtonAttr,
    type ButtonStyle,
    normalizeButtonStyle,
} from '../../ButtonSpecs';

import {StyleSelect} from './StyleSelect';

import './ButtonSettings.scss';

const b = cn('button-settings');

export type ButtonSettingsProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
};

export function ButtonSettings({node, pos, editorView}: ButtonSettingsProps) {
    const {attrs} = node;

    const update = (patch: Record<string, string>) => {
        const tr = editorView.state.tr;
        for (const [name, value] of Object.entries(patch)) tr.setNodeAttribute(pos, name, value);
        editorView.dispatch(tr);
    };

    return (
        <div className={b()}>
            <div className={b('header')}>
                <TextInput
                    size="l"
                    hasClear
                    value={attrs[ButtonAttr.Label]}
                    controlProps={{'aria-label': i18n('label')}}
                    onUpdate={(label) => update({[ButtonAttr.Label]: label})}
                />
            </div>
            <div className={b('body')}>
                <div className={b('item')}>
                    <Text className={b('name')}>{i18n('style')}</Text>
                    <StyleSelect
                        style={normalizeButtonStyle(
                            attrs[ButtonAttr.View],
                            attrs[ButtonAttr.Color],
                        )}
                        label={attrs[ButtonAttr.Label]}
                        onUpdate={({view, color}: ButtonStyle) =>
                            update({[ButtonAttr.View]: view, [ButtonAttr.Color]: color})
                        }
                    />
                </div>
                <div className={b('item')}>
                    <Text className={b('name')}>{i18n('link')}</Text>
                    <TextInput
                        size="l"
                        value={attrs[ButtonAttr.Href]}
                        placeholder={i18n('link_placeholder')}
                        onUpdate={(href) => update({[ButtonAttr.Href]: href})}
                    />
                </div>
                <label className={b('toggle')}>
                    <Text>{i18n('new_tab')}</Text>
                    <Switch
                        size="m"
                        checked={attrs[ButtonAttr.Target] === BUTTON_TARGET_BLANK}
                        onUpdate={(checked) =>
                            update({[ButtonAttr.Target]: checked ? BUTTON_TARGET_BLANK : ''})
                        }
                    />
                </label>
            </div>
        </div>
    );
}
