import type {ReactNode} from 'react';

import {ActionTooltip, Button} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/header';

import {
    type HeaderAttrs,
    HeaderBackground,
    HeaderBorder,
    HeaderDecor,
    HeaderEdges,
    HeaderFormat,
    HeaderLayout,
    HeaderTextColor,
} from '../../HeaderSpecs';

import './HeaderAppearance.scss';

const b = cn('header-appearance');

type ChoiceOption<T> = {value: T; label: string; preview?: ReactNode};

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
                        className={b('option')}
                        selected={option.value === value}
                        aria-label={option.label}
                        aria-pressed={option.value === value}
                        onClick={() => {
                            if (option.value !== value) onChange(option.value);
                        }}
                    >
                        {option.preview ?? option.label}
                    </Button>
                );

                return option.preview ? (
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
                    options={Object.values(HeaderBorder).map((border) => ({
                        value: border,
                        label: i18n(`border.${border}`),
                        preview: <span className={b('border', {style: border})} aria-hidden />,
                    }))}
                />
            </div>
            {/* The pattern lives on the fill; under an image there is nothing to decorate. */}
            {attrs.bg === HeaderBackground.Fill && (
                <div className={b('row')}>
                    <span className={b('label')}>{i18n('decor')}</span>
                    <Choices
                        label={i18n('decor')}
                        value={attrs.decor}
                        onChange={(decor) => onChange({decor})}
                        options={[
                            {value: HeaderDecor.Blobs, label: i18n('decor.blobs')},
                            {value: HeaderDecor.None, label: i18n('decor.none')},
                        ]}
                    />
                </div>
            )}
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
        <div className={b('layout')} role="group" aria-label={i18n('layout')}>
            <span className={b('label')}>{i18n('layout')}</span>
            <div className={b('layouts')}>
                {[HeaderLayout.Cover, HeaderLayout.Split].map((layout) => (
                    <button
                        key={layout}
                        type="button"
                        className={b('layout-option', {selected: value === layout})}
                        aria-pressed={value === layout}
                        onClick={() => onChange(layout)}
                    >
                        <span className={b('layout-preview', {type: layout})} aria-hidden>
                            <span className={b('layout-picture')} />
                            <span className={b('layout-lines')} />
                        </span>
                        {i18n(layout === HeaderLayout.Cover ? 'layout.cover' : 'layout.split')}
                    </button>
                ))}
            </div>
        </div>
    );
}
