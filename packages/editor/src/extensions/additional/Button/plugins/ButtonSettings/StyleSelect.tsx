import {useMemo, useState} from 'react';

import {Text as TextIcon} from '@gravity-ui/icons';
import {
    Icon,
    Popup,
    type PopupAnchorElement,
    Select,
    type SelectOptionGroup,
} from '@gravity-ui/uikit';

import {cn} from 'src/classname';
import {i18n} from 'src/i18n/button';

import {
    type ButtonStyle,
    ButtonView,
    type ButtonViewValue,
    buttonActionClassName,
    buttonColorDataAttr,
    buttonViewColors,
    buttonViewDataAttr,
    normalizeButtonStyle,
} from '../../ButtonSpecs';

const b = cn('button-style-select');

const styleSeparator = ':';

const styleValue = ({view, color}: ButtonStyle) => `${view}${styleSeparator}${color}`;

const parseStyleValue = (value: string) => {
    const [view, color] = value.split(styleSeparator);
    return normalizeButtonStyle(view, color);
};

const getStyleOptions = (): SelectOptionGroup[] =>
    Object.entries(buttonViewColors).map(([view, colors]) => ({
        label: i18n(`group_${view as ButtonViewValue}`),
        options: colors.map((color) => ({
            value: styleValue({view: view as ButtonViewValue, color}),
            text: i18n(`color_${color}`),
        })),
    }));

function Swatch({view, color, size}: ButtonStyle & {size: 16 | 20}) {
    return (
        <span
            className={b('swatch', {size: String(size)})}
            {...{[buttonViewDataAttr]: view, [buttonColorDataAttr]: color}}
        >
            {view === ButtonView.Flat && <Icon data={TextIcon} size={size} />}
        </span>
    );
}

type Hovered = {style: ButtonStyle; anchor: PopupAnchorElement};

/** Правый край списка на высоте пункта: превью стоит рядом с пунктом, но не перекрывает список. */
const besideList = (option: HTMLElement): PopupAnchorElement => {
    const list = option.closest('[role="listbox"]') ?? option;
    return {
        contextElement: option,
        getBoundingClientRect: () => {
            const {top, height} = option.getBoundingClientRect();
            return new DOMRect(list.getBoundingClientRect().right, top, 0, height);
        },
    };
};

export type StyleSelectProps = {
    style: ButtonStyle;
    label: string;
    onUpdate: (style: ButtonStyle) => void;
};

export function StyleSelect({style, label, onUpdate}: StyleSelectProps) {
    const options = useMemo(getStyleOptions, []);
    const [open, setOpen] = useState(false);
    const [hovered, setHovered] = useState<Hovered | null>(null);

    const onOpenChange = (value: boolean) => {
        setOpen(value);
        if (!value) setHovered(null);
    };

    return (
        <>
            <Select
                className={b()}
                size="l"
                width="max"
                popupWidth={158}
                popupPlacement={['right-start', 'left-start']}
                open={open}
                onOpenChange={onOpenChange}
                value={[styleValue(style)]}
                options={options}
                renderSelectedOption={({value}) => {
                    const selected = parseStyleValue(value);
                    return (
                        <span className={b('option')}>
                            <Swatch {...selected} size={20} />
                            {i18n(`view_${selected.view}`)}
                        </span>
                    );
                }}
                renderOption={({value, text}) => (
                    <span
                        className={b('option')}
                        onMouseEnter={(event) =>
                            setHovered({
                                style: parseStyleValue(value),
                                anchor: besideList(event.currentTarget),
                            })
                        }
                    >
                        <Swatch {...parseStyleValue(value)} size={16} />
                        {text}
                    </span>
                )}
                onUpdate={([value]) => onUpdate(parseStyleValue(value))}
            />
            {open && hovered && (
                <Popup
                    open
                    anchorElement={hovered.anchor}
                    placement={['right-start', 'left-start']}
                    offset={{mainAxis: 4}}
                    className={b('preview')}
                >
                    <div className={b('preview-stage')}>
                        <span
                            className={buttonActionClassName}
                            {...{
                                [buttonViewDataAttr]: hovered.style.view,
                                [buttonColorDataAttr]: hovered.style.color,
                            }}
                        >
                            {label || i18n('label_default')}
                        </span>
                    </div>
                </Popup>
            )}
        </>
    );
}
