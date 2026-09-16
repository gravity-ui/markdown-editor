import {Square, SquareDashed, SquareDot, SquareXmark} from '@gravity-ui/icons';
import {ActionTooltip, Button, Icon, type IconProps} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {
    type HeaderAttrs,
    HeaderBorder,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderTextColor,
} from '../../HeaderSpecs';

import './HeaderAppearance.scss';

const b = cn('header-appearance');

type ChoiceOption<T> = {value: T; label: string; icon?: IconProps['data']};

function Choices<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: ChoiceOption<T>[];
    onChange: (value: T) => void;
}) {
    return (
        <div className={b('options')} role="group" aria-label={label}>
            {options.map((option) => {
                const button = (
                    <Button
                        key={option.value}
                        size="m"
                        view="flat"
                        selected={option.value === value}
                        aria-label={option.label}
                        aria-pressed={option.value === value}
                        onClick={() => {
                            if (option.value !== value) onChange(option.value);
                        }}
                    >
                        {option.icon ? <Icon data={option.icon} size={16} /> : option.label}
                    </Button>
                );

                return option.icon ? (
                    <ActionTooltip key={option.value} title={option.label}>
                        {button}
                    </ActionTooltip>
                ) : (
                    button
                );
            })}
        </div>
    );
}

export type AppearanceSettingsProps = {
    attrs: HeaderAttrs;
    onChange: (patch: Partial<HeaderAttrs>) => void;
};

export function AppearanceSettings({attrs, onChange}: AppearanceSettingsProps) {
    return (
        <div className={b()}>
            <div className={b('row')}>
                <span className={b('label')}>{i18n('format')}</span>
                <Choices
                    label={i18n('format')}
                    value={attrs.format}
                    onChange={(format) => onChange({format})}
                    options={[
                        {value: HeaderFormat.Large, label: i18n('format.large')},
                        {value: HeaderFormat.Small, label: i18n('format.small')},
                    ]}
                />
            </div>
            <div className={b('row')}>
                <span className={b('label')}>{i18n('edges')}</span>
                <Choices
                    label={i18n('edges')}
                    value={attrs.edges}
                    onChange={(edges) => onChange({edges})}
                    options={[
                        {value: HeaderEdges.Rounded, label: i18n('edges.rounded')},
                        {value: HeaderEdges.Bleed, label: i18n('edges.bleed')},
                    ]}
                />
            </div>
            <div className={b('row')}>
                <span className={b('label')}>{i18n('border')}</span>
                <Choices
                    label={i18n('border')}
                    value={attrs.border}
                    onChange={(border) => onChange({border})}
                    options={[
                        {value: HeaderBorder.None, label: i18n('border.none'), icon: SquareXmark},
                        {value: HeaderBorder.Solid, label: i18n('border.solid'), icon: Square},
                        {
                            value: HeaderBorder.Dashed,
                            label: i18n('border.dashed'),
                            icon: SquareDashed,
                        },
                        {value: HeaderBorder.Dotted, label: i18n('border.dotted'), icon: SquareDot},
                    ]}
                />
            </div>
            <div className={b('row')}>
                <span className={b('label')}>{i18n('text')}</span>
                <Choices
                    label={i18n('text')}
                    value={attrs.text}
                    onChange={(text) => onChange({text})}
                    options={[
                        {value: HeaderTextColor.Auto, label: i18n('text.auto')},
                        {value: HeaderTextColor.Light, label: i18n('text.light')},
                        {value: HeaderTextColor.Dark, label: i18n('text.dark')},
                    ]}
                />
            </div>
        </div>
    );
}

export type LayoutSettingsProps = {
    value: HeaderAttrs['layout'];
    onChange: (value: HeaderAttrs['layout']) => void;
};

export function LayoutSettings({value, onChange}: LayoutSettingsProps) {
    return (
        <div className={b('layout')}>
            <Choices
                label={i18n('layout')}
                value={value}
                onChange={onChange}
                options={[
                    {value: HeaderLayout.Cover, label: i18n('layout.cover')},
                    {value: HeaderLayout.Split, label: i18n('layout.split')},
                ]}
            />
        </div>
    );
}
