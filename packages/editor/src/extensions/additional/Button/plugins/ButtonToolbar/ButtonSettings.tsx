import {useMemo} from 'react';

import {Font, Xmark} from '@gravity-ui/icons';
import {
    Button,
    Icon,
    Popup,
    type PopupAnchorElement,
    Select,
    type SelectOptionGroup,
    Text,
} from '@gravity-ui/uikit';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {cn} from 'src/classname';
import {i18n} from 'src/i18n/button';

import {
    ButtonAttr,
    type ButtonStyle,
    ButtonView,
    buttonActionClassName,
    buttonColorDataAttr,
    buttonViewColors,
    buttonViewDataAttr,
    normalizeButtonStyle,
} from '../../ButtonSpecs';

import './ButtonSettings.scss';

const b = cn('button-settings');

const styleSeparator = ':';

const styleValue = ({view, color}: ButtonStyle) => `${view}${styleSeparator}${color}`;

const parseStyleValue = (value: string) => {
    const [view, color] = value.split(styleSeparator);
    return normalizeButtonStyle(view, color);
};

function Swatch({view, color}: ButtonStyle) {
    const attrs = {
        className: b('swatch'),
        [buttonViewDataAttr]: view,
        [buttonColorDataAttr]: color,
    };
    return <span {...attrs}>{view === ButtonView.Flat && <Icon data={Font} size={16} />}</span>;
}

function StyleOption(style: ButtonStyle) {
    return (
        <span className={b('option')}>
            <Swatch {...style} />
            {i18n(`color_${style.color}`)}
        </span>
    );
}

const getStyleOptions = (): SelectOptionGroup[] =>
    Object.entries(buttonViewColors).map(([view, colors]) => ({
        label: i18n(`view_${view as ButtonView}`),
        options: colors.map((color) => ({
            value: styleValue({view: view as ButtonView, color}),
            text: i18n(`color_${color}`),
        })),
    }));

const renderStyleOption = ({value}: {value: string}) => <StyleOption {...parseStyleValue(value)} />;

/** Нижний край кнопки: попап открывается под ней, а не под панелью. */
const actionOf = (view: EditorView, pos: number): PopupAnchorElement => ({
    // DOM узла пересоздаётся при смене атрибутов, поэтому берётся при каждом расчёте.
    get contextElement() {
        const dom = view.nodeDOM(pos) as Element | null;
        return dom?.querySelector(`.${buttonActionClassName}`) ?? undefined;
    },
    getBoundingClientRect() {
        return this.contextElement?.getBoundingClientRect() ?? new DOMRect();
    },
});

export type ButtonSettingsProps = {
    node: Node;
    pos: number;
    editorView: EditorView;
    onClose: () => void;
};

export function ButtonSettings({node, pos, editorView, onClose}: ButtonSettingsProps) {
    const anchor = useMemo(() => actionOf(editorView, pos), [editorView, pos]);
    const styleOptions = useMemo(getStyleOptions, []);
    const style = normalizeButtonStyle(node.attrs[ButtonAttr.View], node.attrs[ButtonAttr.Color]);

    const setStyle = ([value]: string[]) => {
        const {view, color} = parseStyleValue(value);
        editorView.dispatch(
            editorView.state.tr
                .setNodeAttribute(pos, ButtonAttr.View, view)
                .setNodeAttribute(pos, ButtonAttr.Color, color),
        );
    };

    return (
        <Popup
            open
            anchorElement={anchor}
            placement={['bottom-start', 'top-start']}
            offset={{mainAxis: 8}}
            onOpenChange={(open) => open || onClose()}
        >
            <div className={b()}>
                <div className={b('title')}>
                    <Text variant="subheader-3">{i18n('settings_title')}</Text>
                    <Button view="flat" size="m" title={i18n('close')} onClick={onClose}>
                        <Icon data={Xmark} />
                    </Button>
                </div>
                <div className={b('item')}>
                    <Text className={b('label')}>{i18n('style')}</Text>
                    <Select
                        className={b('control')}
                        value={[styleValue(style)]}
                        options={styleOptions}
                        renderOption={renderStyleOption}
                        renderSelectedOption={renderStyleOption}
                        onUpdate={setStyle}
                    />
                </div>
            </div>
        </Popup>
    );
}
