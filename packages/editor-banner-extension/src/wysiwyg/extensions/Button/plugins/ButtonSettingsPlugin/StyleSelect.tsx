import {type MouseEvent, type Ref, useMemo, useState} from 'react';

import {ChevronDown, Text as TextIcon} from '@gravity-ui/icons';
import {cn} from '@gravity-ui/markdown-editor';
import {
    type ButtonColor,
    type ButtonView,
    buttonAttrs,
    buttonViewColors,
} from '@gravity-ui/markdown-plugin-banner';
import {Icon, Popup, Select, type SelectOption} from '@gravity-ui/uikit';

import {i18n} from '../../../../../i18n';

import './StyleSelect.scss';

const b = cn('button-style');

const ROW_HEIGHT = 28;
const LIST_WIDTH = 158;
const PREVIEW_OFFSET = 8;

type Style = {view: ButtonView; color: ButtonColor};

const styleValue = ({view, color}: Style) => `${view}/${color}`;
const buttonClass = (style: Style) => buttonAttrs(style).class;

const styleName = ({view, color}: Style) =>
    `${i18n(`button-view-${view}`)}, ${i18n(`button-color-${color}`)}`;

const views = Object.keys(buttonViewColors) as ButtonView[];
const styles = views.flatMap((view) => buttonViewColors[view].map((color) => ({view, color})));

function Swatch({style, size}: {style: Style; size: 'm' | 'l'}) {
    return (
        <span
            className={`${b('swatch', {size, view: style.view})} ${buttonClass(style)}`}
            aria-hidden
        >
            {style.view === 'flat' && <Icon data={TextIcon} size={16} />}
        </span>
    );
}

type Preview = {style: Style; row: Element};

type StyleOptionProps = {
    style: Style;
    onPreview: (preview: Preview) => void;
};

function StyleOption({style, onPreview}: StyleOptionProps) {
    const handleMouseEnter = ({currentTarget}: MouseEvent<HTMLDivElement>) => {
        const row = currentTarget.closest('[role="option"]');
        if (row) onPreview({style, row});
    };
    return (
        <div className={b('option')} onMouseEnter={handleMouseEnter}>
            <Swatch style={style} size="m" />
            <span className={b('option-view')}>{`${i18n(`button-view-${style.view}`)}, `}</span>
            {i18n(`button-color-${style.color}`)}
        </div>
    );
}

type StyleSelectProps = {
    style: Style;
    onUpdate: (style: Style) => void;
};

export function StyleSelect({style, onUpdate}: StyleSelectProps) {
    const [preview, setPreview] = useState<Preview | null>(null);
    const handlePreviewClear = () => setPreview(null);
    const handleOpenChange = (open: boolean) => {
        if (!open) setPreview(null);
    };
    const handleUpdate = ([value]: string[]) => {
        const next = styles.find((item) => styleValue(item) === value);
        if (next) onUpdate(next);
    };
    const options = useMemo(
        () =>
            views.map((view) => ({
                label: i18n(`button-group-${view}`),
                options: buttonViewColors[view].map(
                    (color): SelectOption<Style> => ({
                        value: styleValue({view, color}),
                        data: {view, color},
                    }),
                ),
            })),
        [],
    );
    return (
        <div className={b()} onMouseLeave={handlePreviewClear}>
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
                        aria-label={`${i18n('button-style')}: ${styleName(style)}`}
                        type="button"
                    >
                        <Swatch style={style} size="l" />
                        <span className={b('value')}>{i18n(`button-view-${style.view}`)}</span>
                        <Icon className={b('chevron')} data={ChevronDown} size={16} />
                    </button>
                )}
                renderOptionGroup={({label}) => (
                    <div className={b('group')} onMouseEnter={handlePreviewClear}>
                        {label}
                    </div>
                )}
                renderOption={({data = style}) => (
                    <StyleOption style={data} onPreview={setPreview} />
                )}
                onOpenChange={handleOpenChange}
                onUpdate={handleUpdate}
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
