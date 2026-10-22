import {Checkbox, Select, TextInput} from '@gravity-ui/uikit';

import {i18n} from 'src/i18n/header';

import {type ButtonAttrs, buttonColors, buttonViews} from './ButtonSpecs';

const views = {
    action: 'button_action',
    normal: 'button_normal',
    outlined: 'button_outlined',
    flat: 'button_flat',
} as const;
const colors = {
    default: 'button_default',
    gray: 'button_gray',
    blue: 'button_blue',
    green: 'button_green',
    yellow: 'button_yellow',
    orange: 'button_orange',
    red: 'button_red',
    violet: 'button_violet',
} as const;
export function ButtonFields({
    attrs,
    onUpdate,
    label,
    showText = true,
    panel = false,
}: {
    attrs: ButtonAttrs;
    onUpdate: (patch: Partial<ButtonAttrs>) => void;
    label: string;
    showText?: boolean;
    panel?: boolean;
}) {
    const textInput = (
        <TextInput
            value={attrs.label}
            hasClear
            controlProps={{'aria-label': `${label}: ${i18n('action_text')}`}}
            onUpdate={(text) => onUpdate({label: text})}
        />
    );
    return (
        <div className="g-md-button-fields">
            {showText && !panel && textInput}
            <div className="g-md-button-fields__row">
                <span>{i18n('action_style')}</span>
                <Select
                    width="max"
                    aria-label={`${label}: ${i18n('action_style')}`}
                    value={[`${attrs.view}:${attrs.color}`]}
                    renderSelectedOption={() => (
                        <span className="g-md-button-fields__option">
                            <span
                                aria-hidden
                                className="g-md-button g-md-button-fields__swatch"
                                data-view={attrs.view}
                                data-color={attrs.color}
                            />
                            <span>{i18n(views[attrs.view as keyof typeof views])}</span>
                        </span>
                    )}
                    options={buttonViews.map((view) => ({
                        label: i18n(views[view]),
                        options: buttonColors
                            .filter((color) =>
                                view === 'action'
                                    ? color !== 'gray'
                                    : color !== 'orange' &&
                                      (view === 'flat' || color !== 'default'),
                            )
                            .map((color) => ({
                                value: `${view}:${color}`,
                                text: `${i18n(views[view])}: ${i18n(colors[color])}`,
                                content: (
                                    <span className="g-md-button-fields__option">
                                        <span
                                            aria-hidden
                                            className="g-md-button g-md-button-fields__swatch"
                                            data-view={view}
                                            data-color={color}
                                        />
                                        <span>{i18n(colors[color])}</span>
                                    </span>
                                ),
                            })),
                    }))}
                    onUpdate={([value]) => {
                        const [view, color] = value.split(':');
                        onUpdate({view, color});
                    }}
                />
            </div>
            {showText && panel && (
                <div className="g-md-button-fields__row">
                    <span>{i18n('action_text')}</span>
                    {textInput}
                </div>
            )}
            <div className="g-md-button-fields__row">
                <span>{i18n('action_link')}</span>
                <TextInput
                    value={attrs.href}
                    placeholder={i18n('action_href')}
                    controlProps={{'aria-label': `${label}: ${i18n('action_href')}`}}
                    onUpdate={(href) => onUpdate({href})}
                />
            </div>
            <Checkbox
                className="g-md-button-fields__check"
                checked={attrs['new-tab']}
                onUpdate={(checked) => onUpdate({'new-tab': checked})}
            >
                {i18n('new_tab')}
            </Checkbox>
        </div>
    );
}
