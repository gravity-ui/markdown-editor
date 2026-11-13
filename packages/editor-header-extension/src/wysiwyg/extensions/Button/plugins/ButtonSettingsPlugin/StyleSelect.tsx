import {type Ref, useState} from 'react';

import {ChevronDown, Text as TextIcon} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {
    type ButtonColor,
    type ButtonView,
    buttonAttrs,
    buttonViewColors,
} from '@gravity-ui/markdown-plugin-header';
import {Icon, Popup, Select, type SelectOption} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';

import './StyleSelect.scss';

const b = cn('button-style');

const ROW_HEIGHT = 28;
const LIST_WIDTH = 158;
// The row ends 4px before the edge of the list.
const PREVIEW_OFFSET = 8;

type Style = {view: ButtonView; color: ButtonColor};

const styleValue = ({view, color}: Style) => `${view}/${color}`;
const buttonClass = (style: Style) => buttonAttrs(style).class;

const views = Object.keys(buttonViewColors) as ButtonView[];
const styles = views.flatMap((view) => buttonViewColors[view].map((color) => ({view, color})));

function Swatch({style, size}: {style: Style; size: 'm' | 'l'}) {
    return (
        <span className={`${b('swatch', {size, view: style.view})} ${buttonClass(style)}`}>
            {style.view === 'flat' && <Icon data={TextIcon} size={16} />}
        </span>
    );
}

type StyleSelectProps = {
    style: Style;
    onUpdate: (style: Style) => void;
};

export function StyleSelect({style, onUpdate}: StyleSelectProps) {
    // The preview stands next to the row under the pointer.
    const [preview, setPreview] = useState<{style: Style; row: Element} | null>(null);
    const options = views.map((view) => ({
        label: i18n(`button-group-${view}`),
        options: buttonViewColors[view].map(
            (color): SelectOption<Style> => ({
                value: styleValue({view, color}),
                data: {view, color},
            }),
        ),
    }));
    return (
        <div
            className={b()}
            onMouseLeave={() => setPreview(null)}
            // Mouse events of the list reach this element through the React tree.
            // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events -- The preview repeats the swatch of the row.
            onMouseOver={({target}) => {
                const row = target instanceof Element ? target.closest('[role="option"]') : null;
                const value = row?.querySelector('[data-style]')?.getAttribute('data-style');
                const hovered = styles.find((item) => styleValue(item) === value);
                setPreview(row && hovered ? {style: hovered, row} : null);
            }}
        >
            <Select<Style>
                className={b('select')}
                size="l"
                aria-label={i18n('button-style')}
                value={[styleValue(style)]}
                options={options}
                popupWidth={LIST_WIDTH}
                popupPlacement={['right-start']}
                popupClassName={b('list')}
                getOptionHeight={() => ROW_HEIGHT}
                getOptionGroupHeight={() => ROW_HEIGHT}
                renderControl={({ref, triggerProps}) => (
                    <button
                        ref={ref as Ref<HTMLButtonElement>}
                        className={b('control')}
                        {...triggerProps}
                        type="button"
                    >
                        <Swatch style={style} size="l" />
                        <span className={b('value')}>{i18n(`button-view-${style.view}`)}</span>
                        <Icon className={b('chevron')} data={ChevronDown} size={16} />
                    </button>
                )}
                renderOptionGroup={({label}) => <div className={b('group')}>{label}</div>}
                renderOption={({data = style}) => (
                    <div className={b('option')} data-style={styleValue(data)}>
                        <Swatch style={data} size="m" />
                        {i18n(`button-color-${data.color}`)}
                    </div>
                )}
                onOpenChange={(open) => {
                    if (!open) setPreview(null);
                }}
                onUpdate={([value]) => {
                    const next = styles.find((item) => styleValue(item) === value);
                    if (next) onUpdate(next);
                }}
            />
            <Popup
                open={Boolean(preview)}
                className={b('preview-popup')}
                anchorElement={preview?.row}
                placement="right"
                offset={PREVIEW_OFFSET}
            >
                {preview && (
                    <div className={b('preview')} data-qa="button-style-preview">
                        <span className={buttonClass(preview.style)}>
                            {i18n('button-placeholder')}
                        </span>
                    </div>
                )}
            </Popup>
        </div>
    );
}
